import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Globe, Activity, Clock, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import axios from "axios";
import {BASE_URL} from "@/config"

const newProjectSchema = z.object({
  githubUrl: z
    .string()
    .url({ message: "Please enter a valid GitHub URL" })
    .refine((url) => url.includes("github.com"), {
      message: "URL must be a GitHub repository",
    }),
});

interface Project {
  id: string;
  name: string;
  subDomain: string;
  customDomain?: string | null;
  deployments: {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[];
}


const Dashboard = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof newProjectSchema>>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: { githubUrl: "" },
  });

  // Fetch dashboard data
  useEffect(() => {
  const fetchDashboard = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    try {
      const res = await axios.get(`${BASE_URL}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Axios automatically parses JSON
      const data = res.data;
      setProjects(data.projects || []);
    } catch (err: any) {
      // Handle errors
      toast({
        title: "Error",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    }
  };

  fetchDashboard();
}, [navigate, toast]);

  const onSubmit = async (values: z.infer<typeof newProjectSchema>) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${BASE_URL}/deployment/deploy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ gitURL: values.githubUrl }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to create project");
    }

    const data = await res.json();

    toast({
      title: "Project Created",
      description: "Your project is being deployed...",
    });

    // Navigate to the project page using the projectSlug from response
    navigate(`/project/${data.projectSlug}`, { state: { project: data } });

    setIsDialogOpen(false);
    form.reset();
  } catch (err: any) {
    toast({
      title: "Error",
      description: err.message,
      variant: "destructive",
    });
  }
};


 // Helper
const getLatestDeployment = (project: Project) => {
  if (!project.deployments || project.deployments.length === 0) return null;
  return [...project.deployments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
};

// Stats
const stats = [
  { label: "Total Projects", value: projects.length.toString(), icon: Globe },
  {
    label: "Active Deployments",
    value: projects.filter((p) => getLatestDeployment(p)?.status === "READY")
      .length.toString(),
    icon: Activity,
  },
  {
    label: "Total Deployments",
    value: projects.reduce((acc, p) => acc + (p.deployments?.length || 0), 0).toString(),
    icon: Clock,
  },
  {
    label: "Projects with Custom Domain",
    value: projects.filter((p) => p.customDomain).length.toString(),
    icon: Globe,
  },
];

// Latest deployment date
const latestDeploymentDate = projects
  .flatMap((p) => p.deployments || [])
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  ?.updatedAt;


  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">
                Manage and monitor your deployments
              </p>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="p-6 bg-card border-border hover:border-primary/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Projects */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Projects</h2>
            <div className="grid gap-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="p-6 bg-card border-border hover:border-primary/50 transition-all hover:shadow-glow group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold">
                          {project.name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            project.deployments?.some(
                              (d) => d.status === "IN_PROGRESS"
                            )
                              ? "bg-warning/10 text-warning animate-glow"
                              : "bg-success/10 text-success"
                          }`}
                        >
                          {project.deployments?.length &&
                            project.deployments[0].status}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Last deployed{" "}
                          {project.deployments?.[0]?.updatedAt || "N/A"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          {project.deployments?.length} deployments
                        </div>
                      </div>

                      <a
                        href={project.customDomain || project.subDomain}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-glow text-sm flex items-center gap-2 group-hover:underline"
                      >
                        {project.customDomain || project.subDomain}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    <Link to={`/project/${project.subDomain}`}  state={{ project }}>
                      <Button variant="outline">View Details</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Enter your GitHub repository URL to deploy your project
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Repository URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://github.com/username/repository"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
                >
                  Create Project
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
