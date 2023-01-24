const express = require("express");
require("dotenv").config();
const server = express();
const cors = require("cors");
const connectDB = require("./database/db");
import fetch from 'node-fetch';


//Temp
const {MongoClient} = require("mongodb");
const { request } = require("express");
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
const leagueQueues = ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"];
const leagueTiers = ["DIAMOND", "PLATINUM", "GOLD", "SILVER", "BRONZE", "IRON"];
const leagueDivisions = ["I", "II", "III", "I"];


async function updateAllProfilesinRiotQueues(leagueQueues, leagueTiers, leagueDivisions) {
    jobQueue = []
    for (const queue of leagueQueues) {
        for (const tier of leagueTiers) {
            for (const division of leagueDivisions) {
                const data = getLeagueEntrieswithPaging(queue, tier, division);
                jobQueue.push(data);
                // let data = getLeagueEntrieswithPaging(queue, tier, division);
                // console.log(`${queue} ${tier} ${division} was updated to DB`)
            }
        }
    }
    return Promise.all(jobQueue)
    // console.log("All Queues Updated")
}

async function getLeagueEntrieswithPaging(queue, tier, division) {
    console.log(`Getting ${queue}, ${tier}, ${division}`);
    const allLeagueEntryPages = [];
    let pageNum = 1;
    while (pageNum > 0) {
        const data = await getLeagueEntries(queue, tier, division, pageNum);
        if (data.length < 1 ) {
            break;
        }
        for (const lolProfile of data) {
            allLeagueEntryPages.push(lolProfile);
        }
        pageNum++
    }
    console.log(`Writing to DB for ${queue} ${tier} ${division}`)
    for (const lolProfile of allLeagueEntryPages) {
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
    }
    console.log(`${queue} ${tier} ${division} has been updated`);
}


async function getLeagueEntries(queue, tier, division, pageNum) {
    const link = `https://na1.api.riotgames.com/lol/league/v4/entries/${queue}/${tier}/${division}?page=${pageNum}&api_key=${riotAPIKey}`;
    const response = await fetch(link);
    let data = await response.json();
    if (!Array.isArray(data) && data.status.status_code === 429) {
        console.log(`Retrying for ${queue}  ${tier}  ${division} ${pageNum} sleeping for 60 seconds`);
        await new Promise(sleep => setTimeout(sleep, 60000));
        return getLeagueEntries(queue, tier, division, pageNum);
    }
    return data;
}


async function main () {
    try {
        await client.connect();
        updateAllProfilesinRiotQueues(leagueQueues, leagueTiers, leagueDivisions);
    } catch (err) {
        console.log(err);
        throw(err);
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
