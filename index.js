const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');

require("dotenv").config();
const stripe = require('stripe')(process.env.PAYEMENT_SECRET_KEY)

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

console.log(process.env.PAYEMENT_SECRET_KEY);


const uri = `mongodb+srv://${process.env.PLANT_USER}:${process.env.PLANT_PASSWORD}@cluster0.7ijeqqy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;





const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const productCollection = client.db("green-plant").collection("products");
const feedbackCollection = client.db("green-plant").collection("feedbacks");
const cartCollection = client.db("green-plant").collection("carts");
const paymentCollection = client.db("green-plant").collection("payment");
async function run() {
  try {

    
          // middleware for token verify______
          const verifyToken=(req,res,next)=>{
            console.log('inside verify token', req.headers.authorization);
            if(!req.headers.authorization){
              return res.status(401).send({message:'forbidden access'})
            }
            const token = req.headers.authorization.split(" ")[1];
             jwt.verify(token,process.env.TOKEN_SECRET, (err,decoded)=>{
              if(err){
                return res.status(401).send({message:'forbidden access'})
              }
              req.decoded = decoded;
              next();
             })
           }
   
    
    app.get("/products", async (req, res) => {
      try {
        const products = await productCollection.find({}).toArray();
        if (products.length > 0) {
          res.status(200).json(products);
        } else {
          res.status(404).json({ message: "No products found" });
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    
    
    app.get("/product/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const product = await productCollection.findOne(query);
        res.send(product);
      } catch (error) {
        console.error(error);
      }
    });
    
    // feedback api
    app.get("/feedbacks", async (req, res) => {
      try {
        const query = {};
        const feedbacks = await feedbackCollection.find(query).toArray();
        res.send(feedbacks);
      } catch (error) {
        console.error(error);
      }
    });
    
    // get cart data from db to server
   
// post cart data to db
    app.post('/carts', async(req,res)=>{
      const    cartItem  = req.body;
      const result = await cartCollection.insertOne(cartItem);
      console.log('in result', result);
      res.send(result)
    })

    app.get('/carts',verifyToken, async(req,res)=>{
      const email = req.query.email;
      console.log(email);
      const query = { email: email };
      console.log(query);
      const result = await cartCollection.find(query).toArray();
      console.log("result in query", result);
      res.send(result)
    })

     // jwt apiii(create jwt api)
     app.post('/jwt', (req,res)=>{
      const userInfo = req.body;
      const token = jwt.sign(userInfo, process.env.TOKEN_SECRET, {
        expiresIn: '1hr'
      })
      console.log("token in jwt", token);
      res.send({token});
    })

    app.post('/create-payment-intent', async(req,res)=>{
      const {price} =req.body;
     
      const amount = parseInt(price * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      })
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })

       // save payment info to the database
    //    app.post('/payment', async (req, res) => {
    //     const payment = req.body;
    //     const paymentResult = await paymentCollection.insertOne(payment);
    //     const query = { menuId: { $in: payment.menuItemId } };
    //  const deleteResult = await cartCollection.deleteMany(query)
    //  console.log("delete result", deleteResult);
    //   res.send({paymentResult,deleteResult})
    // });

    app.post('/payment', async (req, res) => {
      try {
          const payment = req.body;
          const paymentResult = await paymentCollection.insertOne(payment);
  
          // Ensure `menuItemId` is an array
          const menuItemIds = Array.isArray(payment.menuItemId) ? payment.menuItemId : [];
  
          if (menuItemIds.length > 0) {
              const query = { menuId: { $in: menuItemIds } };
              const deleteResult = await cartCollection.deleteMany(query);
              console.log("Deleted items from cart:", deleteResult);
              res.send({ paymentResult, deleteResult });
          } else {
              console.log("No items found to delete.");
              res.send({ paymentResult, message: "No items found to delete." });
          }
      } catch (error) {
          console.error("Error during payment processing:", error);
          res.status(500).send({ message: "Internal server error" });
      }
  });

    // paymeny history
    app.get('/payment/:email', verifyToken, async(req,res)=>{
      const query ={email: req.params.email}
      if(req.params.email !== req.decoded.email){
        return res.status(401).send({message:'forbidden access'})
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })
  
    


    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// root api

app.get("/", (req, res) => {
  try {
    res.send("Green Plant server is running");
  } catch (error) {
    res.send("Server is not working");
  }
});


app.listen(port, () => {
  console.log("Server is running on port", port);
});
