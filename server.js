const {MongoClient} = require('mongodb');
const express = require("express");
const client = new MongoClient('mongodb+srv://houser2023:Augustine9009@housercluster.yreyshx.mongodb.net/test');
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
    client.close()
})

app.post("/addUser", async (req,res) => {
    //Need to check if the username already exists first, then hold the insert inside a try catch
    const userPassword = await bcrypt.hash(req.body.password,10)
    const coll = await connectDB("users")
    coll.insertOne({
        username:"test2", //MAKE THIS DYNAMIC
        password: userPassword
    })
    client.close()
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
    client.close()
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
app.post("/updateStats", async (req,res) => {
    console.log(req.body)
    const user = req.body.userData
    
    //** Handle Game History ** 
    const newGame = {
        num_guesses: req.body.guessCounter,
        used_hint: req.body.usedHint,
        solved: req.body.solved
    }
    var gameHistory = user.game_history
    gameHistory.push(newGame)
    console.log("GAME",gameHistory)

    //**Handle Winstreak Info **
    var newLongestStreak = user.longest_winstreak
        if (user.longest_winstreak < user.winstreak+1 ) {
            newLongestStreak = user.winstreak + 1
        } 
    const coll = await connectDB("users")
    if (req.body.solved) {
        try{
            const aggCursor = await coll.updateOne(
                {email: user.email},
                {$set:{
                    total_wins: user.total_wins +1,
                    total_plays: user.total_plays +1,
                    winstreak: user.winstreak +1,
                    longest_winstreak: newLongestStreak,
                    game_history: gameHistory
                    
                }}
            )
            
            console.log(aggCursor)
            
        } catch(e) {
            console.log(e)
            res.send("Error updating stats")
        }
    } else {
        try{
            const aggCursor = await coll.updateOne(
                {email: user.email},
                {$set:{
                    
                    total_plays: user.total_plays +1,
                    winstreak: 0,
                    game_history: gameHistory
                    
                }}
            )
            console.log(aggCursor)
        
        } catch(e) {
            console.log(e)
            res.send("Error updating stats")
        }
    }

    const pipeline = [
        { 
            $match: { email: user.email } 
        },
    ];

    const newUser = await coll.aggregate(pipeline)
    
    var updatedUser
    for await (const doc of newUser) {
        updatedUser = doc
    }
    console.log("SENDING",updatedUser)
    client.close()
    res.send(updatedUser)
})


async function connectDB(collection) {
    
    const res = await client.connect();
    const db = client.db("Houser");
    const coll = db.collection(collection);
    console.log("connected to mongoDB")
    return coll
}
async function connectRiddle() {
    try {
        const coll = await connectDB("riddles")
        const pipeline = [
            { 
                $match: { Status: "current" } 
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