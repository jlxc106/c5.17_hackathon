var mongoose = require('mongoose');
const _ = require('lodash')
var {flip, updateAllowedMoves, copyBoard} = require('../game_logic/othello_logic');
var ObjectId = mongoose.Schema.ObjectId;

var OthelloSchema = new mongoose.Schema({
  _id: {
    type: ObjectId,
    required: true
  },
  players: {
    jedi: {
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
      resetGamePressed:{
        type: Number,
        default: 0
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
      resetGamePressed: {
        type: Number,
        default: 0
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
    allowedMoves: mongoose.Schema.Types.Mixed,
    winner:{
        userName: {
          type: String,
          trim: true,
          default: null
        },
        _id:{
          type: ObjectId,
          default: null
        },
        role: {
          type: String,
          default: null
        }
    }
  }
});

var defaultBoardState = [
  {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0'},
  {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0'},
  {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0'},
  {0: '0', 1:'0', 2:'0', 3:'w', 4:'b', 5:'0', 6:'0', 7:'0'},
  {0: '0', 1:'0', 2:'0', 3:'b', 4:'w', 5:'0', 6:'0', 7:'0'},
  {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0'},
  {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0'},
  {0: '0', 1:'0', 2:'0', 3:'0', 4:'0', 5:'0', 6:'0', 7:'0'},
];

var defaultGameState = {
  isActive: true,
  turnCount: 0,
  userTurn: 'sith',
  boardState: defaultBoardState,
  allowedMoves: [{'row': 2, 'col': 3}, {'row': 3, 'col': 2}, {'row': 4, 'col': 5}, {'row': 5, 'col': 4}],
  winner: {
    userName: null,
    _id: null,
    role: null
  }
}

var isGameOver = (boardState) =>{
  var gameOver = true;
  boardState.forEach(row => {
    for(column in row){
      if(row[column] === '0'){
        gameOver = false;
        return;
      }
    }
  })
  return gameOver;
}

var determineWinner = (boardState) =>{
  var jedi = 0;
  var sith = 0;

  boardState.forEach(row =>{
    for(column in row){
      if(row[column] === 'w'){
        jedi++;
      }
      else if(row[column] ==='b'){
        sith++;
      }
    }
  })
  if(jedi > sith){
    return 'jedi';
  } 
  else if(sith > jedi){
    return 'sith';
  }
  else{
    return 'tie';
  }
}

OthelloSchema.methods.initNewGame = function(){
  var othelloGame = this;
  othelloGame.players.jedi.resetGamePressed = 0;
  othelloGame.players.sith.resetGamePressed = 0;
  othelloGame.gameState = defaultGameState;
  return othelloGame;
}

OthelloSchema.methods.validateMove = function(role, coordinates){
    const coord_row = coordinates['row'];
    const coord_col = coordinates['col'];
    var winner = null;
    var othelloGame = this;
    var userPiece, opponentPiece;
    // var copyBoardState = copyBoard(this.gameState.boardState);
    var copyBoardState = this.gameState.boardState.slice();
    var moveIsValid = _.findIndex(othelloGame.gameState.allowedMoves, (move)=>{
        return move['row'] === coord_row && move['col'] === coord_col 
    })
    if(moveIsValid !== -1){
        if(role === "black"){
            userPiece = "b";
            opponentPiece = "w";
            othelloGame.gameState.userTurn = 'jedi';
        }else{
            userPiece = "w";
            opponentPiece = "b";
            othelloGame.gameState.userTurn = 'sith';
        }
        var arrayOfFlips = flip(othelloGame.gameState.boardState, coordinates, userPiece, opponentPiece);
        copyBoardState[coord_row][coord_col] = userPiece;
        arrayOfFlips.forEach(flipCoord =>{
            var row = flipCoord[0];
            var column = flipCoord[1];
            copyBoardState[row][column] = userPiece;
        })
        othelloGame.gameState.boardState = copyBoardState;
        if(isGameOver(othelloGame.gameState.boardState)){
          winner = determineWinner(othelloGame.gameState.boardState);
          othelloGame.gameState.winner = {
            userName: othelloGame.players[winner].userName,
            _id: othelloGame.players[winner]._id,
            role: winner
          }
        othelloGame.gameState.allowedMoves = [];
        othelloGame.gameState.isActive = false;
        } else {
          othelloGame.gameState.allowedMoves = updateAllowedMoves(othelloGame.gameState.boardState, opponentPiece, userPiece);
          if(othelloGame.gameState.allowedMoves.length === 0){
            othelloGame.gameState.userTurn = (othelloGame.gameState.userTurn === 'jedi' ? 'sith' : 'jedi');
            othelloGame.gameState.allowedMoves = updateAllowedMoves(othelloGame.gameState.boardState, userPiece, opponentPiece);
            if(othelloGame.gameState.allowedMoves.length === 0){
              winner = determineWinner(othelloGame.gameState.boardState);
              if(winner === 'jedi' || winner === 'sith'){
                othelloGame.gameState.winner = {
                  userName: othelloGame.players[winner].userName,
                  _id: othelloGame.players[winner]._id,
                  role: winner
                }
              }else if(winner ==='tie'){
                othelloGame.gameState.winner = {
                  userName: 'tie',
                  _id: null,
                  role: 'tie'
                }
              }

            }
          }
        }
        othelloGame.save().then(()=>{
          return othelloGame;
        });
    };
}

var OthelloModel = mongoose.model('OthelloModel', OthelloSchema);
module.exports = { OthelloModel };
