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
  socket.emit('validateUser', { token, gameId: getGameId() }, function(err, response) {
    if (err) {
      window.localStorage.removeItem('token');
      window.localStorage.setItem('token', response.id);
      window.location = 'index.html';
    } else {
      console.log('validateUser response: ',response);
      socket.emit('join', {token, gameId: getGameId()});
      Controller.handleRole(response.role);
    }
  });
});

socket.on('initOthello', function(res){
  console.log(res);
  Controller.handleUserNames(res.users);
})

socket.on('sendMessage', function(message) {
  Controller.handleChatReceive('sendMessage', message);
});

socket.on('serverMessage', function(message) {
  Controller.handleChatReceive('serverMessage', message);
});

var Model = {
  gameInstance: {},
  col_list: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  array_list: [[], [], [], [], [], [], [], []],

  initSoloGame: function() {
    this.gameInstance = new Model.GameObj();
    this.gameInstance.init();
  },

  initDuoGame: function(){
    this.gameInstance = new Model.GameObj2();
    this.gameInstance.init();
  },

  setRole: function(role){
    this.gameInstance.setPlayerRole(role);
  },

  GameObj: function() {
    //player 1 is black -- player 2 is white
    var self = this;
    this.player1 = [];
    this.player2 = [];
    this.player_list = ['player 1', 'player 2'];
    this.turn = null;
    this.legal_moves_array = []; //this is for legal moves

    var goodImg = $('#jedi-turn-marker');
    var badImg = $('#sith-turn-marker');

    this.init = function() {
      this.player2.push(Model.array_list[3][3].addClass('white-disc'));
      this.player1.push(Model.array_list[3][4].addClass('black-disc'));
      this.player1.push(Model.array_list[4][3].addClass('black-disc'));
      this.player2.push(Model.array_list[4][4].addClass('white-disc'));
      this.turn = this.player_list[0];
      this.legalMoves(0);
      this.displayDiscs();
      this.symbolAppear();
      View.handlePostModelInit(self);
    };

    this.legalMoves = function(index) {
      var colNum;
      var rowNum;
      for (var i = 0; i < this.legal_moves_array.length; i++) {
        this.legal_moves_array[i].removeClass('allowedSpot'); //removes class-illegal moves cant be used
      }
      this.legal_moves_array = [];
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
            //found adjacent opposite color
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

    //control?
    this.clickHandler = function() {
      var bool = false;
      var x = $(this).attr('col');
      var y = parseInt($(this).attr('row'));
      var indexofcol = Model.col_list.indexOf(x);
      for (var i = 0; i < self.legal_moves_array.length; i++) {
        if (
          self.legal_moves_array[i].attr('row') == y &&
          self.legal_moves_array[i].attr('col') == x
        ) {
          bool = true;
        }
      }
      if (bool) {
        if (self.turn == self.player_list[0]) {
          // player 1's turn
          $(this).addClass('black-disc');
          self.player1.push($(this));
          self.flip($(this), 'black-disc', 'white-disc', indexofcol, y);
          self.turn = self.player_list[1];
          self.legalMoves(1);
        } else {
          $(this).addClass('white-disc');
          self.flip($(this), 'white-disc', 'black-disc', indexofcol, y);
          self.player2.push($(this));
          self.turn = self.player_list[0];
          self.legalMoves(0);
        }
        $(this).off('click');
      }
      self.symbolAppear();
      self.displayDiscs();
      if (self.player1.length + self.player2.length === 64) {
        self.gameOver();
      }
    };

    this.flip = function(inputDiv, color, color_to_replace, x, y) {
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
        if (color === 'black-disc') {
          var indexToRemove = this.player2.indexOf(arrayOfFlips[i]);
          this.player2.splice(indexToRemove, 1);
          this.player1.push(arrayOfFlips[i]);
        } else {
          var indexToRemove = this.player1.indexOf(arrayOfFlips[i]);
          this.player1.splice(indexToRemove, 1);
          this.player2.push(arrayOfFlips[i]);
        }
        arrayOfFlips[i].removeClass('white-disc black-disc');
        arrayOfFlips[i].addClass(color);
      }
    };

    //view
    this.symbolAppear = function() {
      //image appears under player function
      var jediImg = $('#player-imageTwo');
      var sithImg = $('#player-imageOne');
      var statsOne = $('#stats_container1');
      var statsTwo = $('#stats_container2');
      if (self.turn == self.player_list[1]) {
        $(goodImg).removeClass('alternateHideImg');
        $(sithImg).css('opacity', '0.7');
        $(statsTwo).css('opacity', '0.5');
        //sith step down
        $(badImg).addClass('alternateHideImg');
        $(jediImg).css('opacity', '1');
        $(statsOne).css('opacity', '1');
        //jedi's turn
      } else if (self.turn == self.player_list[0]) {
        $(badImg).removeClass('alternateHideImg');
        $(jediImg).css('opacity', '0.7');
        $(statsOne).css('opacity', '0.5');
        //jedi step down
        $(goodImg).addClass('alternateHideImg');
        $(sithImg).css('opacity', '1');
        $(statsTwo).css('opacity', '1');
        //sith's turn
      }
    };

    this.gameOver = function() {
      if (this.player1.length > this.player2.length) {
        this.turn = self.player_list[0];
        this.symbolAppear();
        $('#myModal').show();
      } else {
        this.turn = self.player_list[1];
        this.symbolAppear();
        $('#myModal2').show();
      }
      this.resetAll();
    };

    //view
    this.displayDiscs = function() {
      $('.player1-value').html(this.player1.length);
      $('.player2-value').html(this.player2.length);
    };

    this.resetAll = function() {
      self.turn = null;
      for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
          Model.array_list[i][j].removeClass(
            'white-disc black-disc allowedSpot'
          );
        }
      }
      self.player1 = [];
      self.player2 = [];
      self.legal_moves_array = [];
      self.init();
    };
  },

  GameObj2: function(){
    var self = this;
    this.player = [];
    this.isUserTurn = false;
    this.role;
    this.init = function(){
      
    }

    this.setPlayerRole = function(role){
      if(role){
        this.role = role;
      }
      else{
        throw new Error(role);
        console.log('unable to set role');
      }
    }
  }

};


