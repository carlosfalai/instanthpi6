import { Router } from "express";
import crypto from "crypto";

// Sample data for demonstration - in production this would come from a database
let schedulerSettings = [
  {
    id: "vacc-flu",
    name: "Annual Flu Vaccination",
    category: "vaccination",
    description: "Yearly influenza vaccination recommended for all patients",
    enabled: true,
    ageRangeMin: 6,
    ageRangeMax: 110,
    gender: "all",
    frequency: "yearly",
    messageTemplate:
      "It's time for your annual flu shot. This helps protect you against seasonal influenza strains.",
  },
  {
    id: "vacc-tdap",
    name: "Tdap Booster",
    category: "vaccination",
    description: "Tetanus, diphtheria, pertussis booster shot",
    enabled: true,
    ageRangeMin: 11,
    ageRangeMax: 110,
    gender: "all",
    frequency: "every 10 years",
    messageTemplate:
      "Your Tdap booster is due. This vaccination protects against tetanus, diphtheria, and pertussis (whooping cough).",
  },
  {
    id: "screening-mammo",
    name: "Mammogram",
    category: "screening",
    description: "Breast cancer screening",
    enabled: true,
    ageRangeMin: 40,
    ageRangeMax: 75,
    gender: "female",
    frequency: "every 1-2 years",
    messageTemplate: "It's time to schedule your mammogram for breast cancer screening.",
  },
  {
    id: "screening-colon",
    name: "Colonoscopy",
    category: "screening",
    description: "Colorectal cancer screening",
    enabled: true,
    ageRangeMin: 45,
    ageRangeMax: 75,
    gender: "all",
    frequency: "every 10 years",
    messageTemplate:
      "You're due for a colonoscopy screening. This preventative measure helps detect colorectal cancer early.",
  },
  {
    id: "followup-diabetes",
    name: "Diabetes Follow-up",
    category: "followup",
    description: "Regular follow-up for diabetes management",
    enabled: true,
    frequency: "every 3 months",
    messageTemplate:
      "It's time for your quarterly diabetes check-up to monitor your condition and adjust treatment if needed.",
  },
  {
    id: "followup-hypertension",
    name: "Hypertension Check",
    category: "followup",
    description: "Blood pressure monitoring for hypertension patients",
    enabled: true,
    frequency: "every 6 months",
    messageTemplate:
      "Your hypertension follow-up appointment is due. Regular monitoring helps manage your blood pressure effectively.",
  },
  {
    id: "other-annual",
    name: "Annual Physical Exam",
    category: "other",
    description: "Comprehensive yearly health examination",
    enabled: true,
    ageRangeMin: 18,
    ageRangeMax: 110,
    gender: "all",
    frequency: "yearly",
    messageTemplate:
      "It's time for your annual physical examination to assess your overall health status.",
  },
];

let schedulerRecommendations = [
  {
    id: crypto.randomUUID(),
    patientId: 1,
    patientName: "Jessica Thompson",
    type: "vaccination",
    title: "Annual Flu Vaccination",
    description: "Due for yearly influenza vaccination",
    messageTemplate:
      "It's time for your annual flu shot. This helps protect you against seasonal influenza strains.",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    priority: "medium",
    status: "pending",
  },
  {
    id: crypto.randomUUID(),
    patientId: 1,
    patientName: "Jessica Thompson",
    type: "screening",
    title: "Mammogram",
    description: "Due for breast cancer screening",
    messageTemplate: "It's time to schedule your mammogram for breast cancer screening.",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    priority: "high",
    status: "pending",
  },
  {
    id: crypto.randomUUID(),
    patientId: 1,
    patientName: "Jessica Thompson",
    type: "followup",
    title: "Diabetes Follow-up",
    description: "Quarterly diabetes management check-up",
    messageTemplate:
      "It's time for your quarterly diabetes check-up to monitor your condition and adjust treatment if needed.",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    priority: "high",
    status: "scheduled",
  },
];

let upcomingEvents = [
  {
    id: crypto.randomUUID(),
    patientId: 1,
    patientName: "Jessica Thompson",
    title: "Diabetes Follow-up",
    description: "Quarterly diabetes management check-up",
    scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    status: "confirmed",
    messageStatus: "sent",
  },
];

export const schedulerRouter = Router();

// Get scheduler settings
schedulerRouter.get("/settings", (req, res) => {
  res.json(schedulerSettings);
});

// Update a scheduler setting
schedulerRouter.patch("/settings/:id", (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;

  const settingIndex = schedulerSettings.findIndex((setting) => setting.id === id);

  if (settingIndex === -1) {
    return res.status(404).json({ error: "Setting not found" });
  }

  schedulerSettings[settingIndex] = {
    ...schedulerSettings[settingIndex],
    enabled,
  };

  res.json(schedulerSettings[settingIndex]);
});

// Get AI recommendations
schedulerRouter.get("/recommendations", (req, res) => {
  res.json(schedulerRecommendations);
});

// Schedule a recommendation
schedulerRouter.post("/recommendations/:id/schedule", (req, res) => {
  const { id } = req.params;

  const recIndex = schedulerRecommendations.findIndex((rec) => rec.id === id);

  if (recIndex === -1) {
    return res.status(404).json({ error: "Recommendation not found" });
  }

  // Update the recommendation status
  schedulerRecommendations[recIndex] = {
    ...schedulerRecommendations[recIndex],
    status: "scheduled",
  };

  // Add to upcoming events
  const newEvent = {
    id: crypto.randomUUID(),
    patientId: schedulerRecommendations[recIndex].patientId,
    patientName: schedulerRecommendations[recIndex].patientName,
    title: schedulerRecommendations[recIndex].title,
    description: schedulerRecommendations[recIndex].description,
    scheduledDate: schedulerRecommendations[recIndex].dueDate,
    status: "scheduled",
    messageStatus: "pending",
  };

  upcomingEvents.push(newEvent);

  res.json(schedulerRecommendations[recIndex]);
});

// Dismiss a recommendation
schedulerRouter.post("/recommendations/:id/dismiss", (req, res) => {
  const { id } = req.params;

  const recIndex = schedulerRecommendations.findIndex((rec) => rec.id === id);

  if (recIndex === -1) {
    return res.status(404).json({ error: "Recommendation not found" });
  }

  schedulerRecommendations[recIndex] = {
    ...schedulerRecommendations[recIndex],
    status: "dismissed",
  };

  res.json(schedulerRecommendations[recIndex]);
});

// Get upcoming scheduled events
schedulerRouter.get("/upcoming", (req, res) => {
  res.json(upcomingEvents);
});
