import express from "express";
import { io } from "../lib/socket.js";

const router = express.Router();

router.get("/socket-status", (req, res) => {
  try {
    const socketInfo = {
      engine: io.engine.clientsCount,
      connected: Object.keys(io.sockets.sockets).length,
      adapter: io.sockets.adapter
        ? Object.keys(io.sockets.adapter.rooms || {}).length
        : "Not available",
    };

    res.json({
      status: "Socket server running",
      info: socketInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting socket status:", error);
    res
      .status(500)
      .json({ error: "Failed to get socket status", message: error.message });
  }
});

export default router;
