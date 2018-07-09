import React, { Component } from 'react';
import Row from './row';
class OthelloSolo extends Component {
  constructor(props) {
    super(props);
    this.list = null;
    this.state = {
      winner: null,
      showModal: false,
      //player is black -- bot is white
      player: [[3, 4], [4, 3]],
      bot: [[3, 3], [4, 4]],
      turn: 'player',
      legal_moves_array: [[2, 3], [3, 2], [4, 5], [5, 4]],
      boardState: [
        ['0', '0', '0', '0', '0', '0', '0', '0'],
        ['0', '0', '0', '0', '0', '0', '0', '0'],
        ['0', '0', '0', 'a', '0', '0', '0', '0'],
        ['0', '0', 'a', 'w', 'b', '0', '0', '0'],
        ['0', '0', '0', 'b', 'w', 'a', '0', '0'],
        ['0', '0', '0', '0', 'a', '0', '0', '0'],
        ['0', '0', '0', '0', '0', '0', '0', '0'],
        ['0', '0', '0', '0', '0', '0', '0', '0']
      ]
    };

    this.handleUserTurn = this.handleUserTurn.bind(this);
    this.hideModal = this.hideModal.bind(this);
    this.handleReset = this.handleReset.bind(this);
  }

  alternateTurn() {
    if (this.state.turn === 'player') {
      return 'bot';
    }
    return 'player';
  }

  audioCallback() {
    var audio_dom = document.getElementById('sw_audio');
    if (audio_dom.paused) {
      audio_dom.play();
      $('#volume-on-icon').hide();
      $('#volume-off-icon').show();
    } else {
      audio_dom.pause();
      $('#volume-off-icon').hide();
      $('#volume-on-icon').show();
    }
  }

  withinBounds(row, column) {
    if (row >= 0 && row < 8 && column >= 0 && column < 8) {
      return true;
    }
    return false;
  }