var View = {
  handlePostModelInit: function(self) {
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
        $("#volume-on-icon").hide();
        $("#volume-off-icon").show();
    } else {
      audio_dom.pause();
      $("#volume-off-icon").hide();
      $("#volume-on-icon").show();
    }
  },

  disableChat: function() {
    console.log('1 player mode');
    $('.chat').css('display', 'none');
    $('.othello')
      .removeClass('col-md-9')
      .addClass('col-md-12');
    // $().
  },

  handleSendMessage: function(message){
    // console.log('send message ', message);
    var incomingMessage = $("<li>").addClass("li-message").html("<span>" + message.from + "</span>" + ": " + message.message).appendTo("#messages");
    if(message.role === 'black'){
      incomingMessage.addClass('message-black');
    }
    else{
      incomingMessage.addClass('message-white');
    }
    this.scrollToBottom();
    if(message.activeUsers.length < 2){
      View.handleServerMessage({"message": "Your opponent is not in game."})
    }
  },

  handleServerMessage: function(message){
    // console.log('sever message ',message);
    $("<li>").addClass('li-server-message').html(message.message).appendTo("#messages");
    this.scrollToBottom();
  },

  scrollToBottom: function(){
    // selectors
    var messages = $('#messages');
    var newMessage = messages.children('li:last-child');
    //heights
    var clientHeight = messages.prop('clientHeight');
    var scrollTop = messages.prop('scrollTop');
    var scrollHeight = messages.prop('scrollHeight');
    var newMessageHeight = newMessage.innerHeight();
    var lastMessageHeight = newMessage.prev().innerHeight();

    if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
      messages.scrollTop(scrollHeight);
    }
  }


};

