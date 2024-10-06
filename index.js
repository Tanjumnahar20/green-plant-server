const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5oljn5y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const dbConnect = () => {
  try {
    client.connect();
  } catch (error) {
    console.error(error);
  }
};
dbConnect();

// database and collection create
const productCollection = client.db("green-plant").collection("products");
const feedbackCollection = client.db("green-plant").collection("feedbacks");

// root api
app.get("/", (req, res) => {
  try {
    res.send("Green Plant server is running");
  } catch (error) {
    res.send("Server is not working");
  }
});

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

app.listen(port, () => {
  console.log("Server is running on port", port);
});
