var socket = io();

function getGameId() {
  let searchUrl = window.location.search;
  if (searchUrl.includes('numPlayers=2')) {
    var searchUrlSplit = searchUrl.split('&id=');
    return searchUrlSplit[1];
  }
}

socket.on('connect', function() {
  const token = window.localStorage.getItem('token')
    ? window.localStorage.getItem('token')
    : undefined;
  if (token === undefined || token === "undefined") {
    window.location = 'index.html';
    return;
  }
  socket.emit('validateUser', { token, gameId: getGameId() }, function(
    err,
    response
  ) {
    if (err && response.id) {
      window.localStorage.removeItem('token');
      window.localStorage.setItem('token', response.id);
      window.location = 'index.html';
    } else {
      socket.emit('join', { token, gameId: getGameId() });
    }
  });
});

socket.on('initNewGame', function(res){
  View.clearBoard();
  Model.updateBoard(res.gameState);
  View.highlightTurn(Model.gameInstance.role);
  View.removeNewGameMessage();
})

socket.on('getMove', function(res) {
  Model.updateBoard(res);
  View.highlightTurn(Model.gameInstance.role);
});

socket.on('initOthello', function(res) {
  View.handleUserNames(res.users);
  Model.gameInstance.init(res);
});

socket.on('gameOver', function(res) {
  Controller.handleGameOver(res.winner);
});

socket.on('sendMessage', function(message) {
  Controller.handleChatReceive('sendMessage', message);
});

socket.on('serverMessage', function(message) {
  Controller.handleChatReceive('serverMessage', message);
});

socket.on('confirmNewGame', function(res){
  Controller.handleConfirmNewGame(res.userName);
})


var Model = {
  gameInstance: {},
  col_list: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  array_list: [[], [], [], [], [], [], [], []],

  createGameObj: function() {
    this.gameInstance = new Model.GameObj();
  },

  updateBoard: function(response) {
    this.gameInstance.importBoard(response.boardState);
    this.gameInstance.setTurn(response.userTurn);
    if(this.gameInstance.isUserTurn){
      this.gameInstance.setLegalMoves(response.allowedMoves);
    }
  },

  GameObj: function() {
    var self = this;
    this.role;
    this.otherRole;
    this.player = [];
    this.opponent = [];
    this.isUserTurn = false;
    this.legal_moves_array = [];

    this.whitePlayerByRef = null;
    this.blackPlayerByRef = null;

    this.init = function(res) {
      if (!res.role || !(res.role === 'black' || res.role === 'white')) {
        console.log('invalid role');
        throw new Error('invalid role');
      }
      this.role = res.role;
      if (this.role === 'black') {
        this.otherRole = 'white';
        this.whitePlayerByRef = this.opponent;
        this.blackPlayerByRef = this.player;
      } else {
        this.whitePlayerByRef = this.player;
        this.blackPlayerByRef = this.opponent;
        this.otherRole = 'black';
      }
      this.setTurn(res.userTurn);
      this.importBoard(res.boardState);
      if (this.isUserTurn) {
        this.setLegalMoves(res.allowedMoves);
      }
      View.highlightTurn(res.userTurn);
      View.initEventHandlers(self);
    };

    this.preImportBoard = function(){
      this.player = [];
      this.opponent = [];
      if(this.role === 'black'){
        this.whitePlayerByRef = this.opponent;
        this.blackPlayerByRef = this.player;
      }
      else{
        this.whitePlayerByRef = this.player;
        this.blackPlayerByRef = this.opponent;
      }
    };

    this.importBoard = function(boardState) {
      this.preImportBoard();
      boardState.forEach((row, rowIndex) => {
        for (column in row) {
          var cell = Model.array_list[rowIndex][column];
          if (row[column] === 'b') {
            this.blackPlayerByRef.push(
              cell.removeClass('white-disc allowedSpot').addClass('black-disc')
            );
          } else if (row[column] === 'w') {
            this.whitePlayerByRef.push(
              cell.removeClass('black-disc allowedSpot').addClass('white-disc')
            );
          }
        }
      });
      View.updateScores(this.whitePlayerByRef, this.blackPlayerByRef);
    };

    this.setTurn = function(userTurn){
      if(!this.role){
        return console.log('invalid role');
      }
      if(this.role ==='black' && userTurn === 'sith' || this.role === 'white' && userTurn === 'jedi'){
        this.isUserTurn = true;
      }
    };

    this.setLegalMoves = function(legalMoves) {
      this.clearLegalMoves();
      legalMoves.forEach(move => {
        var row = move.row;
        var col = move.col;
        this.legal_moves_array.push(
          Model.array_list[row][col]
            .removeClass('black-disc white-disc')
            .addClass('allowedSpot')
        );
      });
      return this.legal_moves_array;
    };

    this.clearLegalMoves = function() {
      this.legal_moves_array.forEach(function(move) {
        move.removeClass('allowedSpot');
      });
      this.legal_moves_array = [];
    };

    this.clickHandler = function() {
      if(!self.isUserTurn){
        return false;
      }
      var col = $(this).attr('col');
      var rowNum = parseInt($(this).attr('row'));
      var colNum = Model.col_list.indexOf(col);
      var allowedMove = self.legal_moves_array.some(function(move) {
        return move.attr('row') == rowNum && move.attr('col') == col;
      });
      if (allowedMove) {
        socket.emit(
          'setMove',
          {
            token: window.localStorage.getItem('token'),
            gameId: getGameId(),
            role: self.role,
            position: { row: rowNum, col: colNum }
          },
          function(err, res) {
            if (err) {
              console.log('error occured');
            }
            self.importBoard(res.gameState.boardState);
            self.setTurn(response.gameState.userTurn);
            if(self.isUserTurn){
              self.setLegalMoves(response.gameState.allowedMoves);
              View.highlightTurn(self.role);
            }
            else{
              View.highlightTurn(self.otherRole);
              self.clearLegalMoves();
            }
          }
        );
          // self.isUserTurn = false;
          // View.highlightTurn(self.otherRole);
          // self.clearLegalMoves();
      }
    };

    this.gameOver = function(winner) {
      if(winner === 'sith' || winner === 'jedi'){
        $(`#contain-${winner}-gif`).show();
        return;
      }
      if (this.whitePlayerByRef.length < this.blackPlayerByRef.length) {
        $('#contain-sith-gif').show();
      } else if (this.whitePlayerByRef.length > this.blackPlayerByRef.length) {
        $('#contain-jedi-gif').show();
      }
    };

    this.handleReset = function() {
      socket.emit('requestNewGame', {
        token: window.localStorage.getItem('token'),
        gameId: getGameId(),
        role: self.role
      });
    };
  }
};

