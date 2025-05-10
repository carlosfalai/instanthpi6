import { MailService } from '@sendgrid/mail';
import { storage } from '../storage';

// Initialize SendGrid mail service
const mailService = new MailService();

// Set SendGrid API key if available
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailAttachment {
  content: string; // Base64 encoded content
  filename: string;
  type: string;
  disposition: 'attachment';
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  from?: string;
}

/**
 * Sends an email using SendGrid
 * 
 * @param options Email options (to, subject, text, html, attachments)
 * @returns Promise<boolean> indicating success or failure
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string }> {
  // Validate SendGrid API key
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set');
    return { 
      success: false, 
      message: 'Email service is not configured. Please set up SendGrid API key.' 
    };
  }

  // Set default from address if not provided
  const fromAddress = options.from || process.env.EMAIL_FROM || 'noreply@centremedicalfont.com';

  try {
    await mailService.send({
      to: options.to,
      from: fromAddress,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments
    });

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('SendGrid email error:', error);
    return { 
      success: false, 
      message: `Failed to send email: ${(error as Error).message}`
    };
  }
}

/**
 * Sends a document to a patient via email
 * 
 * @param patientId The ID of the patient
 * @param documentId The ID of the document to send
 * @param documentType The type of document being sent
 * @param fileBuffer The file buffer containing the document
 * @param fileName The name of the file
 * @returns Promise with result of the operation
 */
export async function sendDocumentToPatient(
  patientId: number,
  documentId: string,
  documentType: string,
  fileBuffer: Buffer,
  fileName: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get patient from storage
    const patient = await storage.getPatient(patientId);
    
    if (!patient) {
      return { success: false, message: 'Patient not found' };
    }
    
    if (!patient.email) {
      return { success: false, message: 'Patient email not found' };
    }

    // Convert file buffer to base64
    const base64File = fileBuffer.toString('base64');
    
    // Prepare email content based on document type
    let subject = 'Medical Document from Centre Médical Font';
    let emailText = `Dear ${patient.name},\n\nPlease find attached your medical document from Centre Médical Font.\n\nSincerely,\nDr. Carlos Font\nCentre Médical Font`;
    let emailHtml = `<p>Dear ${patient.name},</p><p>Please find attached your medical document from Centre Médical Font.</p><p>Sincerely,<br>Dr. Carlos Font<br>Centre Médical Font</p>`;
    
    // Customize email content based on document type
    if (documentType === 'prescription') {
      subject = 'Your Prescription from Centre Médical Font';
      emailText = `Dear ${patient.name},\n\nPlease find attached your prescription from Centre Médical Font. Present this document to your pharmacy.\n\nSincerely,\nDr. Carlos Font\nCentre Médical Font`;
      emailHtml = `<p>Dear ${patient.name},</p><p>Please find attached your prescription from Centre Médical Font. Present this document to your pharmacy.</p><p>Sincerely,<br>Dr. Carlos Font<br>Centre Médical Font</p>`;
    } else if (documentType === 'work_leave') {
      subject = 'Your Work Leave Document from Centre Médical Font';
      emailText = `Dear ${patient.name},\n\nPlease find attached your work leave documentation from Centre Médical Font. This document can be provided to your employer.\n\nSincerely,\nDr. Carlos Font\nCentre Médical Font`;
      emailHtml = `<p>Dear ${patient.name},</p><p>Please find attached your work leave documentation from Centre Médical Font. This document can be provided to your employer.</p><p>Sincerely,<br>Dr. Carlos Font<br>Centre Médical Font</p>`;
    } else if (documentType === 'lab_requisition') {
      subject = 'Your Lab Requisition from Centre Médical Font';
      emailText = `Dear ${patient.name},\n\nPlease find attached your laboratory requisition from Centre Médical Font. Please take this to your nearest laboratory for testing.\n\nSincerely,\nDr. Carlos Font\nCentre Médical Font`;
      emailHtml = `<p>Dear ${patient.name},</p><p>Please find attached your laboratory requisition from Centre Médical Font. Please take this to your nearest laboratory for testing.</p><p>Sincerely,<br>Dr. Carlos Font<br>Centre Médical Font</p>`;
    } else if (documentType === 'imaging_requisition') {
      subject = 'Your Imaging Requisition from Centre Médical Font';
      emailText = `Dear ${patient.name},\n\nPlease find attached your imaging requisition from Centre Médical Font. Please take this to your imaging center for your appointment.\n\nSincerely,\nDr. Carlos Font\nCentre Médical Font`;
      emailHtml = `<p>Dear ${patient.name},</p><p>Please find attached your imaging requisition from Centre Médical Font. Please take this to your imaging center for your appointment.</p><p>Sincerely,<br>Dr. Carlos Font<br>Centre Médical Font</p>`;
    }
    
    // Send email with attachment
    const result = await sendEmail({
      to: patient.email,
      subject,
      text: emailText,
      html: emailHtml,
      attachments: [
        {
          content: base64File,
          filename: fileName,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    });
    
    // Log the email activity
    await storage.createPatientActivity({
      patientId,
      activityType: 'document_emailed',
      description: `Document ${fileName} sent to patient via email`,
      metadata: {
        documentId,
        documentType,
        emailSuccess: result.success
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error sending document to patient:', error);
    return {
      success: false,
      message: `Failed to send document: ${(error as Error).message}`
    };
  }
}