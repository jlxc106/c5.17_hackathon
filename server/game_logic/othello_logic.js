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


var copyBoard = (board) => {
  var newBoard = [];
  for(var i=0; i<board.length; i++){
      var row = board[i].slice();
      newBoard.push(row);
  }
  return newBoard;
}

var flip = (boardState, coordinates, userPiece, opponentPiece) => {
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
  for (var j = 0; j < directions.length; j++) {
    var direction = directions[j];
    var path = [];
    var dRow = direction[0];
    var dColumn = direction[1];
    var tempRow = row + dRow;
    var tempColumn = column + dColumn;
    if (isCoordinateInBound(tempRow, tempColumn)) {
      var tracker = boardState[tempRow][tempColumn];
      if (tracker === opponentPiece) {
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
        while (tracker === opponentPiece) {
          var t_dRow = temp_directions[j][0];
          var t_dColumn = temp_directions[j][1];
          path.push([row + t_dRow, column + t_dColumn]);
          if (!isCoordinateInBound(column + t_dColumn, row + t_dRow)) {
            break;
          }
          tracker = boardState[row + t_dRow][column + t_dColumn];
          if (tracker === userPiece) {
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
  directions.forEach((direction, direction_index) => {
    var direction_row = direction[0];
    var direction_col = direction[1];
    var check_row = row + direction_row;
    var check_col = col + direction_col;
    if (isCoordinateInBound(check_row, check_col)) {
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
          if (!isCoordinateInBound(temp_r, temp_c)) {
            break;
          }
          checkCell = boardState[temp_r][temp_c];
          if (checkCell === userPiece) {
            allowedMovesArray.push({ row: row, col: col });
            return;
          }
          temp_directions[direction_index][0] += direction_row;
          temp_directions[direction_index][1] += direction_col;
        }
      }
    }
  });
};

module.exports = { flip, updateAllowedMoves, copyBoard };
