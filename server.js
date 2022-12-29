const express = require("express");
const server = express();
const cors = require("cors");
const dbConnection = require('./database/db');

// Middleware
server.use(cors());
server.use(express.json());

server.use((req, res) => {
    res.send("Hello server")
})

const PORT = process.env.PORT || 3000
// server.listen(PORT, () => {
//     console.log("Server listening on http://localhost:" + PORT);
// });
    
dbConnection.connectToServer(function (err) {
    if (err) {
      console.error(err);
      process.exit();
    }
  
    // start the Express server
    server.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  });