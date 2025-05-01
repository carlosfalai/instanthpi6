import { Router } from 'express';
import { db } from '../db';
import { urgentCareRequests, insertUrgentCareRequestSchema, messages } from '@shared/schema';
import { z } from 'zod';
import { OpenAI } from 'openai';
import { eq, and, gte, desc } from 'drizzle-orm';
// Simple error parser helper
function parseError(error: unknown): string {
  if (!error) return 'Unknown error occurred';
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle objects with message properties
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  
  // Fallback for other error types
  try {
    return JSON.stringify(error);
  } catch {
    return 'Error occurred but could not be serialized';
  }
}

const router = Router();

// Initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

// Get all urgent care requests (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { status, type, timeframe } = req.query;
    
    let query = db.select().from(urgentCareRequests)
      .orderBy(desc(urgentCareRequests.receivedAt));
    
    // Build conditions for filters
    const conditions = [];
    
    // Filter by timeframe (defaults to last 24 hours)
    const hours = timeframe ? parseInt(timeframe as string) : 24;
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);
    
    // Apply all conditions
    if (conditions.length === 0) {
      // Just apply the timeframe filter if no other filters
      query = query.where(gte(urgentCareRequests.receivedAt, cutoffDate));
    } else {
      // Apply status filter if provided
      if (status) {
        query = query.where(eq(urgentCareRequests.status, status as string));
      }
      
      // Apply type filter if provided
      if (type) {
        query = query.where(eq(urgentCareRequests.requestType, type as string));
      }
      
      // Apply timeframe filter 
      query = query.where(gte(urgentCareRequests.receivedAt, cutoffDate));
    }
    
    const requests = await query;
    
    // Get associated patient information for each request
    const requestsWithPatients = await Promise.all(
      requests.map(async (request) => {
        const [patient] = await db.query.patients.findMany({
          where: eq(db.query.patients.id, request.patientId)
        });
        
        // Get message content if available
        let messageContent = null;
        if (request.messageId) {
          const [message] = await db.query.messages.findMany({
            where: eq(db.query.messages.id, request.messageId)
          });
          messageContent = message?.content || null;
        }
        
        return {
          ...request,
          patient: patient || null,
          messageContent
        };
      })
    );
    
    res.json(requestsWithPatients);
  } catch (error) {
    console.error('Error fetching urgent care requests:', error);
    res.status(500).json({ message: 'Failed to fetch urgent care requests' });
  }
});

// Get a specific urgent care request by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [request] = await db.select()
      .from(urgentCareRequests)
      .where(eq(urgentCareRequests.id, parseInt(id)));
    
    if (!request) {
      return res.status(404).json({ message: 'Urgent care request not found' });
    }
    
    // Get associated patient information
    const [patient] = await db.query.patients.findMany({
      where: eq(db.query.patients.id, request.patientId)
    });
    
    // Get message content if available
    let messageContent = null;
    if (request.messageId) {
      const [message] = await db.query.messages.findMany({
        where: eq(db.query.messages.id, request.messageId)
      });
      messageContent = message?.content || null;
    }
    
    res.json({
      ...request,
      patient: patient || null,
      messageContent
    });
  } catch (error) {
    console.error('Error fetching urgent care request:', error);
    res.status(500).json({ message: 'Failed to fetch urgent care request' });
  }
});

