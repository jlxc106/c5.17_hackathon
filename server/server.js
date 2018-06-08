require('./config/config.js');
const express = require('express');
const path = require('path');
const socketIO = require('socket.io');
const http = require('http');
var fs = require('fs');
const moment = require('moment');
const {ObjectID} = require('mongodb')
// const jwt = require('jsonwebtoken');

var { mongoose } = require('./db/mongoose');
const { User } = require('./models/user');
const { Othello } = require('./othello/othello');
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

  socket.on('validateUser', (response, callback)=>{
      if(!response.token){
          console.log('no token. creating new user');
          var user = new User({
              _id: new ObjectID(),
              socketId: socket.id
          });
          user.save().then(result =>{
              othello.connectUser(result);
              const token = user.generateAuthToken();
              callback('new user', {token: token});
              return;
          }, err=> console.log('error: ', err));
       }
      else{
        User.findByToken(response.token).then((userDoc)=>{
            User.findByIdAndUpdate({_id: userDoc._id}, {socketId: socket.id}, {new: true}, (err, doc) =>{
                if(err || !doc){
                    // console.log(err);
                    console.log('tainted token. creating new user')
                    var user = new User({
                        _id: new ObjectID(),
                        socketId: socket.id
                    });
                    user.save().then(result =>{
                        othello.connectUser(result);
                        const token = user.generateAuthToken();
                        callback('new user', {token: token});
                        return;
                    }, err=> console.log('error: ', err));
                }else{
                    console.log(`welcome back ${doc.userName} #${socket.id}`);
                    // console.log(`welcome back ${doc}`);
                    callback(null, doc);
                }
            })
          }).catch(err => console.log(err));
      }
  })

  socket.on('join', (response)=>{
    console.log(response);
    User.findByToken(response.token).then(doc=>{
        socket.join(doc.roomId);
        othello.connectUser(doc);
        io.to(doc.roomId).emit('serverMessage', {
            from: 'server',
            message: `User ${doc.userName} has connected`,
            activeUsers: othello.getActiveUsers(doc.roomId)
        });
    })
  })

  socket.on('searchOthello', response => {
      console.log(response);
    if (response.userName.trim().length > 0) {
        User.findByToken(response.token).then(doc =>{
            User.findByIdAndUpdate({_id: ObjectID(doc._id)}, {userName: response.userName}, {new: true}, (err, result)=>{
                console.log('searchothello result: ',result);
                if(err || !result){
                    console.log('unable to find user');
                    return;
                }
                else if(othello.addUserToWaitingList(result)){
                    const gameId = new ObjectID().toHexString();
                    console.log('gameId: ',gameId);
                    othello.addUsersToGame(gameId).then(players=>{
                        players.forEach(player => {
                            if (player.socketId !== socket.id) {
                              socket.to(player.socketId).emit('foundOthelloGame', {path: `othello2.html?numPlayers=2&id=${gameId}`});
                            } else {
                              socket.emit('foundOthelloGame', {path: `othello2.html?numPlayers=2&id=${gameId}`});
                            }
                          });
                    }, (err)=>console.log(err));
                }
            })
        })
    }
    else{
        callback()
    }
  });

  socket.on('newMessage', (response, callback) => {
    User.findByToken(response.token).then((userDoc) =>{
        io.to(response.gameId).emit('sendMessage', {
            from: userDoc.userName,
            message: response.message
        })
        callback();
    }).catch(err => callback(err))
    // User.findOne(
    //   { id: response.id, roomId: response.gameId },
    //   (err, userDoc) => {
    //     if (err) {
    //       callback(err);
    //     } else {
    //       console.log('userdoc: ', userDoc);
    //       io.to(response.gameId).emit('sendMessage', {
    //         from: userDoc.userName,
    //         message: response.message
    //       });
    //       callback();
    //     }
    //   }
    // );
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
  });
});

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});




