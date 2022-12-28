// Databse
require("dotenv").config();
const { MongoClient } = require('mongodb');
const connectionString = process.env.ATLAS_URI;
const client = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});



async function main() {
    try {
        await client.connect();
        await listDatabases(client);
    } catch (e) {
        console.error(e);
    }
    finally {
        await client.close();
    }
}

main().catch(console.error);

async function listDatabases(client) {
    const databasesList = await client.db().admin().listDatabases();

    console.log("Databases");
    databasesList.databases.forEach(db => {
        console.log(`- ${db.name}`)
    })
}