var View = {
  initEventHandlers: function(self) {
    $('.rows > div').click(self.clickHandler);
    $('.reset').click(self.handleReset);
    $('.modal').click(this.closeModal);
  },

  closeModal: function() {
    $('.modal').hide();
  },

  generateSpots: function() {
    for (var i = 1; i < 9; i++) {
      $('<div>')
        .attr('id', 'row' + i)
        .addClass('rows')
        .appendTo('#back-board');
    }
    for (var k = 0; k < 8; k++) {
      for (var j = 0; j < 8; j++) {
        var tempDiv = $('<div>')
          .attr('col', Model.col_list[j])
          .attr('row', k)
          .appendTo('#row' + (k + 1));
        Model.array_list[k].push(tempDiv);
      }
    }
  },

  toggleAudio: function() {
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
  },

  handleSendMessage: function(message) {
    var incomingMessage = $('<li>')
      .addClass('li-message')
      .html('<span>' + message.from + '</span>' + ': ' + message.message)
      .appendTo('#messages');
    if (message.role === 'black') {
      incomingMessage.addClass('message-black');
    } else {
      incomingMessage.addClass('message-white');
    }
    this.scrollToBottom();
    if (message.activeUsers.length < 2) {
      View.handleServerMessage({ message: 'Your opponent is not in game.' });
    }
  },

  handleServerMessage: function(message) {
    $('<li>')
      .addClass('li-server-message')
      .html(message.message)
      .appendTo('#messages');
    this.scrollToBottom();
  },

  scrollToBottom: function() {
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
  },

  updateScores: function(jedi, sith) {
    if (jedi && sith) {
      $('.jedi-score').html(jedi.length);
      $('.sith-score').html(sith.length);
    }
  },

  clearBoard: function(){
    Model.array_list.forEach(function(row){
      row.forEach(function(cell){
        cell.removeClass('black-disc white-disc allowedSpot');
      })
    })
  },

  highlightTurn: function(role) {
    if (role === 'white' || role === 'jedi') {
      $('#jedi-stats').css('opacity', '1');
      $('#sith-stats').css('opacity', '0.5');
    } else {
      $('#jedi-stats').css('opacity', '0.5');
      $('#sith-stats').css('opacity', '1');
    }
  },

  handleUserNames: function(users) {
    users.forEach(function(user) {
      if (user.role === 'black') {
        $('.player_one-name > span').html('(' + user.userName + ')');
      } else {
        $('.player_two-name > span').html('(' + user.userName + ')');
      }
    });
  },

  handleNewGameMessage: function(userName){
    if($('.chat-new-game').length === 0){
      var newGameButton = $('<button>').html('New Game').addClass('btn btn-danger chat-new-game').prop('type', 'button');
      $('<li>')
      .addClass('li-server-message')
      .html(`${userName} wants a rematch!`)
      .append(newGameButton)
      .appendTo('#messages');
      this.scrollToBottom();
    }
  },

  removeNewGameMessage: function(){
    if($('.chat-new-game').length){
      $('.chat-new-game').parent().remove();
    }
  }

};

var Controller = {
  handleOnLoad: function() {
    $('.audio-btn').click(View.toggleAudio);
    View.generateSpots();
    Model.createGameObj();
    Controller.handleChatSubmit();
  },

  handleChatSubmit: function() {
    $('#message-form').on('submit', function(event) {
      event.preventDefault();
      //   console.log(event);
      var message = $('#input_message')
        .val()
        .trim();
      if (message.length > 0) {
        socket.emit(
          'newMessage',
          {
            token: window.localStorage.getItem('token'),
            gameId: getGameId(),
            message
          },
          function(err) {
            if (err) {
              console.log(err);
            } else {
              $('#input_message').val('');
            }
          }
        );
      }
    });
  },

  handleChatReceive: function(type, message) {
    // console.log('message: ', message);
    switch (type) {
      case 'sendMessage':
        View.handleSendMessage(message);
        return;
      case 'serverMessage':
        View.handleServerMessage(message);
        return;
      default:
        console.log('invalid message type');
        return;
    }
  },
  
  handleGameOver: function(winner){
    Model.gameInstance.gameOver(winner);
    View.highlightTurn(winner);
  },

  handleConfirmNewGame: function(userName){
    View.handleNewGameMessage(userName);
    $('.chat-new-game').click(function(){
      socket.emit('startNewGame', {
        token: window.localStorage.getItem('token'),
        gameId: getGameId()
      })
      $(this).prop('disabled', true)
    })
  }
};

$(document).ready(Controller.handleOnLoad);
