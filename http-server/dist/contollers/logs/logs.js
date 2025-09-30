"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectLogs = void 0;
const redis_1 = require("../../client/redis");
const getProjectLogs = async (req, res) => {
    const { projectSlug } = req.params;
    try {
        const logs = await redis_1.redisClient.lrange(`logs-list:${projectSlug}`, 0, -1);
        return res.json({ projectSlug, logs });
    }
    catch (err) {
        console.error("Error fetching logs:", err);
        return res.status(500).json({ error: err.message });
    }
};
exports.getProjectLogs = getProjectLogs;
