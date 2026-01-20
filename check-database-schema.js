#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log("🔍 Checking InstantHPI database schema...\n");

  try {
    // Try to get all tables by querying information_schema
    const { data: tables, error: tablesError } = await supabase.rpc("get_tables");

    if (tablesError) {
      console.log("❌ Could not get tables via RPC, trying direct queries...\n");
    } else {
      console.log("📋 Available tables:", tables);
    }

    // Try common table names
    const commonTables = [
      "consultations",
      "patients",
      "physicians",
      "physician_profiles",
      "form_submissions",
      "messages",
      "ai_documentations",
      "pending_items",
      "preventative_care",
      "users",
      "clinics",
      "referrals",
      "ai_processing_logs",
    ];

    console.log("🔍 Checking for common tables...\n");

    for (const tableName of commonTables) {
      try {
        const { data, error } = await supabase.from(tableName).select("*").limit(1);

        if (error) {
          console.log(`❌ Table '${tableName}' - ${error.message}`);
        } else {
          console.log(`✅ Table '${tableName}' exists and accessible`);

          // Try to get count
          const { count, error: countError } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true });

          if (!countError) {
            console.log(`   📊 Records: ${count}`);
          }
        }
      } catch (err) {
        console.log(`❌ Table '${tableName}' - Exception: ${err.message}`);
      }
    }

    // Check if we can access the auth schema
    console.log("\n🔐 Checking auth schema...");
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.log("❌ Auth error:", error.message);
      } else {
        console.log("✅ Auth system accessible");
        if (user) {
          console.log(`   👤 Current user: ${user.email}`);
        }
      }
    } catch (err) {
      console.log("❌ Auth exception:", err.message);
    }
  } catch (error) {
    console.error("❌ General error:", error.message);
  }
}

checkDatabaseSchema();
