"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deploymentQueue = exports.connection = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const bullmq_1 = require("bullmq");
exports.connection = process.env.REDIS_URI
    ? new ioredis_1.default(process.env.REDIS_URI, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    })
    : new ioredis_1.default({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });
exports.deploymentQueue = new bullmq_1.Queue("deployments", { connection: exports.connection });
