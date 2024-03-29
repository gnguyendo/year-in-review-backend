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


//Riot API Calls
riotAPIKey = process.env.RIOT_API;
const leagueQueues = ["RANKED_FLEX_SR"]; // "RANKED_FLEX_SR", "RANKED_SOLO_5x5"
const leagueTiers = ["DIAMOND", "PLATINUM", "GOLD", "SILVER", "BRONZE", "IRON"];
const leagueDivisions = ["I", "II", "III", "IV"];

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
}

async function getLeagueEntrieswithPaging(queue, tier, division) {
    console.log(`Getting ${queue}, ${tier}, ${division}`);
    const allLeagueEntryPages = [];
    let pageNum = 1;
    while (pageNum > 0) {
        const data = await getLeagueEntries(queue, tier, division, pageNum);
        if (!Object.keys(data).length) {
            break;
        }   
        for (const lolProfile of data) {
            allLeagueEntryPages.push(lolProfile);
        }
        pageNum++;
    }
    console.log(`Writing to DB for ${queue} ${tier} ${division}`);
    for (const lolProfile of allLeagueEntryPages) {
        const res = await updateDBProfile(client, lolProfile.summonerName, 
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
            });
    }
    console.log(`Completed write to DB for ${queue} ${tier} ${division}`);
}


async function getLeagueEntries(queue, tier, division, pageNum) {
    const link = `https://na1.api.riotgames.com/lol/league/v4/entries/${queue}/${tier}/${division}?page=${pageNum}&api_key=${riotAPIKey}`;
    const response = await fetch(link);
    let data = await response.json();
    if (!Array.isArray(data) && data.status.status_code === 429) {
        console.log(`Retrying for ${queue} ${tier} ${division} PAGE:${pageNum}, sleeping for 60 seconds`);
        await new Promise(sleep => setTimeout(sleep, 60000));
        return getLeagueEntries(queue, tier, division, pageNum);
    }
    return data;
}

async function main () {
    try {
        await client.connect();
        // await updateAllProfilesinRiotQueues(leagueQueues, leagueTiers, leagueDivisions);

        // const test = await addMatchestoDB('mynamejefff')
        const result = await isValidSummoner('mynamejefff')
        console.log(result)
        const result2 = await isValidSummoner('sdkjfhdsjkf')
        console.log(result2);
        console.log("Finished all actions")
    } catch (err) {
        console.log(err);
        throw(err);
    }   
};

async function isValidSummoner(summonerName) {
    const link = `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${riotAPIKey}`;
    const response = await fetch(link);
    if (response.ok) {
        let data = await response.json();
        let summoner = await updateDBProfile(client, data.name, 
            {   
                summonerName: data.name,
                summonerId: data.id,
                puuid: data.puuid,
                summonerLevel: data.summonerLevel,
                profileIconID: data.profileIconId
            });
        return true;
    } else {
        return false;
    }
}


async function updateDBProfile(client, summonerName, updatedProfile) {
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
    const res = await updateDBProfile(client, data.name, 
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
    if (!summonerProfile) { // if no profile searches and creates profile
        await summonerv4BySummonerName(summonerNameForID);
        summonerProfile = await client.db("League").collection("Summoners").findOne({_id: summonerNameForID});
    }
    const link = `https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerProfile.summonerId}?api_key=${riotAPIKey}`;
    const response = await fetch(link);
    let data = await response.json();
    for (lolProfile of data) {
        const res = await updateDBProfile(client, lolProfile.summonerName, 
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

async function findSummonerPUUID(summonerName) {
    let summonerProfile = await client.db("League").collection("Summoners").findOne({_id: summonerName});
    return summonerProfile.puuid
}

async function allMatchesByPUUID(summonerName) {
    // try {

    // } catch (error) {
    //     console.log(error);
    // }
    const summonerPUUID = await findSummonerPUUID(summonerName);
    if (!summonerPUUID) {
        return null
    }
    const link = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${summonerPUUID}/ids?start=0&count=100&api_key=${riotAPIKey}`
    const response = await fetch(link);
    if (response.status <= 299) {
        return await response.json()
    } else if (response.status >= 300) {
        return null
    } 
    // let data = await response.json();
    // return data
}


async function addMatchestoDB(summonerName){
    // try {

    //     return
    // } catch (error) {
    //     console.log(error)
    // }
    const leagueMatches = await allMatchesByPUUID(summonerName);
    const res = await updateDBProfile(client, summonerName, 
        {
            matches: leagueMatches
        }
    )
    console.log("Finished adding matches to DB")
}

//Run server
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
        return res.json(userProfile);
    } catch (err) {
        console.log(err);
    }
});

server.get('/validsummoner/:id', async(req, res) => {
    try {
        const {id} = req.params;
        const userProfile = await isValidSummoner(id);
        return res.status(200).json(userProfile)
    } catch (err) {
        console.log(err);
    }
});