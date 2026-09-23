import "dotenv/config";

import http from "http";

import { Server } from "socket.io";

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initializeSocket } from "./socket.js";
import {
  setConversationIO,
} from "./controllers/conversationController.js";

const PORT =
  Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectDB();

    const httpServer =
      http.createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin:
          process.env.CLIENT_URL ||
          "http://localhost:5173",
        credentials: true,
      },
    });

    initializeSocket(io);
    setConversationIO(io);

    httpServer.listen(PORT, () => {
      console.log(
        `🚀 ReLoop server running on http://localhost:${PORT}`
      );

      console.log(
        "💬 Socket.IO chat server ready"
      );
    });

  } catch (error) {
    console.error(
      "❌ Failed to start server:",
      error
    );

    process.exit(1);
  }
}

startServer();