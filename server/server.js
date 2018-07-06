require('./config/config.js');
const express = require('express');
const path = require('path');
const socketIO = require('socket.io');
const http = require('http');
var fs = require('fs');
const _ = require('lodash');
const { ObjectID } = require('mongodb');

const { User } = require('./models/user');
const { Othello } = require('./othello/othello');
const { OthelloModel } = require('./models/othello_model');
const publicPath = path.join(__dirname, '../public');
const publicPath2 = path.join(__dirname, '..')
const app = express();
var server = http.createServer(app);
var io = socketIO(server);
const port = process.env.PORT || 3000;



//production
// app.use(express.static(publicPath2));

// app.get("/*", (req, res)=>{
//   res.sendFile(path.resolve(__dirname, "..", "index.html"));
// })

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
    console.log('validate user');
    if (!response.token || response.token == "undefined") {
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
                    console.log(`welcome back ${doc.userName}`);
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
    User.findByToken(response.token)
      .then(doc => {
        socket.join(doc.roomId);
        othello.connectUser(doc);
        var usersInGame = othello.getActiveUsers(doc.roomId);
        OthelloModel.findById(doc.roomId, (err, gameObj) =>{
          if(err || !gameObj){
            return console.log(err);
          }
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

  socket.on('searchOthello', (response, callback) => {
    console.log('139 searchothello');
    if (response.userName.trim().length > 0) {
      User.findByToken(response.token).then(doc => {
        User.findByIdAndUpdate(
          { _id: ObjectID(doc._id) },
          { userName: response.userName },
          { new: true },
          (err, result) => {
            if (err || !result) {
              console.log('unable to find user');
              return;
            } else if (othello.addUserToWaitingList(result)) {
              const gameId = new ObjectID().toHexString();
              othello
                .addUsersToGame(gameId)
                .then(players => {
                  players.forEach(player => {
                    console.log('foundothellogame');
                    if (player.socketId !== socket.id) {
                      socket
                        .to(player.socketId)
                        .emit('foundOthelloGame', {
                          gameId: gameId
                        });
                    } else {
                      socket.emit('foundOthelloGame', {
                        gameId: gameId
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
                        {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0'},
                        {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0'},
                        {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0'},
                        {0: '0', 1:'0', 2:'0', 3:'w', 4:'b', 5:'0', 6:'0', 7:'0'},
                        {0: '0', 1:'0', 2:'0', 3:'b', 4:'w', 5:'0', 6:'0', 7:'0'},
                        {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0'},
                        {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0'},
                        {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0'},
                      ],
                      allowedMoves: [{'row': 2, 'col': 3}, {'row': 3, 'col': 2}, {'row': 4, 'col': 5}, {'row': 5, 'col': 4}]
                    }
                  });
                  othelloGame.save();
                })
                .catch(e => console.log(e));
            }
          }
        );
      });
    } else {
      callback('invalid name');
    }
  });

  socket.on('setMove', (res, callback) => {
    OthelloModel.findById(res.gameId).then(othelloGame => {
        if((othelloGame.gameState.userTurn ==='sith' && res.role === 'black') || (othelloGame.gameState.userTurn ==='jedi' && res.role === 'white')){
          othelloGame.validateMove(res.role, res.position);
          return othelloGame;
        }
        throw new Error('not user turn')
    }).then(othelloGame =>{
      var resObj = {
        allowedMoves: othelloGame.gameState.allowedMoves,
        boardState: othelloGame.gameState.boardState,
        userTurn: othelloGame.gameState.userTurn
      }
      socket.to(res.gameId).emit('getMove', resObj)
      callback(null, resObj)
      if(othelloGame.gameState.winner.role && othelloGame.gameState.winner.role !== 'tie'){
        var usersInGame = othello.getActiveUsers(res.gameId);
        io.in(res.gameId).emit('gameOver', {
          winner: othelloGame.gameState.winner.role
        })
        io.in(res.gameId).emit('serverMessage', {
          from: 'server',
          message: `User ${othelloGame.gameState.winner.userName} has won!`,
          activeUsers: usersInGame
        });
      }
      else if(othelloGame.gameState.winner.role === 'tie'){
        var usersInGame = othello.getActiveUsers(res.gameId);
        io.in(res.gameId).emit('gameOver', {
          winner: othelloGame.gameState.winner.role
        })
        io.in(res.gameId).emit('serverMessage', {
          from: 'server',
          message: `Tie game!`,
          activeUsers: usersInGame
        });
      }
    }).catch(err => console.log(err));
  });

  socket.on('requestNewGame', (response)=>{
    User.findByToken(response.token).then(user =>{
      var swRole = response.role === 'black' ? 'sith' : 'jedi';
      OthelloModel.findById(response.gameId).then(othelloGame =>{
        othelloGame.players[swRole].resetGamePressed = new Date().valueOf();
        if(othelloGame.players.jedi.resetGamePressed && othelloGame.players.sith.resetGamePressed && Math.abs(othelloGame.players.jedi.resetGamePressed - othelloGame.players.sith.resetGamePressed < 600000)){
          othelloGame.initNewGame();
          othelloGame.save().then(othello =>{
            io.in(response.gameId).emit('initNewGame', othello);
          })
        }else{
          othelloGame.save();
        }
      })

      socket.to(response.gameId).emit('confirmNewGame', {
        userName: user.userName
      })
    }).catch(err => console.log(err));
  })

  socket.on('startNewGame', (response)=>{
    OthelloModel.findById(response.gameId).then(othelloGame =>{
      othelloGame.initNewGame();
      othelloGame.save().then(othello =>{
        io.in(response.gameId).emit('initNewGame', othello);
      })
    })

  })


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
    var disconnected_user = othello.disconnectUser({ socketId: socket.id });
    if (disconnected_user) {
      io.to(disconnected_user.roomId).emit('serverMessage', {
        from: 'server',
        message: `User ${disconnected_user.userName} has disconnected`,
        activeUsers: othello.getActiveUsers(disconnected_user.roomId)
      });
      console.log(`User ${disconnected_user.userName} disconnected`);
    }
  });
});

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
