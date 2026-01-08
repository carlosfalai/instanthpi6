// NOTE: This is an alternative standalone Supabase-focused server
// The main server entry point is server/index.ts which includes this functionality
// This file can be used for Supabase-specific deployments or testing

import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config({ path: ".env.production" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/dist")));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "InstantHPI Medical Platform" });
});

// Messages endpoint
app.get("/api/messages", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { patient_id, content, subject, sender } = req.body;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        patient_id,
        content,
        subject,
        sender: sender || "provider",
        status: "sent",
      })
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Patients endpoint
app.get("/api/patients", async (req, res) => {
  try {
    const { data, error } = await supabase.from("patients").select("*").order("name");

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/patients", async (req, res) => {
  try {
    const { name, email, phone, date_of_birth } = req.body;

    const { data, error } = await supabase
      .from("patients")
      .insert({
        name,
        email,
        phone,
        date_of_birth,
      })
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Appointments endpoint
app.get("/api/appointments", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, patients(name, email)")
      .order("appointment_date", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/appointments", async (req, res) => {
  try {
    const { patient_id, appointment_date, appointment_type, notes } = req.body;

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patient_id,
        appointment_date,
        appointment_type,
        notes,
      })
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscriptions endpoint
app.get("/api/subscriptions", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, patients(name, email)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Spruce Health webhook endpoint
app.post("/api/webhook/spruce", async (req, res) => {
  try {
    const { event, data: webhookData } = req.body;

    if (event === "message.received") {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          spruce_message_id: webhookData.id,
          content: webhookData.content,
          sender: "patient",
          status: "unread",
          priority: webhookData.priority || "normal",
        })
        .select();

      if (error) throw error;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve React app for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

if (process.argv[1] && process.argv[1].endsWith('supabase-server.ts')) {
  app.listen(PORT, () => {
    console.log(`🚀 InstantHPI Server running on port ${PORT}`);
    console.log(`🔐 Connected to Supabase: ${process.env.SUPABASE_URL}`);
  });
}
