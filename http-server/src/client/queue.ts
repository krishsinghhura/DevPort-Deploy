import Redis from "ioredis";
import { Queue } from "bullmq";

export const connection = process.env.REDIS_URI
  ? new Redis(process.env.REDIS_URI, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  : new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

export const deploymentQueue = new Queue("deployments", { connection });
