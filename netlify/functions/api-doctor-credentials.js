const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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
    const spruceUrl = `https://api.sprucehealth.com/v1/conversations`;
    const response = await fetch(spruceUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${spruce_api_key}`,
        'X-Spruce-Access-ID': spruce_access_id,
        'Content-Type': 'application/json'
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
          messages: [{ role: 'user', content: 'test' }]
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
    
    // Get doctor ID from session or create a test one
    const doctorId = 'test-doctor-id'; // In real implementation, get from auth
    
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
      throw error;
    }

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
      body: JSON.stringify({ error: 'Failed to save credentials' })
    };
  }
}

async function getCredentials(event) {
  try {
    const doctorId = 'test-doctor-id'; // In real implementation, get from auth
    
    const { data, error } = await supabase
      .from('physicians')
      .select('*')
      .eq('id', doctorId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
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
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get credentials' })
    };
  }
}
