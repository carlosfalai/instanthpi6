#!/usr/bin/env node

/**
 * Update Supabase OAuth redirect URI configuration
 * This script adds https://instanthpi.ca/auth/callback to the allowed redirect URIs
 */

import https from 'https';
import { readFileSync } from 'fs';

const PROJECT_REF = 'uoahrhroyqsqixusewwe';
const REDIRECT_URI = 'https://instanthpi.ca/auth/callback';

// Get service role key from Supabase CLI
async function getServiceRoleKey() {
  const { execSync } = await import('child_process');
  try {
    const output = execSync(`supabase projects api-keys --project-ref ${PROJECT_REF}`, { encoding: 'utf-8' });
    const serviceRoleMatch = output.match(/service_role\s+\|\s+([^\s]+)/);
    if (serviceRoleMatch) {
      return serviceRoleMatch[1].trim();
    }
  } catch (error) {
    console.error('Failed to get service role key:', error.message);
  }
  return null;
}

// Update redirect URI via Supabase Management API
async function updateRedirectURI(serviceRoleKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/config/auth`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
      },
    };

    // First, get current config
    const getOptions = {
      ...options,
      method: 'GET',
      path: `/v1/projects/${PROJECT_REF}/config/auth`,
    };

    const getReq = https.request(getOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const config = JSON.parse(data);
          const currentURIs = config.SITE_URL ? [config.SITE_URL] : [];
          const redirectURLs = config.REDIRECT_URLS || [];
          
          // Combine and deduplicate
          const allURIs = [...new Set([...currentURIs, ...redirectURLs, REDIRECT_URI])];
          
          console.log('Current redirect URIs:', allURIs);
          
          // Update with new URI
          const updateData = JSON.stringify({
            REDIRECT_URLS: allURIs,
          });

          const updateReq = https.request(options, (updateRes) => {
            let updateData = '';
            updateRes.on('data', (chunk) => { updateData += chunk; });
            updateRes.on('end', () => {
              if (updateRes.statusCode === 200 || updateRes.statusCode === 204) {
                console.log('✅ Successfully updated redirect URI');
                console.log(`✅ Added: ${REDIRECT_URI}`);
                resolve(JSON.parse(updateData || '{}'));
              } else {
                console.error('❌ Failed to update redirect URI');
                console.error('Status:', updateRes.statusCode);
                console.error('Response:', updateData);
                reject(new Error(`HTTP ${updateRes.statusCode}: ${updateData}`));
              }
            });
          });

          updateReq.on('error', reject);
          updateReq.write(updateData);
          updateReq.end();
        } catch (error) {
          reject(error);
        }
      });
    });

    getReq.on('error', reject);
    getReq.end();
  });
}

async function main() {
  console.log('🔧 Updating Supabase OAuth redirect URI...');
  console.log(`Project: ${PROJECT_REF}`);
  console.log(`Redirect URI: ${REDIRECT_URI}`);
  console.log('');

  const serviceRoleKey = await getServiceRoleKey();
  if (!serviceRoleKey) {
    console.error('❌ Could not retrieve service role key');
    console.error('Please ensure you are logged in: supabase login');
    process.exit(1);
  }

  try {
    await updateRedirectURI(serviceRoleKey);
    console.log('');
    console.log('✅ Configuration updated successfully!');
    console.log('You may need to wait a few moments for changes to propagate.');
  } catch (error) {
    console.error('❌ Error updating redirect URI:', error.message);
    console.error('');
    console.error('Note: Redirect URIs may need to be updated manually in the Supabase Dashboard:');
    console.error(`https://supabase.com/dashboard/project/${PROJECT_REF}/auth/url-configuration`);
    process.exit(1);
  }
}

main();

