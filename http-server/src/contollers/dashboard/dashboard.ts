import { Request, Response } from "express";
import { prisma } from "../../client/prisma";

export const getUserDashboard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        projects: {
          include: {
            Deployement: {
              orderBy: { createdAt: "desc" }, // latest first
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      projects: user.projects.map((project) => ({
        id: project.id,
        name: project.name,
        gitURL: project.gitURL,
        subDomain: project.subDomain,
        customDomain: project.customDomain,
        deployments: project.Deployement.map((d) => ({
          id: d.id,
          status: d.status,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        })),
      })),
    });
  } catch (err: any) {
    console.error("Error fetching dashboard:", err);
    return res.status(500).json({ error: err.message });
  }
};
