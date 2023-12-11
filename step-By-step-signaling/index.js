const express = require("express");

const { Server } = require("socket.io");

const app = express();

app.get("/", (req, res) => res.send("api working fine"));

const server = app.listen(8080, () => {
  console.log("server is listening on port: 8080");
});

const io = new Server(server, {
  cors: {
    origin: `http://localhost:3000`,
  },
});

io.on("connection", (socket) => {
  console.log(socket.id);
  socket.emit("connection-success", {
    status: "connection-success",
    socketId: socket.id,
  });

  //send offer to another peer;
  socket.on("sdp-backend", (data) => {
    console.log("sdp data", data);
    socket.broadcast.emit("sdp-frontend", data);
  });

  //got candidates and sending it to another peer;
  socket.on("candidate-backend", (candidate) => {
    console.log("candidate", candidate);
    socket.broadcast.emit("candidate-frontend", candidate);
  });

  socket.on("disconnect", () => {
    console.log(`${socket.id} has been disconnected`);
  });
});
