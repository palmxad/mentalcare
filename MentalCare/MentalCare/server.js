server เก่า
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("ผู้ใช้ใหม่เชื่อมต่อ:", socket.id);

  if (waitingUser) {
    const roomId = `${waitingUser.id}#${socket.id}`;
    socket.join(roomId);
    waitingUser.join(roomId);

    socket.roomId = roomId;
    waitingUser.roomId = roomId;

    io.to(roomId).emit("startChat");
    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit("waiting");
  }

  socket.on("message", (msg) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit("message", msg);
    }
  });

  socket.on("disconnect", () => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit("end");
    } else if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

http.listen(PORT, () => {
  console.log("เซิร์ฟเวอร์เริ่มที่พอร์ต " + PORT);
});
