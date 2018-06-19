// var memwatch = require('memwatch-next');
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

var isCoordinateInBound = (row, column) => {
  if (row < 0 || row > 7 || column < 0 || column > 7) {
    return false;
  }
  return true;
};

var coordinateIsInArray = (row, column, allowedMovesArray) => {
  var isDuplicate = allowedMovesArray.some(allowedMove => {
    return parseInt(allowedMove.row) === row && parseInt(allowedMove.col) === column;
  });
  return isDuplicate;
};

var flip = (boardState, coordinates, userPiece, opponentPiece) => {
  // console.log('28 inside flip');
  var row = parseInt(coordinates['row']);
  var column = parseInt(coordinates['col']);
  var arrayOfFlips = [];
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
  // console.log('-----------------------------------------------------42',directions);
  for (var j = 0; j < directions.length; j++) {
    var direction = directions[j];
    var path = [];
    var dRow = direction[0];
    var dColumn = direction[1];
    var tempRow = row + dRow;
    var tempColumn = column + dColumn;
    if (isCoordinateInBound(tempRow, tempColumn)) {
      // console.log('50 tempRow: ', tempRow, " tempColumn: ", tempColumn);
      var tracker = boardState[tempRow][tempColumn];
      if (tracker === opponentPiece) {
        // console.log(53)
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
        // temp_directions = directions.slice();
        while (tracker === opponentPiece) {
          // console.log(55);
          // console.log(`row: ${row}, column: ${column}`);
          // console.log(`userPiece: ${userPiece}, opponentPiece: ${opponentPiece}, tracker: ${tracker}`);
          // console.log(`dRow: ${dRow}, dColumn: ${dColumn}`);
          // console.log(`t_dRow: ${t_dRow}, t_dColumn: ${t_dColumn}`);
          var t_dRow = temp_directions[j][0];
          var t_dColumn = temp_directions[j][1];
          path.push([row + t_dRow, column + t_dColumn]);
          if (!isCoordinateInBound(column + t_dColumn, row + t_dRow)) {
            break;
          }
          tracker = boardState[row + t_dRow][column + t_dColumn];
          if (tracker === userPiece) {
            // console.log('adding to flips: ', path)
            arrayOfFlips = arrayOfFlips.concat(path);
            break;
          }
          temp_directions[j][0] = temp_directions[j][0] + dRow;
          temp_directions[j][1] = temp_directions[j][1] + dColumn;
        }
      }
    }
  }
  return arrayOfFlips;
};

var updateAllowedMoves = (boardState, userPiece, opponentPiece) => {
  var allowedMovesArray = [];
  var opponentPiecesArray = [];
  boardState.forEach((row, rowIndex) => {
    for (var column in row) {
      if (row[column] === opponentPiece) {
        opponentPiecesArray.push({ row: rowIndex, col: parseInt(column) });
      }
    }
  });
  // console.log(91, opponentPiecesArray);
  opponentPiecesArray.forEach(piece => {
    for (var d_row = -1; d_row < 2; d_row++) {
      for (var d_col = -1; d_col < 2; d_col++) {
        var temp_row = parseInt(piece.row) + d_row;
        var temp_col = parseInt(piece.col) + d_col;
        if (!isCoordinateInBound(temp_row, temp_col)) {
          continue;
        }
        if (boardState[temp_row][temp_col] !== '0') {
          continue;
        }
        if (coordinateIsInArray(temp_row, temp_col, allowedMovesArray)) {
          continue;
        }
        // console.log(`checksurrounding temp_row: ${temp_row}, temp_col: ${temp_col}`)
        checkSurrounding(
          boardState,
          userPiece,
          opponentPiece,
          temp_row,
          temp_col,
          allowedMovesArray
        );
      }
    }
  });
  // console.log('inside updateAllowedMoves');
  // const used = process.memoryUsage();
  //   for (let key in used) {
  //   console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  //   }
    return allowedMovesArray;
};

var checkSurrounding = (boardState, userPiece, opponentPiece, row, col, allowedMovesArray) => {
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
  // console.log('inside checksurrounding', directions);
  directions.forEach((direction, direction_index) => {
    // console.log('for each loop # ',direction_index)
    var direction_row = direction[0];
    var direction_col = direction[1];
    var check_row = row + direction_row;
    var check_col = col + direction_col;
    // if(row == 2 && col == 4){
    //   if(direction_index == 4){
    //     console.log('--------------------------whyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`````````````````````````````````````````----------')
    //     console.log(direction_row);
    //     console.log(direction_col);
    //     console.log(row);
    //     console.log(col);
    //   }
    // }
    if (isCoordinateInBound(check_row, check_col)) {
      // console.log(`${check_row}, ${check_col} is in bound`);
      var checkCell = boardState[check_row][check_col];
      if (checkCell && checkCell === opponentPiece) {
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
        while (checkCell === opponentPiece) {
          var temp_r = row + temp_directions[direction_index][0];
          var temp_c = col + temp_directions[direction_index][1];
          // console.log(159);
          // console.log(`row: ${row}, col: ${col}`);
          // console.log(`userPiece: ${userPiece}, opponentPiece: ${opponentPiece}, checkCell: ${checkCell}`);
          // console.log(`temp_r: ${temp_r}, temp_c: ${temp_c}`); 
          if (!isCoordinateInBound(temp_r, temp_c)) {
            // console.log(164);
            break;
          }
          checkCell = boardState[temp_r][temp_c];
          if (checkCell === userPiece) {
            // console.log('---------------------approved-----------------')
            allowedMovesArray.push({ row: row, col: col });
            return;
            // break;
          }
          temp_directions[direction_index][0] += direction_row;
          temp_directions[direction_index][1] += direction_col;
        }
      }
    }
  });
};

// memwatch.on('leak', function(info){
//   console.log('-------------leak info--------');
//   console.log(info);
//   console.log('--------------------------------------')
// })


// memwatch.on('stats', function(stats){
//   console.log('-------------leak info--------');
//   console.log(stats);
//   console.log('--------------------------------------')
// })



module.exports = { flip, updateAllowedMoves };
