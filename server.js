const express = require("express");
const server = express();
const cors = require("cors");
// const pool = require("./dbs");


//Middleware
server.use(cors());
server.use(express.json());

server.use((req, res) => {
    res.send("Hello server")
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log("Server listening on http://localhost:" + PORT);

});
    