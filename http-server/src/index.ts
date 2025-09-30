import express from "express";
import { Server } from "socket.io";
import dotenv from "dotenv";
import http from "http";
import auth from "./routes/auth";
import { subscriber } from "./client/redis";
import deployment from "./routes/deployment";
import { startWorker } from "./worker/deploymentWorker";


dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = 9000;

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// When a client connects
io.on("connection", (socket) => {
  socket.on("subscribe", async (channel: string) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);

    // Extract project slug from channel
    const projectSlug = channel.replace("logs:", "");

    // Fetch recent logs from Redis list
    try {
      const recentLogs = await subscriber.lrange(`logs-list:${projectSlug}`, 0, -1);
      recentLogs.forEach((log) => socket.emit("message", log));
    } catch (err:any) {
      console.error("Failed to fetch logs from Redis list:", err);
      socket.emit("message", `Error fetching recent logs: ${err.message}`);
    }
  });
});

app.use(express.json());

app.use("/auth", auth);
app.use("/deployment", deployment);

// Subscribe to all Redis log channels
async function initRedisSubscribe() {
  console.log("Subscribed to logs...");
  await subscriber.psubscribe("logs:*");

  subscriber.on("pmessage", (_pattern, channel, message) => {
    console.log("Redis message received:", { channel, message });
    io.to(channel).emit("message", message);
  });
}

initRedisSubscribe();

httpServer.listen(PORT, () => {
  console.log(`API + Socket.IO server running on port ${PORT}`);
});

startWorker();