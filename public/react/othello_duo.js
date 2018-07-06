import React, { Component } from 'react';
import _ from 'lodash';
import Row from './row';
import Message from './message';
import io from 'socket.io-client';
// let socket = io(`http://1v1me.io`);
//dev
let socket = io(`http://localhost:3000`);

class OthelloDuo extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.intervalKey;
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
    };

    this.debounced_mount = _.debounce(this.handleUserVerification, 200);
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
      this.handleGetMove(res);
    });

    socket.on('initOthello', res => {
      if(this._isMounted){
        this.handleGameInit(res);
      }
      else{
        this.intervalKey = setInterval(() => {
          this.handleGameInit(res);
          if(this.state.gameState.role){
            clearInterval(this.intervalKey);
          }
        }, 100)
      }
    });

    socket.on('initNewGame', res => {
      this.handleInitNewGame(res);
    });

    socket.on('confirmNewGame', res => {
      this.handleConfirmNewGame();
    });

    socket.on('gameOver', res => {
      this.handleGameOver(res.winner);
    });
  }

  componentDidMount() {
    this._isMounted = true;
    this.debounced_mount();
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.debounced_mount.cancel();
    if(this.intervalKey){
      clearInterval(this.intervalKey);
    }
  }

  handleGameInit(res) {
    if(!this._isMounted){
      return;
    }
    if(this.intervalKey){
      clearInterval(this.intervalKey);
    }
    var { allowedMoves, boardState, userTurn, users } = res;
    var jediUserName, sithUserName;
    users.forEach(user => {
      if (user.role === 'white') {
        jediUserName = user.userName;
      } else if (user.role === 'black') {
        sithUserName = user.userName;
      }
    });
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
    if (userTurn === role) {
      isUserTurn = true;
    }
    var newBoardState;
    if (isUserTurn) {
      newBoardState = this.importBoard(boardState, allowedMoves);
    } else {
      newBoardState = this.importBoard(boardState, null);
    }
    this.setState({
      gameState: {
        ...this.state.gameState,
        boardState: newBoardState.boardState,
        legal_moves_array: newBoardState.legal_moves_array,
        role: role,
        userColor,
        opponentColor,
        isUserTurn,
        players: {
          jedi: {
            userName: jediUserName,
            userSpots: newBoardState.jediSpots
          },
          sith: {
            userName: sithUserName,
            userSpots: newBoardState.sithSpots
          }
        }
      }
    });
  }

  scrollToBottom(){
    var messages = $('#messages');
    var newMessage = messages.children('li:last-child');
    var clientHeight = messages.prop('clientHeight');
    var scrollTop = messages.prop('scrollTop');
    var scrollHeight = messages.prop('scrollHeight');
    var newMessageHeight = newMessage.innerHeight();
    var lastMessageHeight = newMessage.prev().innerHeight();

    if (
      clientHeight + scrollTop + newMessageHeight + lastMessageHeight >=
      scrollHeight
    ) {
      messages.scrollTop(scrollHeight);
    }
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
      this.setState({
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
      }, this.scrollToBottom);
    }
  }

  handleUserVerification() {
    if (this._isMounted) {
      const token = window.localStorage.getItem('token');
      const userName = window.localStorage.getItem('userName');
      const gameId = window.localStorage.getItem('gameId');
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
          socket.emit('validateUser', { token, gameId }, (err, response) => {
            if (err && response.id) {
              window.localStorage.setItem('token', response.id);
              this.props.history.push('/');
            } else {
              if (!window.localStorage.getItem('userName') || response.userName !== window.localStorage.getItem('userName')) {
                window.localStorage.setItem('userName', response.userName);
              }
              socket.emit('join', { token, gameId });
            }
          });
        }
      );
    }
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

  handleReset() {
    socket.emit('requestNewGame', {
      token: this.state.token,
      role: this.state.gameState.userColor,
      gameId: this.state.gameId
    });
  }

  handleConfirmNewGame() {
    this.setState({
      showNewGameMessage: true
    });
  }

  handleStartNewGame(event) {
    event.preventDefault();
    socket.emit('startNewGame', {
      token: this.state.token,
      gameId: this.state.gameId
    });
    $('.chat-new-game').prop('disabled', true);
  }

  handleInitNewGame(res) {
    const isUserTurn =
      res.gameState.userTurn === this.state.gameState.role ? true : false;
    var newBoardState;
    if (isUserTurn) {
      newBoardState = this.importBoard(
        res.gameState.boardState,
        res.gameState.allowedMoves
      );
    } else {
      newBoardState = this.importBoard(res.gameState.boardState, null);
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
        },
        winner: null
      },
      showNewGameMessage: false
    });
  }

  hideModal() {
    this.setState({
      showModal: false
    });
  }

  handleChatInput(event) {
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

  handleGameOver(winner) {
    this.setState({
      gameState: {
        ...this.state.gameState,
        winner
      },
      showModal: true
    });
  }

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
  }

  handleUserTurn(row, column) {
    if (this.state.gameState.boardState[row][column] !== 'a') {
      return;
    }
    socket.emit(
      'setMove',
      {
        token: this.state.token,
        gameId: this.state.gameId,
        role: this.state.gameState.userColor,
        position: { row: row, col: column }
      },
      (err, res) => {
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
      return;
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

  render() {
    let jedi_opacity = 'opacity_1';
    let sith_opacity = 'opacity_1';
    if (
      (this.state.gameState.role === 'sith' &&
        this.state.gameState.isUserTurn) ||
      (this.state.gameState.role === 'jedi' && !this.state.gameState.isUserTurn)
    ) {
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
          turn='player'
        />
      );
    });

    var message_li = this.state.chat.messageLog.map((message, index) => {
      return <Message key={index} message={message[1]} type={message[0]} user={this.state.gameState.players.sith.userName}/>;
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
    if (this.state.gameState.winner === 'jedi' && this.state.showModal) {
      gameOverModal = (
        <div id="contain-jedi-gif" className="modal" onClick={this.hideModal}>
          <div className="jedi-win-gif" />
        </div>
      );
    } else if (this.state.gameState.winner === 'sith' && this.state.showModal) {
      gameOverModal = (
        <div id="contain-sith-gif" className="modal" onClick={this.hideModal}>
          <div className="sith-win-gif" />
        </div>
      );
    } else if(this.state.gameState.winner === 'tie' && this.state.showModal) {
      gameOverModal = (
        <div id="contain-jedi-gif" className="modal" onClick={this.hideModal}>
          <div className="jedi-win-gif" />
        </div>
      );
    }

    var newGameMessage = '';
    if (this.state.showNewGameMessage) {
      var opponentName;
      if (this.state.gameState.role === 'sith') {
        opponentName = this.state.gameState.players.jedi.userName;
      } else {
        opponentName = this.state.gameState.players.sith.userName;
      }
      newGameMessage = (
        <li className="li-server-message">
          {opponentName} wants a rematch!<button
            className="btn btn-danger chat-new-game"
            onClick={event => this.handleStartNewGame(event)}
          >
            New Game
          </button>
        </li>
      );
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
