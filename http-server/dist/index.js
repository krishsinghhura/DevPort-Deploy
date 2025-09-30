"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const auth_1 = __importDefault(require("./routes/auth"));
const redis_1 = require("./client/redis");
const deployment_1 = __importDefault(require("./routes/deployment"));
const deploymentWorker_1 = require("./worker/deploymentWorker");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const PORT = 9000;
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
    },
});
// When a client connects
io.on("connection", (socket) => {
    socket.on("subscribe", async (channel) => {
        socket.join(channel);
        socket.emit("message", `Joined ${channel}`);
        // Extract project slug from channel
        const projectSlug = channel.replace("logs:", "");
        // Fetch recent logs from Redis list
        try {
            const recentLogs = await redis_1.subscriber.lrange(`logs-list:${projectSlug}`, 0, -1);
            recentLogs.forEach((log) => socket.emit("message", log));
        }
        catch (err) {
            console.error("Failed to fetch logs from Redis list:", err);
            socket.emit("message", `Error fetching recent logs: ${err.message}`);
        }
    });
});
app.use(express_1.default.json());
app.use("/auth", auth_1.default);
app.use("/deployment", deployment_1.default);
// Subscribe to all Redis log channels
async function initRedisSubscribe() {
    console.log("Subscribed to logs...");
    await redis_1.subscriber.psubscribe("logs:*");
    redis_1.subscriber.on("pmessage", (_pattern, channel, message) => {
        console.log("Redis message received:", { channel, message });
        io.to(channel).emit("message", message);
    });
}
initRedisSubscribe();
httpServer.listen(PORT, () => {
    console.log(`API + Socket.IO server running on port ${PORT}`);
});
(0, deploymentWorker_1.startWorker)();
