// const express = require('express');
// const path = require('path');
// const socketIO = require('socket.io');
// const http = require('http');
// var fs = require('fs');
// const moment = require('moment');

// const {Othello} = require('./game_logic/othello');
// const publicPath = path.join(__dirname, '../public');
// const app = express();
// var server = http.createServer(app);
// var io = socketIO(server);
// const port = process.env.PORT || 3000;

// app.use(express.static(publicPath));

// var othello = new Othello();

// //
// app.use((req, res, next) => {
//     var now = new Date().toString();
//     var log = `${now}: ${req.method} ${req.url}`;
//     //console.log(log);
//     fs.appendFile('server.log', log + '\n', err => {
//       if (err) {
//         console.log('Unable to append to server.log');
//       }
//     });
//     next();
//   });

// io.on('connection', socket => {
//   console.log(`new user connected. id: ${socket.id}`);

//   socket.on('searchOthello', (params)=>{
//     if(params.userName.trim().length > 0){

//         othello.addUserToWaitingList(socket.id, params.userName, params.hash).then(()=>{
//             if(othello.waitingList.length > 1){
//                 const playerIds = (othello.waitingList[0].id).concat(othello.waitingList[1].id);
//                 // const path = `othello2.html?numPlayers=2&id=${playerIds}`
//                 var othelloPlayers = othello.addUsersToGame(playerIds);
//                 const player1 = othelloPlayers.filter(player => player.id === socket.id);
//                 const player2 = othelloPlayers.filter(player => player.id !== socket.id);
//                 // const path = `othello.html?numPlayers=2&id=${player1[0].id}${player2[0].id}`
//                 const now = moment().valueOf();

//                 socket.emit('foundOthelloGame', {
//                     user: player1[0],
//                     opponent: player2[0],
//                     date: now,
//                     role: 'jedi',
//                     path: `othello2.html?numPlayers=2&id=${player1[0].id}`
//                 })
//                 socket.to(player2[0].id).emit('foundOthelloGame', {
//                     user: player2[0],
//                     opponent: player1[0],
//                     date: now,
//                     role: 'sith',
//                     path: `othello2.html?numPlayers=2&id=${player2[0].id}`
//                 })

//                 //something here
//             }
//         });
//         //add user to list of users & waiting list

//         // const userObject = generateOthelloUser(params.userName, params.hash);
//         // addUser(socket.id, params.userName, params.hash);
//         // othello.push(userObject);
//         // console.log(othello);
//     }
//   })

//   socket.on('newMessage', (response)=>{
//       console.log(response);
//       const gameId = othello.getUserGameId(response.id);
//       response.date = moment().valueOf();
//       io.to(gameId).emit('sendMessage', response);
//     //   socket.emit()
//   })

//   socket.on('updateSocketId', (response)=>{
//     console.log('updateSocketId response: ', response);
//     var gameId = othello.getUserGameId(response.id);
//     console.log(socket.id);

//     //update socket.id
//     socket.join(gameId);
//   })

//   socket.on('disconnect', ()=>{
//       console.log(`user disconnected: ${socket.id}`)
//     //   var user = user
//   })

// });

// server.listen(port, () => {
//   console.log(`listening on port ${port}`);
// });

require('./config/config.js');

const express = require('express');
const path = require('path');
const socketIO = require('socket.io');
const http = require('http');
var fs = require('fs');
const moment = require('moment');
var {mongoose} = require('./db/mongoose');

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
  //console.log(log);
  fs.appendFile('server.log', log + '\n', err => {
    if (err) {
      console.log('Unable to append to server.log');
    }
  });
  next();
});

