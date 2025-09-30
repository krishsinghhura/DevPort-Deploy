import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Rocket, Zap, Shield, BarChart3, Terminal, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Landing = () => {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast Deployments",
      description: "Deploy your applications in seconds with our optimized build pipeline and global CDN.",
    },
    {
      icon: Terminal,
      title: "Real-time Logs",
      description: "Monitor your deployments with live logs streaming directly to your dashboard.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with automatic SSL certificates and DDoS protection.",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track performance metrics, user analytics, and deployment statistics in real-time.",
    },
    {
      icon: Globe,
      title: "Global Edge Network",
      description: "Deliver content at blazing speeds with our worldwide edge network infrastructure.",
    },
    {
      icon: Rocket,
      title: "Zero Configuration",
      description: "Get started instantly with automatic framework detection and smart defaults.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
            <div className="inline-block">
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                ✨ Ship faster with DevPort-Deploy
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Deploy Your Projects
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                In Seconds
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The deployment platform built for speed. Push your code and watch it go live instantly 
              with real-time monitoring and analytics.
            </p>
            
            <div className="flex gap-4 justify-center pt-4">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 text-lg px-8">
                  Start Deploying Free
                </Button>
              </Link>
              <Link to="/docs">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  View Documentation
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full"></div>
            <div className="relative bg-card border border-border shadow-card rounded-2xl p-8 max-w-5xl mx-auto">
              <div className="bg-muted/50 rounded-lg p-6 font-mono text-sm text-left">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-destructive"></div>
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                </div>
                <div className="space-y-2 text-muted-foreground">
                  <p>$ git push origin main</p>
                  <p className="text-primary">✓ Building your project...</p>
                  <p className="text-primary">✓ Deploying to production...</p>
                  <p className="text-success">✓ Deployed successfully!</p>
                  <p className="text-foreground">🚀 https://your-project.devport-deploy.app</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <span className="bg-gradient-accent bg-clip-text text-transparent"> Ship Fast</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features that make deployment effortless and monitoring insightful.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 bg-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 inline-block p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-primary p-12 text-center border-none shadow-glow relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
                Ready to Ship Faster?
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Join thousands of developers who trust DevPort-Deploy for their deployments.
              </p>
              <Link to="/signup">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="text-lg px-8 bg-background text-foreground hover:bg-background/90"
                >
                  Get Started for Free
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
