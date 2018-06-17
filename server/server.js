require('./config/config.js');
const express = require('express');
const path = require('path');
const socketIO = require('socket.io');
const http = require('http');
var fs = require('fs');
const moment = require('moment');
const { ObjectID } = require('mongodb');
var memwatch = require('memwatch-next');
const jwt = require('jsonwebtoken');

var { mongoose } = require('./db/mongoose');
const { User } = require('./models/user');
const { Othello } = require('./othello/othello');
const { OthelloModel } = require('./models/othello_model');
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
  socket.on('validateUser', (response, callback) => {
    if (!response.token) {
      console.log('no token. creating new user');
      var user = new User({
        _id: new ObjectID(),
        socketId: socket.id
      });
      user.save().then(
        result => {
          othello.connectUser(result);
          const token = user.generateAuthToken();
          callback('new user', { token: token });
          return;
        },
        err => console.log('error: ', err)
      );
    } else {
      User.findByToken(response.token)
        .then(userDoc => {
          if (!userDoc) {
            console.log('tainted token. creating new user');
            var user = new User({
              _id: new ObjectID(),
              socketId: socket.id
            });
            user.save().then(
              result => {
                othello.connectUser(result);
                const token = user.generateAuthToken();
                callback('new user', { token: token });
                return;
              },
              err => console.log('error: ', err)
            );
          }else{
            User.findByIdAndUpdate(
                { _id: userDoc._id },
                { socketId: socket.id },
                { new: true },
                (err, doc) => {
                  if (err || !doc) {
                    // console.log(err);
                    console.log('tainted token. creating new user');
                    var user = new User({
                      _id: new ObjectID(),
                      socketId: socket.id
                    });
                    user.save().then(
                      result => {
                        othello.connectUser(result);
                        const token = user.generateAuthToken();
                        callback('new user', { token: token });
                        return;
                      },
                      err => console.log('error: ', err)
                    );
                  } else {
                    console.log(`welcome back ${doc.userName} #${socket.id}`);
                    // console.log(`welcome back ${doc}`);
                    callback(null, doc);
                  }
                }
              );
          }
        })
        .catch(err => console.log(err));
    }
  });

  socket.on('join', response => {
    console.log(response);
    User.findByToken(response.token)
      .then(doc => {
        socket.join(doc.roomId);
        othello.connectUser(doc);
        var usersInGame = othello.getActiveUsers(doc.roomId);
        OthelloModel.findById(doc.roomId, (err, gameObj) =>{
          if(err || !gameObj){
            return console.log(err);
          }
          console.log('117 pre initOthello gameObj', gameObj);
          socket.emit('initOthello', {
            role: doc.role,
            users: usersInGame,
            boardState: gameObj.gameState.boardState,
            allowedMoves: gameObj.gameState.allowedMoves,
            userTurn: gameObj.gameState.userTurn
          });
        })
        socket.to(doc.roomId).emit('serverMessage', {
          from: 'server',
          message: `User ${doc.userName} has connected`,
          activeUsers: usersInGame
        });
      })
      .catch(err => console.log(err));
  });

  socket.on('searchOthello', response => {
    console.log(response);
    if (response.userName.trim().length > 0) {
      User.findByToken(response.token).then(doc => {
        User.findByIdAndUpdate(
          { _id: ObjectID(doc._id) },
          { userName: response.userName },
          { new: true },
          (err, result) => {
            console.log('searchothello result: ', result);
            if (err || !result) {
              console.log('unable to find user');
              return;
            } else if (othello.addUserToWaitingList(result)) {
              const gameId = new ObjectID().toHexString();
              console.log('gameId: ', gameId);
              othello
                .addUsersToGame(gameId)
                .then(players => {
                  players.forEach(player => {
                    if (player.socketId !== socket.id) {
                      socket
                        .to(player.socketId)
                        .emit('foundOthelloGame', {
                          path: `othello2.html?numPlayers=2&id=${gameId}`
                        });
                    } else {
                      socket.emit('foundOthelloGame', {
                        path: `othello2.html?numPlayers=2&id=${gameId}`
                      });
                    }
                  });
                  return players;
                })
                .then(players => {
                  var othelloGame = new OthelloModel({
                    _id: ObjectID(gameId),
                    players: {
                      jedi: {
                        userName: players[1].userName,
                        _id: players[1]._id,
                        socketId: players[1].socketId
                      },
                      sith: {
                        userName: players[0].userName,
                        _id: players[0]._id,
                        socketId: players[0].socketId
                      }
                    },
                    gameState: {
                      boardState: [
                        {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0', },
                        {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0', },
                        {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0', },
                        {0: '0', 1:'0', 2:'0', 3:'w', 4:'b', 5:'0', 6:'0', 7:'0', },
                        {0: '0', 1:'0', 2:'0', 3:'b', 4:'w', 5:'0', 6:'0', 7:'0', },
                        {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0', },
                        {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0', },
                        {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0', },
                      ],
                      allowedMoves: [{'row': 2, 'col': 3}, {'row': 3, 'col': 2}, {'row': 4, 'col': 5}, {'row': 5, 'col': 4}]
                      // [2,3], [3,2], [4,5], [5,4]
                    }
                  });
                  othelloGame.save().then(gameObj => console.log(gameObj));
                })
                .catch(e => console.log(e));
            }
          }
        );
      });
    } else {
      callback();
    }
  });

  socket.on('setMove', (res, callback) => {
      console.log('201 ', res);
    OthelloModel.findById(res.gameId).then(othelloGame => {
        // console.log('203 ', othelloGame);
        othelloGame.validateMove(res.role, res.position);
        return othelloGame;
    }).then(othelloGame =>{
      // console.log(othelloGame);
      var resObj = {
        allowedMoves: othelloGame.gameState.allowedMoves,
        boardState: othelloGame.gameState.boardState,
      }
      socket.to(res.gameId).emit('getMove', resObj)
      callback(null, resObj)
    });
    // socket.to(res.gameId).emit('getMove', res);
    // io.in(res.gameId).emit("getMove",res);
    // callback(null, res);
  });

  socket.on('newMessage', (response, callback) => {
    User.findByToken(response.token)
      .then(userDoc => {
        io.to(response.gameId).emit('sendMessage', {
          obj: userDoc,
          from: userDoc.userName,
          role: userDoc.role,
          message: response.message,
          activeUsers: othello.getActiveUsers(userDoc.roomId)
        });
        callback();
      })
      .catch(err => callback(err));
  });

  socket.on('disconnect', () => {
    console.log(`user disconnected`);
    var disconnected_user = othello.disconnectUser({ socketId: socket.id });
    //   var user = user
    if (disconnected_user) {
      io.to(disconnected_user.roomId).emit('serverMessage', {
        from: 'server',
        message: `User ${disconnected_user.userName} has disconnected`,
        activeUsers: othello.getActiveUsers(disconnected_user.roomId)
      });
      console.log('send disconnect msg: ', disconnected_user.userName);
      //   console.log('room occupants: ' , othello.getActiveUsers(disconnected_user.roomId));
    }
  });
});

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});

memwatch.on('leak', function(info){
  console.log('-------------leak info--------');
  console.log(info);
  console.log('--------------------------------------')
})


memwatch.on('stats', function(stats){
  console.log('-------------leak info--------');
  console.log(stats);
  console.log('--------------------------------------')
})

