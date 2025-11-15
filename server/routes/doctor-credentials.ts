import { Router, Request, Response } from 'express';
import { supabase } from '../supabase-server';
import { encryptCredential, decryptCredential, maskCredential } from '../utils/encryption';
import { SpruceHealthClient } from '../spruce-health-client';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export const router = Router();

interface DoctorCredentials {
  spruce_access_id?: string;
  spruce_api_key?: string;
  openai_api_key?: string;
  claude_api_key?: string;
  preferred_ai_provider?: 'openai' | 'claude' | 'none';
}

/**
 * GET /api/doctor/credentials
 * Fetch doctor's credentials (masked for security)
 */
router.get('/credentials', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { data, error } = await supabase
      .from('doctor_credentials')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching credentials:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des identifiants' });
    }

    // If no credentials exist, return empty object
    if (!data) {
      return res.json({
        has_credentials: false,
        onboarding_completed: false,
        credentials_verified: false,
      });
    }

    // Mask sensitive data before sending to client
    const masked = {
      has_credentials: true,
      has_spruce: !!(data.spruce_access_id && data.spruce_api_key),
      has_openai: !!data.openai_api_key,
      has_claude: !!data.claude_api_key,
      preferred_ai_provider: data.preferred_ai_provider || 'none',
      onboarding_completed: data.onboarding_completed || false,
      credentials_verified: data.credentials_verified || false,
      // Masked preview for UI
      spruce_access_id_masked: data.spruce_access_id ? maskCredential(decryptCredential(data.spruce_access_id)) : null,
      spruce_api_key_masked: data.spruce_api_key ? '••••••••' : null,
      openai_api_key_masked: data.openai_api_key ? '••••••••' : null,
      claude_api_key_masked: data.claude_api_key ? '••••••••' : null,
    };

    res.json(masked);
  } catch (error) {
    console.error('Error in GET /credentials:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/doctor/credentials
 * Save or update doctor's credentials (encrypts before storing)
 */
router.post('/credentials', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const {
      spruce_access_id,
      spruce_api_key,
      openai_api_key,
      claude_api_key,
      preferred_ai_provider,
    }: DoctorCredentials = req.body;

    // Validate at least one credential is provided
    if (!spruce_access_id && !spruce_api_key && !openai_api_key && !claude_api_key) {
      return res.status(400).json({ 
        error: 'Au moins un identifiant doit être fourni' 
      });
    }

    // Encrypt credentials before storing
    const encryptedData: any = {
      user_id: userId,
      preferred_ai_provider: preferred_ai_provider || 'none',
    };

    if (spruce_access_id) {
      encryptedData.spruce_access_id = encryptCredential(spruce_access_id.trim());
    }
    if (spruce_api_key) {
      encryptedData.spruce_api_key = encryptCredential(spruce_api_key.trim());
    }
    if (openai_api_key) {
      encryptedData.openai_api_key = encryptCredential(openai_api_key.trim());
    }
    if (claude_api_key) {
      encryptedData.claude_api_key = encryptCredential(claude_api_key.trim());
    }

    // Upsert credentials (insert or update)
    const { data, error } = await supabase
      .from('doctor_credentials')
      .upsert(encryptedData, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving credentials:', error);
      return res.status(500).json({ error: 'Erreur lors de la sauvegarde des identifiants' });
    }

    res.json({
      success: true,
      message: 'Identifiants sauvegardés avec succès',
      has_spruce: !!(spruce_access_id || spruce_api_key),
      has_ai: !!(openai_api_key || claude_api_key),
    });
  } catch (error) {
    console.error('Error in POST /credentials:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/doctor/credentials/test-spruce
 * Test Spruce Health connection
 */
router.post('/credentials/test-spruce', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { spruce_access_id, spruce_api_key } = req.body;

    if (!spruce_access_id || !spruce_api_key) {
      return res.status(400).json({ error: 'Identifiants Spruce manquants' });
    }

    try {
      // Create a test client with provided credentials
      const testClient = new SpruceHealthClient({
        bearerToken: spruce_api_key,
        maxRetries: 1,
        retryDelay: 1000,
      });

      // Try to fetch conversations as a connection test
      const result = await testClient.getConversations({ per_page: 1 });
      
      // Update verification status
      await supabase
        .from('doctor_credentials')
        .update({ credentials_verified: true })
        .eq('user_id', userId);

      res.json({
        success: true,
        message: 'Connexion Spruce Health réussie',
        conversation_count: result.conversations?.length || 0,
      });
    } catch (error: any) {
      console.error('Spruce test connection error:', error);
      res.status(400).json({
        success: false,
        error: 'Échec de connexion Spruce Health',
        details: error.message,
      });
    }
  } catch (error) {
    console.error('Error in POST /credentials/test-spruce:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/doctor/credentials/test-ai
 * Test AI provider connection (OpenAI or Claude)
 */
router.post('/credentials/test-ai', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { provider, api_key } = req.body;

    if (!provider || !api_key) {
      return res.status(400).json({ error: 'Fournisseur ou clé API manquant' });
    }

    try {
      if (provider === 'openai') {
        // Test OpenAI connection
        const openai = new OpenAI({ apiKey: api_key });
        await openai.models.list();
        
        res.json({
          success: true,
          message: 'Connexion OpenAI réussie',
          provider: 'openai',
        });
      } else if (provider === 'claude') {
        // Test Claude connection
        const anthropic = new Anthropic({ apiKey: api_key });
        await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        });
        
        res.json({
          success: true,
          message: 'Connexion Claude réussie',
          provider: 'claude',
        });
      } else {
        res.status(400).json({ error: 'Fournisseur non supporté' });
      }
    } catch (error: any) {
      console.error(`${provider} test connection error:`, error);
      res.status(400).json({
        success: false,
        error: `Échec de connexion ${provider}`,
        details: error.message,
      });
    }
  } catch (error) {
    console.error('Error in POST /credentials/test-ai:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/doctor/credentials
 * Delete doctor's credentials
 */
router.delete('/credentials', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { error } = await supabase
      .from('doctor_credentials')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting credentials:', error);
      return res.status(500).json({ error: 'Erreur lors de la suppression des identifiants' });
    }

    res.json({
      success: true,
      message: 'Identifiants supprimés avec succès',
    });
  } catch (error) {
    console.error('Error in DELETE /credentials:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
