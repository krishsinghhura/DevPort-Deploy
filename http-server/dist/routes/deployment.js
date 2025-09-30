"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const deploy_1 = require("../contollers/deploy/deploy");
const router = express_1.default.Router();
router.post("/deploy", deploy_1.deploy);
exports.default = router;
