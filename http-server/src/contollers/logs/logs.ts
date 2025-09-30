import { Request, Response } from "express";
import { redisClient } from "../../client/redis";

export const getProjectLogs = async (req: Request, res: Response) => {
  const { projectSlug } = req.params;

  try {
    const logs = await redisClient.lrange(`logs-list:${projectSlug}`, 0, -1);
    return res.json({ projectSlug, logs });
  } catch (err: any) {
    console.error("Error fetching logs:", err);
    return res.status(500).json({ error: err.message });
  }
};
