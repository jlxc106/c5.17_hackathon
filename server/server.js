const express = require('express');
const path = require('path');
const othello = require('./game_logic/othello')
const socketIO = require('socket.io');
const http = require('http');

const publicPath = path.join(__dirname, "../public");
const app = express();
var server = http.createServer(app);
var io = socketIO(server);
const port = process.env.PORT || 3000;

app.use(express.static(publicPath));

io.on("connection", (socket)=>{
    console.log('new user connected');
})


server.listen(port, ()=>{
    console.log(`listening on port ${port}`)
})