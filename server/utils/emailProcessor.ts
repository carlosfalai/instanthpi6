import * as nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';

// Configuration for email processing
const EMAIL_CONFIG = {
  // Your clinic's email credentials
  host: process.env.EMAIL_HOST || 'imap.example.com',
  port: parseInt(process.env.EMAIL_PORT || '993', 10),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASSWORD || 'password',
  },
  tls: {
    rejectUnauthorized: false,
  },
};

// Directory to save attachments
const ATTACHMENTS_DIR = path.join(process.cwd(), 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(ATTACHMENTS_DIR)) {
  fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}

// Interface for processed attachments
interface ProcessedAttachment {
  url: string;
  content: string;
  emailSource: string;
}

/**
 * Process email attachments to find new refill requests
 */
export async function processEmailAttachments(): Promise<{
  newAttachments: ProcessedAttachment[];
  error?: string;
}> {
  try {
    // Create a mock implementation for now
    // In a real implementation, we would:
    // 1. Connect to the email server using IMAP
    // 2. Fetch new emails with attachments
    // 3. Process PDF attachments, especially those forwarded from Grasshopper
    // 4. Save the PDFs and extract their content for AI processing
    
    // For development/demo purposes, return mock data if no email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('No email credentials configured, using mock data');
      return getMockAttachments();
    }
    
    // TODO: Implement real email processing
    // This would involve connecting to the email server and processing new emails
    
    return { 
      newAttachments: [],
      error: 'Real email processing not yet implemented'
    };
  } catch (error) {
    console.error('Error processing email attachments:', error);
    return {
      newAttachments: [],
      error: `Failed to process email attachments: ${(error as Error).message}`
    };
  }
}

/**
 * Generate mock attachments for development/demo purposes
 * This function will be replaced by the updated version below
 */

/**
 * Process a PDF file to extract its text content
 */
export async function processPdfFile(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    // For now, just return the contents as a string since we're using mock data
    return "PDF content extracted";
  } catch (error) {
    console.error('Error processing PDF file:', error);
    throw error;
  }
}

/**
 * Analyze attachment content to determine if it's a medication refill request
 */
