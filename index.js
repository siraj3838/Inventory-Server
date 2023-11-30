const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hq29e8f.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const storeCollection = client.db('newStoreDB').collection('store');
        const newsLetterCollection = client.db('newStoreDB').collection('letters');
        const feedbackCollection = client.db('newStoreDB').collection('feedbacks');
        const productCollection = client.db('newStoreDB').collection('products');
        const salesCollection = client.db('newStoreDB').collection('sales');
        const checkDoneCollection = client.db('newStoreDB').collection('getPaid');
        const userCollection = client.db('newStoreDB').collection('users');
        const paymentCheckFormCollection = client.db('newStoreDB').collection('paymentCheck');


        // Payment Check Form Collection
        app.post('/paymentChecks', async(req, res)=>{
            const payment = req.body;
            const result = await paymentCheckFormCollection.insertOne(payment);
            res.send(result);
        })
        app.get('/paymentChecks', async(req, res)=>{
            const result = await paymentCheckFormCollection.find().toArray();
            res.send(result);
        })

        // user Collection
        app.post('/allUsers', async(req, res)=>{
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        app.get('/allUsers', async(req, res)=>{
            const query = req.query;
            const page = query.page;
            const pageNum = parseInt(page);
            const perPage = 6
            const skip = pageNum * perPage;
            const post = userCollection.find().skip(skip).limit(perPage)
            const result = await post.toArray();
            const postCount = await userCollection.countDocuments()
            res.send({result, postCount});
        })
        app.get('/allUsers/:email', async(req, res)=>{
            const email = req.params.email;
            const query = {email: email};
            const user = await userCollection.findOne(query);
            let admin = false;
            if(user){
                admin = user?.role === 'admin';
            }
            res.send({admin});
        })
        app.patch('/allUsersSearch/:id', async (req, res) => {
            const id = req.params.id;
            const user= req.body;
            const filter = { _id: new ObjectId(id) };
            const updatedUser = {
                $set: {
                    role: 'manager',
                    shopName: user?.shopName
                }
            }
            const result = await userCollection.updateOne(filter, updatedUser);
            res.send(result);
        })
       


        // check Out Collection
        app.post('/pendingPaid', async (req, res) => {
            const payment = req.body;
            const paymentResult = await checkDoneCollection.insertOne(payment);
            const query = {
                _id: {
                    $in: payment.cartIds.map(id => new ObjectId(id))
                }
            }
            const deleteResult = await salesCollection.deleteMany(query);
            res.send(deleteResult);
        })
        app.get('/pendingPaid', async (req, res) => {
            const email = req?.query?.email;
            const query = {
                email: email,
            };
            const result = await checkDoneCollection.find(query).toArray();
            res.send(result);
        })
        app.get('/pendingPaidAdmin', async (req, res) => {
            const result = await checkDoneCollection.find().toArray();
            res.send(result);
        })


        // sales Collection
        app.post('/salesProduct', async (req, res) => {
            const product = req.body;
            const result = await salesCollection.insertOne(product);
            res.send(result);
        })
        app.get('/salesProduct', async (req, res) => {
            const result = await salesCollection.find().toArray();
            res.send(result);
        })
        app.put('/quantityUpdate/:id', async (req, res) => {
            const id = req.params.id;
            const productQuantity = req.body.productQuantity;
            const saleCount = req.body.saleCount;
            // const product = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateQuantity = {
                $set: {
                    productQuantity: productQuantity - 1,
                    saleCount: saleCount + 1
                }
            }
            const result = await productCollection.updateOne(filter, updateQuantity, options);
            res.send(result);
        })




        // product Collection
        app.post('/allProducts', async (req, res) => {
            const email = req.body.email;
            const existProduct = await productCollection.countDocuments({ email: email });
            if (existProduct >= 3) {
                return res.send({ message: 'You can’t add more Product please Subscription' })
            }
            const newProduct = { ...req.body, email: email };
            const result = await productCollection.insertOne(newProduct);
            res.send(result);
        })
        app.get('/allProductsAdmin', async (req, res) => {
            const result = await productCollection.find().toArray();
            res.send(result);
        })
        app.get('/allProducts', async (req, res) => {
            const email = req?.query?.email;
            const query = {
                email: email,
            };
            const result = await productCollection.find(query).toArray();
            res.send(result);
        })

        app.put('/allProducts/:id', async (req, res) => {
            const id = req.params.id;
            const product = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateProduct = {
                $set: {
                    productName: product.productName,
                    image: product.image,
                    productQuantity: product.productQuantity,
                    productLocation: product.productLocation,
                    productionCost: product.productionCost,
                    profitMargin: product.profitMargin,
                    discount: product.discount,
                    productDescription: product.productDescription,
                }
            }
            const result = await productCollection.updateOne(filter, updateProduct, options);
            res.send(result);
        })


        app.delete('/allProducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })

        // Customer Testimonials
        app.post('/feedBacks', async (req, res) => {
            const feedBack = req.body;
            const result = await feedbackCollection.insertOne(feedBack);
            res.send(result);
        })
        app.get('/feedBacks', async (req, res) => {
            const result = await feedbackCollection.find().toArray();
            res.send(result);
        })

        // news letters section
        app.get('/allLetters', async (req, res) => {
            const result = await newsLetterCollection.find().toArray();
            res.send(result);
        })

        // new Store section
        app.get('/allStores', async (req, res) => {
            const result = await storeCollection.find().toArray();
            res.send(result);
        })
        app.get("/allStoreManager/:email", async (req, res) => {
            const email = req?.params?.email;
            const query = { email: email };
            const user = await storeCollection.findOne(query);
            const isManager = user?.role === "manager";
            res.send({ isManager });
        })

        app.post('/allStores', async (req, res) => {
            const store = req.body;
            const query = { email: store.email };
            const existEmail = await storeCollection.findOne(query);
            if (existEmail) {
                return res.send({ message: 'This Email Already Create Store', insertedId: null })
            }
            const result = await storeCollection.insertOne(store);
            res.send(result);
        })
        app.patch('/allStores/manager/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedManager = {
                $set: {
                    role: 'manager',
                    productLimit: 3
                }
            }
            const result = await storeCollection.updateOne(filter, updatedManager);
            res.send(result);
        })
        
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Inventory Server Running');
})
app.listen(port, () => {
    console.log(`Inventory Running From ${port}`);
})
