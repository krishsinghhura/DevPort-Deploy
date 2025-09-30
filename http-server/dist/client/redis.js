"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriber = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
exports.subscriber = new ioredis_1.default({
    host: process.env.REDIS_URL,
    port: 15646,
    password: process.env.REDIS_PASSWORD,
});
