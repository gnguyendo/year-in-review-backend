// Databse
require("dotenv").config();
const { MongoClient } = require('mongodb');
const connectionString = process.env.ATLAS_URI;
const client = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connectDB = async () => {
    try {
        await client.connect();
        console.log("Connected to MongoDB")
    } catch (err) {
        console.log(err);
        process.exit(1);
    } finally {
        await client.close();
    }
}

module.exports = connectDB