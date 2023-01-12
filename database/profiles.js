const connectDB = require('./database/db');


riotAPIKey = "RGAPI-f07b2c0a-7d1b-498c-946d-f0ffeb71920f"

leagueQueues = ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR', 'RANKED_FLEX_TT'];
leagueTiers = ['DIAMOND', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'IRON'];
leagueDivisions = ['I', 'II', 'III', 'I'];


async function fetchallRanks(queue, tier, division) {
    const summonerName = "mynamejefff"
    const link = `https://na1.api.riotgames.com/lol/league/v4/entries/${queue}/${tier}/${division}?page=1&api_key=${riotAPIKey}`
    const response = await fetch(link);
    let data = await response.json();
    console.log(data);
}

testRank = 'RANKED_SOLO_5x5'
testTier = 'SILVER'
testDivision = 'I'

fetchallRanks(testRank, testTier, testDivision);
// must have _id in every document
// async function createSummonerProfiles( )