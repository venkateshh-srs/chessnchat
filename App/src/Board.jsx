import styles from "./Board.module.css";
import Choose from "./Choose";
import Piece from "./Piece";
import Chat from "./Chat";
import { useState, useEffect, useRef } from "react";
import moveSound from "../public/assets/move.mp3";
import checkSound from "../public/assets/check.mp3";
import captureSound from "../public/assets/capture.mp3";
import io from "socket.io-client";
let socket = io("http://localhost:3001");
let name = "*";
let userID;
const storedName = sessionStorage.getItem("userName");
if (storedName === null) {
  userID = crypto.randomUUID();
  name = prompt("Enter your name");
  sessionStorage.setItem("userName", name);
  sessionStorage.setItem("userID", userID);
  let userDetails = { userID, userName: name, isUserTyping: false };
  socket.emit("userJoined", userDetails);
} else {
  socket.emit("checkReload", {
    type: sessionStorage.getItem("isUserTakenWhiteOrBlack"),
    userName: sessionStorage.getItem("userName"),
    userID: sessionStorage.getItem("userID"),
  });
}

// sessionStorage.setItem("isUserTakenBlackOrWhite",false);
let userName = sessionStorage.getItem("userName");
let f = 0;
let boardState = [
  ["r_b", "n_b", "b_b", "q_b", "k_b", "b_b", "n_b", "r_b"],
  ["p_b", "p_b", "p_b", "p_b", "p_b", "p_b", "p_b", "p_b"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["p_w", "p_w", "p_w", "p_w", "p_w", "p_w", "p_w", "p_w"],
  ["r_w", "n_w", "b_w", "q_w", "k_w", "b_w", "n_w", "r_w"],
];

function EmptyBoard() {
  let source = { i: null, j: null, type: null };
  const boardElement = useRef();
  const [board, setBoard] = useState(boardState);

  const handleResize = () => {
    // console.log(window.innerWidth);
    setBoundingRect(boardElement.current.getBoundingClientRect());
  };
  const handleScroll = () => {
    // console.log("scrolling");
    setBoundingRect(boardElement.current.getBoundingClientRect());
  };
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    // return () => {
    //   window.removeEventListener("resize", handleResize);
    //   window.removeEventListener("scroll", handleScroll);
    // };
  }, []);

  let [canClickWhiteButton, setcanClickWhiteButton] = useState(true);
  let [canClickBlackButton, setcanClickBlackButton] = useState(true);
  let [blackUserName, setBlackUserName] = useState(null);
  let [whiteUserName, setWhiteUserName] = useState(null);
  let [rotateBoardto, setRotateBoardTo] = useState("w");
  let [canWhiteMakeAMove, setcanWhiteMakeAMove] = useState(true);
  let [canBlackMakeAMove, setcanBlackMakeAMove] = useState(false);
  let [validMoves, setValidMoves] = useState(new Set());
  let [isChecked, setIsCheck] = useState({ i: null, j: null });
  let [isCheckMatte, setIsCheckMate] = useState(null);
  let [resetBoard, setResetBoard] = useState(false);
  const [boundingRect, setBoundingRect] = useState(null);

  let [highlightLastMove, setHighlightMove] = useState({
    i: null,
    j: null,
    si: null,
    sj: null,
  });
  useEffect(() => {
    sessionStorage.setItem("boardState", JSON.stringify(board));
    setBoundingRect(boardElement.current.getBoundingClientRect());
  }, [board]);

  //Listener Events
  //Listens when someone clickedwhite or black or changed the boardstate
  socket.on("message", (data) => {
    // console.log(data);
    setBoard(JSON.parse(data.board));
    setcanClickBlackButton(data.canClickBlackButton);
    setcanClickWhiteButton(data.canClickWhiteButton);
    setBlackUserName(data.blackUserName);
    setWhiteUserName(data.whiteUserName);
  });
  socket.on("canMakeAMove", (data) => {
    // console.log(data);
    setcanWhiteMakeAMove(data.white);
    setcanBlackMakeAMove(data.black);
  });

  socket.on("highlightMove", (data) => {
    setHighlightMove(data);
  });
  socket.on("onCheck", (data) => {
    setIsCheck(data);
  });
  socket.on("checkMate", () => {
    // console.log("Mate");
    setIsCheckMate("CHECK MATE");
    setResetBoard(true);
  });
  socket.on("resetVisible", (data) => {
    if (data) {
      setIsCheckMate("CHECK MATE");
      setResetBoard(true);
    } else {
      setIsCheckMate("");
      setResetBoard(false);
    }
  });

  socket.on("resetBoard", () => {
    sessionStorage.removeItem("isUserTakenBlackOrWhite");
    sessionStorage.removeItem("isUserTakenWhiteOrBlack");
    setResetBoard(false);
  });

  //Emitter events
  //BroadCast when  someone clickedwhite or black or changed the boardstate
  if (f === 1) {
    let data = {
      board: JSON.stringify(board),
      canClickBlackButton,
      canClickWhiteButton,
      blackUserName,
      whiteUserName,
    };
    socket.emit("message", data);
    f = 0;
  }
  //user  choosen to play white
  const handleWhiteClickButton = () => {
    if (sessionStorage.getItem("isUserTakenBlackOrWhite")) return;
    // if(sessionStorage.getItem("isUserTakenBlackOrWhite"))return;
    let data = {
      board: JSON.stringify(board),
      canClickBlackButton,
      canClickWhiteButton,
      blackUserName,
      whiteUserName: userName,
    };
    sessionStorage.setItem("isUserTakenBlackOrWhite", true);
    sessionStorage.setItem("isUserTakenWhiteOrBlack", "w");
    socket.emit("whiteClick", data);
    setRotateBoardTo("w");
  };
  //user  choosen to play black
  const handleBlackClickButton = () => {
    socket.data = { color: "black" };
    // console.log(socket.data);
    if (sessionStorage.getItem("isUserTakenBlackOrWhite")) return;
    // if(sessionStorage.getItem("isUserTakenBlackOrWhite"))return;
    let data = {
      board: JSON.stringify(board),
      canClickBlackButton,
      canClickWhiteButton,
      blackUserName: userName,
      whiteUserName,
    };
    sessionStorage.setItem("isUserTakenBlackOrWhite", true);
    sessionStorage.setItem("isUserTakenWhiteOrBlack", "b");
    socket.emit("blackClick", data);
    setRotateBoardTo("b");
  };

  //Handle reloads

  socket.on("whiteReloaded", () => {
    setcanClickWhiteButton(false);
  });
  socket.on("blackReloaded", () => {
    setcanClickBlackButton(false);
  });

  //Board rotate
  const handleRotateClick = () => {
    let currView = rotateBoardto;
    currView = currView === "b" ? "w" : "b";
    setRotateBoardTo(currView);
  };
  const validMovesForKnight = (si, sj, color) => {
    let validCells = new Set();
    const knightMoves = [
      [1, 2],
      [2, 1],
      [2, -1],
      [1, -2],
      [-1, -2],
      [-2, -1],
      [-2, 1],
      [-1, 2],
    ];

    // Iterate over each knight move offset
    for (let move of knightMoves) {
      let di = move[0];
      let dj = move[1];

      let newRow = si + di;
      let newCol = sj + dj;

      // Check if the new position is within the board bounds
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        let target = board[newRow][newCol];
        if (target === "" || target.charAt(2) !== color) {
          validCells.add(`${newRow}-${newCol}`);
        }
      }
    }
    return validCells;
  };
  const validMovesForRook = (si, sj, color) => {
    let validCells = new Set();
    for (let row = si - 1; row >= 0; row--) {
      let target = board[row][sj];
      if (target === "") {
        validCells.add(`${row}-${sj}`);
      } else if (target.charAt(2) !== color) {
        validCells.add(`${row}-${sj}`);
        break;
      } else {
        break;
      }
    }

    // Check for valid moves in the downward direction
    for (let row = si + 1; row < 8; row++) {
      let target = board[row][sj];
      if (target === "") {
        validCells.add(`${row}-${sj}`);
      } else if (target.charAt(2) !== color) {
        validCells.add(`${row}-${sj}`);
        break;
      } else {
        break;
      }
    }

    // Check for valid moves in the left direction
    for (let col = sj - 1; col >= 0; col--) {
      let target = board[si][col];
      if (target === "") {
        validCells.add(`${si}-${col}`);
      } else if (target.charAt(2) !== color) {
        validCells.add(`${si}-${col}`);
        break;
      } else {
        break;
      }
    }

    // Check for valid moves in the right direction
    for (let col = sj + 1; col < 8; col++) {
      let target = board[si][col];
      if (target === "") {
        validCells.add(`${si}-${col}`);
      } else if (target.charAt(2) !== color) {
        validCells.add(`${si}-${col}`);
        break;
      } else {
        break;
      }
    }
    return validCells;
  };
  const validMovesForBishop = (si, sj, color) => {
    let validCells = new Set();
    let row = si - 1;
    let col = sj - 1;
    while (row >= 0 && col >= 0) {
      let target = board[row][col];
      if (target === "") {
        validCells.add(`${row}-${col}`);
      } else if (target.charAt(2) !== color) {
        validCells.add(`${row}-${col}`);
        break;
      } else {
        break;
      }
      row--;
      col--;
    }

    // Check for valid moves in the upward-right direction
    row = si - 1;
    col = sj + 1;
    while (row >= 0 && col < 8) {
      let target = board[row][col];
      if (target === "") {
        validCells.add(`${row}-${col}`);
      } else if (target.charAt(2) !== color) {
        validCells.add(`${row}-${col}`);
        break;
      } else {
        break;
      }
      row--;
      col++;
    }

    // Check for valid moves in the downward-left direction
    row = si + 1;
    col = sj - 1;
    while (row < 8 && col >= 0) {
      let target = board[row][col];
      if (target === "") {
        validCells.add(`${row}-${col}`);
      } else if (target.charAt(2) !== color) {
        validCells.add(`${row}-${col}`);
        break;
      } else {
        break;
      }
      row++;
      col--;
    }

    // Check for valid moves in the downward-right direction
    row = si + 1;
    col = sj + 1;
    while (row < 8 && col < 8) {
      let target = board[row][col];
      if (target === "") {
        validCells.add(`${row}-${col}`);
      } else if (target.charAt(2) !== color) {
        validCells.add(`${row}-${col}`);
        break;
      } else {
        break;
      }
      row++;
      col++;
    }
    return validCells;
  };
  const validMovesForPawn = (si, sj, color) => {
    let validCells = new Set();
    if (color === "w") {
      if (
        si - 1 >= 0 &&
        sj - 1 >= 0 &&
        board[si - 1][sj - 1] !== "" &&
        board[si - 1][sj - 1].charAt(2) === "b"
      ) {
        validCells.add(`${si - 1}-${sj - 1}`);
      }
      if (
        si - 1 >= 0 &&
        sj + 1 < 8 &&
        board[si - 1][sj + 1] !== "" &&
        board[si - 1][sj + 1].charAt(2) === "b"
      ) {
        validCells.add(`${si - 1}-${sj + 1}`);
      }
      if (si === 6) {
        if (board[si - 1][sj] === "") validCells.add(`${si - 1}-${sj}`);
        if (board[si - 2][sj] === "") validCells.add(`${si - 2}-${sj}`);
      } else {
        if (si - 1 >= 0 && board[si - 1][sj] === "")
          validCells.add(`${si - 1}-${sj}`);
      }
    }
    //else
    if (color === "b") {
      if (
        si + 1 < 8 &&
        sj - 1 >= 0 &&
        board[si + 1][sj - 1] !== "" &&
        board[si + 1][sj - 1].charAt(2) === "w"
      ) {
        validCells.add(`${si + 1}-${sj - 1}`);
      }
      if (
        si + 1 < 8 &&
        sj + 1 < 8 &&
        board[si + 1][sj + 1] !== "" &&
        board[si + 1][sj + 1].charAt(2) === "w"
      ) {
        validCells.add(`${si + 1}-${sj + 1}`);
      }
      if (si === 1) {
        if (board[si + 1][sj] === "") validCells.add(`${si + 1}-${sj}`);
        if (board[si + 2][sj] === "") validCells.add(`${si + 2}-${sj}`);
      } else {
        if (si + 1 < 8 && board[si + 1][sj] === "")
          validCells.add(`${si + 1}-${sj}`);
      }
    }
    return validCells;
  };
  const validMovesForKing = (si, sj, color) => {
    let validCells = new Set();
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        let row = si + i,
          col = sj + j;
        if (row >= 0 && col >= 0 && row < 8 && col < 8) {
          let target = board[row][col];
          if (target === "") validCells.add(`${row}-${col}`);
          else if (target.charAt(2) !== color) validCells.add(`${row}-${col}`);
        }
      }
    }
    return validCells;
  };
  const giveFilteredArrayLength = (validMove, si, sj, color) => {
    let filteredArray = [...validMove].filter((ele) => {
      let i = ele.charAt(0) - "0";
      let j = ele.charAt(2) - "0";
      let temp = board.map((row) => [...row]);
      temp[i][j] = temp[si][sj];
      temp[si][sj] = "";
      return !isCheck(color, temp);
    });
    // console.log(filteredArray);
    return filteredArray.length;
  };

  const isCheckMate = (opponent) => {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] !== "" && board[i][j].charAt(2) === opponent) {
          let si = i,
            sj = j,
            name = board[i][j].charAt(0),
            color = opponent;

          if (name === "p") {
            if (
              giveFilteredArrayLength(
                validMovesForPawn(si, sj, color),
                si,
                sj,
                color
              )
            )
              return false;
          }
          if (name === "n") {
            if (
              giveFilteredArrayLength(
                validMovesForKnight(si, sj, color),
                si,
                sj,
                color
              )
            )
              return false;
          }
          if (name === "r") {
            if (
              giveFilteredArrayLength(
                validMovesForRook(si, sj, color),
                si,
                sj,
                color
              )
            )
              return false;
          }
          if (name === "b") {
            if (
              giveFilteredArrayLength(
                validMovesForBishop(si, sj, color),
                si,
                sj,
                color
              )
            )
              return false;
          }
          if (name === "q") {
            let validCellsForRook = validMovesForRook(si, sj, color);
            let validCellsForBishop = validMovesForBishop(si, sj, color);
            validCellsForBishop.forEach((ele) => {
              validCellsForRook.add(ele);
            });
            if (
              giveFilteredArrayLength(
                validMovesForRook(si, sj, color),
                si,
                sj,
                color
              )
            )
              return false;
          }
          if (name === "k")
            if (
              giveFilteredArrayLength(
                validMovesForKing(si, sj, color),
                si,
                sj,
                color
              )
            )
              return false;
        }
      }
    }
    return true;
  };
  const isCheck = (currentPlayer, board) => {
    const opponent = currentPlayer === "w" ? "b" : "w";
    const king = currentPlayer === "w" ? "k_w" : "k_b";
    let kingPosition;

    // Find the position of the current player's king
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] === king) {
          kingPosition = { i, j };
          break;
        }
      }
    }
    // if (!kingPosition) return true;

    // Check if the opponent's knight can attack the king
    const knightMoves = [
      { row: -2, col: -1 },
      { row: -2, col: 1 },
      { row: -1, col: -2 },
      { row: -1, col: 2 },
      { row: 1, col: -2 },
      { row: 1, col: 2 },
      { row: 2, col: -1 },
      { row: 2, col: 1 },
    ];

    for (const move of knightMoves) {
      const { row, col } = move;
      const newRow = kingPosition.i + row;
      const newCol = kingPosition.j + col;

      if (
        newRow >= 0 &&
        newRow < 8 &&
        newCol >= 0 &&
        newCol < 8 &&
        board[newRow][newCol].charAt(0) === "n" &&
        board[newRow][newCol].charAt(2) === opponent
      ) {
        // socket.emit("onCheck",{ i: kingPosition.i, j: kingPosition.j });
        // setIsCheck({ i: kingPosition.i, j: kingPosition.j });
        return true; // Check detected
      }
    }

    // Check if the opponent's pawn can attack the king
    const pawnMoves = [
      { row: -1, col: -1 },
      { row: -1, col: 1 },
    ];

    const pawnDir = opponent === "b" ? 1 : -1;

    for (const move of pawnMoves) {
      const { row, col } = move;
      const newRow = kingPosition.i + pawnDir * row;
      const newCol = kingPosition.j + col;
      if (
        newRow >= 0 &&
        newRow < 8 &&
        newCol >= 0 &&
        newCol < 8 &&
        board[newRow][newCol].charAt(0) === "p" &&
        board[newRow][newCol].charAt(2) === opponent
      ) {
        // setIsCheck({ i: kingPosition.i, j: kingPosition.j });
        // socket.emit("onCheck",{ i: kingPosition.i, j: kingPosition.j });

        return true; // Check detected
      }
    }

    // Check if the opponent's rook or queen can attack the king in vertical and horizontal directions
    const rookMoves = [
      { row: -1, col: 0 }, // top
      { row: 0, col: -1 }, // left
      { row: 0, col: 1 }, // right
      { row: 1, col: 0 }, // bottom
    ];

    const rookOrQueenMoves = [...rookMoves];

    for (const move of rookOrQueenMoves) {
      const { row, col } = move;
      let newRow = kingPosition.i + row;
      let newCol = kingPosition.j + col;

      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        if (
          board[newRow][newCol].charAt(0) === "r" ||
          board[newRow][newCol].charAt(0) === "q"
        ) {
          if (board[newRow][newCol].charAt(2) === opponent) {
            // setIsCheck({ i: kingPosition.i, j: kingPosition.j });
            // socket.emit("onCheck",{ i: kingPosition.i, j: kingPosition.j });

            return true; // Check detected
          } else {
            break; // Blocking piece found, no check in this direction
          }
        } else if (board[newRow][newCol] !== "") {
          break; // Piece other than rook or queen found, no check in this direction
        }

        newRow += row;
        newCol += col;
      }
    }

    // Check if the opponent's bishop or queen can attack the king in diagonal directions
    const bishopMoves = [
      { row: -1, col: -1 }, // top left
      { row: -1, col: 1 }, // top right
      { row: 1, col: -1 }, // bottom left
      { row: 1, col: 1 }, // bottom right
    ];

    const bishopOrQueenMoves = [...bishopMoves];

    for (const move of bishopOrQueenMoves) {
      const { row, col } = move;
      let newRow = kingPosition.i + row;
      let newCol = kingPosition.j + col;

      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        if (
          board[newRow][newCol].charAt(0) === "b" ||
          board[newRow][newCol].charAt(0) === "q"
        ) {
          if (board[newRow][newCol].charAt(2) === opponent) {
            // setIsCheck({ i: kingPosition.i, j: kingPosition.j });
            // socket.emit("onCheck",{ i: kingPosition.i, j: kingPosition.j });

            return true; // Check detected
          } else {
            break; // Blocking piece found, no check in this direction
          }
        } else if (board[newRow][newCol] !== "") {
          break; // Piece other than bishop or queen found, no check in this direction
        }

        newRow += row;
        newCol += col;
      }
    }

    // Check if the opponent's king can attack the king
    const kingMoves = [
      { row: -1, col: -1 }, // top left
      { row: -1, col: 0 }, // top
      { row: -1, col: 1 }, // top right
      { row: 0, col: -1 }, // left
      { row: 0, col: 1 }, // right
      { row: 1, col: -1 }, // bottom left
      { row: 1, col: 0 }, // bottom
      { row: 1, col: 1 }, // bottom right
    ];

    for (const move of kingMoves) {
      const { row, col } = move;
      const newRow = kingPosition.i + row;
      const newCol = kingPosition.j + col;

      if (
        newRow >= 0 &&
        newRow < 8 &&
        newCol >= 0 &&
        newCol < 8 &&
        board[newRow][newCol].charAt(0) === "k" &&
        board[newRow][newCol].charAt(2) === opponent
      ) {
        // setIsCheck({ i: kingPosition.i, j: kingPosition.j });
        // socket.emit("onCheck",{ i: kingPosition.i, j: kingPosition.j });
        return true; // Check detected
      }
    }
    // socket.emit("onCheck",{ i: null, j: null })
    return false; // No check detected
  };

  const giveValidMoves = (source) /*(target i,j)*/ => {
    let si = source.i;
    let sj = source.j;
    let color = source.type.charAt(2);
    let name = source.type.charAt(0);
    //is first move
    if (name === "p") {
      return validMovesForPawn(si, sj, color);
    }
    if (name === "n") {
      return validMovesForKnight(si, sj, color);
    }
    if (name === "r") {
      return validMovesForRook(si, sj, color);
    }
    if (name === "b") {
      return validMovesForBishop(si, sj, color);
    }
    if (name === "q") {
      let validCellsForRook = validMovesForRook(si, sj, color);
      let validCellsForBishop = validMovesForBishop(si, sj, color);
      validCellsForBishop.forEach((ele) => {
        validCellsForRook.add(ele);
      });
      return validCellsForRook;
    }
    if (name === "k") return validMovesForKing(si, sj, color);
  };

  const sourceUpdate = (id, type) => {
    if (type === "") return;
    if (source.i === null) {
      source = id;
      source.type = type;
    }
  };

  const handle = (i, j, type) /** target*/ => {
    if (i === source.i && j === source.j) {
      //If yo make it null it will be alaways null and pieces wont move
      // source = { i: null, j: null };
      return false;
    }

    if (source.i === null) return false;
    if (source.type.charAt(2) === type.charAt(2)) {
      source = { i: i, j: j, type: type };
      return false;
    }
    if (source.i !== null && source.j !== null) {
      if (
        source.type.charAt(2) !==
        sessionStorage.getItem("isUserTakenWhiteOrBlack")
      ) {
        source = { i: i, j: j, type: type };
        return false;
      }
    }
    if (source.type.charAt(2) === "w" && canBlackMakeAMove) {
      source = { i: i, j: j, type: type };

      // source = { i: null, j: null, type: null };
      return false;
    }
    if (source.type.charAt(2) === "b" && canWhiteMakeAMove) {
      source = { i: i, j: j, type: type };

      // source = { i: null, j: null, type: null };
      return false;
    }

    if (source.i !== null && source.j !== null) {
      let validMove = giveValidMoves(
        { i: source.i, j: source.j, type: source.type } /*source*/,
        { i, j, type } /*dest*/
      );
      //out of these valid moves if any move leads to check for the current player delete it from valid move set.
      let checkFor = source.type.charAt(2) === "b" ? "w" : "b";
      let filteredArray = [...validMove].filter((ele) => {
        let i = ele.charAt(0) - "0";
        let j = ele.charAt(2) - "0";
        let temp = board.map((row) => [...row]);
        temp[i][j] = temp[source.i][source.j];
        temp[source.i][source.j] = "";
        return !isCheck(source.type.charAt(2), temp);
      });
      validMove = new Set(filteredArray);

      //if checks in any way highlight them
      if (!validMove.has(`${i}-${j}`)) {
        let king;
        //check if the invalid move is bcoz there is already a check and u r not releaving from it and trying to make another move
        if (isCheck(source.type.charAt(2), board)) {
          if (board[source.i][source.j].charAt(0) === "k") {
            if (
              !validMovesForKing(source.i, source.j, source.type.charAt(2)).has(
                `${i}-${j}`
              )
            )
              return;

            socket.emit("onCheck", { i: i, j: j });
            setTimeout(() => {
              socket.emit("onCheck", { i: null, j: null });
            }, 1500);
            return;
          }
          //if it is because of check then highlight the current player king
          if (source.type.charAt(2) === "b") king = "k_b";
          else king = "k_w";
          for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
              if (board[i][j] === king) {
                socket.emit("onCheck", { i: i, j: j });
                setTimeout(() => {
                  socket.emit("onCheck", { i: null, j: null });
                }, 1500);
                return;
              }
            }
          }
        }
        //check if this invalid move is beacuse of this move it leads to check for the current player
        else {
          let temp = board.map((row) => [...row]);
          temp[i][j] = temp[source.i][source.j];
          temp[source.i][source.j] = "";
          //check if the invalid move is bcoz of check
          if (isCheck(source.type.charAt(2), temp)) {
            //if it is because of check then highlight the current player king
            if (source.type.charAt(2) === "b") king = "k_b";
            else king = "k_w";
            // console.log(board[source.i][source.j]);
            if (board[source.i][source.j].charAt(0) === "k") {
              if (
                !validMovesForKing(
                  source.i,
                  source.j,
                  source.type.charAt(2)
                ).has(`${i}-${j}`)
              )
                return;
              socket.emit("onCheck", { i: i, j: j });
              setTimeout(() => {
                socket.emit("onCheck", { i: null, j: null });
              }, 1500);
              return;
            } else {
              for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                  if (board[i][j] === king) {
                    socket.emit("onCheck", { i: i, j: j });
                    setTimeout(() => {
                      socket.emit("onCheck", { i: null, j: null });
                    }, 1500);
                    return;
                  }
                }
              }
            }
          }
        }

        return;
      }

      // socket.emit("onCheck", { i: null, j: null });

      socket.emit("highlightMove", {
        si: source.i,
        sj: source.j,
        ti: i,
        tj: j,
      });
      // setHighlightMove({ si: source.i, sj: source.j, ti: i, tj: j });
      //else highlight the last move and show it to all users
      // console.log("Hey");

      let flagForSound = 0;
      const newBoard = [...board];
      if (newBoard[i][j] !== "") {
        flagForSound = 1;
        const captureSoundd = new Audio(captureSound);
        captureSoundd.play();
      }
      newBoard[i][j] = newBoard[source.i][source.j];
      newBoard[source.i][source.j] = "";

      //this is a valid move check for opponent if there is a check and if so highlight
      if (isCheck(checkFor, newBoard)) {
        let king;
        if (source.type.charAt(2) === "b") king = "k_w";
        else king = "k_b";
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            if (board[i][j] === king) {
              if (flagForSound === 0) {
                const checkSoundd = new Audio(checkSound);
                checkSoundd.play();
                flagForSound = 1;
              }
              socket.emit("onCheck", { i: i, j: j });
              setTimeout(() => {
                socket.emit("onCheck", { i: null, j: null });
              }, 1500);
            }
          }
        }
      }

      // console.log("new board rendered");
      f = 1;
      // setBoard(newBoard);
      setValidMoves(validMove);
      if (isCheckMate(checkFor)) {
        // setIsCheck({ i: null, j: null });
        // socket.emit("onCheck",{ i: i, j: j });
        if (flagForSound === 0) {
          const checkSoundd = new Audio(checkSound);
          checkSoundd.play();
          flagForSound = 1;
        }
        socket.emit("resetVisible", true);
        socket.emit("checkMate");
      }
      // isCheck(checkFor, board);
      if (flagForSound === 0) {
        const moveSoundd = new Audio(moveSound);
        moveSoundd.play();
      }
      source = { i: null, j: null, type: null };
    }
    socket.emit("canMakeAMove");
  };
  const cellsFromBlackPerspective = [];
  const cellsFromWhitePerspective = [];

  const onDragAndDrop = (info, divRef, col) => {
    //Handle CONFLICT, board reset
    //info.source,info.target
    let si = Number(info.source[0]);
    let sj = Number(info.source[2]);
    let ti = Number(info.target[0]);
    let tj = Number(info.target[2]);

    if (col === "b") {
      si = 7 - si;
      sj = 7 - sj;
      ti = 7 - ti;
      tj = 7 - tj;
    }
    // console.log(divRef.current);
    if (board[si][sj] === "") {
      divRef.current.style.transform = "translate(0, 0)";
      return;
    }
    // console.log(si, sj, ti, tj);
    if (source.i === null) source = { i: si, j: sj, type: board[si][sj] };

    if (!handle(ti, tj, board[ti][tj])) {
      divRef.current.style.transform = "translate(0, 0)";
    }
    source = { i: null, j: null, type: null };
    //set source and target(i,j,type)
    // handle(i,j,type);
  };

  for (let i = 7; i >= 0; i--) {
    for (let j = 7; j >= 0; j--) {
      let piece = (
        <Piece
          type={board[i][j]}
          boundingRect={boundingRect}
          onDragAndDrop={onDragAndDrop}
        />
      );
      let className1 =
        (i + j) % 2 === 0
          ? `${styles["white-cell"]}`
          : `${styles["black-cell"]}`;
      let className2 = board[i][j] !== "" ? `${styles["cell"]}` : null;

      let class3 = validMoves.has(`${i}-${j}`) ? styles["valid"] : null;
      let class4 =
        i === highlightLastMove.ti && j === highlightLastMove.tj
          ? styles["highlightTo"]
          : null;
      let class5 =
        i === highlightLastMove.si && j === highlightLastMove.sj
          ? styles["highlightFrom"]
          : null;
      let class6 =
        isChecked.i === i && isChecked.j === j ? styles["check"] : null;

      cellsFromBlackPerspective.push(
        <div
          key={`${i}-${j}`}
          id={`${i}-${j}`}
          onClick={() => {
            sourceUpdate({ i, j }, board[i][j]);
            handle(i, j, board[i][j]);
          }}
          className={`${className1} ${className2} ${class4} ${class5} ${class6}`}
        >
          {piece}
        </div>
      );
    }
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = (
        <Piece
          type={board[i][j]}
          boundingRect={boundingRect}
          onDragAndDrop={onDragAndDrop}
        />
      );
      const className1 =
        (i + j) % 2 === 0
          ? `${styles["white-cell"]}`
          : `${styles["black-cell"]}`;
      const className2 = board[i][j] !== "" ? `${styles["cell"]}` : null;
      let class3 = validMoves.has(`${i}-${j}`) ? styles["valid"] : null;
      let class4 =
        i === highlightLastMove.ti && j === highlightLastMove.tj
          ? styles["highlightTo"]
          : null;
      let class5 =
        i === highlightLastMove.si && j === highlightLastMove.sj
          ? styles["highlightFrom"]
          : null;
      let class6 =
        isChecked.i === i && isChecked.j === j ? styles["check"] : null;
      cellsFromWhitePerspective.push(
        <div
          key={`${i}-${j}`}
          id={`${i}-${j}`}
          onClick={() => {
            sourceUpdate({ i, j }, board[i][j]);
            handle(i, j, board[i][j]);
          }}
          className={`${className1} ${className2} ${class4} ${class5} ${class6}`}
        >
          {piece}
        </div>
      );
    }
  }
  let balcksView = (
    <>
      <div
        style={{
          fontSize: "20px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {whiteUserName}
      </div>
      <div ref={boardElement} className={styles.board}>
        {cellsFromBlackPerspective}
      </div>
      <div
        style={{
          fontSize: "20px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {blackUserName}
      </div>
    </>
  );

  let whitesView = (
    <>
      <div
        style={{
          fontSize: "20px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {blackUserName}
      </div>
      <div ref={boardElement} className={styles.board}>
        {cellsFromWhitePerspective}
      </div>
      <div
        style={{
          fontSize: "20px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {whiteUserName}
      </div>
    </>
  );
  let Board = () => {
    return (
      <>
        <div
          style={{
            color: "white",
            fontSize: "30px",
            fontFamily: "revert-layer",
            fontWeight: "700",
          }}
        ></div>
        <div
          style={{
            color: "Red",
            fontSize: "30px",
            fontFamily: "monospace",
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          {resetBoard && isCheckMatte}
        </div>
        {!resetBoard && canWhiteMakeAMove && (
          <div style={{ color: "#46eb98" }}>
            White's Turn
            <span>
              {
                <img
                  src="../assets/rotate2.png"
                  alt=""
                  width="20px"
                  onClick={handleRotateClick}
                  className={styles.rotate}
                />
              }
            </span>
          </div>
        )}
        {resetBoard && (
          <>
            <button
              className={`${styles["resetBtn"]}`}
              onClick={() => {
                let data = {
                  board: JSON.stringify(boardState),
                  canClickBlackButton: true,
                  canClickWhiteButton: true,
                  blackUserName: null,
                  whiteUserName: null,
                };

                socket.emit("highlightMove", {
                  i: null,
                  j: null,
                  si: null,
                  sj: null,
                });
                socket.emit("resetBoard");
                socket.emit("message", data);
                //if white makes a mate then after resetting it is showing blacks turn to fix that
                if (!canWhiteMakeAMove) socket.emit("canMakeAMove");
              }}
            >
              Reset board
            </button>
            <span>
              {
                <img
                  src="../assets/rotate2.png"
                  alt=""
                  width="20px"
                  onClick={handleRotateClick}
                  className={styles.rotate}
                />
              }
            </span>
          </>
        )}

        {!resetBoard && canBlackMakeAMove && (
          <div style={{ color: "#46eb98" }}>
            Black's Turn{" "}
            <span>
              {
                <img
                  src="../assets/rotate2.png"
                  alt=""
                  width="20px"
                  onClick={handleRotateClick}
                  className={styles.rotate}
                />
              }
            </span>
          </div>
        )}
        <div style={{ color: "#ec0f6b", fontSize: "20px" }}>
          Username: {userName}
        </div>
        {rotateBoardto === "b" ||
        sessionStorage.getItem("isUserTakenWhiteOrBlack") === "b"
          ? balcksView
          : whitesView}
      </>
    );
  };

  return (
    <>
      <div style={{ border: "0px solid #00d6ff" }}>
        <Choose
          canClickWhiteButton={canClickWhiteButton}
          handleWhiteClickButton={handleWhiteClickButton}
          canClickBlackButton={canClickBlackButton}
          handleBlackClickButton={handleBlackClickButton}
          handleRotateClick={handleRotateClick}
          resetBoard={resetBoard}
        />
        <Board />
      </div>

      <div>
        <Chat socket={socket} userID={sessionStorage.getItem("userID")} />
      </div>
    </>
  );
}

export default EmptyBoard;

//!TODO
//castling
//draw
//stalemate
//promote(pawn to end of board)
//drag and drop in androids
//databse??
