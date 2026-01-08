import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, AlertTriangle, Copy } from "lucide-react";

export default function LoginDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const runDiagnostics = () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const results = {
        timestamp: new Date().toISOString(),
        domain: window.location.origin,
        environment: {
          supabaseUrl: {
            present: !!supabaseUrl,
            valid: supabaseUrl?.startsWith("https://"),
            value: supabaseUrl || "MISSING",
            firstChars: supabaseUrl?.substring(0, 40) || "N/A",
          },
          supabaseAnonKey: {
            present: !!supabaseAnonKey,
            valid: (supabaseAnonKey?.length || 0) > 50,
            length: supabaseAnonKey?.length || 0,
            firstChars: supabaseAnonKey?.substring(0, 30) || "N/A",
          },
        },
        localStorage: {
          doctor_authenticated: localStorage.getItem("doctor_authenticated"),
          doctor_info: localStorage.getItem("doctor_info"),
        },
        sessionStorage: {
          doctor_authenticated: sessionStorage.getItem("doctor_authenticated"),
          doctor_info: sessionStorage.getItem("doctor_info"),
        },
        issues: [] as string[],
        status: "✅ READY" as string,
      };

      // Check for issues
      if (!supabaseUrl) {
        results.issues.push(
          "❌ VITE_SUPABASE_URL not set - add to Netlify environment variables"
        );
        results.status = "❌ BLOCKED";
      } else if (!supabaseUrl.startsWith("https://")) {
        results.issues.push(
          "❌ VITE_SUPABASE_URL must be HTTPS - current value is invalid"
        );
        results.status = "❌ BLOCKED";
      }

      if (!supabaseAnonKey) {
        results.issues.push(
          "❌ VITE_SUPABASE_ANON_KEY not set - add to Netlify environment variables"
        );
        results.status = "❌ BLOCKED";
      } else if (supabaseAnonKey.length < 50) {
        results.issues.push(
          "❌ VITE_SUPABASE_ANON_KEY appears invalid (too short) - check Netlify settings"
        );
        results.status = "❌ BLOCKED";
      }

      if (results.issues.length === 0) {
        results.status = "✅ OAuth Ready";
      }

      setDiagnostics(results);

      // Also log to console
      console.group("🔍 InstantConsult Login Diagnostics");
      console.log("Full Report:", results);
      if (results.issues.length > 0) {
        console.error("Issues Found:", results.issues);
      } else {
        console.log("✅ All checks passed - OAuth should work");
      }
      console.groupEnd();
    };

    runDiagnostics();
  }, []);

  const handleCopyJson = () => {
    if (diagnostics) {
      navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!diagnostics)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading diagnostics...</p>
      </div>
    );

  const hasIssues = diagnostics.issues.length > 0;
  const isBlocked = diagnostics.status.includes("BLOCKED");

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">🔍 Consultation Platform Diagnostics</h1>
          <p className="text-muted-foreground">
            Check your OAuth configuration status
          </p>
        </div>

        {/* Status Banner */}
        <div
          className={`border rounded-lg p-4 flex items-start gap-3 ${isBlocked
              ? "bg-red-900/20 border-red-700/50"
              : "bg-green-900/20 border-green-700/50"
            }`}
        >
          {isBlocked ? (
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
          )}
          <div>
            <h2 className="font-semibold text-lg">{diagnostics.status}</h2>
            <p className="text-sm text-muted-foreground">
              {isBlocked
                ? "Configuration issues detected - OAuth will not work"
                : "Configuration looks good - OAuth should work"}
            </p>
          </div>
        </div>

        {/* Issues */}
        {hasIssues && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-red-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Issues Found
            </h3>
            <ul className="space-y-2">
              {diagnostics.issues.map((issue: string, i: number) => (
                <li key={i} className="text-sm text-foreground">
                  • {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Environment Variables */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Environment Variables</h3>

          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            {/* Supabase URL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-mono text-sm text-primary">
                  VITE_SUPABASE_URL
                </label>
                {diagnostics.environment.supabaseUrl.present ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="bg-background p-2 rounded border border-border font-mono text-xs text-muted-foreground break-all">
                {diagnostics.environment.supabaseUrl.firstChars}
                {diagnostics.environment.supabaseUrl.value.length > 40 &&
                  "..."}
              </div>
              <p className="text-xs text-muted-foreground">
                {diagnostics.environment.supabaseUrl.valid
                  ? "✓ Valid HTTPS URL"
                  : "✗ Not set or invalid"}
              </p>
            </div>

            {/* Anon Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-mono text-sm text-primary">
                  VITE_SUPABASE_ANON_KEY
                </label>
                {diagnostics.environment.supabaseAnonKey.present ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="bg-background p-2 rounded border border-border font-mono text-xs text-muted-foreground break-all">
                {diagnostics.environment.supabaseAnonKey.firstChars}...
              </div>
              <p className="text-xs text-muted-foreground">
                Length: {diagnostics.environment.supabaseAnonKey.length} chars
                {diagnostics.environment.supabaseAnonKey.valid
                  ? " ✓"
                  : " ✗ (should be 100+)"}
              </p>
            </div>
          </div>
        </div>

        {/* Auth State */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Current Auth State</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-mono text-sm text-primary mb-2">
                localStorage
              </h4>
              <div className="space-y-1 text-xs">
                <p>
                  doctor_authenticated:{" "}
                  <code className="text-primary">
                    {diagnostics.localStorage.doctor_authenticated || "null"}
                  </code>
                </p>
                <p className="text-muted-foreground">
                  {diagnostics.localStorage.doctor_info
                    ? "Has doctor_info"
                    : "No doctor_info"}
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-mono text-sm text-primary mb-2">
                sessionStorage
              </h4>
              <div className="space-y-1 text-xs">
                <p>
                  doctor_authenticated:{" "}
                  <code className="text-primary">
                    {diagnostics.sessionStorage.doctor_authenticated || "null"}
                  </code>
                </p>
                <p className="text-muted-foreground">
                  {diagnostics.sessionStorage.doctor_info
                    ? "Has doctor_info"
                    : "No doctor_info"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Domain Info */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Domain & Redirect Info</h3>

          <div className="bg-card border border-border rounded-lg p-4 space-y-3 font-mono text-xs">
            <div>
              <p className="text-muted-foreground mb-1">Current Domain</p>
              <p className="text-primary break-all">{diagnostics.domain}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Auth Callback URL</p>
              <p className="text-primary break-all">
                {diagnostics.domain}/auth/callback
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Consultant Dashboard Redirect</p>
              <p className="text-primary break-all">
                {diagnostics.domain}/doctor-dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Full Report */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Full Diagnostics Report</h3>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">JSON Report</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyJson}
                className="border-border text-primary hover:bg-secondary"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="bg-background p-3 rounded border border-border font-mono text-xs text-muted-foreground overflow-auto max-h-64">
              {JSON.stringify(diagnostics, null, 2)}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => window.location.href = "/doctor-login"}
            className="flex-1 bg-primary hover:bg-primary/90 text-white"
          >
            Back to Login
          </Button>

          {isBlocked && (
            <Button
              onClick={() => {
                const report = JSON.stringify(diagnostics, null, 2);
                console.error("Diagnostics Report:", report);
                alert(
                  "Check browser console (F12) for full diagnostics report"
                );
              }}
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-secondary"
            >
              View Full Report
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 text-sm text-foreground">
          <p className="font-semibold mb-2">ℹ️ How to Fix</p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
            <li>Go to Netlify Dashboard → Project Settings</li>
            <li>Navigate to Build & Deploy → Environment</li>
            <li>Add: VITE_SUPABASE_URL = https://uoahrhroyqsqixusewwe.supabase.co</li>
            <li>Add: VITE_SUPABASE_ANON_KEY = (your 128-char key)</li>
            <li>Trigger a new deploy</li>
            <li>Wait for build to complete</li>
            <li>Refresh this page to verify</li>
          </ol>
        </div>
      </div>
    </div>
  );
}



















