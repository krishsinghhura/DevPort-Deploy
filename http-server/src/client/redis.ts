import Redis from "ioredis";

export const subscriber = new Redis({
  host: process.env.REDIS_URL,
  port: 15646, 
  password: process.env.REDIS_PASSWORD , 
});

export const redisClient = new Redis({
  host: process.env.REDIS_URL,
  port: 15646,
  password: process.env.REDIS_PASSWORD,
});