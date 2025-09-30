import express from "express";
import { getProjectLogs } from "../contollers/logs/logs";

const router = express.Router();

router.get("/:projectSlug", getProjectLogs);

export default router;
