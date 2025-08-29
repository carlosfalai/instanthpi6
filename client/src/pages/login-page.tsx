import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Check password (you can change this password)
      const SITE_PASSWORD = "doctor123"; // Change this to your desired password

      if (password === SITE_PASSWORD) {
        // Store authentication in session storage
        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("authTime", Date.now().toString());

        toast({
          title: "Login successful",
          description: "Welcome to InstantHPI",
        });

        // Force page reload to properly initialize authenticated session
        window.location.href = "/";
      } else {
        setError("Invalid password. Please try again.");
        toast({
          title: "Login failed",
          description: "Invalid password",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      <Card className="w-full max-w-md mx-4 relative z-10 bg-gray-800/90 backdrop-blur-sm border-gray-700">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-blue-600/20">
              <Lock className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">
            InstantHPI Access
          </CardTitle>
          <p className="text-center text-gray-400 text-sm">
            This site is password protected. Please enter the access password to continue.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter access password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Access Site"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              © 2025 InstantHPI. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 text-center mt-2">
              For access issues, contact your administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
