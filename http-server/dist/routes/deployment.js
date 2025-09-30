"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const deploy_1 = require("../contollers/deploy/deploy");
const details_1 = require("../contollers/deploy/details");
const middleware_1 = require("../middleware");
const router = express_1.default.Router();
router.post("/deploy", middleware_1.authMiddleware, deploy_1.deploy);
router.get("/history/:slug", middleware_1.authMiddleware, details_1.getDeploymentHistory);
exports.default = router;
