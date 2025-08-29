import { Router } from "express";
import crypto from "crypto";

// Sample message templates for demonstration
const messageTemplates = [
  {
    id: crypto.randomUUID(),
    name: "Appointment Reminder",
    content:
      "Hello {patient_name}, this is a reminder about your upcoming appointment at InstantHPI. Please confirm your attendance by replying to this message. If you need to reschedule, please call us.",
  },
  {
    id: crypto.randomUUID(),
    name: "Vaccination Reminder",
    content:
      "Hello {patient_name}, it's time for your vaccination. Please schedule an appointment at your earliest convenience to ensure your immunization is up-to-date.",
  },
  {
    id: crypto.randomUUID(),
    name: "Follow-up Check",
    content:
      "Hello {patient_name}, we're following up on your recent visit. How are you feeling? Please let us know if you have any questions or concerns about your treatment.",
  },
  {
    id: crypto.randomUUID(),
    name: "Lab Results Notification",
    content:
      "Hello {patient_name}, your lab results are available. Please schedule a follow-up appointment to discuss your results with your healthcare provider.",
  },
  {
    id: crypto.randomUUID(),
    name: "Medication Refill",
    content:
      "Hello {patient_name}, this is a reminder that your medication refill is due. Please contact us if you need a prescription renewal.",
  },
];

// Message history for demonstration
const messageHistory: {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  message: string;
  timestamp: string;
  status: "sent" | "delivered" | "failed";
}[] = [];

export const messagingRouter = Router();

// Get all message templates
messagingRouter.get("/templates", (req, res) => {
  res.json(messageTemplates);
});

// Get a specific message template
messagingRouter.get("/templates/:id", (req, res) => {
  const { id } = req.params;
  const template = messageTemplates.find((t) => t.id === id);

  if (!template) {
    return res.status(404).json({ error: "Message template not found" });
  }

  res.json(template);
});

// Create a new message template
messagingRouter.post("/templates", (req, res) => {
  const { name, content } = req.body;

  if (!name || !content) {
    return res.status(400).json({ error: "Name and content are required" });
  }

  const newTemplate = {
    id: crypto.randomUUID(),
    name,
    content,
  };

  messageTemplates.push(newTemplate);
  res.status(201).json(newTemplate);
});

// Update a message template
messagingRouter.patch("/templates/:id", (req, res) => {
  const { id } = req.params;
  const { name, content } = req.body;

  const templateIndex = messageTemplates.findIndex((t) => t.id === id);

  if (templateIndex === -1) {
    return res.status(404).json({ error: "Message template not found" });
  }

  messageTemplates[templateIndex] = {
    ...messageTemplates[templateIndex],
    ...(name && { name }),
    ...(content && { content }),
  };

  res.json(messageTemplates[templateIndex]);
});

// Delete a message template
messagingRouter.delete("/templates/:id", (req, res) => {
  const { id } = req.params;
  const templateIndex = messageTemplates.findIndex((t) => t.id === id);

  if (templateIndex === -1) {
    return res.status(404).json({ error: "Message template not found" });
  }

  messageTemplates.splice(templateIndex, 1);
  res.status(204).end();
});

// Endpoint for mass messaging
messagingRouter.post("/mass-send", (req, res) => {
  const { patients, message, templateId } = req.body;

  if (!patients || !Array.isArray(patients) || patients.length === 0) {
    return res.status(400).json({ error: "Valid patient list is required" });
  }

  if (!message) {
    return res.status(400).json({ error: "Message content is required" });
  }

  // Enforce patient limit
  if (patients.length > 500) {
    return res.status(400).json({
      error: "Patient list exceeds the maximum limit of 500 patients",
    });
  }

  // Process each patient and send message
  // In a real application, this would integrate with Spruce Health API
  // or another messaging service
  const sentMessages = patients.map((patient) => {
    let personalizedMessage = message;

    // Variable replacement
    personalizedMessage = personalizedMessage
      .replace(/\{patient_name\}/g, patient.name)
      .replace(/\{patient_phone\}/g, patient.phone);

    if (patient.email) {
      personalizedMessage = personalizedMessage.replace(/\{patient_email\}/g, patient.email);
    }

    // Log the message in history
    const messageRecord = {
      id: crypto.randomUUID(),
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      message: personalizedMessage,
      timestamp: new Date().toISOString(),
      status: "sent" as const, // In a real app, this would be set based on actual delivery status
    };

    messageHistory.push(messageRecord);

    return messageRecord;
  });

  // In a real application, we would return actual success/failure counts
  res.json({
    message: "Messages processed",
    totalCount: patients.length,
    successCount: patients.length,
    failureCount: 0,
    details: sentMessages.map((msg) => ({
      patientId: msg.patientId,
      patientName: msg.patientName,
      status: msg.status,
    })),
  });
});

// Get message history
messagingRouter.get("/history", (req, res) => {
  res.json(messageHistory);
});
