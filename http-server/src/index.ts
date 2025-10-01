import express from "express";
import { Server } from "socket.io";
import dotenv from "dotenv";
import http from "http";
import auth from "./routes/auth";
import { subscriber } from "./client/redis";
import deployment from "./routes/deployment";
import { startWorker } from "./worker/deploymentWorker";
import logsRouter from "./routes/logs";
import dashboardRouter from "./routes/dashboard";
import cors from "cors";

dotenv.config();



const app = express();
const httpServer = http.createServer(app);
const PORT = 9000;

app.use(cors({
  origin: "http://localhost:8080",  // allow your frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"], // must include Content-Type
}));

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("subscribe", (channel: string) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});


app.use(express.json());

app.use("/api/auth", auth);
app.use("/api/deployment", deployment);
app.use("/api/logs", logsRouter);
app.use("/api/dashboard", dashboardRouter);

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