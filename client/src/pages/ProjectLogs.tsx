import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, Search, Download } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import {BASE_URL} from "@/config"

interface LogEntry {
  log: string;
  timestamp: number;
}

const ProjectLogs = () => {
  const { slug } = useParams<{ slug: string }>();
  const [logs, setLogs] = useState<string[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/logs/${slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch logs");
        }
        const data: { projectSlug: string; logs: string[] } = await res.json();

        // Parse each log string into JSON
        const formatted = data.logs.map((logStr) => {
          try {
            const parsed: LogEntry = JSON.parse(logStr);
            return `[${new Date(parsed.timestamp).toLocaleTimeString()}] ${parsed.log}`;
          } catch {
            return logStr; // fallback if parsing fails
          }
        });

        setLogs(formatted);
        setFilteredLogs(formatted);
      } catch (err: any) {
        toast(
          <div>
            <strong className="text-destructive">Error</strong>
            <div>{err.message}</div>
          </div>
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [slug]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = logs.filter((log) =>
        log.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs(logs);
    }
  }, [searchQuery, logs]);

  const handleDownload = () => {
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
              <Link to={`/project/${slug}`} className="hover:text-foreground">{slug}</Link>
              <span>/</span>
              <span>Logs</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Deployment Logs</h1>
                <p className="text-muted-foreground">
                  Last {logs.length} log entries for {slug}
                </p>
              </div>

              <Button 
                onClick={handleDownload}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Logs
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
          </div>

          {/* Logs */}
          <Card className="bg-card border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Terminal className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">
                  {filteredLogs.length} log entries
                </h2>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-glow text-muted-foreground">
                    Loading logs...
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs h-[600px] overflow-y-auto">
                  {filteredLogs.length === 0 ? (
                    <p className="text-muted-foreground">No logs found matching your search.</p>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <div key={index} className="text-foreground/80 mb-1 hover:bg-muted/30 px-2 py-1 rounded">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectLogs;
