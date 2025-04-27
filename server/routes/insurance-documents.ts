import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { insuranceDocuments } from '@shared/schema';
import { processEmailAttachments, analyzeAttachment } from '../utils/emailProcessor';

const router = express.Router();

// Get all insurance documents
router.get('/', async (_req: Request, res: Response) => {
  try {
    const documents = await db.select().from(insuranceDocuments).orderBy(insuranceDocuments.dateReceived);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching insurance documents:', error);
    res.status(500).json({ error: 'Failed to fetch insurance documents' });
  }
});

// Get a specific insurance document
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [document] = await db.select().from(insuranceDocuments).where(eq(insuranceDocuments.id, id));
    
    if (!document) {
      return res.status(404).json({ error: 'Insurance document not found' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error fetching insurance document:', error);
    res.status(500).json({ error: 'Failed to fetch insurance document' });
  }
});

// Process an insurance document
router.post('/:id/process', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!status || !['pending', 'processed', 'needs_info'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const [document] = await db.select().from(insuranceDocuments).where(eq(insuranceDocuments.id, id));
    
    if (!document) {
      return res.status(404).json({ error: 'Insurance document not found' });
    }
    
    const [updatedDocument] = await db
      .update(insuranceDocuments)
      .set({ 
        status, 
        processingNotes: notes || document.processingNotes,
        updatedAt: new Date()
      })
      .where(eq(insuranceDocuments.id, id))
      .returning();
    
    res.json(updatedDocument);
  } catch (error) {
    console.error('Error processing insurance document:', error);
    res.status(500).json({ error: 'Failed to process insurance document' });
  }
});

// Check email for new insurance documents
router.post('/check-email', async (_req: Request, res: Response) => {
  try {
    // Process email attachments to find new documents
    const { newAttachments, error } = await processEmailAttachments();
    
    if (error) {
      return res.status(500).json({ error });
    }
    
    if (newAttachments.length === 0) {
      return res.json({ count: 0, message: 'No new insurance documents found' });
    }
    
    // Process each attachment with AI to determine if it's an insurance document
    let newDocumentCount = 0;
    
    await Promise.all(
      newAttachments.map(async (attachment: { url: string; content: string; emailSource: string }) => {
        try {
          // Use AI to analyze the PDF content
          const analysisResult = await analyzeAttachment(attachment.content);
          
          if (analysisResult.isInsuranceDocument) {
            // Insert into the database based on schema structure
            await db
              .insert(insuranceDocuments)
              .values({
                id: uuidv4(),
                patientName: analysisResult.patientName || 'Unknown Patient',
                dateReceived: new Date(),
                status: 'pending',
                documentType: analysisResult.documentType || 'Insurance Document',
                pdfUrl: attachment.url,
                emailSource: attachment.emailSource,
                aiProcessed: true,
                aiConfidence: analysisResult.confidence || 0.7,
              });
            
            newDocumentCount++;
          }
        } catch (error) {
          console.error('Error processing attachment:', error);
          // Continue with other attachments if one fails
        }
      })
    );
    
    res.json({ 
      count: newDocumentCount, 
      message: `Successfully processed ${newDocumentCount} new insurance documents.` 
    });
  } catch (error) {
    console.error('Error checking email for insurance documents:', error);
    res.status(500).json({ error: 'Failed to check email for insurance documents' });
  }
});

export default router;