// Create a new urgent care request manually
router.post('/', async (req, res) => {
  try {
    const validatedData = insertUrgentCareRequestSchema.parse(req.body);
    
    const [newRequest] = await db.insert(urgentCareRequests)
      .values(validatedData)
      .returning();
    
    res.status(201).json(newRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    
    console.error('Error creating urgent care request:', error);
    res.status(500).json({ message: 'Failed to create urgent care request' });
  }
});

// Process a new message to determine if it's a new problem/consultation request
router.post('/analyze-message', async (req, res) => {
  try {
    const { messageId, patientId, content } = req.body;
    
    if (!messageId || !patientId || !content) {
      return res.status(400).json({ 
        message: 'Missing required fields: messageId, patientId, and content are required' 
      });
    }
    
    // Check if OpenAI API key is available
    if (!openai) {
      return res.status(400).json({ 
        message: 'OpenAI API key not configured, unable to analyze message content' 
      });
    }
    
    // Get recent messages from this patient to provide context
    const recentMessages = await db.select()
      .from(messages)
      .where(eq(messages.patientId, patientId))
      .orderBy(desc(messages.timestamp))
      .limit(10);
    
    // Convert to chat history format with properly typed roles
    const chatHistory = recentMessages
      .reverse()
      .map(msg => ({
        role: msg.isFromPatient ? "user" as const : "assistant" as const,
        content: msg.content
      }));
    
    // Analyze the message content to determine if it's a new problem or follow-up
    const systemPrompt = `
    You are a medical AI assistant responsible for triaging patient messages.
    
    Analyze the following message content and determine if it represents:
    1. A new medical problem/consultation request
    2. A medication refill request
    3. A follow-up to an existing conversation
    4. A symptom check related to a previous condition
    5. Other (administrative, general question, etc.)
    
    Previous conversation context is provided if available.
    
    Rate the priority as:
    - High: Urgent medical issues needing immediate attention
    - Medium: Standard medical concerns needing attention within 24 hours
    - Low: Non-urgent matters that can be addressed in routine care
    
    Provide a brief analysis of the patient's problem and what type of care they might need.
    
    Output a JSON object with the following fields:
    {
      "requestType": "new_problem" | "medication_refill" | "follow_up" | "symptom_check" | "other",
      "isNewConsultation": true/false,
      "priority": "high" | "medium" | "low",
      "problemDescription": "Brief description of the patient's issue",
      "analysisNotes": "Your analysis of what the patient needs"
    }
    `;
    
    // Prepare the messages for the AI with proper typing
    const aiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...chatHistory
    ];
    
    // Call OpenAI API to analyze the message
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: aiMessages,
      response_format: { type: "json_object" }
    });
    
    const aiResponse = completion.choices[0].message.content;
    const analysis = JSON.parse(aiResponse || "{}");
    
    // Create a new urgent care request if this is a new consultation
    if (analysis.isNewConsultation) {
      const [urgentRequest] = await db.insert(urgentCareRequests)
        .values({
          patientId: patientId,
          messageId: messageId,
          requestType: analysis.requestType,
          priority: analysis.priority,
          problemDescription: analysis.problemDescription,
          aiAnalysis: analysis.analysisNotes,
          aiProcessedAt: new Date()
        })
        .returning();
      
      return res.status(201).json({
        message: 'New consultation request created',
        analysis: analysis,
        request: urgentRequest
      });
    }
    
    // If not a new consultation, just return the analysis
    res.json({
      message: 'Message analyzed, not a new consultation request',
      analysis: analysis
    });
  } catch (error) {
    console.error('Error analyzing message for urgent care:', error);
    res.status(500).json({ 
      message: 'Failed to analyze message', 
      error: parseError(error)
    });
  }
});

// Update an urgent care request status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, doctorAssignedId } = req.body;
    
    // First check if the request exists
    const [existingRequest] = await db.select()
      .from(urgentCareRequests)
      .where(eq(urgentCareRequests.id, parseInt(id)));
    
    if (!existingRequest) {
      return res.status(404).json({ message: 'Urgent care request not found' });
    }
    
    // Update fields that were provided
    const updateData: Partial<typeof existingRequest> = {};
    
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (doctorAssignedId) updateData.doctorAssignedId = doctorAssignedId;
    
    // If being marked as completed, add completion time
    if (status === 'completed' && existingRequest.status !== 'completed') {
      updateData.respondedAt = new Date();
    }
    
    // Update the request
    const [updatedRequest] = await db.update(urgentCareRequests)
      .set(updateData)
      .where(eq(urgentCareRequests.id, parseInt(id)))
      .returning();
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating urgent care request:', error);
    res.status(500).json({ message: 'Failed to update urgent care request' });
  }
});

export default router;