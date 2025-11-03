"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWorker = startWorker;
const bullmq_1 = require("bullmq");
const prisma_1 = require("../client/prisma");
const ecs_1 = require("../client/ecs");
const queue_1 = require("../client/queue");
const client_ecs_1 = require("@aws-sdk/client-ecs");
async function waitForTask(taskArn) {
    console.log(`⏳ Waiting for ECS task to complete: ${taskArn}`);
    while (true) {
        const resp = await ecs_1.ecsClient.send(new client_ecs_1.DescribeTasksCommand({
            cluster: ecs_1.config.CLUSTER,
            tasks: [taskArn],
        }));
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
function startWorker() {
    const worker = new bullmq_1.Worker("deployments", async (job) => {
        const { projectSlug, gitURL, deployementId } = job.data;
        await prisma_1.prisma.deployement.update({
            where: { id: deployementId },
            data: { status: "IN_PROGRESS" },
        });
        try {
            const resp = await ecs_1.ecsClient.send(new client_ecs_1.RunTaskCommand({
                cluster: ecs_1.config.CLUSTER,
                taskDefinition: ecs_1.config.TASK,
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
            }));
            const taskArn = resp.tasks?.[0]?.taskArn;
            if (!taskArn)
                throw new Error("No task ARN returned from ECS");
            const finalStatus = await waitForTask(taskArn);
            await prisma_1.prisma.deployement.update({
                where: { id: deployementId },
                data: { status: finalStatus },
            });
        }
        catch (err) {
            console.error("Deployment failed:", err);
            await prisma_1.prisma.deployement.update({
                where: { id: deployementId },
                data: { status: "FAIL" },
            });
        }
    }, { connection: queue_1.connection, concurrency: 3 });
    worker.on("failed", async (job, err) => {
        console.error("Job failed:", job?.id, err?.message);
        if (job?.data?.deployementId) {
            await prisma_1.prisma.deployement.update({
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
