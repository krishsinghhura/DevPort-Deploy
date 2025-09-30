import { Request, Response } from "express";
import { generateSlug } from "random-word-slugs";
import { prisma } from "../../client/prisma";
import { deploymentQueue } from "../../client/queue";

export const deploy = async (req: Request, res: Response) => {
  const { gitURL, slug, name } = req.body;
  const projectSlug = slug ?? generateSlug();

  // 🔹 Replace hardcoded user with real auth (placeholder for now)
  const userId = (req as any).user?.id || "1234567890wertyuio";

  try {
    // 🔹 Upsert project (unique per ownerId + subDomain)
    const project = await prisma.project.upsert({
      where: {
        ownerId_subDomain: {
          ownerId: userId,
          subDomain: projectSlug,
        },
      },
      update: {
        gitURL,
        name: name || projectSlug,
      },
      create: {
        name: name || projectSlug,
        gitURL,
        subDomain: projectSlug,
        ownerId: userId,
      },
    });

    // Insert a Deployement record with status QUEUED
    const deployment = await prisma.deployement.create({
      data: {
        projectId: project.id,
        status: "QUEUED",
      },
    });

    // Add job to BullMQ queue
    await deploymentQueue.add("deploy-job", {
      projectId: project.id,
      projectSlug,
      gitURL,
      deployementId: deployment.id,
      userId,
    });

    const baseDomain = process.env.BASE_DOMAIN || "localhost:8000";

    return res.json({
      status: "queued",
      projectSlug,
      deploymentId: deployment.id,
      url: `http://${projectSlug}.${baseDomain}`,
    });
  } catch (err: any) {
    console.error("Deploy Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
