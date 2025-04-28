import { Router } from 'express';
import { db } from '../db';
import { pseudonymLinks, insertPseudonymLinkSchema, messages, patients } from '@shared/schema';
import { ZodError } from 'zod';
import { eq, like, and } from 'drizzle-orm';

export const pseudonymRouter = Router();

// Handle Zod validation errors
const handleZodError = (error: unknown, res: any) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: error.errors,
    });
  }
  console.error("Unexpected error:", error);
  return res.status(500).json({ message: "Internal server error" });
};

// Get all pseudonym links
pseudonymRouter.get('/', async (req, res) => {
  try {
    const links = await db.select().from(pseudonymLinks).orderBy(pseudonymLinks.timestamp);
    res.json(links);
  } catch (error) {
    console.error('Error fetching pseudonym links:', error);
    res.status(500).json({ message: 'Failed to fetch pseudonym links' });
  }
});

// Get pseudonym links by patient ID
pseudonymRouter.get('/by-patient/:patientId', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const links = await db
      .select()
      .from(pseudonymLinks)
      .where(eq(pseudonymLinks.patientId, patientId))
      .orderBy(pseudonymLinks.timestamp);
    
    res.json(links);
  } catch (error) {
    console.error('Error fetching pseudonym links by patient:', error);
    res.status(500).json({ message: 'Failed to fetch pseudonym links' });
  }
});

// Get pseudonym links by pseudonym
pseudonymRouter.get('/by-pseudonym/:pseudonym', async (req, res) => {
  try {
    const { pseudonym } = req.params;
    const links = await db
      .select()
      .from(pseudonymLinks)
      .where(like(pseudonymLinks.pseudonym, `%${pseudonym}%`))
      .orderBy(pseudonymLinks.timestamp);
    
    res.json(links);
  } catch (error) {
    console.error('Error fetching pseudonym links by pseudonym:', error);
    res.status(500).json({ message: 'Failed to fetch pseudonym links' });
  }
});

// Create a new pseudonym link
pseudonymRouter.post('/', async (req, res) => {
  try {
    const linkData = insertPseudonymLinkSchema.parse(req.body);
    
    // Verify if patient exists
    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, linkData.patientId))
      .limit(1);
    
    if (patient.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // If messageId is provided, verify if message exists
    if (linkData.messageId) {
      const message = await db
        .select()
        .from(messages)
        .where(eq(messages.id, linkData.messageId))
        .limit(1);
      
      if (message.length === 0) {
        return res.status(404).json({ message: 'Message not found' });
      }
    }
    
    // Check for duplicate
    const existingLink = await db
      .select()
      .from(pseudonymLinks)
      .where(
        and(
          eq(pseudonymLinks.pseudonym, linkData.pseudonym),
          eq(pseudonymLinks.patientId, linkData.patientId)
        )
      )
      .limit(1);
    
    if (existingLink.length > 0) {
      return res.status(409).json({ 
        message: 'Pseudonym link already exists', 
        link: existingLink[0]
      });
    }
    
    // Create new link
    const [newLink] = await db
      .insert(pseudonymLinks)
      .values(linkData)
      .returning();
    
    res.status(201).json(newLink);
  } catch (error) {
    handleZodError(error, res);
  }
});

// Delete a pseudonym link
pseudonymRouter.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if link exists
    const existingLink = await db
      .select()
      .from(pseudonymLinks)
      .where(eq(pseudonymLinks.id, id))
      .limit(1);
    
    if (existingLink.length === 0) {
      return res.status(404).json({ message: 'Pseudonym link not found' });
    }
    
    // Delete the link
    await db
      .delete(pseudonymLinks)
      .where(eq(pseudonymLinks.id, id));
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting pseudonym link:', error);
    res.status(500).json({ message: 'Failed to delete pseudonym link' });
  }
});

// Process a message to find potential pseudonyms
pseudonymRouter.post('/analyze-message', async (req, res) => {
  try {
    const { messageId, patientId, content } = req.body;
    
    if (!messageId || !patientId || !content) {
      return res.status(400).json({ 
        message: 'Missing required fields: messageId, patientId, and content are required' 
      });
    }
    
    // Check if message exists
    const message = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);
    
    if (message.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if patient exists
    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);
    
    if (patient.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Patterns that may indicate a pseudonym
    const patterns = [
      // Pattern: 3 digits followed by words (e.g., "847 Ancient Meadows")
      /\b(\d{2,4}\s+[A-Z][a-z]+\s+[A-Z][a-z]+)\b/g,
      
      // Pattern: Number + adjective + noun
      /\b(\d+\s+[A-Z][a-z]+\s+[A-Z][a-z]+s?)\b/g,
    ];
    
    // Find potential pseudonyms
    let potentialPseudonyms: string[] = [];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        potentialPseudonyms = [...potentialPseudonyms, ...matches];
      }
    }
    
    // If no pseudonyms found
    if (potentialPseudonyms.length === 0) {
      return res.json({
        found: false,
        message: 'No potential pseudonyms found in the message'
      });
    }
    
    // Create links for each found pseudonym
    const createdLinks = [];
    
    for (const pseudonym of potentialPseudonyms) {
      // Check for existing link
      const existingLink = await db
        .select()
        .from(pseudonymLinks)
        .where(
          and(
            eq(pseudonymLinks.pseudonym, pseudonym),
            eq(pseudonymLinks.patientId, patientId)
          )
        )
        .limit(1);
      
      if (existingLink.length === 0) {
        // Create new link
        const [newLink] = await db
          .insert(pseudonymLinks)
          .values({
            pseudonym,
            patientId,
            patientName: patient[0].name,
            messageId
          })
          .returning();
        
        createdLinks.push(newLink);
      } else {
        createdLinks.push(existingLink[0]);
      }
    }
    
    res.json({
      found: true,
      pseudonyms: potentialPseudonyms,
      links: createdLinks
    });
  } catch (error) {
    console.error('Error analyzing message for pseudonyms:', error);
    res.status(500).json({ message: 'Failed to analyze message' });
  }
});

export default pseudonymRouter;