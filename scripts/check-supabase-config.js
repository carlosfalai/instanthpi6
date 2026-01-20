#!/usr/bin/env node

/**
 * Supabase Configuration Checker
 * Run this script to verify your Supabase environment variables are set correctly
 */

console.log("🔍 Checking Supabase Configuration...\n");

// Check if we're in a build environment
const isBuild = process.env.NETLIFY === "true" || process.env.NODE_ENV === "production";

if (isBuild) {
  console.log("📦 Build environment detected\n");
}

// Check environment variables
const requiredVars = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
};

const optionalVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
};

console.log("✅ Required Environment Variables (Frontend):");
let allPresent = true;
for (const [key, value] of Object.entries(requiredVars)) {
  const present = !!value;
  const valid = present && (key.includes("URL") ? value.startsWith("https://") : value.length > 50);

  if (present && valid) {
    console.log(`   ✓ ${key}: ${value.substring(0, 30)}...`);
  } else if (present) {
    console.log(`   ⚠️  ${key}: Present but invalid`);
    allPresent = false;
  } else {
    console.log(`   ❌ ${key}: MISSING`);
    allPresent = false;
  }
}

console.log("\n📋 Optional Environment Variables (Backend):");
for (const [key, value] of Object.entries(optionalVars)) {
  if (value) {
    console.log(`   ✓ ${key}: ${value.substring(0, 30)}...`);
  } else {
    console.log(`   ○ ${key}: Not set (optional)`);
  }
}

console.log("\n");

if (!allPresent) {
  console.log("❌ ISSUES FOUND:\n");
  console.log("To fix Supabase OAuth issues:\n");
  console.log("1. Go to Netlify Dashboard → Your Site → Settings → Build & Deploy → Environment");
  console.log("2. Add these variables:");
  console.log("   - VITE_SUPABASE_URL = https://uoahrhroyqsqixusewwe.supabase.co");
  console.log("   - VITE_SUPABASE_ANON_KEY = (your-anon-key)");
  console.log("3. Trigger a new deploy\n");
  console.log("Get your Supabase credentials from:");
  console.log("   https://supabase.com/dashboard/project/uoahrhroyqsqixusewwe/settings/api\n");
  process.exit(1);
} else {
  console.log("✅ All required Supabase variables are set correctly!");
  console.log("\nNext steps:");
  console.log("1. Verify OAuth redirect URI in Supabase Dashboard:");
  console.log("   https://instanthpi.ca/auth/callback");
  console.log("2. Ensure Google OAuth is enabled in Supabase");
  console.log("3. Test OAuth login flow\n");
  process.exit(0);
}
