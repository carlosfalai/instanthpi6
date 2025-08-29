import { useEffect, useState } from "react";
import { ConversationStatus } from "@/components/ai/ConversationStatusBar";

interface Message {
  id: number;
  patientId: number;
  senderId: number;
  content: string;
  timestamp: string;
  isFromPatient: boolean;
  spruceMessageId: string | null;
}

interface Patient {
  id: number;
  name: string;
  // Other patient fields not used in this hook
}

/**
 * Analyzes messages to determine the current status of a conversation
 */
export function useConversationStatus(messages: Message[], patient?: Patient | null) {
  const [status, setStatus] = useState<ConversationStatus>("unknown");
  const [statusDetail, setStatusDetail] = useState<string>("");

  useEffect(() => {
    if (!messages || messages.length === 0) {
      setStatus("unknown");
      setStatusDetail("");
      return;
    }

    // Sort messages by timestamp
    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Find the most recent messages for analysis
    const lastMessage = sortedMessages[sortedMessages.length - 1];
    const lastDoctorMessage = sortedMessages.filter((m) => !m.isFromPatient).pop();
    const lastPatientMessage = sortedMessages.filter((m) => m.isFromPatient).pop();

    // Check for pharmacy information request
    const askingForPharmacy = sortedMessages.some(
      (m) =>
        !m.isFromPatient &&
        m.content.toLowerCase().includes("pharmacy") &&
        (m.content.toLowerCase().includes("what is") ||
          m.content.toLowerCase().includes("provide") ||
          m.content.toLowerCase().includes("send"))
    );

    // Check for treatment plan
    const proposingTreatment = sortedMessages.some(
      (m) =>
        !m.isFromPatient &&
        (m.content.toLowerCase().includes("plan:") ||
          m.content.toLowerCase().includes("treatment:") ||
          m.content.toLowerCase().includes("prescription:") ||
          m.content.toLowerCase().includes("prescribing"))
    );

    // Check for patient acknowledgment of plan
    const patientAcknowledged =
      proposingTreatment &&
      lastPatientMessage &&
      new Date(lastPatientMessage.timestamp).getTime() >
        new Date(lastDoctorMessage?.timestamp || 0).getTime() &&
      (lastPatientMessage.content.toLowerCase().includes("thank") ||
        lastPatientMessage.content.toLowerCase().includes("got it") ||
        lastPatientMessage.content.toLowerCase().includes("sounds good") ||
        lastPatientMessage.content.toLowerCase().includes("ok") ||
        lastPatientMessage.content.toLowerCase().includes("understand"));

    // Check if doctor is asking a clarification question
    const askingClarification =
      lastDoctorMessage &&
      lastDoctorMessage.content.includes("?") &&
      !proposingTreatment &&
      !askingForPharmacy;

    // Determine conversation status
    if (sortedMessages.length <= 2) {
      setStatus("initial");
      setStatusDetail("New conversation");
    } else if (
      askingForPharmacy &&
      lastMessage.senderId !== patient?.id &&
      !lastPatientMessage?.content.toLowerCase().includes("pharmacy")
    ) {
      setStatus("waiting_patient_info");
      setStatusDetail("Waiting for pharmacy information");
    } else if (askingClarification && lastMessage.senderId !== patient?.id) {
      setStatus("waiting_clarification");
      setStatusDetail(lastDoctorMessage?.content.split("?")[0] + "?");
    } else if (proposingTreatment && patientAcknowledged) {
      setStatus("plan_acknowledged");
      setStatusDetail("Patient acknowledged treatment plan");
    } else if (proposingTreatment) {
      setStatus("treatment_proposed");
      // Extract the first line of the plan for the detail
      const planContent = lastDoctorMessage?.content
        .split("\n")
        .find(
          (line) =>
            line.toLowerCase().includes("plan:") ||
            line.toLowerCase().includes("treatment:") ||
            line.toLowerCase().includes("prescription:")
        );
      setStatusDetail(planContent || "Treatment plan sent to patient");
    } else {
      setStatus("unknown");
      setStatusDetail("");
    }
  }, [messages, patient]);

  return { status, statusDetail };
}
