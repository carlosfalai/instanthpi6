import { describe, it, expect, beforeEach } from "vitest";
import { MemStorage } from "./storage";

describe("MemStorage", () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe("Patient Management", () => {
    it("should create a patient successfully", async () => {
      const patientData = {
        name: "John Doe",
        gender: "male",
        dateOfBirth: "1990-01-01",
        email: "john@example.com",
        phone: "555-0123",
      };

      const patient = await storage.createPatient(patientData);

      expect(patient).toMatchObject(patientData);
      expect(patient.id).toBeDefined();
      expect(typeof patient.id).toBe("number");
    });

    it("should retrieve patients", async () => {
      const patientData = {
        name: "Jane Doe",
        gender: "female",
        dateOfBirth: "1985-05-15",
        email: "jane@example.com",
        phone: "555-0456",
      };

      await storage.createPatient(patientData);
      const patients = await storage.getPatients();

      expect(patients).toHaveLength(1);
      expect(patients[0]).toMatchObject(patientData);
    });

    it("should search patients by name", async () => {
      await storage.createPatient({
        name: "Alice Smith",
        gender: "female",
        dateOfBirth: "1992-03-20",
        email: "alice@example.com",
        phone: "555-1111",
      });

      await storage.createPatient({
        name: "Bob Johnson",
        gender: "male",
        dateOfBirth: "1988-07-10",
        email: "bob@example.com",
        phone: "555-2222",
      });

      const searchResults = await storage.searchPatients("Alice");
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe("Alice Smith");
    });
  });

  describe("Message Management", () => {
    it("should create and retrieve messages", async () => {
      const patient = await storage.createPatient({
        name: "Test Patient",
        gender: "male",
        dateOfBirth: "1990-01-01",
        email: "test@example.com",
        phone: "555-0000",
      });

      const messageData = {
        patientId: patient.id,
        senderId: 1,
        content: "Hello, doctor!",
        isFromPatient: true,
      };

      const message = await storage.createMessage(messageData);
      expect(message).toMatchObject(messageData);

      const messages = await storage.getMessagesByPatientId(patient.id);
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe("Hello, doctor!");
    });
  });
});