io.on('connection', socket => {
  console.log(`new user connected.`);


  // socket.on('searchOthello', params => {
  //   if (params.userName.trim().length > 0) {
  //     othello
  //       .addUserToWaitingList(socket.id, params.userName, params.hash)
  //       .then(() => {
  //         if (othello.waitingList.length > 1) {
  //           const playerIds = othello.waitingList[0].id.concat(
  //             othello.waitingList[1].id
  //           );
  //           var othelloPlayers = othello.addUsersToGame(playerIds);
  //           const player1 = othelloPlayers.filter(player => player.id === socket.id);
  //           const player2 = othelloPlayers.filter(player => player.id !== socket.id);
  //           const now = moment().valueOf();
  //           User.updateMany({})


  //           socket.emit('foundOthelloGame', {
  //             user: player1[0],
  //             opponent: player2[0],
  //             date: now,
  //             role: 'jedi',
  //             path: `othello2.html?numPlayers=2&id=${player1[0].id}`
  //           });
  //           socket.to(player2[0].id).emit('foundOthelloGame', {
  //             user: player2[0],
  //             opponent: player1[0],
  //             date: now,
  //             role: 'sith',
  //             path: `othello2.html?numPlayers=2&id=${player2[0].id}`
  //           });
  //         }
  //       });
  //   }
  // });

  socket.on('searchOthello', response => {
    if (response.userName.trim().length > 0) {

      User.findOneAndUpdate({id: response.id}, {'userName': response.userName, 'hash': response.pairingHash},(err, result)=>{
        othello.addUserToWaitingList({"socketId":socket.id, "id":response.id}).then((waitingList)=>{
          if(waitingList.length > 1){
            const gameId = waitingList[0]["socketId"].concat(waitingList[1]["socketId"]);
            othello.addUsersToGame(gameId, waitingList).then((playerIds)=>{
              console.log('playerIds: ', playerIds);
              console.log('socket.id ', socket.id)
            // const player1 = playerIds.filter(player => player.id === response.id);  //this me
            // const player2 = playerIds.filter(player => player.id !== response.id);  //this u
            // socket.join(gameId);
            // socket.to(player1[0].socketId).join(gameId);
            // socket.to().join(gameId);
            playerIds.forEach(player=>{
              if(player.socketId !== socket.id){
                socket.to(player.socketId).emit('foundOthelloGame', {
                  // user: player2[0],
                  // opponent: player1[0],
                  // date: now,
                  // role: 'sith',
                  path: `othello2.html?numPlayers=2&id=${gameId}`
                });
                // socket.to(player.socketId).join(gameId);
                // console.log('u joins');

              }
              else{
                // socket.join(gameId);
                // console.log('me joins')
                socket.emit('foundOthelloGame', {
                  // user: player1[0],
                  // opponent: player2[0],
                  // date: now,
                  // role: 'jedi',
                  path: `othello2.html?numPlayers=2&id=${gameId}`
                });
              }
            })
            // const now = moment().valueOf();
            // console.log('player1: ', player1);
            // console.log('player2: ',player2);


            // io.in(gameId).emit('foundOthelloGame', {
            //   path: `othello2.html?numPlayers=2&id=${gameId}`




          })
          }
        })
      })

      // othello
      //   .addUserToWaitingList(socket.id, response.userName, response.hash)
      //   .then(() => {
      //     if (othello.waitingList.length > 1) {
      //       const playerIds = othello.waitingList[0].id.concat(
      //         othello.waitingList[1].id
      //       );
      //       var othelloPlayers = othello.addUsersToGame(playerIds);
      //       const player1 = othelloPlayers.filter(player => player.id === socket.id);
      //       const player2 = othelloPlayers.filter(player => player.id !== socket.id);
      //       const now = moment().valueOf();
      //       User.updateMany({})


            // socket.emit('foundOthelloGame', {
            //   user: player1[0],
            //   opponent: player2[0],
            //   date: now,
            //   role: 'jedi',
            //   path: `othello2.html?numPlayers=2&id=${player1[0].id}`
            // });
            // socket.to(player2[0].id).emit('foundOthelloGame', {
            //   user: player2[0],
            //   opponent: player1[0],
            //   date: now,
            //   role: 'sith',
            //   path: `othello2.html?numPlayers=2&id=${player2[0].id}`
            // });
      //     }
      //   });
    }
  });

  socket.on('validateUser', (response, callback) => {
    console.log('validateUser response: ', response);
    if (response.id === null) {
        var user = new User({
          id: socket.id,
          socketId: socket.id,
          roomId: null
        });
        user.save().then((result) => {
          console.log('user save result: ',result);
          callback('invalid id', { id: socket.id });
          return;
        },(err)=>{
          console.log('error: ',err);
        });
    } else {
      User.findOneAndUpdate({ id: response.id }, {socketId: socket.id}, (err, doc)=>{
        console.log('doc', doc);
        if(err){
          console.log(err);
          callback('invalid id', {id: socket.id});
        }
      })
    }
  });

  socket.on('newMessage', response => {
    console.log(response);
    const gameId = othello.getUserGameId(response.id);
    response.date = moment().valueOf();
    io.to(gameId).emit('sendMessage', response);
    //   socket.emit()
  });

  // socket.on('updateSocketId', (response)=>{
  //   console.log('updateSocketId response: ', response);
  //   var gameId = othello.getUserGameId(response.id);
  //   console.log(socket.id);

  //   //update socket.id
  //   socket.join(gameId);
  // })

  socket.on('disconnect', () => {
    console.log(`user disconnected`);
    //   var user = user
  });
});

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
