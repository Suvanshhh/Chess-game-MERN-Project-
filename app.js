const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w"; // Fixed typo "currentPlyer" to "currentPlayer"

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
  console.log("connected");

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  } else {
    uniquesocket.emit("spectatorRole");
  }

  uniquesocket.emit("boardState", chess.fen());

  uniquesocket.on("disconnect", function () {
    if (uniquesocket.id === players.white) {
      delete players.white;
    } else if (uniquesocket.id === players.black) {
      delete players.black;
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      if (
        (chess.turn() === "w" && uniquesocket.id !== players.white) ||
        (chess.turn() === "b" && uniquesocket.id !== players.black)
      )
        return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move); // Emit the move to all players
        io.emit("boardState", chess.fen()); // Emit the updated board state
      } else {
        console.log("Invalid move", move);
        uniquesocket.emit("Invalid move", move);
      }
    } catch (err) {
      console.log(err);
      uniquesocket.emit("Invalid move:", move);
    }
  });
});

server.listen(3000, function () {
  console.log("listening on *:3000");
});
