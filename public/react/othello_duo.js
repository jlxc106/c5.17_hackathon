import React, { Component } from 'react';
import _ from 'lodash';
import Row from './row';
import Message from './message';
import io from 'socket.io-client';
// import io from 'socket.io-client';
let socket = io(`http://localhost:3000/`);

class OthelloDuo extends Component {
  constructor(props) {
    super(props);
    this.list = null;
    this.col_list = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    this._isMounted = false;
    this.state = {
      gameState: {
        boardState: [
          ['0', '0', '0', '0', '0', '0', '0', '0'],
          ['0', '0', '0', '0', '0', '0', '0', '0'],
          ['0', '0', '0', '0', '0', '0', '0', '0'],
          ['0', '0', '0', '0', '0', '0', '0', '0'],
          ['0', '0', '0', '0', '0', '0', '0', '0'],
          ['0', '0', '0', '0', '0', '0', '0', '0'],
          ['0', '0', '0', '0', '0', '0', '0', '0'],
          ['0', '0', '0', '0', '0', '0', '0', '0']
        ],
        legal_moves_array: [],
        winner: null,
        players: {
          sith: {
            userName: null,
            userSpots: [[3, 4], [4, 3]]
          },
          jedi: {
            userName: null,
            userSpots: [[3, 3], [4, 4]]
          }
        },
        role: null, //sith/jedi
        userColor: null, //black/white
        opponentColor: null,
        isUserTurn: null
      },
      chat: {
        message: '',
        messageLog: []
      },
      token: null,
      userName: null,
      gameId: null,
      showModal: false,
      showNewGameMessage: false
      // jediArray: [[3, 3], [4, 4]],
      // SithArray: [[3, 4], [4, 3]],
      // role: null, //sith/jedi
      // userColor: null,  //black/white
      // opponentColor: null,
      // isUserTurn: null,
      // legal_moves_array: [[2, 3], [3, 2], [4, 5], [5, 4]],
      // boardState: [
      //   ['0', '0', '0', '0', '0', '0', '0', '0'],
      //   ['0', '0', '0', '0', '0', '0', '0', '0'],
      //   ['0', '0', '0', 'a', '0', '0', '0', '0'],
      //   ['0', '0', 'a', 'w', 'b', '0', '0', '0'],
      //   ['0', '0', '0', 'b', 'w', 'a', '0', '0'],
      //   ['0', '0', '0', '0', 'a', '0', '0', '0'],
      //   ['0', '0', '0', '0', '0', '0', '0', '0'],
      //   ['0', '0', '0', '0', '0', '0', '0', '0']
      // ],
      // message: '',
      // messageLog: []
    };

    this.debounced_mount = _.debounce(this.handleUserVerification, 200);

    // this.componentDidMount = _.debounce(this.componentDidMount, 300);
    // this.somefag = _.debounce(this.somefag, 300);
    // socket.on('connect', ()=>{
    // this.somefag();

    // }, 500)

    // })
    this.handleStartNewGame = this.handleStartNewGame.bind(this);
    this.handleUserTurn = this.handleUserTurn.bind(this);
    this.hideModal = this.hideModal.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleChatSubmit = this.handleChatSubmit.bind(this);
    socket.on('sendMessage', message => {
      this.handleChatReceive('sendMessage', message);
    });
    socket.on('serverMessage', message => {
      this.handleChatReceive('serverMessage', message);
    });

    socket.on('getMove', res => {
      console.log('getMove', res);
      this.handleGetMove(res);
    });

    socket.on('initOthello', res => {
      console.log('initOthello', res);
      this.handleGameInit(res);
    });

    socket.on('initNewGame', res => {
      console.log('initNewGame', res);
      this.handleInitNewGame(res);
    });

    socket.on('confirmNewGame', res => {
      console.log('confirmNewGame', res);
      this.handleConfirmNewGame();
    });

    socket.on('gameOver', res =>{
      this.handleGameOver(res.winner);
    })

  }

  componentDidMount() {
    console.log('mounting');
    this._isMounted = true;
    this.debounced_mount();
  }

