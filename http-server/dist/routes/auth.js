"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const signin_1 = require("../contollers/auth/signin");
const signup_1 = require("../contollers/auth/signup");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.post("/signin", signin_1.signin);
router.post("/signup", signup_1.signup);
exports.default = router;
