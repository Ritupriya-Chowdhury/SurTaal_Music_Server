const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 1830;
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');



// middleware
app.use(cors());
app.use(express.json());


// VerifyJWt
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vkhsa2w.mongodb.net/?retryWrites=true&w=majority`;

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
    // Send a ping to confirm a successful connection
    const database = client.db("surtaalMusic");
    // Classes Database
    const classes = database.collection("Classes");
// Instructor Database
    const instructors = database.collection("Instructor");
// Reviewer Database
const reviewers = database.collection("reviewer");

// Select Class Database
const SelectedClasses = database.collection("SelectClasses");
// Users DataBase
const usersCollection = database.collection("users");

// Add a class Database
const AddAClass = database.collection("AddClass");



    // JWT API
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.send({ token })
    })

    // Verify Admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }


// Classes Api
 app.get('/classes', async (req, res) => {
      const result = await classes.find().toArray();
      res.send(result);
    })




    // Instructor Api
    

    app.get('/instructors', async (req, res) => {
      const result = await instructors.find().toArray();
      res.send(result);
    })



    //  Reviewer Api
   
    app.get('/reviewers', async (req, res) => {
      const result = await reviewers.find().toArray();
      res.send(result);
    })


   
  

    


    // Select Class Api
    app.get('/selectClass', verifyJWT, async (req, res) => {
      const email = req.query.email;
      console.log(email)
      if (!email) {
        res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      const query = { email: email };
      const result = await SelectedClasses.find(query).toArray();
      res.send(result);

    })


    //  Select Class Collection
    app.post('/selectClass', async (req, res) => {
      const item = req.body;
      console.log(item)
      const result = await SelectedClasses.insertOne(item);
      res.send(result);
    })

    // Delete Class
    app.delete('/selectClass/:id', async (req, res) => {
      const id = req.params.id;
      console.log(req.params.id);
      const query = { _id: new ObjectId(id) };

      const result = await SelectedClasses.deleteOne(query);
      res.send(result);
    });







    // User Data
    
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });


    app.post('/instructors', async (req, res) => {
      const user = req.body;
      console.log(user)
      const query = { email: user.instructorEmail }
      console.log(user.instructorEmail)
      const existingUser = await instructors.findOne(query);
       
      if (existingUser) {
        console.log(existingUser);
        return res.send({ message: 'user already exists' })
      }
      const result = await instructors.insertOne(user);
      console.log(result)
      res.send(result);
    });




    // All User Api
    
      app.get('/users', verifyJWT,verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });




    // Admin Api
    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({admin:false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      console.log(user)
      const result = { admin:user?.role === 'admin' }
      res.send(result);
    })




    // Student Api
    app.get('/users/student/:email', verifyJWT,  async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({student: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { student: user?.role === 'student' }
      console.log(user)
      res.send(result);
    })





    // Instructor  Api
    app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({instructor: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      console.log(user)
      const result = { instructor: user?.role === 'instructor' }
      console.log(user.role)
      res.send(result);
    })





    // Make Instructor
    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })




    // Make Admin

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })




    // Delete Users
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      console.log(req.params.id);
      const query = { _id: new ObjectId(id) };

      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });


    // Add Class Collection

   
    app.post('/addClass', async (req, res) => {
      const user = req.body;
      console.log(user)
      const result = await  AddAClass.insertOne(user);
      console.log(result)
      res.send(result);
    });


    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('SurTaal Music Server is running');
})

app.listen(port, () => {
  console.log(`SurTaal Music Server is running port:http://localhost:${port}`)
})