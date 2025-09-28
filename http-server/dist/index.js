"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const random_word_slugs_1 = require("random-word-slugs");
const client_ecs_1 = require("@aws-sdk/client-ecs");
const socket_io_1 = require("socket.io");
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const PORT = 9000;
const subscriber = new ioredis_1.default({
    host: "redis-15646.c62.us-east-1-4.ec2.redns.redis-cloud.com",
    port: 15646, // replace with the actual port from Redis Cloud
    password: process.env.REDIS_PASSWORD || "M3dXj4fzYBs7hRlZNzUoKDgJVRQTgx6P", // store in .env for safety
});
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*", // allow all origins (or restrict to your frontend URL)
    },
});
io.on("connection", (socket) => {
    socket.on("subscribe", (channel) => {
        socket.join(channel);
        socket.emit("message", `Joined ${channel}`);
    });
});
// ECS client
const ecsClient = new client_ecs_1.ECSClient({
    region: "ap-south-1", // e.g. "ap-south-1"
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
        : undefined,
});
const config = {
    CLUSTER: "arn:aws:ecs:ap-south-1:768238137421:cluster/builder-server",
    TASK: "arn:aws:ecs:ap-south-1:768238137421:task-definition/final-task:1",
};
app.use(express_1.default.json());
app.post("/project", async (req, res) => {
    const { gitURL, slug } = req.body;
    const projectSlug = slug ? slug : (0, random_word_slugs_1.generateSlug)();
    // Define ECS task
    const command = new client_ecs_1.RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: "FARGATE",
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: "ENABLED",
                subnets: [
                    "subnet-007de0c4bf79d6daa",
                    "subnet-08e9457a94ce2f6aa",
                    "subnet-0785a9c97e5ab951b",
                ], // replace with your subnet IDs
                securityGroups: ["sg-0ff3803d9a3607fe2"], // replace with your security group ID(s)
            },
        },
        overrides: {
            containerOverrides: [
                {
                    name: "final-task",
                    environment: [
                        { name: "GIT_REPOSITORY__URL", value: gitURL },
                        { name: "PROJECT_ID", value: projectSlug },
                    ],
                },
            ],
        },
    });
    try {
        const response = await ecsClient.send(command);
        console.log("ECS RunTask response:", JSON.stringify(response, null, 2));
        if (response.failures && response.failures.length > 0) {
            console.error("Task launch failures:", response.failures);
            return res.status(500).json({ error: response.failures });
        }
        return res.json({
            status: "queued",
            data: {
                projectSlug,
                url: `http://${projectSlug}.localhost:8000`,
                taskArn: response.tasks?.[0]?.taskArn,
            },
        });
    }
    catch (err) {
        console.error("ECS RunTask Error:", err);
        return res.status(500).json({ error: err });
    }
});
// // Subscribe to Redis logs
async function initRedisSubscribe() {
    console.log("Subscribed to logs....");
    await subscriber.psubscribe("logs:*");
    subscriber.on("pmessage", (_pattern, channel, message) => {
        io.to(channel).emit("message", message);
    });
}
initRedisSubscribe();
httpServer.listen(PORT, () => {
    console.log(`API + Socket.IO server running on port ${PORT}`);
});