var Controller = {
  handleOnLoad: function() {
    $('.audio-btn').click(View.audioCallback);
    View.generateSpots();
    Controller.handleGameType();
  },

  handleGameType: function() {
    let parameter = window.location.search;
    if (parameter === '?numPlayers=1') {
      View.disableChat();
      Model.initSoloGame();
    } else if (parameter.includes('?numPlayers=2')) {
      Model.initDuoGame();
      Controller.handleChatSubmit();
      //let server handle game logic
    } else {
      throw new Error('invalid game');
    }
  },

  handleChatSubmit: function() {
    $('#message-form').on('submit', function(event) {
      event.preventDefault();
      console.log(event);
      var message = $('#input_message').val().trim();
      if (message.length > 0) {
        socket.emit(
          'newMessage',
          { token: window.localStorage.getItem('token'), gameId: getGameId(), message },
          function(err) {
            if (err) {
              console.log(err);
            } else {
              // console.log('success');
              $('#input_message').val('');
            }
          }
        );
      }
    });
  },

  handleChatReceive: function(type, message) {
    console.log('message: ',message)
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

  handleUserNames: function(users){
    users.forEach(function(user){
      if(user.role==="black"){
        $(".player_one-name > span").html("("+ user.userName + ")")
      }
      else{
        $(".player_two-name > span").html("("+ user.userName + ")")
      }
    })
  },

  handleRole: function(role){
    Model.setRole(role);
  }
};

$(document).ready(Controller.handleOnLoad);





// var Model = {
//   gameInstance: {},

//   init: function() {
//     let gameTypeIndicator = Model.controlGameType(window.location.search);
//     this.gameInstance = new Model.GameObj().init(gameTypeIndicator);
//   },

//   controlGameType: function(search) {
//     const onePlayer = '?numPlayers=1';
//     const twoPlayer = '?numPlayers=2';
//     switch (search) {
//       case onePlayer:
//         return 1;
//       case twoPlayer:
//       default:
//         return 2;
//       // throw new Error('invalid game mode');
//     }
//   },
//   col_list: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
//   array_list: [[], [], [], [], [], [], [], []],

//   GameObj: function() {
//     //player 1 is black -- player 2 is white
//     var self = this;
//     this.player1 = [];
//     this.player2 = [];
//     this.player_list = ['player 1', 'player 2'];
//     this.turn = null;
//     this.legal_moves_array = []; //this is for legal moves

//     var goodImg = $('#jedi-turn-marker');
//     var badImg = $('#sith-turn-marker');

//     this.init = function(gameType) {
//       if (gameType === 1) {
//         //trigger something here
//       } else if (gameType === 2) {
//         //trigger 2 player game here
//       }
//       console.log(this);
//       //start with player 1 (sith) ready
//       // $(badImg).removeClass('alternateHideImg');
//       // $(goodImg).addClass('alternateHideImg');
//       //initialize game board
//       this.player2.push(Model.array_list[3][3].addClass('white-disc'));
//       this.player1.push(Model.array_list[3][4].addClass('black-disc'));
//       this.player1.push(Model.array_list[4][3].addClass('black-disc'));
//       this.player2.push(Model.array_list[4][4].addClass('white-disc'));
//       this.turn = this.player_list[0];
//       this.legalMoves(0);
//       this.displayDiscs();
//       this.symbolAppear();
//       View.handlePostModelInit(self);
//     };

//     this.legalMoves = function(index) {
//       var colNum;
//       var rowNum;
//       for (var i = 0; i < this.legal_moves_array.length; i++) {
//         this.legal_moves_array[i].removeClass('allowedSpot'); //removes class-illegal moves cant be used
//       }
//       this.legal_moves_array = [];
//       //for player 1 - black moves
//       if (index === 0) {
//         for (i = 0; i < this.player2.length; i++) {
//           colNum = Model.col_list.indexOf(this.player2[i].attr('col'));
//           rowNum = parseInt(this.player2[i].attr('row'));
//           for (var j = -1; j < 2; j++) {
//             // for rows
//             for (var k = -1; k < 2; k++) {
//               //for columns
//               if (
//                 rowNum + j < 0 ||
//                 rowNum + j > 7 ||
//                 colNum + k < 0 ||
//                 colNum + k > 7
//               ) {
//                 continue;
//               }
//               var selectDiv = Model.array_list[rowNum + j][colNum + k];
//               if (
//                 selectDiv.hasClass('white-disc') ||
//                 selectDiv.hasClass('black-disc')
//               ) {
//                 continue;
//               } else {
//                 for (var b = 0; b < this.player1.length; b++) {
//                   this.searchSpots(selectDiv, 'white-disc', 'black-disc');
//                 }
//               }
//             }
//           }
//         }
//       } else {
//         //for player 2 - white moves
//         for (var i = 0; i < this.player1.length; i++) {
//           colNum = Model.col_list.indexOf(this.player1[i].attr('col'));
//           rowNum = parseInt(this.player1[i].attr('row'));
//           for (var j = -1; j < 2; j++) {
//             // for rows
//             for (var k = -1; k < 2; k++) {
//               //for columns
//               if (
//                 rowNum + j < 0 ||
//                 rowNum + j > 7 ||
//                 colNum + k < 0 ||
//                 colNum + k > 7
//               ) {
//                 continue;
//               }
//               var selectDiv = Model.array_list[rowNum + j][colNum + k];
//               if (
//                 selectDiv.hasClass('white-disc') ||
//                 selectDiv.hasClass('black-disc')
//               ) {
//                 continue;
//               } else {
//                 this.searchSpots(selectDiv, 'black-disc', 'white-disc');
//               }
//             }
//           }
//         }
//       }
//       for (var i = 0; i < self.legal_moves_array.length; i++) {
//         self.legal_moves_array[i].addClass('allowedSpot');
//       }
//       if (
//         self.legal_moves_array.length === 0 &&
//         self.player1.length + self.player2.length < 64
//       ) {
//         if (self.turn === self.player_list[1]) {
//           self.turn = self.player_list[0];
//           self.legalMoves(0);
//         } else {
//           self.turn = self.player_list[1];
//           self.legalMoves(1);
//         }
//       }
//     };

//     this.searchSpots = function(selectDiv, disc_color, this_color) {
//       var r = parseInt(selectDiv.attr('row'));
//       var c = Model.col_list.indexOf(selectDiv.attr('col'));
//       var diag = [
//         [0, 1],
//         [0, -1],
//         [-1, 0],
//         [1, 0],
//         [-1, -1],
//         [1, -1],
//         [-1, 1],
//         [1, 1]
//       ];
//       var temp_diag_directions = [
//         [0, 1],
//         [0, -1],
//         [-1, 0],
//         [1, 0],
//         [-1, -1],
//         [1, -1],
//         [-1, 1],
//         [1, 1]
//       ];
//       for (var i = 0; i < diag.length; i++) {
//         var var1 = diag[i][0];
//         var var2 = diag[i][1];
//         var var3 = diag[i][1] + r;
//         var var4 = diag[i][0] + c;
//         if (var3 >= 0 && var3 < 8 && var4 >= 0 && var4 < 8) {
//           var check = Model.array_list[diag[i][1] + r][diag[i][0] + c];
//           if (typeof check !== undefined && check.hasClass(disc_color)) {
//             temp_diag_directions = [
//               [0, 1],
//               [0, -1],
//               [-1, 0],
//               [1, 0],
//               [-1, -1],
//               [1, -1],
//               [-1, 1],
//               [1, 1]
//             ];
//             //found adjacent opposite color
//             while (check.hasClass(disc_color)) {
//               temp_diag_directions[i][0] += var1;
//               temp_diag_directions[i][1] += var2;
//               var tempr = r + temp_diag_directions[i][1];
//               var tempc = c + temp_diag_directions[i][0];
//               if (tempr < 0 || tempr > 7 || tempc < 0 || tempc > 7) {
//                 break;
//               }
//               check =
//                 Model.array_list[r + temp_diag_directions[i][1]][
//                   c + temp_diag_directions[i][0]
//                 ];
//               if (check.hasClass(this_color)) {
//                 this.legal_moves_array.push(selectDiv);
//                 break;
//               }
//             }
//           }
//         }
//       }
//     };

//     //control?
//     this.clickHandler = function() {
//       var bool = false;
//       var x = $(this).attr('col');
//       var y = parseInt($(this).attr('row'));
//       var indexofcol = Model.col_list.indexOf(x);
//       for (var i = 0; i < self.legal_moves_array.length; i++) {
//         if (
//           self.legal_moves_array[i].attr('row') == y &&
//           self.legal_moves_array[i].attr('col') == x
//         ) {
//           bool = true;
//         }
//       }
//       if (bool) {
//         if (self.turn == self.player_list[0]) {
//           // player 1's turn
//           $(this).addClass('black-disc');
//           self.player1.push($(this));
//           self.flip($(this), 'black-disc', 'white-disc', indexofcol, y);
//           self.turn = self.player_list[1];
//           self.legalMoves(1);
//         } else {
//           $(this).addClass('white-disc');
//           self.flip($(this), 'white-disc', 'black-disc', indexofcol, y);
//           self.player2.push($(this));
//           self.turn = self.player_list[0];
//           self.legalMoves(0);
//         }
//         $(this).off('click');
//       }
//       self.symbolAppear();
//       self.displayDiscs();
//       if (self.player1.length + self.player2.length === 64) {
//         self.gameOver();
//       }
//     };

//     this.flip = function(inputDiv, color, color_to_replace, x, y) {
//       //flip function
//       var directions = [
//         [-1, -1],
//         [0, -1],
//         [1, -1],
//         [-1, 0],
//         [1, 0],
//         [-1, 1],
//         [0, 1],
//         [1, 1]
//       ];
//       var temp_directions = [
//         [-1, -1],
//         [0, -1],
//         [1, -1],
//         [-1, 0],
//         [1, 0],
//         [-1, 1],
//         [0, 1],
//         [1, 1]
//       ];
//       var arrayOfFlips = [];
//       for (var j = 0; j < directions.length; j++) {
//         var path = [];
//         var d0 = directions[j][0];
//         var d1 = directions[j][1];
//         var temp_y = y + d1;
//         var temp_x = x + d0;
//         if (temp_y >= 0 && temp_y < 8 && temp_x >= 0 && temp_x < 8) {
//           var divTracker = Model.array_list[temp_y][temp_x];
//           if (divTracker.hasClass(color_to_replace)) {
//             temp_directions = [
//               [-1, -1],
//               [0, -1],
//               [1, -1],
//               [-1, 0],
//               [1, 0],
//               [-1, 1],
//               [0, 1],
//               [1, 1]
//             ];
//             while (divTracker.hasClass(color_to_replace)) {
//               path.push(divTracker);
//               temp_directions[j][0] += d0;
//               temp_directions[j][1] += d1;
//               if (
//                 y + temp_directions[j][1] < 0 ||
//                 y + temp_directions[j][1] > 7 ||
//                 x + temp_directions[j][0] < 0 ||
//                 x + temp_directions[j][0] > 7
//               ) {
//                 break;
//               }
//               divTracker =
//                 Model.array_list[y + temp_directions[j][1]][
//                   x + temp_directions[j][0]
//                 ];
//               if (divTracker.hasClass(color)) {
//                 arrayOfFlips = arrayOfFlips.concat(path);
//                 break;
//               }
//             }
//           }
//         }
//       }
//       for (var i = 0; i < arrayOfFlips.length; i++) {
//         if (color === 'black-disc') {
//           var indexToRemove = this.player2.indexOf(arrayOfFlips[i]);
//           this.player2.splice(indexToRemove, 1);
//           this.player1.push(arrayOfFlips[i]);
//         } else {
//           var indexToRemove = this.player1.indexOf(arrayOfFlips[i]);
//           this.player1.splice(indexToRemove, 1);
//           this.player2.push(arrayOfFlips[i]);
//         }
//         arrayOfFlips[i].removeClass('white-disc black-disc');
//         arrayOfFlips[i].addClass(color);
//       }
//     };

//     //view
//     this.symbolAppear = function() {
//       //image appears under player function
//       var jediImg = $('#player-imageTwo');
//       var sithImg = $('#player-imageOne');
//       var statsOne = $('#stats_container1');
//       var statsTwo = $('#stats_container2');
//       if (self.turn == self.player_list[1]) {
//         $(goodImg).removeClass('alternateHideImg');
//         $(sithImg).css('opacity', '0.7');
//         $(statsTwo).css('opacity', '0.5');
//         //sith step down
//         $(badImg).addClass('alternateHideImg');
//         $(jediImg).css('opacity', '1');
//         $(statsOne).css('opacity', '1');
//         //jedi's turn
//       } else if (self.turn == self.player_list[0]) {
//         $(badImg).removeClass('alternateHideImg');
//         $(jediImg).css('opacity', '0.7');
//         $(statsOne).css('opacity', '0.5');
//         //jedi step down
//         $(goodImg).addClass('alternateHideImg');
//         $(sithImg).css('opacity', '1');
//         $(statsTwo).css('opacity', '1');
//         //sith's turn
//       }
//     };

//     this.gameOver = function() {
//       if (this.player1.length > this.player2.length) {
//         this.turn = self.player_list[0];
//         this.symbolAppear();
//         $('#myModal').show();
//       } else {
//         this.turn = self.player_list[1];
//         this.symbolAppear();
//         $('#myModal2').show();
//       }
//       this.resetAll();
//     };

//     //view
//     this.displayDiscs = function() {
//       $('.player1-value').html(this.player1.length);
//       $('.player2-value').html(this.player2.length);
//     };

//     this.resetAll = function() {
//       self.turn = null;
//       for (var i = 0; i < 8; i++) {
//         for (var j = 0; j < 8; j++) {
//           Model.array_list[i][j].removeClass(
//             'white-disc black-disc allowedSpot'
//           );
//         }
//       }
//       self.player1 = [];
//       self.player2 = [];
//       self.legal_moves_array = [];
//       self.init();
//     };
//   }
// };