  handleGameInit(res) {
    var { allowedMoves, boardState, userTurn, users } = res;
    var jediUserName, sithUserName;
    users.forEach(user => {
      console.log('user', user);
      if (user.role === 'white') {
        jediUserName = user.userName;
      } else if (user.role === 'black') {
        sithUserName = user.userName;
      }
    });

    // var role;
    // if(userColor === 'black'){
    //   opponentColor = '';
    //   role = 'sith'
    // }
    var role, userColor, opponentColor;
    var isUserTurn = false;
    if (res.role === 'black') {
      role = 'sith';
      userColor = 'black';
      opponentColor = 'white';
    } else if (res.role === 'white') {
      role = 'jedi';
      userColor = 'white';
      opponentColor = 'black';
    }
    // var role = 'sith';
    // var opponentColor = '';
    // var userColor = res.role
    // var isUserTurn = false;
    // if(userColor === 'black'){
    //   role = 'jedi';
    // }
    // if(userColor === 'black'){
    //   opponentColor = 'white';
    // }else if(userColor === 'white'){
    //   opponentColor = 'black';
    // }
    if (userTurn === role) {
      isUserTurn = true;
    }
    var newBoardState = [[], [], [], [], [], [], [], []];
    var newAllowedMovesArray = [];
    if (isUserTurn) {
      allowedMoves.forEach((move, index) => {
        let { row, col } = move;
        newAllowedMovesArray.push([row, col]);
        boardState[row][col] = 'a';
      });
    }
    for (var rowIndex = 0; rowIndex < 8; rowIndex++) {
      for (var colIndex = 0; colIndex < 8; colIndex++) {
        var cellValue = boardState[rowIndex][colIndex];
        newBoardState[rowIndex].push(cellValue);
      }
    }
    this.setState(
      {
        gameState: {
          ...this.state.gameState,
          boardState: newBoardState,
          legal_moves_array: newAllowedMovesArray,
          role: role,
          userColor,
          opponentColor,
          isUserTurn,
          players: {
            jedi: {
              userName: jediUserName,
              userSpots: this.getUserSpots(newBoardState, 'w')
            },
            sith: {
              userName: sithUserName,
              userSpots: this.getUserSpots(newBoardState, 'b')
            }
          }
        }
      },
      () => {
        console.log(this.state);
        console.log(jediUserName);
        console.log(sithUserName);
      }
    );
  }

  getUserSpots(boardState, color) {
    var returnArray = [];
    for (var rowIndex = 0; rowIndex < 8; rowIndex++) {
      for (var colIndex = 0; colIndex < 8; colIndex++) {
        if (boardState[rowIndex][colIndex] === color) {
          returnArray.push([rowIndex, colIndex]);
        }
      }
    }
    return returnArray;
  }

  handleChatReceive(type, message) {
    if (!this._isMounted) {
      return;
    }
    var jedi, sith;
    message.activeUsers.forEach(user => {
      if (user.role === 'white') {
        jedi = user.userName || this.state.gameState.players.jedi.userName;
      } else if (user.role === 'black') {
        sith = user.userName || this.state.gameState.players.sith.userName;
      }
    });
    if (this._isMounted) {
      this.setState(
        {
          chat: {
            ...this.state.chat,
            messageLog: [...this.state.chat.messageLog, [type, message]]
          },
          gameState: {
            ...this.state.gameState,
            players: {
              jedi: {
                ...this.state.gameState.players.jedi,
                userName: jedi
              },
              sith: {
                ...this.state.gameState.players.sith,
                userName: sith
              }
            }
          }
        },
        () => {
          console.log(this.state);
        }
      );
    }
  }

  handleInitSocket() {
    const token =
      this.state.token || window.localStorage.getItem('token') || undefined;
    const gameId =
      this.state.gameId || window.localStorage.getItem('gameId') || undefined;
    if (token == 'undefined' || !token || !gameId || gameId == 'undefined') {
      this.props.history.push('/');
      return;
    }
    console.log('validateuser, ', gameId);

    socket.emit('validateUser', { token, gameId }, (err, response) => {
      console.log(response);
      console.log(err);
      if (err && response.id) {
        window.localStorage.setItem('token', response.id);
        this.props.history.push('/');
      } else {
        console.log('emit join');
        socket.emit('join', { token, gameId }, () => {
          console.log('oink');
        });
      }
    });
  }

