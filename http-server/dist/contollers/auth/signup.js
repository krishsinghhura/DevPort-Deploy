"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = void 0;
const prisma_1 = require("../../client/prisma");
const crypto_js_1 = __importDefault(require("crypto-js"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authTypes_1 = require("../../validation/authTypes");
const JWT_SECRET = process.env.JWT_SECRET || "qwertyuiop";
const signup = async (req, res) => {
    const { name, email, password } = req.body;
    const safeParseResult = authTypes_1.signUpSchema.safeParse(req.body);
    if (safeParseResult.error) {
        return res.status(404).json(safeParseResult.error);
    }
    try {
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existingUser)
            return res.status(400).json({ message: "User already exists" });
        const encryptedPassword = crypto_js_1.default.AES.encrypt(password, JWT_SECRET).toString();
        const user = await prisma_1.prisma.user.create({
            data: { name, email, password: encryptedPassword },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });
        res.status(201).json({
            user: { id: user.id, name: user.name, email: user.email },
            token,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
};
exports.signup = signup;
