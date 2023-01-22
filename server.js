const {MongoClient} = require('mongodb');
const express = require("express");
const app = express();
var cors = require('cors');

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
async function connectRiddle() {
    try {
        const uri = "mongodb+srv://houser2023:Augustine9009@housercluster.yreyshx.mongodb.net/test"
        const client = new MongoClient(uri);
        await client.connect();
        console.log("connected to mongoDB")
        const db = client.db("Houser");
        const coll = db.collection("riddles");
        const pipeline = [
            { 
                $match: { Number: "13" } 
            },
        ];
        const aggCursor = coll.aggregate(pipeline);
        var result
        for await (const doc of aggCursor) {
            result = doc
        }
        console.log("DOC",result.Question)
        return result.Question
    } catch (error) {
        console.error(error);
    }
}


app.listen(8000, () => {
    console.log("server started")
})