  handleUserVerification() {
    const token = window.localStorage.getItem('token');
    const userName = window.localStorage.getItem('userName');
    const gameId = window.localStorage.getItem('gameId');
    console.log('oink');
    this.setState(
      {
        token,
        userName,
        gameId
      },
      () => {
        if (
          token == 'undefined' ||
          !token ||
          !gameId ||
          gameId == 'undefined'
        ) {
          this.props.history.push('/');
          return;
        }
        console.log('validateUser, ', token, '           -       ', gameId);
        socket.emit('validateUser', { token, gameId }, (err, response) => {
          console.log(err);
          console.log(response);
          if (err && response.id) {
            window.localStorage.setItem('token', response.id);
            this.props.history.push('/');
          } else {
            if (!window.localStorage.getItem('userName')) {
              window.localStorage.setItem('userName', response.userName);
            }
            console.log('emit join');
            socket.emit('join', { token, gameId });
          }
        });
      }
    );
  }



  // componentDidMount(){
  //   console.log(this._isMounted);
  //   this._isMounted = true;
  //   setTimeout(()=>{
  //     if(!this._isMounted){
  //       return;
  //     }
  //     console.log('--------------------component mounted here-------------------')
  //     const token = window.localStorage.getItem('token');
  //     const userName = window.localStorage.getItem('userName');
  //     const gameId = window.localStorage.getItem('gameId');
  //     this.setState(
  //       {
  //         token,
  //         userName,
  //         gameId
  //       },
  //       () => this.handleInitSocket()
  //     );
  //   },300)
  //   // console.log('--------------------component mounted here-------------------')
  //   // const token = window.localStorage.getItem('token');
  //   // const userName = window.localStorage.getItem('userName');
  //   // const gameId = window.localStorage.getItem('gameId');
  //   // this.setState(
  //   //   {
  //   //     token,
  //   //     userName,
  //   //     gameId
  //   //   },
  //   //   () => this.handleInitSocket()
  //   // );
  //   // this.handleInitSocket();
  // }

  componentWillUnmount() {
    console.log('unmounting');
    this._isMounted = false;
    this.debounced_mount.cancel();
  }

