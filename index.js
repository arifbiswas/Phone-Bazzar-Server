const express = require('express')
const cors = require("cors");
const { MongoClient } = require('mongodb');
const app = express()
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

const Client =new MongoClient(process.env.DB_URL)

async function run(){
    try {
        const CategoriesCollection = Client.db("PhoneBazaar").collection("categories")
        app.post("/categories", async(req,res)=>{
            const category = req.body;
            const result = await CategoriesCollection.insertOne(category);
            res.send(result);
        })
        app.get("/categories", async(req,res)=>{
            const query = {};
            const categories = await CategoriesCollection.find(query).toArray();
            res.send(categories);
        })
    } catch (error) {
        console.log(error);
    }
}
run().catch(error => {
    console.log(error);
})

app.get('/', (req, res) => res.send('Phone Bazaar server is running'))
app.listen(port, () => console.log(`Phone Bazaar app listening on port ${port}!`))