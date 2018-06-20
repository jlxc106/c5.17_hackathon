require('./../config/config');
const moment = require('moment');
const {ObjectID} = require('mongodb');

const { mongoose } = require('./../db/mongoose');
const { User } = require('./../models/user');

class Othello {
  constructor() {
    this.waitingList = [];
    this.activeUsers = [];
  }

  connectUser(user) {
    this.activeUsers = this.activeUsers.filter(activeUser => activeUser.id !== user.id);
    this.activeUsers.push(user);
    // console.log("****active users: ", this.activeUsers);
    return this.activeUsers;
  }

  disconnectUser(user) {
    // console.log('************USER :', user);
    // console.log('*****ACTIVE USERS: ', this.activeUsers);
    this.waitingList = this.waitingList.filter(waitingUser => waitingUser.socketId !== user.socketId);
    var disconnected_user = this.activeUsers.filter(activeUser=> activeUser.socketId === user.socketId);
    this.activeUsers = this.activeUsers.filter(
      activeUser => activeUser.socketId !== user.socketId
    );
    return disconnected_user[0];
  }

  getActiveUsers(gameId) {
    return this.activeUsers.filter(activeUser => activeUser.roomId === gameId);
  }

  addUserToWaitingList(user) {
    this.waitingList = this.waitingList.filter(waitingUser => waitingUser.socketId !== user.socketId); //prevents same user from making two requests
    this.waitingList.push(user);
    if (this.waitingList.length > 1) {
      return true;
    }
    return false;
  }

  addUsersToGame(gameId) {
    var self = this;
    return new Promise(function(resolve, reject) {
      User.count({ roomId: gameId }, (err, countDocuments) => {
        if (err) {
          console.log(err);
          reject(err);
        }
        // console.log('countDocuments: ', countDocuments);
        if (countDocuments === 0) {
          console.log('no duplicate gameIds');
          //no such gameId exists yet
          let playerList = [];
          playerList.push(self.waitingList.shift());
          playerList.push(self.waitingList.shift());

          const roles = ['black', 'white'];
          var counter = 0;
          var newArr = [];
          playerList.forEach((userId, index) => {
            User.findByIdAndUpdate(
              { _id: ObjectID(userId._id) },
              { roomId: gameId, role: roles[index] },
              {new: true},
              (err, result) => {
                if (err || !result) {
                  console.log(err);
                  reject(err) || reject('no result');
                }else{
                  console.log('hehe xd: ',result);
                  newArr.push(result);
                  if (counter++ == 1) {
                    console.log('----------------updated roomId parameter----------------')
                    resolve(newArr);
                    // resolve(playerList);
                  }
                }

              }
            );
          });
        }else{
          console.log('duplicate gameIds');
        }
      });
    });
  }

  getUserGameId(userId) {
    console.log(this.userList);
    let result = this.userList.filter(userObj => userObj.id === userId);
    if (result.length === 1) {
      return result[0].gameId;
    }
    console.log('mistakes were made');
  }


  removeGame(gameId) {
    if (gameId && _.has(this.userList, gameId)) {
      delete this.userList[gameId];
    }
  }
}

module.exports = { Othello };
