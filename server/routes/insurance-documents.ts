import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { insuranceDocuments, InsuranceDocument, insertInsuranceDocumentSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { processPdfFile } from '../utils/emailProcessor';
import { ZodError } from 'zod';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Create router
const router = express.Router();

// Get all insurance documents
router.get('/', async (req, res) => {
  try {
    const documents = await db.select().from(insuranceDocuments).orderBy(insuranceDocuments.dateReceived);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching insurance documents:', error);
    res.status(500).json({ message: 'Failed to fetch insurance documents' });
  }
});

// Get a specific insurance document
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [document] = await db.select().from(insuranceDocuments).where(eq(insuranceDocuments.id, id));
    
    if (!document) {
      return res.status(404).json({ message: 'Insurance document not found' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error fetching insurance document:', error);
    res.status(500).json({ message: 'Failed to fetch insurance document' });
  }
});

// Process an insurance document
router.post('/:id/process', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Validate input
    if (!status || !['pending', 'processed', 'needs_info'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Update document
    const [updatedDocument] = await db
      .update(insuranceDocuments)
      .set({ 
        status,
        processingNotes: notes || null
      })
      .where(eq(insuranceDocuments.id, id))
      .returning();
    
    if (!updatedDocument) {
      return res.status(404).json({ message: 'Insurance document not found' });
    }
    
    res.json(updatedDocument);
  } catch (error) {
    console.error('Error processing insurance document:', error);
    res.status(500).json({ message: 'Failed to process insurance document' });
  }
});

// Check emails for new insurance documents
router.post('/check-email', async (req, res) => {
  try {
    // This function will be implemented to check for new insurance documents in email
    // For now, we'll use mock data to demonstrate the functionality

    // In a production environment, this would:
    // 1. Connect to email server
    // 2. Download attachments
    // 3. Process PDFs to extract text
    // 4. Use AI to identify insurance documents
    // 5. Create records in the database

    // Only process authentic documents from actual email sources
    // No mock data is inserted
    res.json({ count: 0 });
  } catch (error) {
    console.error('Error checking emails for insurance documents:', error);
    res.status(500).json({ message: 'Failed to check for new insurance documents' });
  }
});

// Create a new insurance document
router.post('/', async (req, res) => {
  try {
    // Validate document data using Zod schema
    const documentData = insertInsuranceDocumentSchema.parse(req.body);
    
    // Generate a UUID for the new document
    const id = uuidv4();
    
    // Insert document into database
    const [document] = await db
      .insert(insuranceDocuments)
      .values({ id, ...documentData })
      .returning();
    
    res.status(201).json(document);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors,
      });
    }
    console.error('Error creating insurance document:', error);
    res.status(500).json({ message: 'Failed to create insurance document' });
  }
});

export default router;