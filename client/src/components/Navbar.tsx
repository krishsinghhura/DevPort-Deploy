import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/signin" || location.pathname === "/signup";
  const isDashboard = location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/project");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-gradient-primary shadow-glow transition-all group-hover:scale-110">
            <Rocket className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            DevPort-Deploy
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {!isDashboard && (
            <>
              <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link to="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </Link>
            </>
          )}
          
          {!isAuthPage && !isDashboard && (
            <div className="flex items-center gap-3">
              <Link to="/signin">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {isDashboard && (
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
