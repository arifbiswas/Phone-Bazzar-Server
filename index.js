const express = require('express')
const cors = require("cors");
const { MongoClient, ObjectId } = require('mongodb');
const app = express()
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

const Client =new MongoClient(process.env.DB_URL)

async function run(){
    try {
        const CategoriesCollection = Client.db("PhoneBazaar").collection("categories")
        const UserCollection = Client.db("PhoneBazaar").collection("user")
        const ProductsCollection = Client.db("PhoneBazaar").collection("products")

        // CategoriesCollection 
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

        // CategoriesCollection end 

        // UserCollection 

        app.get("/users",async(req,res)=>{
            const buyer = req.query.buyer;
            const seller = req.query.seller;
            let query = {}
            if(buyer){
                query ={
                    role : "buyer"
                }
            }
            if(seller){
                query ={
                    role : "seller"
                }
            }
            const users = await UserCollection.find(query).toArray();
            res.send(users);
        })


        app.post('/users',async(req,res)=>{
        try{
            const user = req.body;
            // console.log(user);
            const query = {email : user?.email}
            const dbUser = await UserCollection.findOne(query);
            if(dbUser){
                res.send({message : "You hove already added"})
            }
            if(!dbUser){
                if(user.role){
                    const result = await UserCollection.insertOne(user)
                    res.send(result);
                }
                if(!user.role){
                    user.role = "buyer";
                    const result = await UserCollection.insertOne(user)
                res.send(result);
                }
            }
           
            
        }
        catch(e){
            console.log(e);
        }
        })
        // UserCollection End 

        app.get("/products/:name",async(req , res)=>{
            const name = req.params.name;
            const query = {
                productCategory : name
            }

            const products = await ProductsCollection.find(query).toArray();
            res.send(products);
        })
        
        app.get("/product/:id", async(req,res)=>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)}
            const product = await ProductsCollection.findOne(query);
            res.send(product);
        })

        app.post("/products",async(req,res)=>{
            try {
                const product = req.body ;
            const result =await ProductsCollection.insertOne(product);
            res.send(result)
            } catch (error) {
                console.log(error);
            }
        })
        // addProduct 

        

        // addProduct End


    } catch (error) {
        console.log(error);
    }
}
run().catch(error => {
    console.log(error);
})

app.get('/', (req, res) => res.send('Phone Bazaar server is running'))
app.listen(port, () => console.log(`Phone Bazaar app listening on port ${port}!`))