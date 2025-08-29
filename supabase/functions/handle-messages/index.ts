import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { action, payload } = await req.json();

    switch (action) {
      case "fetchMessages": {
        const { data, error } = await supabaseClient
          .from("messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        return new Response(JSON.stringify({ messages: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "sendMessage": {
        const { patientId, content, subject } = payload;
        const { data, error } = await supabaseClient
          .from("messages")
          .insert({
            patient_id: patientId,
            content,
            subject,
            sender: "provider",
            status: "sent",
          })
          .select();

        if (error) throw error;
        return new Response(JSON.stringify({ message: data[0] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "updateMessageStatus": {
        const { messageId, status } = payload;
        const { data, error } = await supabaseClient
          .from("messages")
          .update({ status })
          .eq("id", messageId)
          .select();

        if (error) throw error;
        return new Response(JSON.stringify({ message: data[0] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
