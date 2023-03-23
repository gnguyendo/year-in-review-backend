const express = require("express");
require("dotenv").config();
const server = express();
const cors = require("cors");
const connectDB = require("./database/db");

//Temp
const {MongoClient} = require("mongodb");
// const { request } = require("express");
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

//Riot API calls and write to DB
riotAPIKey = process.env.RIOT_API;


async function main () {
    try {
        await client.connect();
        console.log("Completed all Profile Updates");

    } catch (err) {
        console.log(err);
        throw(err);
    }
};

async function updateByProfile(client, summonerName, updatedProfile) {
    let summonerNameForID = summonerName.toString().toLowerCase();
    const result = await client.db("League").collection("Summoners").updateOne
        (
            {_id: summonerNameForID}, 
            {$set: updatedProfile},
            {upsert: true}
        );
}  


async function summonerv4BySummonerName(summonerName) {
    const link = `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${riotAPIKey}`;
    const response = await fetch(link)
    let data = await response.json();
    console.log(data);
    const res = await updateByProfile(client, data.name, 
        {   
            summonerName: data.name,
            summonerId: data.id,
            puuid: data.puuid,
            summonerLevel: data.summonerLevel,
            profileIconID: data.profileIconId
        });
    console.log(`${summonerName} has been updated to DB`);
}

async function leagueV4BySummonerID(summonerName) {
    let summonerNameForID = summonerName.toString().toLowerCase();
    let summonerProfile = await client.db("League").collection("Summoners").findOne({_id: summonerNameForID});
    if (!summonerProfile) {
        await summonerv4BySummonerName(summonerNameForID);
        console.log(`${summonerName} profile has been updated/created`);
        summonerProfile = await client.db("League").collection("Summoners").findOne({_id: summonerNameForID});
    }
    const link = `https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerProfile.summonerId}?api_key=${riotAPIKey}`;
    const response = await fetch(link);
    let data = await response.json();
    for (lolProfile of data) {
        const res = await updateByProfile(client, lolProfile.summonerName, 
            {
                summonerName: lolProfile.summonerName,
                leagueId: lolProfile.leagueId,
                summonerId: lolProfile.summonerId,
                [lolProfile.queueType]: {
                    rank: lolProfile.rank,
                    tier: lolProfile.tier,
                    wins: lolProfile.wins,
                    losses: lolProfile.losses,
                    leaguePoints: lolProfile.leaguePoints
                }
            }
        );
    }
    return await client.db("League").collection("Summoners").findOne({_id: summonerNameForID})
}

main().catch(console.error);

//Routes
server.get('/', async(req, res) => {
    try {
        return res.json({message: "Connected"});
    } catch (err) {
        console.log(err);
    }
});

server.get('/:id', async(req, res) => {
    try {
        const {id} = req.params
        const userProfile = await leagueV4BySummonerID(id);
        // console.log(userProfile);
        return res.json(userProfile);
    } catch (err) {
        console.log(err);
    }
});
