import { Request, Response } from "express";
import { generateSlug } from "random-word-slugs";
import { prisma } from "../../client/prisma";
import { deploymentQueue } from "../../client/queue";

export const deploy = async (req: Request, res: Response) => {
  const { gitURL, slug, name } = req.body;
  const projectSlug = slug ?? generateSlug();

  const userId = (req as any).user?.userId;

  try {
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

    const deployment = await prisma.deployement.create({
      data: {
        projectId: project.id,
        status: "QUEUED",
      },
    });

    await deploymentQueue.add("deploy-job", {
      projectId: project.id,
      projectSlug,
      gitURL,
      deployementId: deployment.id,
      userId,
    });

    const baseDomain = "localhost:8000"; //devport-deploy.space

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
