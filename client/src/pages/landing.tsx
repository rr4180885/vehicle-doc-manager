import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Shield, CheckCircle2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [, navigate] = useLocation();
  const { login, isLoggingIn, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header with icon and branding */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-700">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30 animate-bounce">
              <Car className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Maa Pollution Center
            </h1>
            <p className="text-slate-600 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              Vehicle Document Management System
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </p>
          </div>

          {/* Login Card with enhanced styling */}
          <Card className="border-0 shadow-2xl shadow-indigo-500/20 backdrop-blur-sm bg-white/80 animate-in fade-in slide-in-from-bottom duration-700">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Sign in to manage your vehicle documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02]"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <Car className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Feature highlights */}
          <div className="mt-8 grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs text-slate-600 font-medium">Secure</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-2">
                <Car className="w-6 h-6 text-indigo-600" />
              </div>
              <p className="text-xs text-slate-600 font-medium">Fast Access</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-2">
                <CheckCircle2 className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-xs text-slate-600 font-medium">Reliable</p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-8">
            © 2026 Maa Pollution Center. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
