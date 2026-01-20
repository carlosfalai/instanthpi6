import { Router, Request, Response } from "express";
import twilio from "twilio";
import crypto from "crypto";

const router = Router();

// Twilio credentials from environment variables (REQUIRED)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Validate required credentials at startup
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error("[Twilio] Missing required environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER");
}

// Initialize Twilio client
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; timestamp: number; attempts: number }>();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (now - data.timestamp > 600000) {
      // 10 minutes expiry
      otpStore.delete(phone);
    }
  }
}, 300000);

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Format phone number for Twilio (ensure it has country code)
function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, "");

  // Add +1 for North America if not present
  if (cleaned.length === 10) {
    cleaned = "1" + cleaned;
  }

  // Add + prefix
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  return cleaned;
}

// Send OTP via SMS
router.post("/send-otp", async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const otp = generateOTP();

    // Store OTP with timestamp
    otpStore.set(formattedPhone, {
      otp,
      timestamp: Date.now(),
      attempts: 0,
    });

    console.log(`Generated OTP for ${formattedPhone}: ${otp}`); // Log for debugging

    // Send SMS via Twilio
    try {
      const message = await twilioClient.messages.create({
        body: `Your InstantHPI verification code is: ${otp}. Valid for 10 minutes.`,
        from: TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });

      console.log(`OTP sent successfully to ${formattedPhone}: ${message.sid}`);

      res.json({
        success: true,
        message: "OTP sent successfully",
        phoneNumber: formattedPhone.replace(/(\d{1,3})(\d{3})(\d{3})(\d{4})/, "+$1 ($2) $3-$4"),
      });
    } catch (twilioError: any) {
      console.error("Twilio error:", twilioError);

      // For development/testing, you can still return success and show OTP in console
      if (process.env.NODE_ENV === "development") {
        console.log(`Development mode - OTP for ${formattedPhone}: ${otp}`);
        res.json({
          success: true,
          message: "OTP sent successfully (dev mode - check console)",
          phoneNumber: formattedPhone.replace(/(\d{1,3})(\d{3})(\d{3})(\d{4})/, "+$1 ($2) $3-$4"),
          devOtp: otp, // Only in dev mode
        });
      } else {
        throw twilioError;
      }
    }
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
});

// Verify OTP
router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Manual OTP verification
    const storedData = otpStore.get(formattedPhone);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    // Check expiry (10 minutes)
    if (Date.now() - storedData.timestamp > 600000) {
      otpStore.delete(formattedPhone);
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // Check attempts
    if (storedData.attempts >= 3) {
      otpStore.delete(formattedPhone);
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts",
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts++;
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsRemaining: 3 - storedData.attempts,
      });
    }

    // OTP is valid
    otpStore.delete(formattedPhone);

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString("hex");

    // In production, you would store this token in a database
    // For now, we'll just return it

    res.json({
      success: true,
      message: "OTP verified successfully",
      token: sessionToken,
      phoneNumber: formattedPhone,
    });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
});

// Resend OTP
router.post("/resend-otp", async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Check if there's a recent OTP (prevent spam)
    const existingOtp = otpStore.get(formattedPhone);
    if (existingOtp && Date.now() - existingOtp.timestamp < 60000) {
      // 1 minute cooldown
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting a new OTP",
        waitTime: Math.ceil((60000 - (Date.now() - existingOtp.timestamp)) / 1000),
      });
    }

    // Send new OTP
    const otp = generateOTP();
    otpStore.set(formattedPhone, {
      otp,
      timestamp: Date.now(),
      attempts: 0,
    });

    console.log(`Generated new OTP for ${formattedPhone}: ${otp}`);

    try {
      await twilioClient.messages.create({
        body: `Your new InstantHPI verification code is: ${otp}. Valid for 10 minutes.`,
        from: TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });

      res.json({
        success: true,
        message: "New OTP sent successfully",
      });
    } catch (twilioError: any) {
      console.error("Error sending SMS:", twilioError);

      // For development/testing
      if (process.env.NODE_ENV === "development") {
        console.log(`Development mode - New OTP for ${formattedPhone}: ${otp}`);
        res.json({
          success: true,
          message: "New OTP sent successfully (dev mode - check console)",
          devOtp: otp, // Only in dev mode
        });
      } else {
        throw twilioError;
      }
    }
  } catch (error: any) {
    console.error("Error resending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
      error: error.message,
    });
  }
});

// Health check endpoint
router.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Twilio auth service is running",
    twilioConfigured: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER),
  });
});

export { router };
