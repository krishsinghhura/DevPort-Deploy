import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Activity, Clock, Terminal } from "lucide-react";
import Navbar from "@/components/Navbar";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { BASE_URL } from "@/config";

interface Deployment {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface LogEntry {
  log: string;
  timestamp: number;
}

interface Project {
  id: string;
  name: string;
  gitURL: string;
  subDomain: string;
  customDomain?: string | null;
  deployments: Deployment[];
}

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const project: Project | undefined = location.state?.project;

  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "building" | "error">(
    "active"
  );
  const [deployments, setDeployments] = useState<Deployment[]>(
    project?.deployments || []
  );
  const [isRedeploying, setIsRedeploying] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const projectGitURL = project?.gitURL || "#";
  const projectUrl = `http://${slug}.localhost:8000`;

  // Fetch deployment history if project not passed via state
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || deployments.length > 0) return;

    const fetchDeployments = async () => {
      try {
        const res = await fetch(`${BASE_URL}/deployment/history/${slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.message || "Failed to fetch deployment history"
          );
        }
        const data: { deployments: Deployment[] } = await res.json();
        setDeployments(data.deployments);
      } catch (err: any) {
        toast.error(err.message);
      }
    };

    fetchDeployments();
  }, [slug, deployments.length]);

  // Fetch initial logs and subscribe to Socket.IO
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchLogs = async () => {
      try {
        const res = await fetch(`${BASE_URL}/logs/${slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch logs");
        }
        const data: { logs: string[] } = await res.json();

        const formattedLogs = data.logs.map((logStr) => {
          try {
            const logObj: LogEntry = JSON.parse(logStr);
            return `[${new Date(logObj.timestamp).toLocaleTimeString()}] ${
              logObj.log
            }`;
          } catch {
            return logStr;
          }
        });

        setLogs(formattedLogs);
      } catch (err: any) {
        toast.error(err.message);
      }
    };

    fetchLogs();

    socketRef.current = io(`${BASE_URL}`);
    socketRef.current.emit("subscribe", `logs:${slug}`);

    socketRef.current.on("message", (raw: string) => {
      try {
        const parsed: LogEntry = JSON.parse(raw);
        if (parsed.log && parsed.timestamp) {
          const timestamp = new Date(parsed.timestamp).toLocaleTimeString();
          setLogs((prev) => [...prev, `[${timestamp}] ${parsed.log}`]);
        }
      } catch {
        console.warn("Failed to parse log:", raw);
      }
    });

    socketRef.current.on(
      "status",
      (newStatus: "active" | "building" | "error") => {
        setStatus(newStatus);
      }
    );

    return () => {
      socketRef.current?.disconnect();
    };
  }, [slug]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleRedeploy = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsRedeploying(true); // start loader
    try {
      const res = await fetch(`${BASE_URL}/deployment/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gitURL: projectGitURL, slug }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to redeploy");
      }

      await res.json();
      toast.success("Redeploy triggered! Check logs for progress.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsRedeploying(false); // stop loader
    }
  };

  const lastDeployment = deployments[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link to="/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <span>/</span>
              <span>{slug}</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{slug}</h1>
                  <Badge
                    className={
                      status === "active"
                        ? "bg-success/10 text-success border-success/20"
                        : status === "building"
                        ? "bg-warning/10 text-warning border-warning/20 animate-glow"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }
                  >
                    {status}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1">
                  <a
                    href={projectGitURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary-glow flex items-center gap-2"
                  >
                    GitHub Repository
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <a
                    href={projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary-glow flex items-center gap-2"
                  >
                    Live Project
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <p className="text-xs text-muted-foreground mt-1">
                    ⚠️ After pushing changes to GitHub, click "Redeploy" to
                    update the deployment.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleRedeploy}
                  disabled={isRedeploying}
                >
                  <Activity className="h-4 w-4" />
                  {isRedeploying ? "Redeploying..." : "Redeploy"}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Deployments
                  </p>
                  <p className="text-2xl font-bold">{deployments.length}</p>
                  {lastDeployment && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Last Deployment: {lastDeployment.status} at{" "}
                      {new Date(lastDeployment.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Real-time Logs */}
          <Card className="bg-card border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Terminal className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Real-time Build Logs</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-glow"></div>
                  <span className="text-sm text-muted-foreground">Live</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">Waiting for logs...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="text-foreground/80 mb-1">
                      {log}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
