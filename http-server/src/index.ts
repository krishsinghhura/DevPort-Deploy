import express, { Request, Response } from "express";
import { generateSlug } from "random-word-slugs";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import { Server } from "socket.io";
import Redis from "ioredis";
import dotenv from "dotenv";
import http from "http";
import auth from "./routes/auth";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = 9000;

app.use("/auth",auth);

const subscriber = new Redis({
  host: process.env.REDIS_URL,
  port: 15646, 
  password: process.env.REDIS_PASSWORD , 
});

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

const ecsClient = new ECSClient({
  region: "ap-south-1", 
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        }
      : undefined,
});

const config = {
  CLUSTER: "arn:aws:ecs:ap-south-1:768238137421:cluster/builder-server",
  TASK: "arn:aws:ecs:ap-south-1:768238137421:task-definition/final-task:1",
};

app.use(express.json());

interface ProjectRequestBody {
  gitURL: string;
  slug?: string;
}

app.post("/deploy", async (req: Request, res: Response) => {
  const { gitURL, slug } = req.body as ProjectRequestBody;
  const projectSlug = slug ? slug : generateSlug();

  const command = new RunTaskCommand({
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
        ], 
        securityGroups: ["sg-0ff3803d9a3607fe2"], 
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
  } catch (err) {
    console.error("ECS RunTask Error:", err);
    return res.status(500).json({ error: err });
  }
});

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
