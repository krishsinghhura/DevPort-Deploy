import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import { toast } from "sonner";
import {BASE_URL} from "@/config"

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await fetch(`${BASE_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Signin failed");
    }

    const data = await res.json();

    // Save JWT token to localStorage
    localStorage.setItem("token", data.token);

    toast.success("Signed in successfully!");
    navigate("/dashboard");
  } catch (error: any) {
    toast.error(error.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl"></div>
      
      <Card className="w-full max-w-md p-8 bg-card/80 backdrop-blur-xl border-border shadow-card relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-lg bg-gradient-primary shadow-glow mb-4">
            <Rocket className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            DevPort-Deploy
          </h1>
          <p className="text-muted-foreground mt-2">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-glow">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background border-border"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:text-primary-glow font-medium">
            Sign up
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default SignIn;
