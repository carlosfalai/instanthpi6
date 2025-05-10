import nodemailer from 'nodemailer';
import { storage } from '../storage';

// Set up email transporter - use Ethereal for development or Gmail if credentials available
let transporter: nodemailer.Transporter;

// Create reusable transporter with appropriate configuration
(async function() {
  // Check if Gmail password is available
  if (process.env.GMAIL_APP_PASSWORD) {
    // Set up Gmail transporter with direct SMTP settings
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: 'drcfont@gmail.com', // Your Gmail address
        pass: process.env.GMAIL_APP_PASSWORD, // App password from Gmail
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });
    
    console.log('Using Gmail SMTP configuration with direct settings');
  } else {
    // Use Ethereal for testing if no Gmail password
    try {
      // Generate Ethereal test account
      const testAccount = await nodemailer.createTestAccount();
      
      // Create test transporter
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      console.log('Created Ethereal test account for email testing');
      console.log('Preview URL will be shown when emails are sent');
    } catch (error) {
      console.error('Failed to create test email account, using mock transporter');
      
      // Create a dummy transport that just logs messages
      transporter = {
        sendMail: (mailOptions: any) => {
          console.log('Email would be sent:', mailOptions);
          return Promise.resolve({ messageId: 'mock-message-id' });
        },
        verify: (callback: any) => {
          callback(null, true);
          return Promise.resolve(true);
        }
      } as any;
    }
  }
})();

// Delayed verification after transporter initialization
setTimeout(() => {
  if (transporter) {
    transporter.verify(function(error, success) {
      if (error) {
        console.error('Error connecting to SMTP server:', error);
      } else {
        console.log('SMTP connection established successfully');
        console.log('Email service is ready to send messages');
      }
    });
  } else {
    console.error('Transporter not initialized properly');
  }
}, 1000);

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
 * Sends an email using Nodemailer
 * 
 * @param options Email options (to, subject, text, html, attachments)
 * @returns Promise with success status and message
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string; previewUrl?: string }> {
  // Set default from address if not provided
  const fromAddress = options.from || process.env.EMAIL_FROM || 'noreply@centremedicalfont.com';

  try {
    // Convert the attachments format to Nodemailer format
    const attachments = options.attachments?.map(attachment => ({
      filename: attachment.filename,
      content: Buffer.from(attachment.content, 'base64'),
      contentType: attachment.type,
      contentDisposition: attachment.disposition
    }));

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text || '',
      html: options.html || '',
      attachments: attachments
    });

    console.log('Message sent: %s', info.messageId);
    
    // If using Ethereal, get the preview URL
    let previewUrl: string | undefined;
    if (info && typeof nodemailer.getTestMessageUrl === 'function') {
      previewUrl = nodemailer.getTestMessageUrl(info) as string | undefined;
      if (previewUrl) {
        console.log('Preview URL: %s', previewUrl);
      }
    }
    
    return { 
      success: true, 
      message: 'Email sent successfully',
      previewUrl
    };
  } catch (error) {
    console.error('Email sending error:', error);
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