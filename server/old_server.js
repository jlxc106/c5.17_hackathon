require('./config/config.js');
const express = require('express');
const path = require('path');
const socketIO = require('socket.io');
const http = require('http');
var fs = require('fs');
const moment = require('moment');
var { mongoose } = require('./db/mongoose');

const { User } = require('./models/user');
const { Othello } = require('./game_logic/othello');
const publicPath = path.join(__dirname, '../public');
const app = express();
var server = http.createServer(app);
var io = socketIO(server);
const port = process.env.PORT || 3000;

app.use(express.static(publicPath));
var othello = new Othello();
app.use((req, res, next) => {
  var now = new Date().toString();
  var log = `${now}: ${req.method} ${req.url}`;
  fs.appendFile('server.log', log + '\n', err => {
    if (err) {
      console.log('Unable to append to server.log');
    }
  });
  next();
});

io.on('connection', socket => {
  console.log(`new user connected.`);

  socket.on('searchOthello', response => {
    if (response.userName.trim().length > 0) {
      //verify valid user name is input
      User.findOneAndUpdate(
        { id: response.id },
        { userName: response.userName, hash: response.pairingHash },
        {new: true},
        (err, result) => {
          if (err | !result) {
            console.log('unable to find user');
            return;
          }
          if (othello.addUserToWaitingList({socketId: socket.id,id: response.id})) {
            const gameId = othello.waitingList[0]['socketId'].concat(othello.waitingList[1]['socketId']);
            othello.addUsersToGame(gameId).then(
              players => {
                players.forEach(player => {
                  if (player.socketId !== socket.id) {
                    socket.to(player.socketId).emit('foundOthelloGame', {path: `othello2.html?numPlayers=2&id=${gameId}`});
                  } else {
                    socket.emit('foundOthelloGame', {path: `othello2.html?numPlayers=2&id=${gameId}`});
                  }
                });
              },
              (err) => {
                console.log(err);

              }
            );
          }
        }
      );
    }
  });

  socket.on('validateUser', (response, callback) => {
    console.log('validateUser response: ', response);
    //client has no id: give them new user id
    if (!response.id) {
      var user = new User({
        id: socket.id,
        socketId: socket.id,
        roomId: null
      });
      user.save().then(
        result => {
          console.log('user save result: ', result);
          othello.connectUser(result);
          callback('invalid id', { id: socket.id });
          return;
        },
        err => {
          console.log('error: ', err);
        }
      );
    } else if (response.id && response.gameId) {
      //validateuser called from inside the game
      User.findOneAndUpdate(
        { id: response.id},
        { socketId: socket.id },
        {new: true},
        (err, doc) => {
          console.log('inside the game doc: ', doc);
          if (err || !doc) {//invalid userId or gameId
            console.log(err);
            callback('invalid id', { id: socket.id });
          } else {
            socket.join(response.gameId);
            othello.connectUser(doc);
            io.to(response.gameId).emit('serverMessage', {
              from: 'server',
              message: `User ${doc.userName} has connected`,
              activeUsers: othello.getActiveUsers(doc.roomId)
            });
            callback(null, doc);
          }
        }
      ).then(()=>{

      });
    } else {
      //validate user called from index.html
      User.findOneAndUpdate(
        { id: response.id },
        { socketId: socket.id, roomId: null, role: null },
        {new: true},
        (err, doc) => {
          console.log('index doc: ', doc);
          if (err || !doc) {//invalid userId
            var user = new User({
              id: socket.id,
              socketId: socket.id,
              roomId: null
            })
            user.save().then(()=>{
              console.log(err);
              callback('invalid id', { id: socket.id });
            }, (err)=>{
              console.log(err);
            }
            )
          } else {
            othello.connectUser(doc);
            callback(null, doc);
          }
        }
      );
    }
  });

  socket.on('newMessage', (response, callback) => {
    User.findOne(
      { id: response.id, roomId: response.gameId },
      (err, userDoc) => {
        if (err) {
          callback(err);
        } else {
          console.log('userdoc: ', userDoc);
          io.to(response.gameId).emit('sendMessage', {
            from: userDoc.userName,
            message: response.message
          });
          callback();
        }
      }
    );
  });

  socket.on('disconnect', () => {
    console.log(`user disconnected`);
    var disconnected_user = othello.disconnectUser({socketId: socket.id})
    //   var user = user
    if(disconnected_user){
      io.to(disconnected_user.roomId).emit('serverMessage', {
        from: 'server',
        message: `User ${disconnected_user.userName} has disconnected`,
        activeUsers: othello.getActiveUsers(disconnected_user.roomId)
      })
      console.log('send disconnect msg: ' , disconnected_user);
      console.log('room occupants: ' , othello.getActiveUsers(disconnected_user.roomId));

    }

  

    // User.findOne({ socketId: socket.id }, (err, res) => {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     console.log('disconnect user: ', res);
    //     if (res) {
    //       // othello.disconnectUser(res);
    //       io.to(res.roomId).emit('serverMessage', {
    //         from: 'server',
    //         message: `User ${res.userName} has disconnected`,
    //         activeUsers: othello.getActiveUsers(res.roomId)
    //       });
    //       console.log('send disconnect server message');
    //     }
    //   }
    // });
  });
});

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
