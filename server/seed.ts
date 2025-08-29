import { storage } from "./storage";

export async function seedDatabase() {
  try {
    // Check if we already have patients
    const existingPatients = await storage.getPatients();
    if (existingPatients.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database with sample data...");

    // Create sample patients with muted data consistent with your preferences
    const patients = [
      {
        name: "Marie Dubois",
        email: "marie.dubois@email.com",
        phone: "514-555-0101",
        dateOfBirth: "1985-03-15",
        gender: "female",
        language: "french" as const,
        spruceId: "spruce_patient_001",
        ramqVerified: true,
        chronicConditions: ["hypertension"],
        allergies: ["penicillin"],
        currentMedications: ["lisinopril 10mg"],
        emergencyContact: "Jean Dubois - 514-555-0102",
      },
      {
        name: "Jean Tremblay",
        email: "jean.tremblay@email.com",
        phone: "514-555-0103",
        dateOfBirth: "1978-11-22",
        gender: "male",
        language: "french" as const,
        spruceId: "spruce_patient_002",
        ramqVerified: true,
        chronicConditions: ["diabetes"],
        allergies: [],
        currentMedications: ["metformin 500mg"],
        emergencyContact: "Sophie Tremblay - 514-555-0104",
      },
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@email.com",
        phone: "514-555-0105",
        dateOfBirth: "1990-07-08",
        gender: "female",
        language: "english" as const,
        spruceId: "spruce_patient_003",
        ramqVerified: false,
        chronicConditions: [],
        allergies: ["shellfish"],
        currentMedications: [],
        emergencyContact: "Mike Johnson - 514-555-0106",
      },
      {
        name: "Robert Chen",
        email: "robert.chen@email.com",
        phone: "514-555-0107",
        dateOfBirth: "1982-12-03",
        gender: "male",
        language: "english" as const,
        spruceId: "spruce_patient_004",
        ramqVerified: true,
        chronicConditions: ["asthma"],
        allergies: ["pollen"],
        currentMedications: ["salbutamol inhaler"],
        emergencyContact: "Linda Chen - 514-555-0108",
      },
    ];

    // Create patients
    for (const patientData of patients) {
      const patient = await storage.createPatient(patientData);
      console.log(`Created patient: ${patient.name}`);

      // Create some sample messages for each patient
      await storage.createMessage({
        patientId: patient.id,
        senderId: 1, // Doctor's ID
        content:
          patient.language === "french"
            ? "Bonjour docteur, j'ai des questions concernant mes médicaments."
            : "Hello doctor, I have some questions about my medications.",
        isFromPatient: true,
        spruceMessageId: `msg_${patient.id}_001`,
      });

      // Create sample pending items
      if (patientData.chronicConditions && patientData.chronicConditions.length > 0) {
        await storage.createPendingItem({
          patientId: patient.id,
          type: "bloodwork",
          description: "Annual bloodwork for chronic condition monitoring",
          priority: "medium",
          status: "pending",
        });
      }
    }

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