  flip(row, column, color, color_to_replace, copyOfBoard) {
    const directions = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1]
    ];
    var temp_directions = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1]
    ];
    var arrayOfFlips = [];
    for (
      var directionIndex = 0;
      directionIndex < directions.length;
      directionIndex++
    ) {
      var path = [];
      var dRow = directions[directionIndex][0];
      var dColumn = directions[directionIndex][1];
      var temp_row = row + dRow;
      var temp_column = column + dColumn;
      if (this.withinBounds(temp_row, temp_column)) {
        var cellTracker = this.state.boardState[temp_row][temp_column];
        if (cellTracker === color_to_replace) {
          temp_directions = [
            [-1, -1],
            [0, -1],
            [1, -1],
            [-1, 0],
            [1, 0],
            [-1, 1],
            [0, 1],
            [1, 1]
          ];
          while (cellTracker === color_to_replace) {
            path.push([
              row + temp_directions[directionIndex][0],
              column + temp_directions[directionIndex][1]
            ]);
            temp_directions[directionIndex][0] =
              temp_directions[directionIndex][0] + dRow;
            temp_directions[directionIndex][1] =
              temp_directions[directionIndex][1] + dColumn;
            var temp_dRow = row + temp_directions[directionIndex][0];
            var temp_dColumn = column + temp_directions[directionIndex][1];
            if (!this.withinBounds(temp_dRow, temp_dColumn)) {
              break;
            }
            cellTracker = this.state.boardState[temp_dRow][temp_dColumn];
            if (cellTracker === color) {
              arrayOfFlips = arrayOfFlips.concat(path);
              break;
            }
          }
        }
      }
    }
    for (var index = 0; index < arrayOfFlips.length; index++) {
      var flipRow = arrayOfFlips[index][0];
      var flipColumn = arrayOfFlips[index][1];
      copyOfBoard[flipRow][flipColumn] = color;
    }
    return copyOfBoard;
  }

  countFlips(row, column, color, color_to_replace, copyOfBoard) {
    const directions = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1]
    ];
    var temp_directions = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1]
    ];
    var arrayOfFlips = [];
    for (
      var directionIndex = 0;
      directionIndex < directions.length;
      directionIndex++
    ) {
      var path = [];
      var dRow = directions[directionIndex][0];
      var dColumn = directions[directionIndex][1];
      var temp_row = row + dRow;
      var temp_column = column + dColumn;
      if (this.withinBounds(temp_row, temp_column)) {
        var cellTracker = this.state.boardState[temp_row][temp_column];
        if (cellTracker === color_to_replace) {
          temp_directions = [
            [-1, -1],
            [0, -1],
            [1, -1],
            [-1, 0],
            [1, 0],
            [-1, 1],
            [0, 1],
            [1, 1]
          ];
          while (cellTracker === color_to_replace) {
            path.push([
              row + temp_directions[directionIndex][0],
              column + temp_directions[directionIndex][1]
            ]);
            temp_directions[directionIndex][0] =
              temp_directions[directionIndex][0] + dRow;
            temp_directions[directionIndex][1] =
              temp_directions[directionIndex][1] + dColumn;
            var temp_dRow = row + temp_directions[directionIndex][0];
            var temp_dColumn = column + temp_directions[directionIndex][1];
            if (!this.withinBounds(temp_dRow, temp_dColumn)) {
              break;
            }
            cellTracker = this.state.boardState[temp_dRow][temp_dColumn];
            if (cellTracker === color) {
              arrayOfFlips = arrayOfFlips.concat(path);
              break;
            }
          }
        }
      }
    }
    return arrayOfFlips.length;
    // for (var index = 0; index < arrayOfFlips.length; index++) {
    //   var flipRow = arrayOfFlips[index][0];
    //   var flipColumn = arrayOfFlips[index][1];
    //   copyOfBoard[flipRow][flipColumn] = color;
    // }
    // return copyOfBoard;
  }


  legalMoves(board, color) {
    var returnBoard = this.copyBoard(board);
    var colNum, rowNum;
    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 8; j++) {
        if (board[i][j] === 'a') {
          board[i][j] = '0';
        }
      }
    }
    if (color === 'b') {
      var opponentPieces = this.findPlayerCells('w', board);
      for (var i = 0; i < opponentPieces.length; i++) {
        rowNum = opponentPieces[i][0];
        colNum = opponentPieces[i][1];
        for (var j = -1; j < 2; j++) {
          for (var k = -1; k < 2; k++) {
            if (!this.withinBounds(rowNum + j, colNum + k)) {
              continue;
            }
            var selectDiv = board[rowNum + j][colNum + k];
            if (selectDiv === 'w' || selectDiv === 'b') {
              continue;
            } else {
              returnBoard = this.searchSpots(
                rowNum + j,
                colNum + k,
                'w',
                'b',
                board
              );
            }
          }
        }
      }
    } else {
      var opponentPieces = this.findPlayerCells('b', board);
      for (var i = 0; i < opponentPieces.length; i++) {
        rowNum = opponentPieces[i][0];
        colNum = opponentPieces[i][1];
        for (var j = -1; j < 2; j++) {
          for (var k = -1; k < 2; k++) {
            if (!this.withinBounds(rowNum + j, colNum + k)) {
              continue;
            }
            var selectDiv = board[rowNum + j][colNum + k];
            if (selectDiv === 'w' || selectDiv === 'b') {
              continue;
            } else {
              returnBoard = this.searchSpots(
                rowNum + j,
                colNum + k,
                'b',
                'w',
                board
              );
            }
          }
        }
      }
    }
    return returnBoard;
  }

  searchSpots(row, column, color_to_replace, color, board) {
    const diag = [
      [0, 1],
      [0, -1],
      [-1, 0],
      [1, 0],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1]
    ];
    var temp_diag_directions = [
      [0, 1],
      [0, -1],
      [-1, 0],
      [1, 0],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1]
    ];
    for (var i = 0; i < diag.length; i++) {
      var dRow = diag[i][0];
      var dColumn = diag[i][1];
      var tempRow = diag[i][0] + row;
      var tempColumn = diag[i][1] + column;
      if (this.withinBounds(tempRow, tempColumn)) {
        var checkCell = board[tempRow][tempColumn];
        if (checkCell === color_to_replace) {
          temp_diag_directions = [
            [0, 1],
            [0, -1],
            [-1, 0],
            [1, 0],
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1]
          ];
          while (checkCell === color_to_replace) {
            temp_diag_directions[i][0] = temp_diag_directions[i][0] + dRow;
            temp_diag_directions[i][1] = temp_diag_directions[i][1] + dColumn;
            var tempr = row + temp_diag_directions[i][0];
            var tempc = column + temp_diag_directions[i][1];
            if (!this.withinBounds(tempr, tempc)) {
              break;
            }
            checkCell = board[tempr][tempc];
            if (checkCell === color) {
              board[row][column] = 'a';
            }
          }
        }
      }
    }
    return board;
  }

  findPlayerCells(color, board) {
    var playerList = [];
    for (var rowIndex = 0; rowIndex < 8; rowIndex++) {
      for (var colIndex = 0; colIndex < 8; colIndex++) {
        if (board[rowIndex][colIndex] === color) {
          playerList.push([rowIndex, colIndex]);
        }
      }
    }
    return playerList;
  }

  handleReset() {
    this.setState({
      winner: null,
      showModal: false,
      player: [[3, 4], [4, 3]],
      bot: [[3, 3], [4, 4]],
      turn: 'player',
      legal_moves_array: [[2, 3], [3, 2], [4, 5], [5, 4]],
      boardState: [
        ['0', '0', '0', '0', '0', '0', '0', '0'],
        ['0', '0', '0', '0', '0', '0', '0', '0'],
        ['0', '0', '0', 'a', '0', '0', '0', '0'],
        ['0', '0', 'a', 'w', 'b', '0', '0', '0'],
        ['0', '0', '0', 'b', 'w', 'a', '0', '0'],
        ['0', '0', '0', '0', 'a', '0', '0', '0'],
        ['0', '0', '0', '0', '0', '0', '0', '0'],
        ['0', '0', '0', '0', '0', '0', '0', '0']
      ]
    })
  }

  hideModal(){
    this.setState({
      showModal: false
    })
  }

  handleGameOver() {
    var winner = null;
    var player_score = this.state.player.length;
    var bot_score = this.state.bot.length;
    if (player_score > bot_score) {
      winner = 'player';
    } else if (bot_score > player_score) {
      winner = 'bot';
    } else {
      winner = 'tie';
    }
    this.setState({
      winner,
      showModal: true
    })
  }

  copyBoard(board){
    var newBoard = [];
    for(var i=0; i<board.length; i++){
        var row = board[i].slice();
        newBoard.push(row);
    }
    return newBoard;
  }


  handleUserTurn(row, column, userInduced = false) {
    if (this.state.boardState[row][column] !== 'a' || userInduced && this.state.turn === 'bot') {
        return;
    }
    var copyOfBoard = this.copyBoard(this.state.boardState);
    if (this.state.turn === 'player') {
      copyOfBoard[row][column] = 'b';
      copyOfBoard = this.flip(row, column, 'b', 'w', copyOfBoard);
      copyOfBoard = this.legalMoves(copyOfBoard, 'w');
      if(this.findPlayerCells('a', copyOfBoard).length > 0){
        this.setState({
            player: this.findPlayerCells('b', copyOfBoard),
            bot: this.findPlayerCells('w', copyOfBoard),
            turn: this.alternateTurn(),
            legal_moves_array: this.findPlayerCells('a', copyOfBoard),
            boardState: copyOfBoard
        }, () =>{
            if(this.state.player.length + this.state.bot.length === 64){
                this.handleGameOver();
                return;
            } else{
                // trigger bot's turn
                var botMove = this.handleAITurn();
                setTimeout(()=>{
                    this.handleUserTurn(botMove[0], botMove[1]);
                }, 1000)
            }

        })
      }else{
        copyOfBoard = this.legalMoves(copyOfBoard, 'b');
        this.setState({
            player: this.findPlayerCells('b', copyOfBoard),
            bot: this.findPlayerCells('w', copyOfBoard),
            legal_moves_array: this.findPlayerCells('a', copyOfBoard),
            boardState: copyOfBoard
        }, () =>{
            if(this.state.player.length + this.state.bot.length === 64){
                this.handleGameOver();
                return;
            }
        })
      }
    } else {    //bot move
      copyOfBoard[row][column] = 'w';
      copyOfBoard = this.flip(row, column, 'w', 'b', copyOfBoard);
      copyOfBoard = this.legalMoves(copyOfBoard, 'b');
        if(this.findPlayerCells('a', copyOfBoard).length > 0){
            this.setState({
                player: this.findPlayerCells('b', copyOfBoard),
                bot: this.findPlayerCells('w', copyOfBoard),
                turn: this.alternateTurn(),
                legal_moves_array: this.findPlayerCells('a', copyOfBoard),
                boardState: copyOfBoard
            }, () =>{
                if(this.state.player.length + this.state.bot.length === 64){
                    this.handleGameOver();
                    return;
                }
            })
        }else{
            copyOfBoard = this.legalMoves(copyOfBoard, 'w');
            this.setState({
                player: this.findPlayerCells('b', copyOfBoard),
                bot: this.findPlayerCells('w', copyOfBoard),
                legal_moves_array: this.findPlayerCells('a', copyOfBoard),
                boardState: copyOfBoard
            }, () =>{
                if(this.findPlayerCells('a', copyOfBoard).length === 0 || this.state.player.length + this.state.bot.length === 64){
                    this.handleGameOver();
                    return;
                }                
                else{
                    // trigger bot's turn
                    var botMove = this.handleAITurn();
                    setTimeout(()=>{
                        this.handleUserTurn(botMove[0], botMove[1]);
                    }, 1000)
                }
            })
        }
    }
  }

  handleAITurn(){
    if(this.state.turn !== 'bot' || this.state.player.length + this.state.bot.length === 64){
        return;
    }
    var someObj = [];
    var copyOfBoard = this.copyBoard(this.state.boardState);
    var optimalMove;
    var max_flipped;
    for(var i=0; i<this.state.legal_moves_array.length; i++){
        max_flipped = 0;
        copyOfBoard = this.copyBoard(this.state.boardState);
        var move = this.state.legal_moves_array[i];
        var row = move[0];
        var column = move[1];
        copyOfBoard[row][column] = 'w';
        copyOfBoard = this.flip(row, column, 'w', 'b', copyOfBoard);
        copyOfBoard = this.legalMoves(copyOfBoard, 'b');
        var legal_moves_array = this.findPlayerCells('a', copyOfBoard);
        legal_moves_array.forEach((legalMove)=>{
            var legalMove_row = legalMove[0];
            var legalMove_col = legalMove[1];
            var num_flipped = this.countFlips(legalMove_row, legalMove_col, 'b','w', copyOfBoard);
            max_flipped = max_flipped > num_flipped ? max_flipped : num_flipped;
        })
        someObj.push({board: copyOfBoard, value: max_flipped, row, column})
        optimalMove = optimalMove <= max_flipped ? optimalMove : max_flipped;
    }
    var returnVar = someObj.filter(obj => obj.value === optimalMove);
    var returnRow = returnVar[0].row;
    var returnCol = returnVar[0].column;
    var abc = [returnRow, returnCol];
    return abc;
  }


  render() {
    var gameOverModal = null;
    if(this.state.winner === 'bot' && this.state.showModal){
      gameOverModal =  <div id="contain-jedi-gif" className='modal' onClick={this.hideModal}>
        <div className="jedi-win-gif" />
      </div>    
    }else if(this.state.winner === 'player' && this.state.showModal){
      gameOverModal =  <div id="contain-sith-gif" className='modal' onClick={this.hideModal}>
        <div className="sith-win-gif" />
      </div>
    } else if(this.state.winner === 'tie' && this.state.showModal){
      gameOverModal =  <div id="contain-jedi-gif" className='modal' onClick={this.hideModal}>
      <div className="jedi-win-gif" />
    </div> 
    }


    var jedi_opacity = 'opacity_1';
    var sith_opacity = 'opacity_1';
    if (this.state.turn === 'player') {
      jedi_opacity = 'opacity_05';
    } else {
      sith_opacity = 'opacity_05';
    }

    const row = this.state.boardState.map((rowItem, key) => {
      return (
        <Row
          key={key}
          rowItem={rowItem}
          rowNum={key}
          callback={this.handleUserTurn}
          turn={this.state.turn}
        />
      );
    });

    return (
      <div className="col-xs-12 othello forest_background">
        <audio
          id="sw_audio"
          className="audio_class"
          loop
          preload="auto"
          src="public/css/audio/Star-Wars-Duel-of-the-Fates.mp3"
        />
        <h2 className="game-title">Othello</h2>
        <h3 className="game-subtitle">Jedi vs. Sith</h3>
        <div className="game-contents">
          <div id="back-board">{row}</div>
          <div>
            <div
              className={
                'stats_container col-xs-offset-2 col-xs-2 ' + jedi_opacity
              }
              id="jedi-stats"
            >
              <div className="player-info" id="jedi-info">
                <p className="jedi-name">
                  Jedi<span />
                </p>
                <p className="jedi-score">{this.state.bot.length}</p>
              </div>
            </div>
            <div className="col-xs-offset-1 col-xs-2" id="reset-button">
              <button
                type="button"
                className="button reset"
                onClick={this.handleReset}
              >
                RESET
              </button>
            </div>
            <div
              className={
                'stats_container col-xs-offset-1 col-xs-2 ' + sith_opacity
              }
              id="sith-stats"
            >
              <div className="player-info" id="sith-info">
                <p className="sith-name">
                  Sith<span />
                </p>
                <p className="sith-score">{this.state.player.length}</p>
              </div>
            </div>
          </div>
          <div>
            <button
              className="button btn btn-light audio-btn"
              onClick={this.audioCallback}
            >
              <span id="volume-on-icon">
                <i className="fas fa-volume-up" />
              </span>
              <span id="volume-off-icon">
                <i className="fas fa-volume-off" />
              </span>
            </button>
          </div>
        </div>
        {gameOverModal}
      </div>
    );
  }
}

export default OthelloSolo;
