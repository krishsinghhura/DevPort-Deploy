"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const random_word_slugs_1 = require("random-word-slugs");
const client_ecs_1 = require("@aws-sdk/client-ecs");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = 9000;
// Create HTTP server for Socket.io
// const socketServer = http.createServer();
// io.listen(socketServer);
// socketServer.listen(9002, () => {
//   console.log("Socket Server running on port 9002");
// });
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
    TASK: "arn:aws:ecs:ap-south-1:768238137421:task-definition/builder-task",
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
                subnets: ["subnet-007de0c4bf79d6daa", "subnet-08e9457a94ce2f6aa", "subnet-0785a9c97e5ab951b"], // replace with your subnet IDs
                securityGroups: ["sg-0ff3803d9a3607fe2"], // replace with your security group ID(s)
            },
        },
        overrides: {
            containerOverrides: [
                {
                    name: "builder-server",
                    environment: [
                        { name: "GIT_REPOSITORY__URL", value: gitURL },
                        { name: "PROJECT_ID", value: projectSlug },
                    ],
                },
            ],
        },
    });
    await ecsClient.send(command);
    return res.json({
        status: "queued",
        data: {
            projectSlug,
            url: `http://${projectSlug}.localhost:8000`,
        },
    });
});
// // Subscribe to Redis logs
// async function initRedisSubscribe() {
//   console.log("Subscribed to logs....");
//   await subscriber.psubscribe("logs:*");
//   subscriber.on("pmessage", (_pattern, channel, message) => {
//     io.to(channel).emit("message", message);
//   });
// }
// initRedisSubscribe();
app.listen(PORT, () => console.log(`API Server running on port ${PORT}`));
