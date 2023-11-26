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
        app.get('/allProducts', async (req, res) => {
            const result = await productCollection.find().toArray();
            res.send(result);
        })
        app.get('/allProducts', async (req, res) => {
            const email = req?.query?.email;
            const query = { email: email };
            const result = await productCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/allProducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productCollection.findOne(query);
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
