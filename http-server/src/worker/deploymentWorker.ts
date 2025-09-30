// src/worker.ts
import { Worker, Job } from "bullmq";
import { prisma } from "../client/prisma";
import { ecsClient, config } from "../client/ecs";
import { connection } from "../client/queue";
import { RunTaskCommand, DescribeTasksCommand } from "@aws-sdk/client-ecs";

// 🔹 Wait for ECS task to finish and determine final status
async function waitForTask(taskArn: string): Promise<"READY" | "FAIL"> {
  console.log(`⏳ Waiting for ECS task to complete: ${taskArn}`);
  while (true) {
    const resp = await ecsClient.send(
      new DescribeTasksCommand({
        cluster: config.CLUSTER,
        tasks: [taskArn],
      })
    );

    const task = resp.tasks?.[0];
    if (!task) {
      console.warn("Task not found in ECS response, retrying...");
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    if (task.lastStatus === "STOPPED") {
      const exitCode = task.containers?.[0]?.exitCode;
      console.log("Task stopped, exitCode:", exitCode);
      return exitCode === 0 ? "READY" : "FAIL";
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

// 🔹 Start BullMQ worker for deployments
export function startWorker() {
  const worker = new Worker(
    "deployments",
    async (job: Job) => {
      const { projectSlug, gitURL, deployementId } = job.data;
      // 🔹 Update status to IN_PROGRESS
      await prisma.deployement.update({
        where: { id: deployementId },
        data: { status: "IN_PROGRESS" },
      });

      try {
        // 🔹 Run ECS task
        const resp = await ecsClient.send(
          new RunTaskCommand({
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
                  name: "final-builder-task-1",
                  environment: [
                    { name: "GIT_REPOSITORY__URL", value: gitURL },
                    { name: "PROJECT_ID", value: projectSlug },
                  ],
                },
              ],
            },
          })
        );

        const taskArn = resp.tasks?.[0]?.taskArn;
        if (!taskArn) throw new Error("No task ARN returned from ECS");

        // 🔹 Wait for ECS task to complete
        const finalStatus = await waitForTask(taskArn);

        // 🔹 Update deployment status in DB
        await prisma.deployement.update({
          where: { id: deployementId },
          data: { status: finalStatus },
        });
      } catch (err) {
        console.error("Deployment failed:", err);
        await prisma.deployement.update({
          where: { id: deployementId },
          data: { status: "FAIL" },
        });
      }
    },
    { connection, concurrency: 3 }
  );

  worker.on("failed", async (job, err) => {
    console.error("Job failed:", job?.id, err?.message);
    if (job?.data?.deployementId) {
      await prisma.deployement.update({
        where: { id: job.data.deployementId },
        data: { status: "FAIL" },
      });
    }
  });

  worker.on("completed", (job) => {
    console.log("Job completed:", job.id);
  });

  console.log("🚀 Worker started and listening to 'deployments' queue");
}
