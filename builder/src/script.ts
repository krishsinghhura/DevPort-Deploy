import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mime from "mime-types";
// import Redis from "ioredis";
import dotenv from 'dotenv';
dotenv.config();

// const publisher = new Redis(process.env.REDIS_URL || "");

// S3 client
const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const PROJECT_ID = process.env.PROJECT_ID;

// function publishLog(log: string) {
//   if (!PROJECT_ID) return;
//   publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }));
// }

async function init(): Promise<void> {
  console.log("Executing script.ts");
  // publishLog("Build Started...");

  const outDirPath = '/home/app/output';

  const p = exec(`cd ${outDirPath} && npm install && npm run build`);

  if (!p.stdout) {
    console.error("Failed to capture stdout");
    return;
  }

  p.stdout.on("data", (data: Buffer) => {
    const message = data.toString();
    console.log(message);
    // publishLog(message);
  });

  p.stderr?.on("data", (data: Buffer) => {
    const message = data.toString();
    console.error("Error:", message);
    // publishLog(`error: ${message}`);
  });

  p.on("close", async () => {
    console.log("Build Complete");
    // publishLog("Build Complete");

    const distFolderPath = path.join(outDirPath, "dist");
    const distFolderContents = fs.readdirSync(distFolderPath, { recursive: true }) as string[];

    // publishLog("Starting to upload");

    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log("uploading", filePath);
      // publishLog(`uploading ${file}`);

      const command = new PutObjectCommand({
        Bucket: "devport-deploy",
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath) || undefined,
      });

      await s3Client.send(command);

      // publishLog(`uploaded ${file}`);
      console.log("uploaded", filePath);
    }

    // publishLog("Done");
    console.log("Done...");
  });
}

init().catch((err) => {
  console.error("Script failed:", err);
  // publishLog(`Script failed: ${err.message}`);
});
