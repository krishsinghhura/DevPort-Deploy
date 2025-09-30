"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deploy = void 0;
const random_word_slugs_1 = require("random-word-slugs");
const prisma_1 = require("../../client/prisma");
const queue_1 = require("../../client/queue");
const deploy = async (req, res) => {
    const { gitURL, slug, name } = req.body;
    const projectSlug = slug ?? (0, random_word_slugs_1.generateSlug)();
    // 🔹 Replace hardcoded user with real auth (placeholder for now)
    const userId = req.user?.id || "1234567890wertyuio";
    try {
        // 🔹 Upsert project (unique per ownerId + subDomain)
        const project = await prisma_1.prisma.project.upsert({
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
        const deployment = await prisma_1.prisma.deployement.create({
            data: {
                projectId: project.id,
                status: "QUEUED",
            },
        });
        // Add job to BullMQ queue
        await queue_1.deploymentQueue.add("deploy-job", {
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
    }
    catch (err) {
        console.error("Deploy Error:", err);
        return res.status(500).json({ error: err.message });
    }
};
exports.deploy = deploy;
