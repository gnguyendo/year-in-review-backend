const express = require("express");
const server = express();
const cors = require("cors");
const connectDB = require('./database/db');

// Middleware
server.use(cors());
server.use(express.json());

// server.use((req, res) => {
//     res.send("Hello server")
// })

const PORT = process.env.PORT || 3000


//Start Server
const startServer = async () => {
    try {
        await connectDB;
        console.log("Connected to MongoDB");
        server.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`);
        });
    } catch (err) {

    }
}

startServer();

//Routes