  alternateTurn() {
    if (this.state.gameState.isUserTurn) {
      return false;
    }
    return true;
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
        var cellTracker = this.state.gameState.boardState[temp_row][
          temp_column
        ];
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
            cellTracker = this.state.gameState.boardState[temp_dRow][
              temp_dColumn
            ];
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

  // searchSpots(row, column, color_to_replace, color, board) {
  //   const diag = [
  //     [0, 1],
  //     [0, -1],
  //     [-1, 0],
  //     [1, 0],
  //     [-1, -1],
  //     [1, -1],
  //     [-1, 1],
  //     [1, 1]
  //   ];
  //   let temp_diag_directions = [
  //     [0, 1],
  //     [0, -1],
  //     [-1, 0],
  //     [1, 0],
  //     [-1, -1],
  //     [1, -1],
  //     [-1, 1],
  //     [1, 1]
  //   ];
  //   for (var i = 0; i < diag.length; i++) {
  //     var var1 = diag[i][0];
  //     var var2 = diag[i][1];
  //     var var3 = diag[i][0] + row;
  //     var var4 = diag[i][1] + column;
  //     if (this.withinBounds(var3, var4)) {
  //       var checkCell = board[var3][var4];
  //       if (checkCell === color_to_replace) {
  //         temp_diag_directions = [
  //           [0, 1],
  //           [0, -1],
  //           [-1, 0],
  //           [1, 0],
  //           [-1, -1],
  //           [1, -1],
  //           [-1, 1],
  //           [1, 1]
  //         ];
  //         while (checkCell === color_to_replace) {
  //           temp_diag_directions[i][0] = temp_diag_directions[i][0] + var1;
  //           temp_diag_directions[i][1] = temp_diag_directions[i][1] + var2;
  //           var tempr = row + temp_diag_directions[i][0];
  //           var tempc = column + temp_diag_directions[i][1];
  //           if (!this.withinBounds(tempr, tempc)) {
  //             break;
  //           }
  //           checkCell = board[tempr][tempc];
  //           if (checkCell === color) {
  //             board[row][column] = 'a';
  //           }
  //         }
  //       }
  //     }
  //   }
  //   return board;
  // }

  // findPlayerCells(color, board) {
  //   let playerList = [];
  //   for (var rowIndex = 0; rowIndex < 8; rowIndex++) {
  //     for (var colIndex = 0; colIndex < 8; colIndex++) {
  //       if (board[rowIndex][colIndex] === color) {
  //         playerList.push([rowIndex, colIndex]);
  //       }
  //     }
  //   }
  //   return playerList;
  // }

  handleReset() {
    socket.emit('requestNewGame', {
      token: this.state.token,
      role: this.state.gameState.userColor,
      gameId: this.state.gameId
    });
    // this.setState({
    //   winner: null,
    //   showModal: false,
    //   //player1 is black -- player2 is white
    //   player1: [[3, 4], [4, 3]],
    //   player2: [[3, 3], [4, 4]],
    //   turn: 'player 1',
    //   legal_moves_array: [[2, 3], [3, 2], [4, 5], [5, 4]],
    //   boardState: [
    //     ['0', '0', '0', '0', '0', '0', '0', '0'],
    //     ['0', '0', '0', '0', '0', '0', '0', '0'],
    //     ['0', '0', '0', 'a', '0', '0', '0', '0'],
    //     ['0', '0', 'a', 'w', 'b', '0', '0', '0'],
    //     ['0', '0', '0', 'b', 'w', 'a', '0', '0'],
    //     ['0', '0', '0', '0', 'a', '0', '0', '0'],
    //     ['0', '0', '0', '0', '0', '0', '0', '0'],
    //     ['0', '0', '0', '0', '0', '0', '0', '0']
    //   ]
    // });
  }

  handleConfirmNewGame(){
    this.setState({
      showNewGameMessage: true
    })
  }

  handleStartNewGame(event){
    event.preventDefault();
    // console.log(self)
    socket.emit('startNewGame', {
      token: this.state.token,
      gameId: this.state.gameId
    })
    $('.chat-new-game').prop('disabled', true);
  }

  handleInitNewGame(res){
    const isUserTurn = res.gameState.userTurn === this.state.gameState.role ? true : false;
    var newBoardState;
    if(isUserTurn){
      newBoardState = this.importBoard(res.gameState.boardState, res.gameState.allowedMoves);
    } else {
      newBoardState = this.importBoard(res.gameState.boardState, null);
    }
    this.setState({
      gameState:{
        ...this.state.gameState,
        boardState: newBoardState.boardState,
        legal_moves_array: newBoardState.legal_moves_array,
        isUserTurn,
        players: {
          jedi:{
            ...this.state.gameState.players.jedi,
            userSpots: newBoardState.jediSpots
          },
          sith:{
            ...this.state.gameState.players.sith,
            userSpots: newBoardState.sithSpots
          }
        },
        winner: null
      },
      showNewGameMessage: false
    })
  }

  hideModal() {
    this.setState({
      showModal: false
    });
  }

  handleChatInput(event) {
    // console.log('event ',event);
    // if(event.keyCode === 13 || event.keyCode === 10){

    // }
    // event.preventDefault();
    let message = event.target.value;
    this.setState({ chat: { ...this.state.chat, message } });
  }

  handleChatSubmit(event) {
    event.preventDefault();
    var { token, gameId } = this.state;
    var message = this.state.chat.message;
    if (!message || message.length === 0) {
      return;
    }
    console.log('chat submit pressed');
    socket.emit(
      'newMessage',
      {
        token,
        gameId,
        message
      },
      err => {
        if (err) {
          console.log(err);
        } else {
          this.setState({ chat: { ...this.state.chat, message: '' } });
        }
      }
    );
  }

  handleGameOver(winner){
    this.setState({
      gameState: {
        ...this.state.gameState,
        winner
      },
      showModal: true
    })
  }

  // handleGameOver() {
  //   let winner = null;
  //   let player1_score = this.state.player1.length;
  //   let player2_score = this.state.player2.length;
  //   if (player1_score > player2_score) {
  //     winner = 'player 1';
  //   } else if (player2_score > player1_score) {
  //     winner = 'player 2';
  //   } else {
  //     winner = 'tie';
  //     console.log('handle a tie scenario result');
  //   }
  //   this.setState({
  //     winner,
  //     showModal: true
  //   });
  // }

  handleGetMove(res) {
    var isUserTurn = this.setUserTurn(res.userTurn);
    var newBoardState;
    if (isUserTurn) {
      newBoardState = this.importBoard(res.boardState, res.allowedMoves);
    } else {
      newBoardState = this.importBoard(res.boardState, null);
    }
    this.setState({
      gameState: {
        ...this.state.gameState,
        boardState: newBoardState.boardState,
        legal_moves_array: newBoardState.legal_moves_array,
        isUserTurn,
        players: {
          jedi: {
            ...this.state.gameState.players.jedi,
            userSpots: newBoardState.jediSpots
          },
          sith: {
            ...this.state.gameState.players.sith,
            userSpots: newBoardState.sithSpots
          }
        }
      }
    });

    // (err, res) =>{
    //   // console.log(err);
    //   console.log(res);
    //   if(err){
    //     console.log(err);
    //     return;
    //   }
    //   var isUserTurn = this.setUserTurn(res.userTurn);
    //   var newBoardState;
    //   if(isUserTurn){
    //     newBoardState = this.importBoard(res.boardState, res.allowedMoves);
    //   }
    //   else{
    //     newBoardState = this.importBoard(res.boardState);
    //   }
    //   this.setState({
    //     gameState:{
    //       ...this.state.gameState,
    //       boardState: newBoardState.boardState,
    //       legal_moves_array: newBoardState.legal_moves_array,
    //       isUserTurn
    //     }
    //   })
    // }
  }

  handleUserTurn(row, column) {
    console.log('inside handleuserturn');
    if (this.state.gameState.boardState[row][column] !== 'a') {
      console.log('invalid move');
      return;
    }
    console.log('valid move');
    socket.emit(
      'setMove',
      {
        token: this.state.token,
        gameId: this.state.gameId,
        role: this.state.gameState.userColor,
        position: { row: row, col: column }
      },
      (err, res) => {
        // console.log(err);
        console.log(res);
        if (err) {
          console.log(err);
          return;
        }
        var isUserTurn = this.setUserTurn(res.userTurn);
        var newBoardState;
        if (isUserTurn) {
          newBoardState = this.importBoard(res.boardState, res.allowedMoves);
        } else {
          newBoardState = this.importBoard(res.boardState, null);
        }
        this.setState({
          gameState: {
            ...this.state.gameState,
            boardState: newBoardState.boardState,
            legal_moves_array: newBoardState.legal_moves_array,
            isUserTurn,
            players: {
              jedi: {
                ...this.state.gameState.players.jedi,
                userSpots: newBoardState.jediSpots
              },
              sith: {
                ...this.state.gameState.players.sith,
                userSpots: newBoardState.sithSpots
              }
            }
          }
        });
      }
    );
  }

  setUserTurn(userTurn) {
    if (!this.state.gameState.role || this.state.gameState.role.length === 0) {
      return console.log('invalid role error');
    }
    if (userTurn === this.state.gameState.role) {
      return true;
    }
    return false;
  }

  importBoard(boardState, allowedMoves) {
    var returnObj = {
      boardState: [[], [], [], [], [], [], [], []],
      legal_moves_array: [],
      jediSpots: [],
      sithSpots: []
    };
    for (var rowIndex = 0; rowIndex < 8; rowIndex++) {
      for (var colIndex = 0; colIndex < 8; colIndex++) {
        var cell = boardState[rowIndex][colIndex];
        if (cell === 'w') {
          returnObj.jediSpots.push([rowIndex, colIndex]);
        } else if (cell === 'b') {
          returnObj.sithSpots.push([rowIndex, colIndex]);
        }
        returnObj.boardState[rowIndex].push(cell);
      }
    }
    if (!allowedMoves || allowedMoves.length === 0) {
      return returnObj;
    }
    for (
      var allowedIndex = 0;
      allowedIndex < allowedMoves.length;
      allowedIndex++
    ) {
      var { row, col } = allowedMoves[allowedIndex];
      returnObj.boardState[row][col] = 'a';
      returnObj.legal_moves_array.push([row, col]);
    }
    return returnObj;
  }

  // handleUserTurn(row, column) {
  //   // console.log(`called handleUserTurn from ${row} and ${column}`);
  //   if (this.state.boardState[row][column] !== 'a') {
  //     return;
  //     // console.log('allowed move clicked')
  //   }
  //   var copyOfBoard = this.state.boardState.slice();
  //   // console.log(copyOfBoard);
  //   if (this.state.turn === 'player 1') {
  //     copyOfBoard[row][column] = 'b';
  //     copyOfBoard = this.flip(row, column, 'b', 'w', copyOfBoard);
  //     copyOfBoard = this.legalMoves(copyOfBoard, 'w');
  //     this.setState(
  //       {
  //         player1: this.findPlayerCells('b', copyOfBoard),
  //         player2: this.findPlayerCells('w', copyOfBoard),
  //         turn: this.alternateTurn(),
  //         legal_moves_array: this.findPlayerCells('a', copyOfBoard),
  //         boardState: copyOfBoard
  //       },
  //       () => {
  //         if (this.state.player1.length + this.state.player2.length === 64) {
  //           // console.log('game over');
  //           this.handleGameOver();
  //         }
  //         // console.log(this.state);
  //         if (this.state.legal_moves_array.length === 0) {
  //           // console.log('---alternate turn------', this.state)
  //           copyOfBoard = this.legalMoves(copyOfBoard, 'b');
  //           this.setState({
  //             turn: this.alternateTurn(),
  //             legal_moves_array: this.findPlayerCells('a', copyOfBoard),
  //             boardState: copyOfBoard
  //           });
  //         }
  //       }
  //     );
  //   } else {
  //     copyOfBoard[row][column] = 'w';
  //     copyOfBoard = this.flip(row, column, 'w', 'b', copyOfBoard);
  //     copyOfBoard = this.legalMoves(copyOfBoard, 'b');
  //     this.setState(
  //       {
  //         player1: this.findPlayerCells('b', copyOfBoard),
  //         player2: this.findPlayerCells('w', copyOfBoard),
  //         turn: this.alternateTurn(),
  //         legal_moves_array: this.findPlayerCells('a', copyOfBoard),
  //         boardState: copyOfBoard
  //       },
  //       () => {
  //         if (this.state.player1.length + this.state.player2.length === 64) {
  //           // console.log('game over');
  //           this.handleGameOver();
  //         }
  //         // console.log(this.state);
  //         if (this.state.legal_moves_array.length === 0) {
  //           // console.log('---alternate turn------', this.state)
  //           copyOfBoard = this.legalMoves(copyOfBoard, 'w');
  //           this.setState({
  //             turn: this.alternateTurn(),
  //             legal_moves_array: this.findPlayerCells('a', copyOfBoard),
  //             boardState: copyOfBoard
  //           });
  //         }
  //       }
  //     );
  //   }
  // }

  render() {
    // let displayJediWin = '',
    //   displaySithWin = '';
    // if (this.state.showModal) {
    //   if (this.state.winner === 'player 1') {
    //     displaySithWin = 'showModal';
    //   } else if (this.state.winner === 'player 2') {
    //     displayJediWin = 'showModal';
    //   }
    // }
    let jedi_opacity = 'opacity_1';
    let sith_opacity = 'opacity_1';
    if (
      (this.state.gameState.role === 'sith' &&
        this.state.gameState.isUserTurn) ||
      (this.state.gameState.role === 'jedi' && !this.state.gameState.isUserTurn)
    ) {
      // if (this.state.turn === 'player 1') {
      jedi_opacity = 'opacity_05';
    } else {
      sith_opacity = 'opacity_05';
    }

    const row = this.state.gameState.boardState.map((rowItem, key) => {
      return (
        <Row
          key={key}
          rowItem={rowItem}
          rowNum={key}
          callback={this.handleUserTurn}
        />
      );
    });

    var message_li = this.state.chat.messageLog.map((message, index) => {
      return <Message key={index} message={message[1]} type={message[0]} />;
    });

    var sithName, jediName;
    if (
      !this.state.gameState.players.sith.userName ||
      this.state.gameState.players.sith.userName.length === 0
    ) {
      sithName = '';
    } else {
      sithName = <span>{this.state.gameState.players.sith.userName}</span>;
    }
    if (
      !this.state.gameState.players.jedi.userName ||
      this.state.gameState.players.jedi.userName.length === 0
    ) {
      jediName = '';
    } else {
      jediName = <span>{this.state.gameState.players.jedi.userName}</span>;
    }

    var gameOverModal = null;
    if(this.state.gameState.winner === 'jedi' && this.state.showModal){
      gameOverModal =  <div id="contain-jedi-gif" className='modal' onClick={this.hideModal}>
        <div className="jedi-win-gif" />
      </div>    
    }else if(this.state.gameState.winner === 'sith' && this.state.showModal){
      gameOverModal =  <div id="contain-sith-gif" className='modal' onClick={this.hideModal}>
        <div className="sith-win-gif" />
      </div>
    }
    
  //   <div
  //   id="contain-sith-gif"
  //   className={'modal ' + displaySithWin}
  //   onClick={this.hideModal}
  // >
  //   <div className="sith-win-gif" />
  // </div>
  // <div
  //   id="contain-jedi-gif"
  //   className={'modal ' + displayJediWin}
  //   onClick={this.hideModal}
  // >
  //   <div className="jedi-win-gif" />
  // </div>


    var newGameMessage = '';
    if(this.state.showNewGameMessage){
      // const opponentRole = this.state.gameState.role === 'sith' ? 'jedi' : 'sith';
      var opponentName;
      if(this.state.gameState.role === 'sith'){
        opponentName = this.state.gameState.players.jedi.userName;
      }
      else{
        opponentName = this.state.gameState.players.sith.userName;
      }
      newGameMessage = <li className="li-server-message">{opponentName} wants a rematch!<button className="btn btn-danger chat-new-game" onClick={event => this.handleStartNewGame(event)}>New Game</button></li>
    }

    return (
      <div className="forest_background">
        <div className="col-xs-9 othello">
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
                  <p className="jedi-name">Jedi {jediName}</p>
                  <p className="jedi-score">
                    {this.state.gameState.players.jedi.userSpots.length}
                  </p>
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
                    Sith
                    {sithName}
                  </p>
                  <p className="sith-score">
                    {this.state.gameState.players.sith.userSpots.length}
                  </p>
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
        <div className="col-xs-3 chat">
          <div className="chat-header">
            <p>Chat Lobby</p>
          </div>
          <div className="chat-div">
            <ul id="messages" className="chat__messages">
              {message_li}
              {newGameMessage}
            </ul>
            <div className="chat__footer">
              <form
                id="message-form"
                onSubmit={event => this.handleChatSubmit(event)}
              >
                <div id="contain-chat-input">
                  <input
                    name="message"
                    type="text"
                    className="form-input"
                    id="input_message"
                    placeholder="send message"
                    value={this.state.chat.message}
                    autoFocus
                    autoComplete="off"
                    onChange={event => this.handleChatInput(event)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-success"
                  id="send_button"
                  onClick={event => this.handleChatSubmit(event)}
                >
                  <i className="fas fa-paper-plane" id="send-icon" />
                  <span id="send-text">send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default OthelloDuo;

// <div className="col-xs-12 othello">
//         <audio
//           id="sw_audio"
//           className="audio_class"
//           loop
//           preload="auto"
//           src="public/css/audio/Star-Wars-Duel-of-the-Fates.mp3"
//         />
//         <h2 className="game-title">Othello</h2>
//         <h3 className="game-subtitle">Jedi vs. Sith</h3>
//         <div className="game-contents">
//           <div id="back-board">{row}</div>
//           <div>
//             <div
//               className={
//                 'stats_container col-xs-offset-2 col-xs-2 ' + jedi_opacity
//               }
//               id="jedi-stats"
//             >
//               <div className="player-info" id="jedi-info">
//                 <p className="jedi-name">
//                   Jedi<span />
//                 </p>
//                 <p className="jedi-score">{this.state.player2.length}</p>
//               </div>
//             </div>
//             <div className="col-xs-offset-1 col-xs-2" id="reset-button">
//               <button
//                 type="button"
//                 className="button reset"
//                 onClick={this.handleReset}
//               >
//                 RESET
//               </button>
//             </div>
//             <div
//               className={
//                 'stats_container col-xs-offset-1 col-xs-2 ' + sith_opacity
//               }
//               id="sith-stats"
//             >
//               <div className="player-info" id="sith-info">
//                 <p className="sith-name">
//                   Sith<span />
//                 </p>
//                 <p className="sith-score">{this.state.player1.length}</p>
//               </div>
//             </div>
//           </div>
//           <div>
//             <button
//               className="button btn btn-light audio-btn"
//               onClick={this.audioCallback}
//             >
//               <span id="volume-on-icon">
//                 <i className="fas fa-volume-up" />
//               </span>
//               <span id="volume-off-icon">
//                 <i className="fas fa-volume-off" />
//               </span>
//             </button>
//           </div>
//         </div>
//         <div
//           id={'contain-sith-gif'}
//           className={'modal ' + displaySithWin}
//           onClick={this.hideModal}
//         >
//           <div className="sith-win-gif" />
//         </div>
//         <div
//           id={'contain-jedi-gif'}
//           className={'modal ' + displayJediWin}
//           onClick={this.hideModal}
//         >
//           <div className="jedi-win-gif" />
//         </div>
//       </div>
