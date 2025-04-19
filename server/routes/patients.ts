import { Router } from 'express';
import { storage } from '../storage';
import { insertChronicConditionSchema, insertMedicationSchema, insertPendingItemSchema, insertPreventativeCareSchema } from '@shared/schema';
import { randomUUID } from 'crypto';

export const router = Router();

// Get all patients
router.get('/', async (req, res) => {
  try {
    const patients = await storage.getAllPatients();
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Search patients
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      const patients = await storage.getAllPatients();
      return res.json(patients);
    }
    
    const patients = await storage.getAllPatients();
    const searchQuery = query.toString().toLowerCase();
    
    const filteredPatients = patients.filter(patient => {
      const fullName = patient.name.toLowerCase();
      const email = patient.email.toLowerCase();
      const phone = patient.phone.toLowerCase();
      
      return fullName.includes(searchQuery) || 
             email.includes(searchQuery) || 
             phone.includes(searchQuery);
    });
    
    res.json(filteredPatients);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
});

// Get patient details
router.get('/:patientId', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  try {
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient details' });
  }
});

// Get all patient messages
router.get('/:patientId/messages', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  try {
    const messages = await storage.getMessagesByPatientId(patientId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching patient messages:', error);
    res.status(500).json({ error: 'Failed to fetch patient messages' });
  }
});

// Get all pending items for a patient
router.get('/:patientId/pending-items', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  try {
    const pendingItems = await storage.getPendingItemsByPatientId(patientId);
    res.json(pendingItems);
  } catch (error) {
    console.error('Error fetching pending items:', error);
    res.status(500).json({ error: 'Failed to fetch pending items' });
  }
});

// Create a new pending item for a patient
router.post('/:patientId/pending-items', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  try {
    const parsedData = insertPendingItemSchema.parse({
      ...req.body,
      patientId,
      id: randomUUID()
    });
    
    const pendingItem = await storage.createPendingItem(parsedData);
    res.status(201).json(pendingItem);
  } catch (error) {
    console.error('Error creating pending item:', error);
    res.status(400).json({ error: 'Invalid pending item data' });
  }
});

// Get chronic conditions for a patient
router.get('/:patientId/chronic-conditions', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  try {
    // This would be a real storage query in a production app
    // For demo purposes, we'll return some sample chronic conditions
    const conditions = [
      {
        id: "cc-001",
        patientId,
        name: "Hypertension",
        diagnosisDate: "2023-08-15",
        status: "controlled",
        notes: "Controlled with medication. Regular monitoring needed."
      },
      {
        id: "cc-002",
        patientId,
        name: "Type 2 Diabetes",
        diagnosisDate: "2020-03-22",
        status: "active",
        notes: "HbA1c levels slightly elevated in last check. Diet counseling recommended."
      }
    ];
    
    res.json(conditions);
  } catch (error) {
    console.error('Error fetching chronic conditions:', error);
    res.status(500).json({ error: 'Failed to fetch chronic conditions' });
  }
});

// Add a chronic condition for a patient
router.post('/:patientId/chronic-conditions', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  try {
    const parsedData = insertChronicConditionSchema.parse({
      ...req.body,
      patientId,
      id: randomUUID()
    });
    
    // This would create a real condition in a production app
    // For demo purposes, we'll just return the input
    res.status(201).json(parsedData);
  } catch (error) {
    console.error('Error creating chronic condition:', error);
    res.status(400).json({ error: 'Invalid chronic condition data' });
  }
});

// Get preventative care items for a patient
router.get('/:patientId/preventative-care', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  try {
    const preventativeCare = await storage.getPreventativeCareByPatientId(patientId);
    
    // If we don't have any data, return sample items for the demo
    if (preventativeCare.length === 0) {
      const sampleItems = [
        {
          id: "pc-001",
          patientId,
          title: "Annual Physical Examination",
          recommendedDate: "2025-07-15",
          frequency: "Yearly",
          isCompleted: false
        },
        {
          id: "pc-002",
          patientId,
          title: "Influenza Vaccination",
          recommendedDate: "2025-10-01",
          frequency: "Yearly",
          isCompleted: false
        },
        {
          id: "pc-003",
          patientId,
          title: "Cholesterol Screening",
          recommendedDate: "2025-06-30",
          frequency: "Every 5 years",
          isCompleted: false,
          lastCompleted: "2020-06-15"
        }
      ];
      
      return res.json(sampleItems);
    }
    
    res.json(preventativeCare);
  } catch (error) {
    console.error('Error fetching preventative care items:', error);
    res.status(500).json({ error: 'Failed to fetch preventative care items' });
  }
});

// Add a preventative care item for a patient
router.post('/:patientId/preventative-care', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  try {
    const parsedData = insertPreventativeCareSchema.parse({
      ...req.body,
      patientId,
      id: randomUUID()
    });
    
    const preventativeCare = await storage.createPreventativeCare(parsedData);
    res.status(201).json(preventativeCare);
  } catch (error) {
    console.error('Error creating preventative care item:', error);
    res.status(400).json({ error: 'Invalid preventative care data' });
  }
});

// Get medications for a patient
router.get('/:patientId/medications', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  try {
    // This would be a real storage query in a production app
    // For demo purposes, we'll return some sample medications
    const medications = [
      {
        id: "med-001",
        patientId,
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        startDate: "2023-09-01",
        endDate: null,
        status: "active",
        notes: "Take in the morning with food"
      },
      {
        id: "med-002",
        patientId,
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        startDate: "2020-04-15",
        endDate: null,
        status: "active",
        notes: "Take with breakfast and dinner"
      }
    ];
    
    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

// Add a medication for a patient
router.post('/:patientId/medications', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  try {
    const parsedData = insertMedicationSchema.parse({
      ...req.body,
      patientId,
      id: randomUUID()
    });
    
    // This would create a real medication in a production app
    // For demo purposes, we'll just return the input
    res.status(201).json(parsedData);
  } catch (error) {
    console.error('Error creating medication:', error);
    res.status(400).json({ error: 'Invalid medication data' });
  }
});

// Get next preventative care item for a patient (for dashboard)
router.get('/:patientId/next-preventative-care', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  try {
    const nextItem = await storage.getNextPreventativeCareItem(patientId);
    
    if (!nextItem) {
      return res.status(404).json({ message: 'No upcoming preventative care items found' });
    }
    
    res.json(nextItem);
  } catch (error) {
    console.error('Error fetching next preventative care item:', error);
    res.status(500).json({ error: 'Failed to fetch next preventative care item' });
  }
});