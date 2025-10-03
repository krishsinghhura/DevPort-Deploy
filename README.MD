# DevPort Deploy

A lightweight deployment platform that lets users deploy GitHub projects into static sites with unique subdomains.  

---

## Workflow

### 1. **Builder (Container Image in ECR)**
The **Builder** is a container image (stored in AWS ECR) responsible for doing the actual build work.  

When launched (as an ECS Fargate task), it:
1. **Clones** the Git repository provided by the user.
2. **Runs the build** (using the project’s build command).
3. **Stores the output** (`dist/` folder with static files) into **AWS S3** under a unique project path.
4. **Publishes logs** to **Redis Pub/Sub** in real-time, so the user can see what’s happening during the build.
5. **Appends logs** to a **Redis List**, so logs can be fetched later.

This ensures every deployment is isolated, reproducible, and safe.  

---

### 2. **HTTP Server (Deployment Orchestrator)**
The **http-server** is the core backend that coordinates deployments.  

It handles:
- **API Endpoint `/deploy`**
  - Takes input (`gitURL`, optional `slug`, project name`).
  - Creates/updates a project in the database.
  - Creates a new deployment record (`QUEUED`).
  - Pushes the deployment request into a queue.

- **Queue + ECS Tasks**
  - The queue ensures deployments happen asynchronously.
  - A worker picks jobs from the queue.
  - It launches an **ECS Fargate task** using the Builder container (already registered in **ECR**).
  - ECS runs the Builder, which does the actual build & S3 upload.
  - Once ECS task finishes, the server updates deployment status in DB (`READY` or `FAIL`).

- **Logs Management**
  - Subscribes to **Redis Pub/Sub** to stream build logs in real-time.
  - Stores logs in **Redis Lists** for later retrieval.

In short: The http-server is the **brain** of the system → managing projects, deployments, workers, and logs.  

---

### 3. **Reverse Proxy (Static Site Serving)**
The **reverse proxy** makes the deployed apps accessible via subdomains.  

- Runs on port `8000`.
- Extracts the subdomain from the request hostname.
- Maps that subdomain to the corresponding folder in S3.
- Proxies the request to the static files hosted in **S3**.
- Automatically appends `index.html` when a user visits `/`.

**Example:**
http://devport.localhost:8000 → https://devport-deploy.s3.ap-south-1.amazonaws.com/__outputs/devport/index.html


So if a user deployed a project with slug = `devport`, it becomes instantly available at:
http://devport.devport-deploy.xyz

---

**Summary**
- **Builder**: clone, build, upload, log.
- **http-server**: manage deployments, workers, ECS tasks, logs.
- **Reverse Proxy**: route subdomain requests to static files in S3.
