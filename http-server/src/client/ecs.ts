import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";

export const ecsClient = new ECSClient({
  region: "ap-south-1", 
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        }
      : undefined,
});

export const config = {
  CLUSTER: "arn:aws:ecs:ap-south-1:768238137421:cluster/builder-server",
  TASK: "arn:aws:ecs:ap-south-1:768238137421:task-definition/final-builder-task-1:1",
};