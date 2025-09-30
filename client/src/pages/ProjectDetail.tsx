import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Activity, Clock, Terminal } from "lucide-react";
import Navbar from "@/components/Navbar";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

interface Deployment {
  id: string;
  createdAt: string;
}

interface DeploymentHistoryResponse {
  projectSlug: string;
  totalDeployments: number;
  deployments: Deployment[];
}

interface LogEntry {
  log: string;
  timestamp: number;
}

interface LogsResponse {
  projectSlug: string;
  logs: string[]; // each item is a JSON string of LogEntry
}

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "building" | "error">("active");
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const projectUrl = `https://${slug}.localhost:8000`;

  // Fetch deployment history on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchDeployments = async () => {
      try {
        const res = await fetch(`http://localhost:9000/deployment/history/${slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch deployment history");
        }
        const data: DeploymentHistoryResponse = await res.json();
        setDeployments(data.deployments);
      } catch (err: any) {
        toast(
          <div>
            <strong>Error</strong>
            <div>{err.message}</div>
          </div>
        );
      }
    };

    fetchDeployments();
  }, [slug]);

  // Fetch initial logs and subscribe to Socket.IO
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // 1️⃣ Fetch initial logs
    const fetchLogs = async () => {
      try {
        const res = await fetch(`http://localhost:9000/logs/${slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch logs");
        }
        const data: LogsResponse = await res.json();

        // Parse each string into JSON
        const formattedLogs = data.logs.map((logStr) => {
          try {
            const logObj: LogEntry = JSON.parse(logStr);
            return `[${new Date(logObj.timestamp).toLocaleTimeString()}] ${logObj.log}`;
          } catch {
            return logStr; // fallback
          }
        });

        setLogs(formattedLogs);
      } catch (err: any) {
        toast(
          <div>
            <strong className="text-destructive">Error</strong>
            <div>{err.message}</div>
          </div>
        );
      }
    };

    fetchLogs();

    // 2️⃣ Connect to Socket.IO
    socketRef.current = io("http://localhost:9000");

    socketRef.current.emit("subscribe", `logs:${slug}`);

    socketRef.current.on("message", (raw: string) => {
      try {
        const parsed: LogEntry = JSON.parse(raw); // Redis messages are JSON strings
        if (parsed.log && parsed.timestamp) {
          const timestamp = new Date(parsed.timestamp).toLocaleTimeString();
          setLogs((prev) => [...prev, `[${timestamp}] ${parsed.log}`]);
        }
      } catch (err) {
        console.warn("Failed to parse log:", raw);
      }
    });

    socketRef.current.on("status", (newStatus: "active" | "building" | "error") => {
      setStatus(newStatus);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [slug]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
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
                <a 
                  href={projectUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-glow flex items-center gap-2"
                >
                  {projectUrl}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              
              <div className="flex gap-3">
                <Link to={`/project/${slug}/logs`}>
                  <Button variant="outline">
                    <Terminal className="h-4 w-4 mr-2" />
                    View All Logs
                  </Button>
                </Link>
                <Button className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
                  Redeploy
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
                  <p className="text-sm text-muted-foreground">Total Deployments</p>
                  <p className="text-2xl font-bold">{deployments.length}</p>
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
