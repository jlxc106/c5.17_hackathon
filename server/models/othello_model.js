var mongoose = require('mongoose');
const _ = require('lodash')
var memwatch = require('memwatch-next');
// const jwt = require('jsonwebtoken');
// const { ObjectID } = require('mongodb');
// var ObjectId = mongoose.Types.ObjectId();
var {flip, updateAllowedMoves} = require('../game_logic/othello_logic');
var ObjectId = mongoose.Schema.ObjectId;

// var othello_logic = new Othello_logic();

var OthelloSchema = new mongoose.Schema({
  _id: {
    type: ObjectId,
    required: true
  },
  players: {
    jedi: {
      userName: {
          type: String,
          trime: true,
          required: true
      },
      _id: {
        type: ObjectId,
        trim: true,
        required: true
      },
      socketId: {
          type: String,
          trim: true,
          required: true
      }
    },
    sith: {
      userName: {
        type: String,
        trim: true,
        required: true
      },
      _id: {
        type: ObjectId,
        trim: true,
        required: true
      },
      socketId: {
        type: String,
        trim: true,
        required: true
      }
    }
  },
  gameState: {
    isActive: {
      type: Boolean,
      required: true,
      default: true
    },
    turnCount: {
      type: Boolean,
      default: 0
    },
    userTurn: {
      type: String,
      required: true,
      default: 'sith'
    },
    boardState: [{0:String, 1:String,2:String,3:String,4:String,5:String,6:String,7:String}],
    // boardState: mongoose.Schema.Types.Mixed,
    allowedMoves: mongoose.Schema.Types.Mixed,
    winner:{
        type: ObjectId,
        default: null
    }
  }
});


OthelloSchema.methods.validateMove = function(role, coordinates){
    const coord_row = coordinates['row'];
    const coord_col = coordinates['col'];
    var othelloGame = this;
    var userPiece, opponentPiece;
    // var moveIsValid = false;
    var copyBoardState = this.gameState.boardState.slice();
    console.log('inside validatemove');
    // if((othelloGame.gameState.userTurn === 'sith' && role !== 'black') || (othelloGame.gameState.userTurn === 'jedi' && role !== 'white')){ // the correct user submitted a move
    //     return Promise.reject();
    // }
    // coordinates.forEach(value =>{
    //     if(value < 0 || value > 7){
    //         return Promise.reject();
    //     }
    // })
    // console.log("88 ", othelloGame.gameState.allowedMoves)
    console.log('96 ', coordinates);
    var moveIsValid = _.findIndex(othelloGame.gameState.allowedMoves, (move)=>{
        return move['row'] === coord_row && move['col'] === coord_col 
    })
    // console.log(othelloGame.gameState.allowedMoves.includes(coordinates));
    // console.log(_.findIndex(othelloGame.gameState.allowedMoves, (move)=>{
    //     return move[0] === coordinates[0] && move[1] === coordinates[1] 
    // }))
    // console.log(_.includes(othelloGame.gameState.allowedMoves, coordinates));
    console.log('105 ', moveIsValid);
    if(moveIsValid !== -1){
        //update board state
        if(role === "black"){
            // console.log(92)
            userPiece = "b";
            opponentPiece = "w";
            othelloGame.gameState.userTurn = 'jedi';
        }else{
            // console.log(97)
            userPiece = "w";
            opponentPiece = "b";
            othelloGame.gameState.userTurn = 'sith';
        }
        console.log(119, 'before flip');
        var arrayOfFlips = flip(othelloGame.gameState.boardState, coordinates, userPiece, opponentPiece);
        console.log(121, arrayOfFlips);
        copyBoardState[coord_row][coord_col] = userPiece;
        arrayOfFlips.forEach(flipCoord =>{
            var row = flipCoord[0];
            var column = flipCoord[1];
            copyBoardState[row][column] = userPiece;
        })
        othelloGame.gameState.boardState = copyBoardState;
        // allowedMoves: [[2,3], [3,2], [4,5],[5,4]]
        console.log(130);
        othelloGame.gameState.allowedMoves = updateAllowedMoves(othelloGame.gameState.boardState, opponentPiece, userPiece);
        console.log(132);
        othelloGame.save().then(()=>{
          return othelloGame;
            // console.log('updated othelloGame:', othelloGame);
        });
    };
    //test if move is valid

    // console.log(othelloGame);
}

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



var OthelloModel = mongoose.model('OthelloModel', OthelloSchema);
module.exports = { OthelloModel };
