import { apiRequest } from "@/lib/queryClient";
import { UrgentCareRequest } from "@shared/schema";

interface UrgentCareResponse {
  patient: {
    id: number;
    name: string;
    gender: string;
    age: number;
  } | null;
  messageContent: string | null;
}

export type UrgentCareWithDetails = UrgentCareRequest & UrgentCareResponse;

export interface AnalyzeMessageResponse {
  message: string;
  analysis: {
    requestType: "new_problem" | "medication_refill" | "follow_up" | "symptom_check" | "other";
    isNewConsultation: boolean;
    priority: "high" | "medium" | "low";
    problemDescription: string;
    analysisNotes: string;
    waitingFor: "patient_reply" | "lab_results" | "symptoms_resolution" | "medication_effect" | "specialist_input" | "other";
    waitingForDetails: string;
  };
  request?: UrgentCareRequest;
}

// Get all urgent care requests (with filtering options)
export async function getUrgentCareRequests(
  params?: {
    status?: string;
    type?: string;
    timeframe?: number;
  }
): Promise<UrgentCareWithDetails[]> {
  // Build query parameters
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.type) queryParams.append("type", params.type);
  if (params?.timeframe) queryParams.append("timeframe", params.timeframe.toString());
  
  const queryString = queryParams.toString();
  const url = `/api/urgent-care${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiRequest("GET", url);
  const data = await response.json();
  return data;
}

// Get a specific urgent care request by ID
export async function getUrgentCareRequest(id: number): Promise<UrgentCareWithDetails> {
  const response = await apiRequest("GET", `/api/urgent-care/${id}`);
  return await response.json();
}

// Create a new urgent care request manually
export async function createUrgentCareRequest(requestData: Partial<UrgentCareRequest>): Promise<UrgentCareRequest> {
  const response = await apiRequest("POST", "/api/urgent-care", requestData);
  return await response.json();
}

// Process a patient message to determine if it's a new problem/consultation
export async function analyzeMessage(
  messageId: number,
  patientId: number,
  content: string
): Promise<AnalyzeMessageResponse> {
  const response = await apiRequest("POST", "/api/urgent-care/analyze-message", {
    messageId,
    patientId,
    content
  });
  return await response.json();
}

// Update an urgent care request status
export async function updateUrgentCareRequest(
  id: number,
  updates: {
    status?: string;
    notes?: string;
    doctorAssignedId?: number;
    waitingFor?: string;
    waitingForDetails?: string;
  }
): Promise<UrgentCareRequest> {
  const response = await apiRequest("PATCH", `/api/urgent-care/${id}`, updates);
  return await response.json();
}