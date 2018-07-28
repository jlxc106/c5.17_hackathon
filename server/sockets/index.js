const socketIO = require('socket.io');
const { ObjectID } = require('mongodb');

const { User } = require('../models/user');
const { OthelloModel } = require('../models/othello_model');
const { Othello } = require('../othello/othello');

module.exports = server => {
  var othello = new Othello();
  var io = socketIO(server);
  
  io.on('connection', async socket => {
    socket.on('validateUser', async (response, callback) => {
      console.log('validate user');
      if (!response.token || response.token == 'undefined') {
        console.log('no token. creating new user');
        var user = new User({
          _id: new ObjectID(),
          socketId: socket.id
        });
        var result = await user.save();
        try {
          othello.connectUser(result);
          const token = user.generateAuthToken();
          callback('new user', { token: token });
          return;
        } catch (e) {
          console.log('error: ', e);
        }
      } else {
        var userDoc = await User.findByToken(response.token);
        if (!userDoc) {
          console.log('tained token. creating new user');
          var user = new User({
            _id: new ObjectID(),
            socketId: socket.id
          });
          var result = await user.save;
          try {
            othello.connectUser(result);
            const token = user.generateAuthToken();
            callback('new user', { token: token });
            return;
          } catch (e) {
            console.log('error: ', e);
          }
        } else {
          User.findByIdAndUpdate(
            { _id: userDoc._id },
            { socketId: socket.id },
            { new: true },
            async (err, doc) => {
              if (err || !doc) {
                console.log('tainted token. creating new user');
                var user = new User({
                  _id: new ObjectID(),
                  socketId: socket.id
                });
                var result = await user.save();
                try {
                  othello.connectUser(result);
                  const token = user.generateAuthToken();
                  callback('new user', { token: token });
                  return;
                } catch (e) {
                  err => console.log('error: ', err);
                }
              } else {
                console.log(`welcome back ${doc.userName}`);
                callback(null, doc);
              }
            }
          );
        }
      }
    });

    socket.on('join', async response => {
      try {
        var doc = await User.findByToken(response.token);
        socket.join(doc.roomId);
        othello.connectUser(doc);
        var usersInGame = othello.getActiveUsers(doc.roomId);
        OthelloModel.findById(doc.roomId, (err, gameObj) => {
          if (err || !gameObj) {
            return console.log(err);
          }
          socket.emit('initOthello', {
            role: doc.role,
            users: usersInGame,
            boardState: gameObj.gameState.boardState,
            allowedMoves: gameObj.gameState.allowedMoves,
            userTurn: gameObj.gameState.userTurn
          });
        });
        socket.to(doc.roomId).emit('serverMessage', {
          from: 'server',
          message: `User ${doc.userName} has connected`,
          activeUsers: usersInGame
        });
      } catch (e) {
        console.log(e);
      }
    });

    socket.on('searchOthello', async (response, callback) => {
      // console.log('139 searchothello');
      if (response.userName.trim().length > 0) {
        try {
          let doc = await User.findByToken(response.token);
          User.findByIdAndUpdate(
            { _id: ObjectID(doc._id) },
            { userName: response.userName },
            { new: true },
            async (err, result) => {
              if (err || !result) {
                console.log('unable to find user');
                return;
              } else if (othello.addUserToWaitingList(result)) {
                const gameId = new ObjectID().toHexString();
                var players = await othello.addUsersToGame(gameId);
                players.forEach(player => {
                  if (player.socketId !== socket.id) {
                    socket.to(player.socketId).emit('foundOthelloGame', {
                      gameId: gameId
                    });
                  } else {
                    socket.emit('foundOthelloGame', {
                      gameId: gameId
                    });
                  }
                });
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
                      {
                        0: '0',
                        1: '0',
                        2: '0',
                        3: '0',
                        4: '0',
                        5: '0',
                        6: '0',
                        7: '0'
                      },
                      {
                        0: '0',
                        1: '0',
                        2: '0',
                        3: '0',
                        4: '0',
                        5: '0',
                        6: '0',
                        7: '0'
                      },
                      {
                        0: '0',
                        1: '0',
                        2: '0',
                        3: '0',
                        4: '0',
                        5: '0',
                        6: '0',
                        7: '0'
                      },
                      {
                        0: '0',
                        1: '0',
                        2: '0',
                        3: 'w',
                        4: 'b',
                        5: '0',
                        6: '0',
                        7: '0'
                      },
                      {
                        0: '0',
                        1: '0',
                        2: '0',
                        3: 'b',
                        4: 'w',
                        5: '0',
                        6: '0',
                        7: '0'
                      },
                      {
                        0: '0',
                        1: '0',
                        2: '0',
                        3: '0',
                        4: '0',
                        5: '0',
                        6: '0',
                        7: '0'
                      },
                      {
                        0: '0',
                        1: '0',
                        2: '0',
                        3: '0',
                        4: '0',
                        5: '0',
                        6: '0',
                        7: '0'
                      },
                      {
                        0: '0',
                        1: '0',
                        2: '0',
                        3: '0',
                        4: '0',
                        5: '0',
                        6: '0',
                        7: '0'
                      }
                    ],
                    allowedMoves: [
                      { row: 2, col: 3 },
                      { row: 3, col: 2 },
                      { row: 4, col: 5 },
                      { row: 5, col: 4 }
                    ]
                  }
                });
                othelloGame.save();
              }
            }
          );
        } catch (e) {
          console.log(e);
        }
      } else {
        callback('invalid name');
      }
    });

    socket.on('setMove', async (res, callback) => {
      try {
        var othelloGame = await OthelloModel.findById(res.gameId);
        if (
          (othelloGame.gameState.userTurn === 'sith' && res.role === 'black') ||
          (othelloGame.gameState.userTurn === 'jedi' && res.role === 'white')
        ) {
          othelloGame.validateMove(res.role, res.position);
        } else {
          throw new Error('not user turn');
        }
        var resObj = {
          allowedMoves: othelloGame.gameState.allowedMoves,
          boardState: othelloGame.gameState.boardState,
          userTurn: othelloGame.gameState.userTurn
        };
        socket.to(res.gameId).emit('getMove', resObj);
        callback(null, resObj);
        if (
          othelloGame.gameState.winner.role &&
          othelloGame.gameState.winner.role !== 'tie'
        ) {
          var usersInGame = othello.getActiveUsers(res.gameId);
          io.in(res.gameId).emit('gameOver', {
            winner: othelloGame.gameState.winner.role
          });
          io.in(res.gameId).emit('serverMessage', {
            from: 'server',
            message: `User ${othelloGame.gameState.winner.userName} has won!`,
            activeUsers: usersInGame
          });
        } else if (othelloGame.gameState.winner.role === 'tie') {
          var usersInGame = othello.getActiveUsers(res.gameId);
          io.in(res.gameId).emit('gameOver', {
            winner: othelloGame.gameState.winner.role
          });
          io.in(res.gameId).emit('serverMessage', {
            from: 'server',
            message: `Tie game!`,
            activeUsers: usersInGame
          });
        }
      } catch (e) {
        console.log(e);
      }
    });

    socket.on('requestNewGame', async response => {
      try {
        var user = await User.findByToken(response.token);
        var swRole = response.role === 'black' ? 'sith' : 'jedi';
        var othelloGame = await OthelloModel.findById(response.gameId);
        othelloGame.players[swRole].resetGamePressed = new Date().valueOf();
        if (
          othelloGame.players.jedi.resetGamePressed &&
          othelloGame.players.sith.resetGamePressed &&
          Math.abs(
            othelloGame.players.jedi.resetGamePressed -
              othelloGame.players.sith.resetGamePressed <
              600000
          )
        ) {
          othelloGame.initNewGame();
          var othello = await othelloGame.save();
          io.in(response.gameId).emit('initNewGame', othello);
        } else {
          othelloGame.save();
        }
        socket.to(response.gameId).emit('confirmNewGame', {
          userName: user.userName
        });
      } catch (e) {
        console.log(e);
      }
    });

    socket.on('startNewGame', async response => {
      let othelloGame = await OthelloModel.findById(response.gameId);
      othelloGame.initNewGame();
      let othello = await othelloGame.save();
      io.in(response.gameId).emit('initNewGame', othello);
    });

    socket.on('newMessage', async (response, callback) => {
      try {
        let userDoc = await User.findByToken(response.token);
        io.to(response.gameId).emit('sendMessage', {
          obj: userDoc,
          from: userDoc.userName,
          role: userDoc.role,
          message: response.message,
          activeUsers: othello.getActiveUsers(userDoc.roomId)
        });
        callback();
      } catch (e) {
        console.log(e);
      }
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
};
