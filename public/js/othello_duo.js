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
  if (token === undefined) {
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
  console.log(res);
  View.clearBoard();
  Model.updateBoard(res.gameState);
  View.highlightTurn(Model.gameInstance.role);
  View.removeNewGameMessage();
})

socket.on('getMove', function(res) {
  Model.updateBoard(res);
  View.highlightTurn(Model.gameInstance.role);
  // Model.
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
    // this.gameInstance.
  },

  // initGame: function(res){
  //   this.gameInstance.init(res);
  // },

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
    }

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
        View.updateScores(this.whitePlayerByRef, this.blackPlayerByRef);
      });
    };

    this.setTurn = function(userTurn){
      if(!this.role){
        return console.log('invalid role');
      }
      if(this.role ==='black' && userTurn === 'sith' || this.role === 'white' && userTurn === 'jedi'){
        this.isUserTurn = true;
      }
    }

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

    this.legalMoves = function() {
      var colNum, rowNum;
      this.clearLegalMoves();
      for (i = 0; i < this.opponent.length; i++) {
        colNum = Model.col_list.indexOf(this.opponent[i].attr('col'));
        rowNum = parseInt(this.opponent[i].attr('row'));
        for (var j = -1; j < 2; j++) {
          // for rows
          for (var k = -1; k < 2; k++) {
            //for columns
            if (
              rowNum + j < 0 ||
              rowNum + j > 7 ||
              colNum + k < 0 ||
              colNum + k > 7
            ) {
              continue;
            }
            var selectDiv = Model.array_list[rowNum + j][colNum + k];
            if (
              selectDiv.hasClass('white-disc') ||
              selectDiv.hasClass('black-disc')
            ) {
              continue;
            } else {
              this.searchSpots(
                selectDiv,
                `${this.otherRole}-disc`,
                `${this.role}-disc`
              );
            }
          }
        }
      }
      for (var i = 0; i < self.legal_moves_array.length; i++) {
        self.legal_moves_array[i].addClass('allowedSpot');
      }
    };

    this.clearLegalMoves = function() {
      this.legal_moves_array.forEach(function(move) {
        move.removeClass('allowedSpot');
      });
      this.legal_moves_array = [];
    };

    this.searchSpots = function(selectDiv, disc_color, this_color) {
      var r = parseInt(selectDiv.attr('row'));
      var c = Model.col_list.indexOf(selectDiv.attr('col'));
      var diag = [
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
        var var1 = diag[i][0];
        var var2 = diag[i][1];
        var var3 = diag[i][1] + r;
        var var4 = diag[i][0] + c;
        if (var3 >= 0 && var3 < 8 && var4 >= 0 && var4 < 8) {
          var check = Model.array_list[diag[i][1] + r][diag[i][0] + c];
          if (typeof check !== undefined && check.hasClass(disc_color)) {
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
            while (check.hasClass(disc_color)) {
              temp_diag_directions[i][0] += var1;
              temp_diag_directions[i][1] += var2;
              var tempr = r + temp_diag_directions[i][1];
              var tempc = c + temp_diag_directions[i][0];
              if (tempr < 0 || tempr > 7 || tempc < 0 || tempc > 7) {
                break;
              }
              check =
                Model.array_list[r + temp_diag_directions[i][1]][
                  c + temp_diag_directions[i][0]
                ];
              if (check.hasClass(this_color)) {
                this.legal_moves_array.push(selectDiv);
                break;
              }
            }
          }
        }
      }
    };

    this.clickHandler = function() {
      if(!self.isUserTurn){
        console.log('wait ur turn punk');
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
            console.log('288 ', res);
            self.importBoard(res.boardState);
          }
        );
          self.isUserTurn = false;
          View.highlightTurn(self.otherRole);
          self.clearLegalMoves();
      }
    };

    this.flip = function(color, color_to_replace, x, y) {
      //flip function
      var directions = [
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
      for (var j = 0; j < directions.length; j++) {
        var path = [];
        var d0 = directions[j][0];
        var d1 = directions[j][1];
        var temp_y = y + d1;
        var temp_x = x + d0;
        if (temp_y >= 0 && temp_y < 8 && temp_x >= 0 && temp_x < 8) {
          var divTracker = Model.array_list[temp_y][temp_x];
          if (divTracker.hasClass(color_to_replace)) {
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
            while (divTracker.hasClass(color_to_replace)) {
              path.push(divTracker);
              temp_directions[j][0] += d0;
              temp_directions[j][1] += d1;
              if (
                y + temp_directions[j][1] < 0 ||
                y + temp_directions[j][1] > 7 ||
                x + temp_directions[j][0] < 0 ||
                x + temp_directions[j][0] > 7
              ) {
                break;
              }
              divTracker =
                Model.array_list[y + temp_directions[j][1]][
                  x + temp_directions[j][0]
                ];
              if (divTracker.hasClass(color)) {
                arrayOfFlips = arrayOfFlips.concat(path);
                break;
              }
            }
          }
        }
      }
      for (var i = 0; i < arrayOfFlips.length; i++) {
        if (self.isUserTurn) {
          var indexToRemove = this.opponent.indexOf(arrayOfFlips[i]);
          this.opponent.splice(indexToRemove, 1);
          this.player.push(arrayOfFlips[i]);
        } else {
          var indexToRemove = this.player.indexOf(arrayOfFlips[i]);
          this.player.splice(indexToRemove, 1);
          this.opponent.push(arrayOfFlips[i]);
        }
        arrayOfFlips[i].removeClass('white-disc black-disc');
        arrayOfFlips[i].addClass(color);
      }
      self.clearLegalMoves();
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

    this.resetAll = function() {
      socket.emit('requestNewGame', {
        token: window.localStorage.getItem('token'),
        gameId: getGameId(),
        role: self.role
      });
    };

    this.legalMoves_old = function(index) {
      var colNum;
      var rowNum;
      this.clearLegalMoves();
      //for player 1 - black moves
      if (index === 0) {
        for (i = 0; i < this.player2.length; i++) {
          colNum = Model.col_list.indexOf(this.player2[i].attr('col'));
          rowNum = parseInt(this.player2[i].attr('row'));
          for (var j = -1; j < 2; j++) {
            // for rows
            for (var k = -1; k < 2; k++) {
              //for columns
              if (
                rowNum + j < 0 ||
                rowNum + j > 7 ||
                colNum + k < 0 ||
                colNum + k > 7
              ) {
                continue;
              }
              var selectDiv = Model.array_list[rowNum + j][colNum + k];
              if (
                selectDiv.hasClass('white-disc') ||
                selectDiv.hasClass('black-disc')
              ) {
                continue;
              } else {
                for (var b = 0; b < this.player1.length; b++) {
                  this.searchSpots(selectDiv, 'white-disc', 'black-disc');
                }
              }
            }
          }
        }
      } else {
        //for player 2 - white moves
        for (var i = 0; i < this.player1.length; i++) {
          colNum = Model.col_list.indexOf(this.player1[i].attr('col'));
          rowNum = parseInt(this.player1[i].attr('row'));
          for (var j = -1; j < 2; j++) {
            // for rows
            for (var k = -1; k < 2; k++) {
              //for columns
              if (
                rowNum + j < 0 ||
                rowNum + j > 7 ||
                colNum + k < 0 ||
                colNum + k > 7
              ) {
                continue;
              }
              var selectDiv = Model.array_list[rowNum + j][colNum + k];
              if (
                selectDiv.hasClass('white-disc') ||
                selectDiv.hasClass('black-disc')
              ) {
                continue;
              } else {
                this.searchSpots(selectDiv, 'black-disc', 'white-disc');
              }
            }
          }
        }
      }
      for (var i = 0; i < self.legal_moves_array.length; i++) {
        self.legal_moves_array[i].addClass('allowedSpot');
      }
      if (
        self.legal_moves_array.length === 0 &&
        self.player1.length + self.player2.length < 64
      ) {
        if (self.turn === self.player_list[1]) {
          self.turn = self.player_list[0];
          self.legalMoves(0);
        } else {
          self.turn = self.player_list[1];
          self.legalMoves(1);
        }
      }
    };
  }
};

var View = {
  initEventHandlers: function(self) {
    $('.rows > div').click(self.clickHandler);
    $('.reset').click(self.resetAll);
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

  audioCallback: function() {
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
        console.log(cell);
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
    $('.audio-btn').click(View.audioCallback);
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
