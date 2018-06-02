// const moment = require('moment');

// class Othello {
//   constructor() {
//     // var self = this;
//     this.waitingList = [];
//     this.userList = [];
//   }

//   addUserToWaitingList(id, userName, hash) {
//     var self = this;
//     return new Promise(function(resolve, reject){
//         try{
//             // console.log(self);
//             const user = generateOthelloUser(id, userName, hash);
//             self.waitingList.push(user);
//             console.log(self.waitingList);
//             resolve(user);
//         }
//         catch(e){
//             reject(e);
//         }

//     })
//   }

//   addUsersToGame(key) {
//       let player1 = this.waitingList.shift();
//       let player2 = this.waitingList.shift();
//       player1.gameId = key;
//       player2.gameId = key;
//     //   var gameObj = {'game123': [player1, player2]}
//       this.userList.push(player1, player2);
//       console.log('this is the user list: ',this.userList);
//       //push users to that game uri
//       return [player1, player2];
//   }

//   getUserGameId(userId){
//     console.log(this.userList)
//     let result = this.userList.filter(userObj => userObj.id === userId)
//     if(result.length === 1){
//        return result[0].gameId; 
//     }
//     console.log('mistakes were made');
//     // throw new Error('mistakes were made');
//   }


// //   updateUser

//   removeGame(gameId) {
//     if (gameId && _.has(this.userList, gameId)) {
//       delete this.userList[gameId];
//       // this.userList = this.userList.
//     }
//   }
// }

// const generateOthelloUser = (id, userName, hash, gameId) => {
//   return {
//     id,
//     userName,
//     hash,
//     gameId,
//     createdAt: moment().valueOf(),
//   };
// };

// module.exports = { Othello };


require('./../config/config');
const moment = require('moment');

const {mongoose} = require('./../db/mongoose');
const {User} = require('./../models/user');

class Othello {
  constructor() {
    this.waitingList = [];
  }

  addUserToWaitingList(userIds) {
    var self = this;
    return new Promise(function(resolve, reject){
        try{
            // const user = generateOthelloUser(id, userName, hash);
            self.waitingList.push(userIds);
            console.log(self.waitingList);
            resolve(self.waitingList);
        }
        catch(e){
            reject(e);
        }

    })
  }

  addUsersToGame(gameId, list) {

    return new Promise(function(resolve, reject){
      User.count({roomId: gameId}, (err, countDocuments)=>{
        if(err){
          console.log(err);
          reject(err);
        }
        console.log('countDocuments: ', countDocuments);
        if(true){ //no such gameId exists yet
          let playerList = [];
          playerList.push(list.shift());
          playerList.push(list.shift());

          const roles = ['black', 'white'];
          var counter = 0;
          playerList.forEach((userId, index)=>{
            User.findOneAndUpdate({id: userId.id}, {roomId: gameId, role: roles[index]}, (err, result)=>{
              if(err){
                console.log(err);
                reject(err);
              }
              console.log(result);
              if(counter++ == 1){
                resolve(playerList);
              }
            })
          })


          // User.updateMany({id: [player1Id.id, player2Id.id]}, {roomId: gameId}, (err, result)=>{
          //   if(err){
          //     console.log(err);
          //     reject(err);
          //   }
          //   console.log(result);
          //   resolve([player1Id, player2Id]); 
          // })
        }
      })
    })


    // User.
    //   let player1 = this.waitingList.shift();
    //   let player2 = this.waitingList.shift();
    //   player1.gameId = key;
    //   player2.gameId = key;
    // //   var gameObj = {'game123': [player1, player2]}
    //   this.userList.push(player1, player2);
    //   console.log('this is the user list: ',this.userList);
    //   //push users to that game uri
    //   return [player1, player2];
  }

  getUserGameId(userId){
    console.log(this.userList)
    let result = this.userList.filter(userObj => userObj.id === userId)
    if(result.length === 1){
       return result[0].gameId; 
    }
    console.log('mistakes were made');
    // throw new Error('mistakes were made');
  }


//   updateUser

  removeGame(gameId) {
    if (gameId && _.has(this.userList, gameId)) {
      delete this.userList[gameId];
      // this.userList = this.userList.
    }
  }
}

// const generateOthelloUser = (id, userName, hash, gameId) => {
//   return {
//     id,
//     userName,
//     hash,
//     gameId,
//     createdAt: moment().valueOf(),
//   };
// };

module.exports = { Othello };


