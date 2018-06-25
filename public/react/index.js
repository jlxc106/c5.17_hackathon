import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
let socket = io(`http://localhost:3000`);

class HomePage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      viewPanel: 'selectGame'
    };
    this.handleBackButton = this.handleBackButton.bind(this);
    this.changeView = this.changeView.bind(this);
  }

  changeView(panelType) {
    this.setState({ viewPanel: panelType });
  }

  componentDidMount() {
    var userName = window.localStorage.getItem('userName');
    if (userName !== 'anon' && userName && userName.length > 0) {
      $('#input-name').attr('placeholder', userName);
    }
    // console.log(userName);
  }

  handleOnSubmit(){
      console.log('clicked bruh');
      let userName = $('#input-name').val();
      let findButton = $('#submit-user-info');
      if(!userName || userName.trim().length < 1){
          console.log('invalid user name');
          $('#invalid-name-warning').css('display', 'block');
          return;
      }
      findButton.html("Looking for game...");
      findButton.attr('disabled', true);
      socket.emit('searchOthello', {
          "userName": userName,
          "token": window.localStorage.getItem('token')
      }, function(err, response){
          if(err){
              console.log(`error finding game`);
          }
          else{
              
          }
      });
    
  }

  handleBackButton(){
    this.setState({viewPanel: 'selectGame'})
  }


  render() {
    socket.on('connect', function() {
      const token = window.localStorage.getItem('token')
        ? window.localStorage.getItem('token')
        : null;
      // console.log(token);
      socket.emit('validateUser', { token: token }, function(err, response) {
        if (err && response.token) {
          console.log(err);
          window.localStorage.setItem('token', response.token);
        } else if (response.userName && response.userName !== 'anon') {
          window.localStorage.setItem('userName', response.userName);
        }
      });
    });

    socket.on('foundOthelloGame', function(response) {
      window.location = `${response.path}`;
    });

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
            <button
              className="btn-choose-game othello-one-player"
              name="numPlayers"
              value="1"
              disabled
              data-toggle="tooltip"
              title="coming soonTM"
            >
              Play AI
            </button>
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
          <form id="user-info-form">
            <div className="form-field">
              <label htmlFor="">Display name</label>
              <input id="input-name" type="text" name="name" autoFocus={true} />
              <span id="invalid-name-warning">invalid user name</span>
            </div>
            <button
              id="submit-user-info"
              className="active-btn"
              type="button"
              onClick={this.handleOnSubmit}
            >
              Find a game
            </button>
          </form>
        </div>
      );
    }

    let button = null;

    if (this.state.viewPanel !== 'selectGame') {
      button = (
        <button id="btn-select-game-mode"
        onClick={this.handleBackButton}>
          Back
        </button>
      );
    }

    return (
      <div id="particles-js">
        <script>
          {particlesJS.load('particles-js', 'particles.json')}
        </script>
        <div id="center-container">{panelDOM}</div>
          {button}
        <a
          href="http://www.hannu.se/games/othello/rules.htm"
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
