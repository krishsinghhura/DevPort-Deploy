import express, { Request, Response } from "express";
import { generateSlug } from "random-word-slugs";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import { Server } from "socket.io";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 9000;

// Redis subscriber
// const subscriber = new Redis(""); // put your Redis connection URL here

// // Socket.io server
// const io = new Server({
//   cors: {
//     origin: "*", // allow all origins
//   },
// });

// io.on("connection", (socket) => {
//   socket.on("subscribe", (channel: string) => {
//     socket.join(channel);
//     socket.emit("message", `Joined ${channel}`);
//   });
// });

import http from "http";

// Create HTTP server for Socket.io
// const socketServer = http.createServer();
// io.listen(socketServer);

// socketServer.listen(9002, () => {
//   console.log("Socket Server running on port 9002");
// });

// ECS client
const ecsClient = new ECSClient({
  region: "ap-south-1", // e.g. "ap-south-1"
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      }
    : undefined,
});

const config = {
  CLUSTER: "arn:aws:ecs:ap-south-1:768238137421:cluster/builder-server",
  TASK: "arn:aws:ecs:ap-south-1:768238137421:task-definition/builder-task",
};

app.use(express.json());

interface ProjectRequestBody {
  gitURL: string;
  slug?: string;
}

app.post("/project", async (req: Request, res: Response) => {
  const { gitURL, slug } = req.body as ProjectRequestBody;
  const projectSlug = slug ? slug : generateSlug();

  // Define ECS task
  const command = new RunTaskCommand({
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
