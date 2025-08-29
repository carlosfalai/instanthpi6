import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Phone, Shield, ArrowRight, RefreshCw } from "lucide-react";

export default function DoctorLoginSMS() {
  const [, navigate] = useLocation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Format phone number for display
  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits, spaces, hyphens, parentheses, and plus
    const cleaned = value.replace(/[^\d\s\-()+ ]/g, "");
    setPhoneNumber(cleaned);
  };

  // Handle OTP input
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  // Send OTP
  const sendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setStep("verify");
      // Start resend timer (60 seconds)
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid verification code");
      }

      // Store auth token
      localStorage.setItem("doctor_auth_token", data.token);
      localStorage.setItem("doctor_phone", data.phoneNumber);

      // Navigate to dashboard
      navigate("/doctor/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      // Restart timer
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Doctor Portal - InstantHPI</CardTitle>
          <CardDescription>
            {step === "phone"
              ? "Enter your registered phone number"
              : "Enter the 6-digit code sent to your phone"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            // Phone number step
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(450) 444-1234"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  disabled={loading}
                  className="text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Enter your 10-digit phone number</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>
              )}

              <Button
                onClick={sendOTP}
                disabled={loading || phoneNumber.replace(/\D/g, "").length < 10}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          ) : (
            // OTP verification step
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Code sent to{" "}
                  <span className="font-semibold">{formatPhoneDisplay(phoneNumber)}</span>
                </p>
              </div>

              <div>
                <Label htmlFor="otp" className="flex items-center gap-2 mb-2">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength={6}
                  disabled={loading}
                  className="text-2xl text-center font-mono tracking-wider"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>
              )}

              <Button
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Login"
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setError("");
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Change number
                </button>

                <button
                  onClick={resendOTP}
                  disabled={resendTimer > 0 || loading}
                  className={`${
                    resendTimer > 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:underline"
                  }`}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              By logging in, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Help text */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-sm text-gray-600">
          Need help?{" "}
          <a href="mailto:support@instanthpi.ca" className="text-blue-600 hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
