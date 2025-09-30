"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.ecsClient = void 0;
const client_ecs_1 = require("@aws-sdk/client-ecs");
exports.ecsClient = new client_ecs_1.ECSClient({
    region: "ap-south-1",
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
        : undefined,
});
exports.config = {
    CLUSTER: "arn:aws:ecs:ap-south-1:768238137421:cluster/builder-server",
    TASK: "arn:aws:ecs:ap-south-1:768238137421:task-definition/final-builder-task-1:1",
};
