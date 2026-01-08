const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { method, path } = event;
    
    if (path.includes('/test-spruce')) {
      return await testSpruceConnection(event);
    } else if (path.includes('/test-ai')) {
      return await testAIConnection(event);
    } else if (method === 'POST') {
      return await saveCredentials(event);
    } else if (method === 'GET') {
      return await getCredentials(event);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Error in doctor credentials API:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function testSpruceConnection(event) {
  try {
    const { spruce_access_id, spruce_api_key } = JSON.parse(event.body);

    if (!spruce_access_id || !spruce_api_key) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Spruce credentials are required' })
      };
    }

    // Test Spruce Health API connection
    // Per Spruce API docs: Use Bearer token authentication
    // https://developer.sprucehealth.com/docs/overview#authentication
    const spruceUrl = `https://api.sprucehealth.com/v1/conversations`;
    const response = await fetch(spruceUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${spruce_api_key}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Spruce Health connection successful',
          conversation_count: data.conversations?.length || 0
        })
      };
    } else {
      throw new Error(`Spruce API error: ${response.status} ${response.statusText}`);
    }

  } catch (error) {
    console.error('Spruce test error:', error);
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: `Spruce connection failed: ${error.message}`
      })
    };
  }
}

async function testOpenAIConnection(event) {
  try {
    const { api_key } = JSON.parse(event.body);
    
    if (!api_key) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'OpenAI API key is required' })
      };
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('OpenAI API Response:', response.status, response.statusText);

    if (response.ok) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'OpenAI connection successful'
        })
      };
    } else {
      const errorText = await response.text();
      console.log('OpenAI API Error:', errorText);
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`
        })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: `OpenAI connection failed: ${error.message}`
      })
    };
  }
}

async function testClaudeConnection(event) {
  try {
    const { api_key } = JSON.parse(event.body);
    
    if (!api_key) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Claude API key is required' })
      };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': api_key,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    console.log('Claude API Response:', response.status, response.statusText);

    if (response.ok) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Claude connection successful'
        })
      };
    } else {
      const errorText = await response.text();
      console.log('Claude API Error:', errorText);
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `Claude API error: ${response.status} - ${errorText}`
        })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: `Claude connection failed: ${error.message}`
      })
    };
  }
}

async function testAIConnection(event) {
  try {
    const { provider, api_key } = JSON.parse(event.body);

    if (!provider || !api_key) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Provider and API key are required' })
      };
    }

    if (provider === 'openai') {
      // Test OpenAI API
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            message: 'OpenAI connection successful',
            provider: 'OpenAI'
          })
        };
      } else {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

    } else if (provider === 'claude') {
      // Test Anthropic API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': api_key,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });

      if (response.ok) {
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            message: 'Claude connection successful',
            provider: 'Claude'
          })
        };
      } else {
        throw new Error(`Claude API error: ${response.status}`);
      }
    }

    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid provider' })
    };

  } catch (error) {
    console.error('AI test error:', error);
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: `${provider} connection failed: ${error.message}`
      })
    };
  }
}

async function saveCredentials(event) {
  try {
    const credentials = JSON.parse(event.body);
    
    // Get doctor ID from the request or use a default
    const doctorId = credentials.doctor_id || 'default-doctor';
    
    console.log('Saving credentials for doctor:', doctorId);
    console.log('Credentials:', {
      specialty: credentials.specialty,
      has_spruce_access: !!credentials.spruce_access_id,
      has_spruce_api: !!credentials.spruce_api_key,
      has_openai: !!credentials.openai_api_key,
      has_claude: !!credentials.claude_api_key
    });
    
    const supabase = getSupabase();
    if (!supabase) {
      // No persistence available; acknowledge receipt so UI can proceed (temporary fallback)
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: 'Credentials accepted (not persisted: Supabase env missing)' })
      };
    }

    const { error } = await supabase
      .from('physicians')
      .upsert({
        id: doctorId,
        specialty: credentials.specialty,
        spruce_access_id: credentials.spruce_access_id,
        spruce_api_key: credentials.spruce_api_key,
        openai_api_key: credentials.openai_api_key,
        claude_api_key: credentials.claude_api_key,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Credentials saved successfully');

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Credentials saved successfully' })
    };

  } catch (error) {
    console.error('Save credentials error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Failed to save credentials: ${error.message}` })
    };
  }
}

async function getCredentials(event) {
  try {
    const doctorId = 'default-doctor'; // Use consistent ID
    const supabase = getSupabase();
    if (!supabase) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, data: {} })
      };
    }

    const { data, error } = await supabase
      .from('physicians')
      .select('*')
      .eq('id', doctorId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Get credentials error:', error);
      // Return empty data instead of error for new doctors
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          data: {}
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: data || {}
      })
    };

  } catch (error) {
    console.error('Get credentials error:', error);
    return {
      statusCode: 200, // Return success with empty data
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: {}
      })
    };
  }
}
