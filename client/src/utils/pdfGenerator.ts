/**
 * PDF Generator for REQUÊTE documents
 * Following the Truck Stop Santé template format
 */

export interface PatientData {
  name: string;
  nam?: string; // NAM - Health insurance number (RAMQ)
  dob?: string; // DDN - Date de naissance
  sex?: string; // Sexe à la naissance
  phone?: string; // Tél.
  address?: string; // Adresse
  email?: string; // Courriel
  dossier?: string; // File number
}

export interface RequeteData {
  patient: PatientData;
  description: string;
  doctorName?: string;
  doctorLicense?: string;
}

// Clinic information
const CLINIC_INFO = {
  name: 'Truck Stop Santé',
  address: '410-6000 boul de Rome, Brossard, Québec, J4Y 0B6, Canada',
  tel: '+1 833 964-4725',
  fax: '+1 833 964-4725',
  email: 'info@centremedicalfont.ca',
};

// Default doctor info (can be overridden)
const DEFAULT_DOCTOR = {
  name: 'Dr Carlos Faviel Font',
  license: 'CMQ: 16812',
};

/**
 * Generates a REQUÊTE PDF document following the template format
 */
export async function generateRequetePDF(data: RequeteData): Promise<Blob> {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper functions
  const centerText = (text: string, y: number, fontSize: number = 12) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  const drawLine = (y: number) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
  };

  // ===== HEADER =====
  doc.setFont('helvetica', 'bold');
  centerText(CLINIC_INFO.name, yPos, 16);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  centerText(CLINIC_INFO.address, yPos);
  yPos += 5;
  centerText(`Tél.: ${CLINIC_INFO.tel}   Fax: ${CLINIC_INFO.fax}`, yPos);
  yPos += 8;

  drawLine(yPos);
  yPos += 8;

  // ===== PATIENT INFO SECTION =====
  const leftCol = margin;
  const midCol = pageWidth / 2 + 10;
  const labelWidth = 40;

  doc.setFontSize(10);

  // Left column
  const printLabel = (label: string, value: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, x, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '', x + labelWidth, y);
  };

  // Patient info - left side
  printLabel('Patient', data.patient.name, leftCol, yPos);
  printLabel('Tél.', data.patient.phone || '', midCol, yPos);
  yPos += 5;

  printLabel('NAM', data.patient.nam || '', leftCol, yPos);
  printLabel('Adresse', data.patient.address || '', midCol, yPos);
  yPos += 5;

  printLabel('DDN', data.patient.dob || '', leftCol, yPos);
  printLabel('Courriel', data.patient.email || '', midCol, yPos);
  yPos += 5;

  printLabel('Sexe à la naissance', data.patient.sex || '', leftCol, yPos);
  yPos += 5;

  printLabel('Dossier', data.patient.dossier || '', leftCol, yPos);
  yPos += 8;

  drawLine(yPos);
  yPos += 10;

  // ===== REQUÊTE SECTION =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('REQUÊTE', leftCol, yPos);
  yPos += 8;

  // Description label
  doc.setFontSize(10);
  doc.text('Description', leftCol, yPos);
  yPos += 5;

  // Description content - wrap text
  doc.setFont('helvetica', 'normal');
  const maxWidth = pageWidth - (2 * margin) - 10;
  const lines = doc.splitTextToSize(data.description, maxWidth);

  // Check if we need a new page
  const lineHeight = 5;
  const requiredHeight = lines.length * lineHeight;

  if (yPos + requiredHeight > pageHeight - 60) {
    doc.addPage();
    yPos = margin;
  }

  doc.text(lines, leftCol + 10, yPos);
  yPos += requiredHeight + 20;

  // ===== SIGNATURE SECTION =====
  // Position signature at bottom right
  const signatureX = pageWidth - margin - 80;
  let signatureY = pageHeight - 50;

  // Draw signature line
  doc.setLineWidth(0.3);
  doc.line(signatureX, signatureY, signatureX + 70, signatureY);
  signatureY += 5;

  // Doctor info
  const doctorName = data.doctorName || DEFAULT_DOCTOR.name;
  const doctorLicense = data.doctorLicense || DEFAULT_DOCTOR.license;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${doctorName} (${doctorLicense})`, signatureX, signatureY);

  // ===== FOOTER =====
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENTIEL', margin, pageHeight - 15);

  doc.setFont('helvetica', 'normal');
  const footerText1 = `Imprimé par ${doctorName.replace('Dr ', '')} le ${dateStr} à ${timeStr}`;
  const footerText2 = `Produit par ${doctorName.replace('Dr ', '')} le ${dateStr} à ${timeStr}`;

  doc.text(footerText1, signatureX, pageHeight - 15);
  doc.text(footerText2, signatureX, pageHeight - 10);

  // Page number
  doc.text(`Page 1 de 1`, margin, pageHeight - 5);

  return doc.output('blob');
}

/**
 * Extract patient info from conversation messages
 */
export function extractPatientInfoFromConversation(
  messages: Array<{ content: string; isFromPatient: boolean }>,
  patientName: string
): PatientData {
  const allText = messages
    .filter(m => m.isFromPatient)
    .map(m => m.content)
    .join(' ');

  // Simple regex patterns to extract common info
  const phoneMatch = allText.match(/(\+?1?\s*[-.]?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
  const emailMatch = allText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const dobMatch = allText.match(/(?:né[e]?\s+le\s+|dob[:\s]+|date\s+de\s+naissance[:\s]+)(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})/i);
  const namMatch = allText.match(/(?:nam[:\s]+|ramq[:\s]+|carte\s+soleil[:\s]+)([A-Z]{4}\d{8})/i);

  return {
    name: patientName,
    phone: phoneMatch?.[1],
    email: emailMatch?.[1],
    dob: dobMatch?.[1],
    nam: namMatch?.[1]?.toUpperCase(),
  };
}

/**
 * Download PDF to user's device
 */
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download a REQUÊTE PDF
 */
export async function generateAndDownloadRequete(
  patientData: PatientData,
  description: string,
  doctorName?: string,
  doctorLicense?: string
): Promise<void> {
  const blob = await generateRequetePDF({
    patient: patientData,
    description,
    doctorName,
    doctorLicense,
  });

  const sanitizedName = patientData.name.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Requete_${sanitizedName}_${dateStr}.pdf`;

  downloadPDF(blob, filename);
}
