import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

export function getReceiverSocketId(userId) {
  if (!userId) {
    console.log(
      "Warning: getReceiverSocketId called with null/undefined userId"
    );
    return null;
  }
  // Always convert userId to string for consistent lookup
  const userIdStr = userId.toString();
  const socketId = userSocketMap[userIdStr];
  console.log(
    `Looking up socketId for userId ${userIdStr}: ${socketId || "not found"}`
  );

  // Print all online users for debugging
  console.log(
    "All online users:",
    Object.keys(userSocketMap).map((id) => ({
      userId: id,
      socketId: userSocketMap[id],
    }))
  );

  return socketId;
}

// to store online users
const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    // Always store userId as string to ensure consistent lookups
    const userIdStr = userId.toString();
    userSocketMap[userIdStr] = socket.id;
    console.log(`User ${userIdStr} connected with socket ${socket.id}`);
    console.log("Current online users:", Object.keys(userSocketMap));
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);

    // Find and remove the disconnected user
    if (userId) {
      const userIdStr = userId.toString();
      delete userSocketMap[userIdStr];
      console.log(`User ${userIdStr} disconnected`);
      console.log("Remaining online users:", Object.keys(userSocketMap));
    } else {
      // If userId wasn't in query, find by socket ID
      const disconnectedUserId = Object.keys(userSocketMap).find(
        (key) => userSocketMap[key] === socket.id
      );

      if (disconnectedUserId) {
        delete userSocketMap[disconnectedUserId];
        console.log(
          `User ${disconnectedUserId} disconnected (found by socket id)`
        );
      }
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, server, app };
