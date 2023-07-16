const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const express = require("express");

const app = express();
const mongoose = require("mongoose");

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database");
  });
const userChatSchema = new mongoose.Schema({
  roomId: String,
  messages: [{ time: String, message: String }],
});
const UserChatModel = mongoose.model("UserChatModel", userChatSchema);

const crypto = require("crypto");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const path = require("path");
const port = 3001;
console.log("Server reloaded");
let link;
app.get("/", (req, res) => {
  link = crypto.randomUUID().substring(0, 8);
  // req.session.generatedLink = link;
  res.status(200).send(`http://localhost:3001/${link}`);
  const test = new UserChatModel({
    roomId: link,
    messages: [{ time: new Date(), message: "HelloWorld" }],
  });
  test.save().then((doc) => {
    // console.log(doc);
  });
  app.get(`/${link}`, (req, res, next) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
});

const userChat = new Map();
const userState = new Map();
const canMakeAMove = new Map();
const onlineUsers = new Map();
const highlightMove = new Map();
const resetVisible = new Map();
io.on("connection", (socket) => {
  console.log("new Connection");
  let userName, userID;
  let type = "user";
  let url = socket.handshake.headers.referer;
  const roomId = url.substring(url.lastIndexOf("/") + 1);
  socket.join(roomId);
  // console.log(io.sockets.adapter.rooms.get(roomId));
  //Chat
  if (!resetVisible.has(roomId)) resetVisible.set(roomId, false);
  if (!userChat.has(roomId)) {
    userChat.set(roomId, []);
  }
  if (!highlightMove.has(roomId)) {
    highlightMove.set(roomId, { si: null, sj: null, ti: null, tj: null });
  }

  if (!onlineUsers.has(roomId)) onlineUsers.set(roomId, []);
  let chatArray = userChat.get(roomId);
  // console.log(chatArray);
  socket.on("userJoined", (data) => {
    userID = data.userID;
    userName = data.userName;
    let currDate = new Date();
    let hrs = currDate.getHours().toString().padStart(2, "0");
    let min = currDate.getMinutes().toString().padStart(2, "0");
    onlineUsers.get(roomId).push(data);
    chatArray.push({ time: `${hrs}:${min}`, message: `${userName} joined` });
    io.to(roomId).emit("chat", chatArray);
    io.to(roomId).emit("onlineUsers", onlineUsers.get(roomId));
  });
  socket.on("messageSent", (data) => {
    // console.log(data);
    let currDate = new Date();
    let hrs = currDate.getHours().toString().padStart(2, "0");
    let min = currDate.getMinutes().toString().padStart(2, "0");
    chatArray.push({ time: `${hrs}:${min}`, message: `${userName}:${data}` });
    io.to(roomId).emit("chat", chatArray);
  });
  socket.on("userTyping", (data) => {
    let currOnlineUsers = onlineUsers.get(roomId);
    let ind = currOnlineUsers.findIndex((user) => {
      return user.userID === data.userID;
    });
    // console.log(ind);
    if (ind !== -1) currOnlineUsers[ind].isUserTyping = data.isUserTyping;
    onlineUsers.set(roomId, currOnlineUsers);
    io.to(roomId).emit("onlineUsers", currOnlineUsers);
  });

  //Chess Board
  if (!userState.has(roomId)) {
    let initialBoardState = [
      ["r_b", "n_b", "b_b", "q_b", "k_b", "b_b", "n_b", "r_b"],
      ["p_b", "p_b", "p_b", "p_b", "p_b", "p_b", "p_b", "p_b"],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["p_w", "p_w", "p_w", "p_w", "p_w", "p_w", "p_w", "p_w"],
      ["r_w", "n_w", "b_w", "q_w", "k_w", "b_w", "n_w", "r_w"],
    ];
    let canClickWhiteButton = true;
    let canClickBlackButton = true;
    let blackUserName = null;
    let whiteUserName = null;
    let type = "user";
    let userData = {
      board: JSON.stringify(initialBoardState),
      canClickBlackButton,
      canClickWhiteButton,
      blackUserName,
      whiteUserName,
      type,
    };
    userState.set(roomId, userData);
    canMakeAMove.set(roomId, { white: true, black: false });
  }
  let userData = userState.get(roomId);
  let moveData = canMakeAMove.get(roomId);
  // console.log(userData);
  io.to(roomId).emit("message", userData);
  io.to(roomId).emit("canMakeAMove", moveData);
  io.to(roomId).emit("highlightMove", highlightMove.get(roomId));
  io.to(roomId).emit("resetVisible", resetVisible.get(roomId));
  socket.on("whiteClick", (data) => {
    data.canClickWhiteButton = false;
    data.type = "whitePlayer";
    type = "whitePlayer";
    userState.set(roomId, data);
    io.to(roomId).emit("message", data);
  });
  socket.on("blackClick", (data) => {
    data.canClickBlackButton = false;
    data.type = "blackPlayer";
    type = "blackPlayer";
    // console.log(data);
    userState.set(roomId, data);
    io.to(roomId).emit("message", data);
  });
  socket.on("checkReload", (data) => {
    let currUserData = userState.get(roomId);
    if (data.type === "b") {
      type = "blackPlayer";
      currUserData.blackUserName = data.userName;
      currUserData.canClickBlackButton = false;
    } else if (data.type === "w") {
      type = "whitePlayer";
      currUserData.whiteUserName = data.userName;
      currUserData.canClickWhiteButton = false;
    }
    userName = data.userName;
    userID = data.userID;
    let userData = userChat.get(roomId);
    userData.pop();
    userChat.set(roomId, userData);
    console.log("user reloaded");
    onlineUsers.get(roomId).push({ userID, userName, isUserTyping: false });
    let currOnlineUsers = onlineUsers.get(roomId);

    io.to(roomId).emit("chat", chatArray);
    io.to(roomId).emit("message", currUserData);
    io.to(roomId).emit("onlineUsers", currOnlineUsers);
  });

  socket.on("message", (data) => {
    userState.set(roomId, data);
    io.to(roomId).emit("message", data);
  });
  socket.on("canMakeAMove", () => {
    let data = canMakeAMove.get(roomId);
    data.white = data.white === true ? false : true;
    data.black = data.black === true ? false : true;
    canMakeAMove.set(roomId, data);
    io.to(roomId).emit("canMakeAMove", data);
  });

  //highlight last move
  socket.on("highlightMove", (data) => {
    highlightMove.set(roomId, data);
    io.to(roomId).emit("highlightMove", data);
  });

  //on check highlight red
  socket.on("onCheck", (data) => {
    // console.log(data);
    io.to(roomId).emit("onCheck", data);
  });

  //on check mate inform to all
  socket.on("checkMate", () => {
    io.to(roomId).emit("checkMate");
  });
  //reset board
  socket.on("resetBoard", () => {
    resetVisible.set(roomId, false);
    io.to(roomId).emit("resetBoard");
  });
  //reset visible
  socket.on("resetVisible", (data) => {
    resetVisible.set(roomId, data);
    io.to(roomId).emit("resetVisible", data);
  });

  socket.on("disconnect", () => {
    let currUserData = userState.get(roomId);
    if (type === "blackPlayer") {
      currUserData.blackUserName = null;
      currUserData.canClickBlackButton = true;
    }
    if (type === "whitePlayer") {
      currUserData.whiteUserName = null;
      currUserData.canClickWhiteButton = true;
    }
    userState.set(roomId, currUserData);
    let currOnlineUsers = onlineUsers.get(roomId);

    let filteredUsers = currOnlineUsers.filter((user) => {
      // console.log(user);
      return user.userID !== userID;
    });

    // console.log(filteredUsers);
    onlineUsers.set(roomId, filteredUsers);
    io.to(roomId).emit("message", currUserData);
    let currDate = new Date();
    let hrs = currDate.getHours().toString().padStart(2, "0");
    let min = currDate.getMinutes().toString().padStart(2, "0");
    userChat
      .get(roomId)
      .push({ time: `${hrs}:${min}`, message: `${userName} left` });
    io.to(roomId).emit("chat", userChat.get(roomId));
    io.to(roomId).emit("onlineUsers", filteredUsers);
    console.log("diconnected");
  });
});
app.use(express.static("build"));
app.use(express.static(path.join(__dirname, "dist")));
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
