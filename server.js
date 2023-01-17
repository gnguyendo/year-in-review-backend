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
riotAPIKey = process.env.RIOT_API;


leagueQueues = ["RANKED_SOLO_5x5", "RANKED_FLEX_SR", "RANKED_FLEX_TT"];
leagueTiers = ["DIAMOND", "PLATINUM", "GOLD", "SILVER", "BRONZE", "IRON"];
leagueDivisions = ["I", "II", "III", "I"];

async function updateAllProfilesinRiotQueues(leagueQueues, leagueTiers, leagueDivisions) {
    for (const queue of leagueQueues) {
        for (const tier of leagueTiers) {
            for (const division of leagueDivisions) {
                try {
                    const link = `https://na1.api.riotgames.com/lol/league/v4/entries/${queue}/${tier}/${division}?page=1&api_key=${riotAPIKey}`;
                    const response = await fetch(link);
                    let data = await response.json();
                    for (const lolProfile of data) {
                        const res = await updateByProfile(client, lolProfile.summonerName, 
                            {
                                id: lolProfile.summonerName,
                                leagueId: lolProfile.leagueId,
                                summonerId: lolProfile.summonerId,
                                [lolProfile.queueType]: {
                                    rank: lolProfile.rank,
                                    tier: lolProfile.tier,
                                    wins: lolProfile.wins,
                                    losses: lolProfile.losses,
                                    leaguePoints: lolProfile.leaguePoints
                                }
                            });
                        // console.log(`${res} documents were updated`)
                    }
                } catch (err){
                    console.log(err);
                }
            }
        }
    }
    console.log("All Queues Updated")
}


async function main () {
    try {
        await client.connect();
        updateAllProfilesinRiotQueues(leagueQueues, leagueTiers, leagueDivisions);
    } catch (err) {
        console.log(err)
    }
};


async function updateByProfile(client, summonerName, updatedProfile) {
    const result = await client.db("League").collection("Summoners").updateOne
        (
            {_id: summonerName}, 
            {$set: updatedProfile},
            {upsert: true}
        )
}   

main().catch(console.error);
