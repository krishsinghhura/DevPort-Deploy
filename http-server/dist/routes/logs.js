"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logs_1 = require("../contollers/logs/logs");
const router = express_1.default.Router();
router.get("/:projectSlug", logs_1.getProjectLogs);
exports.default = router;
