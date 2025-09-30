import { Request, Response } from "express";
import { prisma } from "../../client/prisma";

export const getDeploymentHistory = async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const userId = (req as any).user?.userId;
    console.log("User ID:", userId);
console.log("Requested slug:", slug);

    const project = await prisma.project.findUnique({
      where: { ownerId_subDomain: { subDomain: slug, ownerId: userId } },
      include: {
        Deployement: {
          select: { id: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const deploymentHistory = project.Deployement.map((d) => ({
      id: d.id,
      createdAt: d.createdAt,
    }));

    res.status(200).json({
      projectSlug: slug,
      totalDeployments: deploymentHistory.length,
      deployments: deploymentHistory,
    });
  } catch (err: any) {
    console.error("Error fetching deployment history:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};
