const express = require('express')
const cors = require("cors");
const { MongoClient, ObjectId } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken');
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

const Client =new MongoClient(process.env.DB_URL)

async function verifyJwt(req , res , next){
    try {
        const authorization = req.headers.authorization;
    // console.log(authorization);
    if(!authorization){
        res.status(401).send({message : 'unauthorized'})
    }
    const token = authorization.split(" ")[1];
    jwt.verify(token,process.env.SECRET_KEY,function(error,decoded){
        if(error){
            res.status(403).send({message : "forbidden"})
        }
        req.decoded = decoded;
        next()
    })
    } catch (error) {
        console.log(error.message);
    }
    
}

async function run(){
    try {
        const CategoriesCollection = Client.db("PhoneBazaar").collection("categories")
        const UserCollection = Client.db("PhoneBazaar").collection("user")
        const ProductsCollection = Client.db("PhoneBazaar").collection("products")
        const BookedCollection = Client.db("PhoneBazaar").collection("booked")
        const CartCollection = Client.db("PhoneBazaar").collection("cart")


        //For role cheack And verified get dbUser mention API Context
        app.get("/dbUser" ,verifyJwt ,async(req , res)=>{
            try {
                const email = req.query.email;
                // console.log(email);
                const decodedEmail = req.decoded;
                // console.log(decodedEmail);
                if(!email === decodedEmail){
                    res.status(403).send({message : "forbidden"})
                }

            const query = {email : email}
            const dbUser = await UserCollection.findOne(query);
            if(!dbUser){
                res.status(403).send({message : "forbidden"})
            }
            // console.log(dbUser);
            if(dbUser){
                res.send(dbUser)
            }
            } catch (error) {
                console.log(error);
            }
        })


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
            const token = jwt.sign(user.email,process.env.SECRET_KEY)
            if(dbUser){
                res.send({alreadyHave : true ,token})
            }
            if(!dbUser){
                if(user.role){
                    user.verified = false;
                    const result = await UserCollection.insertOne(user)
                    res.send({result ,token});
                }
                if(!user.role){
                    user.role = "buyer";
                    user.verified = false;
                    const result = await UserCollection.insertOne(user)
                res.send(result);
                }
            }
           
            
        }
        catch(e){
            console.log(e);
        }
        })

         
        app.get("/unverified", async(req,res)=>{
            try {
                const query = {verified : false}
            const unverifiedProducts = await UserCollection.find(query).toArray();
            res.send(unverifiedProducts);
            } catch (error) {
                console.log(error);
            }
        })

        app.patch("/verified/:id",async(req,res)=>{
            try {
                const id = req.params.id;
                // console.log(id);
                let query = {_id : ObjectId(id)}
                // const status = req.body;
                const result = await UserCollection.updateOne(query,{$set:{
                    verified : true
                }})

                const dbUser = await UserCollection.findOne(query);
                const email = dbUser.email;
                // console.log(email);
                
                    query = {
                        email : email
                    }
                   const products  =   await ProductsCollection.updateMany(query,{$set:{
                    verified : true
                    
                }})
                res.send({result,products});

            } catch (error) {
                console.log(error);
            }
        })

        app.delete("/users/:id",async(req,res)=>{
            try {
                const id = req.params.id;
                const query = {_id : ObjectId(id)}
                const result = await UserCollection.deleteOne(query)
                res.send(result);
            } catch (error) {
                console.log(error);
            }
        })

        // UserCollection End 

        // ProductsCollection 

        app.get("/products",async(req , res)=>{
            const name = req.query.name;
            const email = req.query.email;
            let query = { }
             if(name){
                query = {
                    productCategory : name,
                    
                }
             }
             if(email){
                query = {
                    email : email,
                    
                }
             }

            const products = await ProductsCollection.find(query).toArray();
            res.send(products);
        })
        app.get("/categories/:name",async(req , res)=>{
            const name = req.params.name;
            const query = {productCategory : name ,status : "available"}
            const products = await ProductsCollection.find(query).toArray();
            res.send(products);
        })
        
        app.get("/product/:id", async(req,res)=>{
            const id = req.params.id;
            const query = {_id : ObjectId(id) ,status : "available"}
            const product = await ProductsCollection.findOne(query);
            res.send(product);
        })
        
        
        app.get("/advertisement", async(req,res)=>{
            try {
                const query = {advertisement : true , status : "available"}
            const advertisementProducts = await ProductsCollection.find(query).toArray();
            res.send(advertisementProducts);
            } catch (error) {
                console.log(error);
            }
        })
        app.get("/report", async(req,res)=>{
            try {
                const query = {report : true , status : "available"}
            const reportedProducts = await ProductsCollection.find(query).toArray();
            res.send(reportedProducts);
            } catch (error) {
                console.log(error);
            }
        })
        
         // addProduct 
        app.post("/products",async(req,res)=>{
            try {
                const product = req.body ;
            const result =await ProductsCollection.insertOne(product);
            res.send(result)
            } catch (error) {
                console.log(error);
            }
        })
        app.patch("/products/:id",async(req,res)=>{
            try {
                const id = req.params.id;
                const query = {_id : ObjectId(id)}
                const status = req.body;
                const result = await ProductsCollection.updateOne(query,{$set:{
                    status : status.status
                }})
                res.send(result);

            } catch (error) {
                console.log(error);
            }
        })

        app.patch("/advertisement/:id",async(req,res)=>{
            try {
                const id = req.params.id;
                const query = {_id : ObjectId(id)}
                const advertisement = req.body;
                const result = await ProductsCollection.updateOne(query, {$set:{
                    advertisement : advertisement.advertisement
                }})
                res.send(result);
            } catch (error) {
                console.log(error);
            }
        })
        app.patch("/report/:id",async(req,res)=>{
            try {
                const id = req.params.id;
                const query = {_id : ObjectId(id)}
                const result = await ProductsCollection.updateOne(query, {$set:{
                    report : true
                }})
                res.send(result);
            } catch (error) {
                console.log(error);
            }
        })

       
        app.delete("/products/:id",async(req,res)=>{
            try {
                const id = req.params.id;
                const query = {_id : ObjectId(id)}
                const result = await ProductsCollection.deleteOne(query)
                res.send(result);
            } catch (error) {
                console.log(error);
            }
        })
      

        // template of many data push db 
        // app.patch("/products",async(req,res)=>{
        //     try {
        //         const query = {}
        //         const status = req.body;
        //         const result = await UserCollection.updateMany(query,{$set:{
        //             verified : false
        //         }})
        //         res.send(result);

        //     } catch (error) {
        //         console.log(error);
        //     }
        // })
        // addProduct End

        // booked Porducts 

        app.get("/booked", async(req ,res)=>{
            try {
                const email = req.query.email;
                const buyerEmail = req.query.buyerEmail;
                // console.log(email,buyerEmail);
                if(!email && !buyerEmail){
                    res.status(403).send({message : "forbidden"})
                }
                if(email){
                    let query = {email : email };
                const booked = await BookedCollection.find(query).toArray();
              
                    res.send(booked)
                }
                if(buyerEmail){
                    let query = {buyerEmail : buyerEmail };
                    const booked = await BookedCollection.find(query).toArray();
                  
                        res.send(booked)
                }

            } catch (error) {
                console.log(error);
            }
        })

        app.patch("/booked/:id",async(req,res)=>{
            try {
                const id = req.params.id;
                const query = {productId : id }
                const status = req.body;
                const result = await BookedCollection.updateOne(query,{$set:{
                    status : status.status
                }})
                res.send(result);

            } catch (error) {
                console.log(error);
            }
        })

        app.post("/booked",async(req ,res)=>{
           try {
            const booked = req.body;
            const result = await BookedCollection.insertOne(booked);
            res.send(result);
           } catch (error) {
            console.log(error);
           }
        })
        // booked Porducts End
        // Cart Start 
        app.get("/carts", async(req ,res)=>{
            try {
                const email = req.query.email;
                if(!email){
                    res.status(403).send({message : "forbidden"})
                }
                let query = {buyerEmail : email};
                const carts = await CartCollection.find(query).toArray();
              
                    res.send(carts)
                

            } catch (error) {
                console.log(error);
            }
        })

        app.delete("/carts/:id",async(req, res)=>{
            const id = req.params.id;
            const filter = { _id : ObjectId(id)}
            const result = await CartCollection.deleteOne(filter);
            res.send(result);
        })

        app.post("/carts",async(req ,res)=>{
            try {
             const cart = req.body;
            
            const dbCart = await CartCollection.findOne({products_id : cart?.products_id})
            
            if(dbCart){
                res.send({message : "This product already add to Cart"})
            }else{
                const result = await CartCollection.insertOne(cart);
             res.send(result);
            }
           
            } catch (error) {
             console.log(error);
            }
         })
         // Cart End

    } catch (error) {
        console.log(error);
    }
}
run().catch(error => {
    console.log(error);
})

app.get('/', (req, res) => res.send('Phone Bazaar server is running'))
app.listen(port, () => console.log(`Phone Bazaar app listening on port ${port}!`))