import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import io from 'socket.io-client';
let socket = io(`http://1v1me.io`);
//dev
// let socket = io(`http://localhost:3000`);

class HomePage extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.state = {
      viewPanel: 'selectGame',
      userName: null,
      token: null,
      showInvalidNameText: false
    };
    this.handleBackButton = this.handleBackButton.bind(this);
    this.changeView = this.changeView.bind(this);

    socket.on('foundOthelloGame', response => {
      var gameId = response.gameId;
      if (gameId !== window.localStorage.getItem('gameId')) {
        window.localStorage.setItem('gameId', gameId);
      }
      this.props.history.push('/othello_duo');
    });

    this.debounced_mount = _.debounce(this.handleUserVerification, 200);
    this.handleOnSubmit = this.handleOnSubmit.bind(this);
  }

  changeView(panelType) {
    this.setState({ viewPanel: panelType });
  }

  componentDidMount() {
    this._isMounted = true;
    this.debounced_mount();
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.debounced_mount.cancel();
  }

  handleUserVerification() {
    if (this._isMounted) {
      this.setState(
        {
          userName: window.localStorage.getItem('userName') || null,
          token: window.localStorage.getItem('token') || null
        },
        () => {
          socket.emit('validateUser', { token: this.state.token }, function(
            err,
            response
          ) {
            if (err && response.token) {
              window.localStorage.setItem('token', response.token);
            } else if (response.userName && response.userName !== 'anon') {
              window.localStorage.setItem('userName', response.userName);
            }
          });
        }
      );
    }
  }

  handleOnSubmit(event) {
    event.preventDefault();
    let userName = $('#input-name').val();
    let findButton = $('#submit-user-info');
    if (!userName || userName.trim().length < 1) {
      this.setState({ showInvalidNameText: true });
      return;
    }
    this.setState({ showInvalidNameText: false });
    findButton.html('Looking for game...');
    findButton.attr('disabled', true);
    socket.emit(
      'searchOthello',
      {
        userName: userName,
        token: window.localStorage.getItem('token')
      },
      function(err,response) {
        if (err) {
          console.log(`error finding game`);
        } else {
          window.localStorage.setItem('userName', userName);
        }
      }
    );
  }

  handleBackButton() {
    this.setState({ viewPanel: 'selectGame' });
  }

  render() {
    var { showInvalidNameText, userName } = this.state;

    let invalidNameText = 'hideWarningText';
    if (showInvalidNameText) {
      invalidNameText = 'showWarningText';
    }

    let { viewPanel } = this.state;
    let panelDOM = null;
    if (viewPanel === 'selectGame') {
      panelDOM = (
        <div id="select-game">
          <button
            className="active-btn btn-choose-game btn-othello"
            type="button"
            onClick={() => this.changeView('selectGameType')}
          >
            Othello
          </button>
          <button
            className="btn-choose-game btn-chess"
            type="button"
            disabled
            data-toggle="tooltip"
            title="coming soonTM"
          >
            Chess
          </button>
        </div>
      );
    } else if (viewPanel === 'selectGameType') {
      panelDOM = (
        <div id="select-game-type">
          <form>
            <Link to="/othello_solo">
              <button
                className="active-btn btn-choose-game othello-one-player"
                name="numPlayers"
                value="1"
                type="button"
              >
                Single Player
              </button>
            </Link>
            <Link to="/othello_solo_ai">
              <button
                className="btn-choose-game othello-one-player"
                name="numPlayers"
                value="1"
                type="button"
                // disabled
                // data-toggle="tooltip"
                // title="coming soonTM"
              >
                Play AI
              </button>
            </Link>
            <button
              className="active-btn btn-choose-game othello-two-player"
              name="numPlayers"
              value="2"
              type="button"
              onClick={() => this.changeView('collectUserInfo')}
            >
              Two Player
            </button>
          </form>
        </div>
      );
    } else if (viewPanel === 'collectUserInfo') {
      panelDOM = (
        <div id="collect-player-info">
          <form
            id="user-info-form"
            onSubmit={event => this.handleOnSubmit(event)}
          >
            <div className="form-field">
              <label htmlFor="">Display name</label>
              <input
                id="input-name"
                type="text"
                name="name"
                placeholder={userName}
                autoFocus={true}
              />
              <span id="invalid-name-warning" className={invalidNameText}>
                invalid user name
              </span>
            </div>
            <button
              id="submit-user-info"
              className="active-btn"
              type="button"
              onClick={event => this.handleOnSubmit(event)}
            >
              Find a game
            </button>
          </form>
          <div>
          <i className="fas fa-info-circle"
            id="info-circle"
            data-toggle="tooltip"
            title="For testing two player mode of Othello, queue up from two different browsers or a regular & incognito window to emulate two different players.">
          </i>
          </div>
        </div>
      );
    }

    let button = null;

    if (this.state.viewPanel !== 'selectGame') {
      button = (
        <button id="btn-select-game-mode" onClick={this.handleBackButton}>
          Back
        </button>
      );
    }

    let lastDuoGameButton = null;

    if(window.localStorage.getItem('gameId') && window.localStorage.getItem('token') && window.localStorage.getItem('userName').length > 0 && this.state.viewPanel !== 'selectGame'){
      lastDuoGameButton = <Link to="/othello_duo" ><button type="button" id="btn-last-duo-game">Last Duo Game</button></Link>
    }

    return (
      <div id="particles-js">
        <script>{particlesJS.load('particles-js', 'particles.json')}</script>
        <div id="center-container">{panelDOM}</div>
        {button}
        {lastDuoGameButton}
        <a
          href="https://www.youtube.com/watch?v=Ol3Id7xYsY4"
          id="othello-help"
          target="_blank"
        >
          what is othello?
        </a>
      </div>
    );
  }
}

export default HomePage;
