import React, { Component } from 'react';
// import OthelloBoard from './othelloBoard';
import Row from './row';
class OthelloSolo extends Component {
  constructor(props) {
    super(props);
    this.list = null;
    this.col_list = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    this.state = {
      winner: null,
      showModal: false,
      //player1 is black -- player2 is white
      player1: [[3, 4], [4, 3]],
      player2: [[3, 3], [4, 4]],
      turn: 'player 1',
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
    if (this.state.turn === 'player 1') {
      return 'player 2';
    }
    return 'player 1';
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
    let temp_directions = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1]
    ];
    let arrayOfFlips = [];
    for (
      var directionIndex = 0;
      directionIndex < directions.length;
      directionIndex++
    ) {
      let path = [];
      let dRow = directions[directionIndex][0];
      let dColumn = directions[directionIndex][1];
      let temp_row = row + dRow;
      let temp_column = column + dColumn;
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
            let temp_dRow = row + temp_directions[directionIndex][0];
            let temp_dColumn = column + temp_directions[directionIndex][1];
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

  legalMoves(board, color) {
    let returnBoard = board.slice();
    let colNum, rowNum;
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
    let temp_diag_directions = [
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
      var var1 = diag[i][0];
      var var2 = diag[i][1];
      var var3 = diag[i][0] + row;
      var var4 = diag[i][1] + column;
      if (this.withinBounds(var3, var4)) {
        var checkCell = board[var3][var4];
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
            temp_diag_directions[i][0] = temp_diag_directions[i][0] + var1;
            temp_diag_directions[i][1] = temp_diag_directions[i][1] + var2;
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
    let playerList = [];
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
      //player1 is black -- player2 is white
      player1: [[3, 4], [4, 3]],
      player2: [[3, 3], [4, 4]],
      turn: 'player 1',
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
    let winner = null;
    let player1_score = this.state.player1.length;
    let player2_score = this.state.player2.length;
    if (player1_score > player2_score) {
      winner = 'player 1';
    } else if (player2_score > player1_score) {
      winner = 'player 2';
    } else {
      winner = 'tie';
      console.log('handle a tie scenario result');
    }
    this.setState({
      winner,
      showModal: true
    })
  }

  handleUserTurn(row, column) {
    // console.log(`called handleUserTurn from ${row} and ${column}`);
    if (this.state.boardState[row][column] !== 'a') {
      return;
      // console.log('allowed move clicked')
    }
    var copyOfBoard = this.state.boardState.slice();
    // console.log(copyOfBoard);
    if (this.state.turn === 'player 1') {
      copyOfBoard[row][column] = 'b';
      copyOfBoard = this.flip(row, column, 'b', 'w', copyOfBoard);
      copyOfBoard = this.legalMoves(copyOfBoard, 'w');
      this.setState(
        {
          player1: this.findPlayerCells('b', copyOfBoard),
          player2: this.findPlayerCells('w', copyOfBoard),
          turn: this.alternateTurn(),
          legal_moves_array: this.findPlayerCells('a', copyOfBoard),
          boardState: copyOfBoard
        },
        () => {
          if (this.state.player1.length + this.state.player2.length === 64) {
            // console.log('game over');
            this.handleGameOver();
          }
          // console.log(this.state);
          if (this.state.legal_moves_array.length === 0) {
            // console.log('---alternate turn------', this.state)
            copyOfBoard = this.legalMoves(copyOfBoard, 'b');
            this.setState({
              turn: this.alternateTurn(),
              legal_moves_array: this.findPlayerCells('a', copyOfBoard),
              boardState: copyOfBoard
            });
          }
        }
      );
    } else {
      copyOfBoard[row][column] = 'w';
      copyOfBoard = this.flip(row, column, 'w', 'b', copyOfBoard);
      copyOfBoard = this.legalMoves(copyOfBoard, 'b');
      this.setState(
        {
          player1: this.findPlayerCells('b', copyOfBoard),
          player2: this.findPlayerCells('w', copyOfBoard),
          turn: this.alternateTurn(),
          legal_moves_array: this.findPlayerCells('a', copyOfBoard),
          boardState: copyOfBoard
        },
        () => {
          if (this.state.player1.length + this.state.player2.length === 64) {
            // console.log('game over');
            this.handleGameOver();
          }
          // console.log(this.state);
          if (this.state.legal_moves_array.length === 0) {
            // console.log('---alternate turn------', this.state)
            copyOfBoard = this.legalMoves(copyOfBoard, 'w');
            this.setState({
              turn: this.alternateTurn(),
              legal_moves_array: this.findPlayerCells('a', copyOfBoard),
              boardState: copyOfBoard
            });
          }
        }
      );
    }
  }

  render() {
    let displayJediWin = '', displaySithWin = '';
    if(this.state.showModal){
      if(this.state.winner === 'player 1'){
        displaySithWin = 'showModal';
      }
      else if(this.state.winner === 'player 2'){
        displayJediWin = 'showModal';
      }
    }
    let jedi_opacity = 'opacity_1';
    let sith_opacity = 'opacity_1';
    if (this.state.turn === 'player 1') {
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
                <p className="jedi-score">{this.state.player2.length}</p>
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
                <p className="sith-score">{this.state.player1.length}</p>
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
        <div
          id='contain-sith-gif'
          className={'modal ' + displaySithWin}
          onClick={this.hideModal}
        >
          <div className="sith-win-gif" />
        </div>
        <div
          id='contain-jedi-gif'
          className={'modal ' + displayJediWin}
          onClick={this.hideModal}
        >
          <div className="jedi-win-gif" />
        </div>
      </div>
    );
  }
}

export default OthelloSolo;
