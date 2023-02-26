const {MongoClient} = require('mongodb');
const express = require("express");
const app = express();
var bcrypt = require('bcryptjs');
var cors = require('cors');
app.use(express.json())
app.use(cors({ origin: "http://localhost:8000", optionsSuccessStatus: 200 }));

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
  });

app.get("/", (req,res) => res.send("hello world"));

app.get("/getRiddle", async (req,res) => {
    const riddle = await connectRiddle()
    console.log("RIDDLE",riddle)
    res.send(riddle)
})

app.post("/addUser", async (req,res) => {
    //Need to check if the username already exists first, then hold the insert inside a try catch
    const userPassword = await bcrypt.hash(req.body.password,10)
    const coll = await connectDB("users")
    coll.insertOne({
        username:"test2",
        password: userPassword
    })
    res.send("success")
})
app.post("/loginUser", async (req,res) => {
    
    const coll = await connectDB("users")
    console.log(req.body.username)
    const pipeline = [
        { 
            $match: { username: req.body.username } 
        },
    ];
    const aggCursor = await coll.aggregate(pipeline);

    var result
    for await (const doc of aggCursor) {
        result = doc
    }
    console.log("RES",result)
    if(!result) {
        const pipeline2 = [
            { 
                $match: { email: req.body.username } 
            },
        ]
        const aggCursor = await coll.aggregate(pipeline2);

        for await (const doc of aggCursor) {
            result = doc
        }
        if(!result) {
            res.send("Invalid Username or Email")
        } else {
            console.log(result)
            const isValid = await bcrypt.compare(req.body.password, result.password);
            if(isValid) {
                res.send(result)
            } else {
                res.send("Invalid Password")
            }
        }

    } else {
        console.log(result)
        const isValid = await bcrypt.compare(req.body.password, result.password);
        if(isValid) {
            res.send(result)
        } else {
            res.send("Invalid Password")
        }
    }

})

async function connectDB(collection) {
    const uri = "mongodb+srv://houser2023:Augustine9009@housercluster.yreyshx.mongodb.net/test"
    const client = new MongoClient(uri);
    const res = await client.connect();
    const db = client.db("Houser");
    const coll = db.collection(collection);
    console.log("connected to mongoDB")
    return coll
}
async function connectRiddle() {
    try {
        const coll = await connectDB("riddles")
        const number = Math.floor(Math.random() * 376)
        const pipeline = [
            { 
                $match: { Number: number.toString() } 
            },
        ];
        const aggCursor = coll.aggregate(pipeline);
        var result
        for await (const doc of aggCursor) {
            result = doc
        }
        return result
    } catch (error) {
        console.error(error);
    }
}


app.listen(8000, () => {
    console.log("server started")
})