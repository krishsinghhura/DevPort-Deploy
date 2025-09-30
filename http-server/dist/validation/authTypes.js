"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUpSchema = exports.signInSchema = void 0;
const zod_1 = require("zod");
exports.signInSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string()
});
exports.signUpSchema = zod_1.z.object({
    name: zod_1.z.string(),
    email: zod_1.z.email(),
    password: zod_1.z.string()
});