export async function analyzeAttachment(content: string): Promise<{
  isRefill: boolean;
  isInsuranceDocument: boolean;
  patientName?: string;
  medicationName?: string;
  prescriptionNumber?: string;
  pharmacy?: string;
  documentType?: string;
  confidence: number;
}> {
  try {
    // In a real implementation, we would use AI (OpenAI, Anthropic, etc.) to analyze the content
    // For now, we'll use simple pattern matching for demo purposes
    const contentLower = content.toLowerCase();
    
    // Check if it's a medication refill request
    const isRefill = 
      contentLower.includes('refill') && 
      (contentLower.includes('medication') || contentLower.includes('prescription'));
    
    // Check if it's an insurance document
    const isInsuranceDocument = 
      contentLower.includes('insurance') || 
      contentLower.includes('claim') || 
      contentLower.includes('coverage') || 
      contentLower.includes('policy') ||
      contentLower.includes('authorization');
    
    // Extract patient name using a simple pattern
    const patientNameMatch = content.match(/patient:?\s*([A-Za-z\s]+)/i) || 
                           content.match(/name:?\s*([A-Za-z\s]+)/i);
    const patientName = patientNameMatch ? patientNameMatch[1].trim() : undefined;
    
    // Extract medication name if it's a refill request
    const medicationMatch = content.match(/medication:?\s*([A-Za-z0-9\s%]+)/i);
    const medicationName = medicationMatch ? medicationMatch[1].trim() : undefined;
    
    // Extract prescription number if available
    const rxMatch = content.match(/prescription\s*(?:number|#)?:?\s*([A-Za-z0-9]+)/i) ||
                  content.match(/rx\s*(?:number|#)?:?\s*([A-Za-z0-9]+)/i);
    const prescriptionNumber = rxMatch ? rxMatch[1].trim() : undefined;
    
    // Extract pharmacy name if available
    const pharmacyMatch = content.match(/pharmacy:?\s*([A-Za-z\s]+)/i);
    const pharmacy = pharmacyMatch ? pharmacyMatch[1].trim() : undefined;
    
    // Determine document type for insurance documents
    let documentType = 'Insurance Document';
    if (isInsuranceDocument) {
      if (contentLower.includes('claim')) documentType = 'Insurance Claim';
      else if (contentLower.includes('prior authorization')) documentType = 'Prior Authorization';
      else if (contentLower.includes('policy')) documentType = 'Insurance Policy';
      else if (contentLower.includes('coverage')) documentType = 'Coverage Information';
    }
    
    // Calculate a confidence score (in a real implementation, this would come from the AI model)
    const confidence = isRefill || isInsuranceDocument ? 0.85 : 0.2;
    
    return {
      isRefill,
      isInsuranceDocument,
      patientName,
      medicationName,
      prescriptionNumber,
      pharmacy,
      documentType,
      confidence
    };
  } catch (error) {
    console.error('Error analyzing attachment:', error);
    return {
      isRefill: false,
      isInsuranceDocument: false,
      confidence: 0
    };
  }
}

/**
 * Update the mock attachments to include insurance document examples
 */
function getMockAttachments(): { newAttachments: ProcessedAttachment[] } {
  // Create mock attachments including both refill requests and insurance documents
  const mockAttachments: ProcessedAttachment[] = [
    {
      url: '/mock-pdfs/refill-request-1.pdf',
      content: `
        MEDICATION REFILL REQUEST
        
        Patient: Sarah Johnson
        DOB: 05/12/1975
        
        Medication: Lisinopril 10mg
        Prescription #: RX29384756
        
        Pharmacy: Walgreens
        Phone: (555) 123-4567
        
        Notes: Patient is requesting a 90-day supply refill.
        Last visit: 02/15/2024
      `,
      emailSource: 'pharmacy@walgreens.com via Grasshopper',
    },
    {
      url: '/mock-pdfs/refill-request-2.pdf',
      content: `
        PRESCRIPTION REFILL AUTHORIZATION
        
        Patient Information:
        Name: Michael Williams
        Date of Birth: 11/30/1968
        
        Medication Information:
        Medication: Metformin 500mg
        Directions: Take one tablet twice daily with meals
        Prescription Number: RX7651238
        
        Pharmacy: CVS Pharmacy
        Location: 123 Main Street
        Phone: (555) 987-6543
        
        REQUEST DATE: 04/24/2025
      `,
      emailSource: 'noreply@cvspharmacy.com via Grasshopper',
    },
    {
      url: '/mock-pdfs/insurance-claim-1.pdf',
      content: `
        INSURANCE CLAIM FORM

        Patient: Emily Parker
        DOB: 03/28/1990
        Policy #: POL-987654321
        Group #: GRP-123456

        Service Date: 04/15/2025
        Provider: Dr. James Wilson
        Diagnosis Code: J45.909 (Unspecified asthma)
        Procedure Code: 99213 (Office visit)

        Total Charges: $175.00
        Patient Responsibility: $25.00
        Amount Billed to Insurance: $150.00

        Please process this claim at your earliest convenience.
      `,
      emailSource: 'emily.parker@email.com via Grasshopper',
    },
    {
      url: '/mock-pdfs/prior-auth-1.pdf',
      content: `
        PRIOR AUTHORIZATION REQUEST
        
        Patient: Robert Garcia
        DOB: 09/12/1983
        Insurance ID: INS98765432
        
        Medication: Humira (adalimumab) 40mg/0.8mL
        Diagnosis: Crohn's Disease (K50.90)
        
        Clinical Justification:
        Patient has failed treatment with conventional therapies including
        prednisone and azathioprine. Recent colonoscopy shows active inflammation
        in the terminal ileum. CRP elevated at 24 mg/L.
        
        Requesting approval for 12-month treatment course.
        
        Prescribing Physician: Dr. Michelle Lee
        NPI: 1234567890
        Contact: (555) 234-5678
      `,
      emailSource: 'insurance@medical-office.com via Grasshopper',
    },
    {
      url: '/mock-pdfs/lab-result.pdf',
      content: `
        LABORATORY RESULTS
        
        Patient: James Rodriguez
        DOB: 08/17/1982
        Collection Date: 04/20/2025
        
        TEST RESULTS:
        
        Complete Blood Count (CBC)
        WBC: 7.2 × 10^9/L (Reference: 4.0-11.0)
        RBC: 5.1 × 10^12/L (Reference: 4.5-5.9)
        Hemoglobin: 15.2 g/dL (Reference: 13.5-17.5)
        Hematocrit: 45% (Reference: 41-53%)
        Platelets: 250 × 10^9/L (Reference: 150-400)
        
        Chemistry Panel
        Glucose: 92 mg/dL (Reference: 70-99)
        BUN: 15 mg/dL (Reference: 7-20)
        Creatinine: 0.9 mg/dL (Reference: 0.6-1.2)
        eGFR: >90 mL/min (Reference: >60)
        
        CONCLUSION: Normal lab results. No significant abnormalities.
      `,
      emailSource: 'results@labcorp.com via Grasshopper',
    },
  ];
  
  return { newAttachments: mockAttachments };
}