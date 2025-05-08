import express from 'express';
import anthropic from '../utils/anthropic';

export const router = express.Router();

// Generate text with Claude
router.post('/generate-text', async (req, res) => {
  try {
    const { prompt, system, model, maxTokens, temperature } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const result = await anthropic.generateText(prompt, {
      system,
      model,
      maxTokens,
      temperature
    });
    
    res.json({ result });
  } catch (error: any) {
    console.error('Error in generate-text endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate JSON with Claude
router.post('/generate-json', async (req, res) => {
  try {
    const { prompt, schema, model, maxTokens, temperature } = req.body;
    
    if (!prompt || !schema) {
      return res.status(400).json({ error: 'Prompt and schema are required' });
    }
    
    const result = await anthropic.generateJson(prompt, schema, {
      model,
      maxTokens,
      temperature
    });
    
    res.json({ result });
  } catch (error: any) {
    console.error('Error in generate-json endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze image with Claude
router.post('/analyze-image', async (req, res) => {
  try {
    const { imageBase64, prompt, model, maxTokens, temperature } = req.body;
    
    if (!imageBase64 || !prompt) {
      return res.status(400).json({ error: 'Image data and prompt are required' });
    }
    
    const result = await anthropic.analyzeImage(imageBase64, prompt, {
      model,
      maxTokens,
      temperature
    });
    
    res.json({ result });
  } catch (error: any) {
    console.error('Error in analyze-image endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze sentiment with Claude
router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { text, model, maxTokens, temperature } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const result = await anthropic.analyzeSentiment(text, {
      model,
      maxTokens,
      temperature
    });
    
    res.json({ result });
  } catch (error: any) {
    console.error('Error in analyze-sentiment endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Summarize text with Claude
router.post('/summarize-text', async (req, res) => {
  try {
    const { text, model, maxTokens, temperature, wordLimit } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const result = await anthropic.summarizeText(text, {
      model,
      maxTokens,
      temperature,
      wordLimit
    });
    
    res.json({ result });
  } catch (error: any) {
    console.error('Error in summarize-text endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate medical documentation with Claude
router.post('/generate-medical-documentation', async (req, res) => {
  try {
    const { patientData, options } = req.body;
    
    if (!patientData || !patientData.symptoms || !patientData.chiefComplaint) {
      return res.status(400).json({ error: 'Patient data with symptoms and chief complaint is required' });
    }
    
    const result = await anthropic.generateMedicalDocumentation(patientData, options);
    
    res.json({ result });
  } catch (error: any) {
    console.error('Error in generate-medical-documentation endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate treatment plan with Claude
router.post('/generate-treatment-plan', async (req, res) => {
  try {
    const { diagnosis, patientDetails, options } = req.body;
    
    if (!diagnosis) {
      return res.status(400).json({ error: 'Diagnosis is required' });
    }
    
    const result = await anthropic.generateTreatmentPlan(diagnosis, patientDetails || {}, options);
    
    res.json({ result });
  } catch (error: any) {
    console.error('Error in generate-treatment-plan endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;