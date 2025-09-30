"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeploymentHistory = void 0;
const prisma_1 = require("../../client/prisma");
const getDeploymentHistory = async (req, res) => {
    const { slug } = req.params;
    try {
        const userId = req.user?.userId;
        console.log("User ID:", userId);
        console.log("Requested slug:", slug);
        const project = await prisma_1.prisma.project.findUnique({
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
    }
    catch (err) {
        console.error("Error fetching deployment history:", err);
        res.status(500).json({ message: "Something went wrong" });
    }
};
exports.getDeploymentHistory = getDeploymentHistory;
