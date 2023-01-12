const express = require("express");
require("dotenv").config();
const server = express();
const cors = require("cors");
const connectDB = require("./database/db");


//Temp
const {MongoClient} = require("mongodb");
const connectionString = process.env.ATLAS_URI;
const client = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  

// Middleware
server.use(cors());
server.use(express.json());

const PORT = process.env.PORT || 3000

//Start Server
const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`);
        });
    } catch (err) {
        console.log(err);
    }
}

startServer();

//Riot API Calls
riotAPIKey = "RGAPI-36a7b7c1-957d-4f5d-b22b-3f528b2a249a"
leagueQueues = ["RANKED_SOLO_5x5", "RANKED_FLEX_SR", "RANKED_FLEX_TT"];
leagueTiers = ["DIAMOND", "PLATINUM", "GOLD", "SILVER", "BRONZE", "IRON"];
leagueDivisions = ["I", "II", "III", "I"];


async function fetchallRanks(queue, tier, division) {
    try {    
        const summonerName = "mynamejefff"
        const link = `https://na1.api.riotgames.com/lol/league/v4/entries/${queue}/${tier}/${division}?page=1&api_key=${riotAPIKey}`
        const response = await fetch(link);
        let data = await response;
    return data.json();
    } catch (err) {
        console.log(err);
    }
};

testRank = "RANKED_SOLO_5x5"
testTier = "GOLD"
testDivision = "I"


// async function updateAllAPI(client, ) {
//     fetchallRanks(testRank, testTier, testDivision).then(data => {
//         for (const lolProfile of data) {
//             console.log(lolProfile);
//         }
//     })
// }

async function main () {
    try {
        await client.connect();
        updateAllAPI(client);
    } catch (err) {
        console.log(err)
    }
};


async function updateAllAPI(client) {
    fetchallRanks(testRank, testTier, testDivision).then(async data => {
        for (const lolProfile of data) {
            // console.log(lolProfile)
            const res = await updateProfile(client, lolProfile.summonerName, 
                {
                    _id: lolProfile.summonerName,
                    leagueId: lolProfile.leagueId,
                    summonerId: lolProfile.summonerId,
                });
            console.log(`${res} documents were updated`)
        }
        console.log("All Profiles created");
    })
}


async function updateProfile(client, summonerName, updatedProfile) {
    const result = await client.db("League").collection("Summoners").updateOne({_id: summonerName}, {$set: updatedProfile},{upsert: true})
    console.log(result)
}   

main().catch(console.error);
