import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../middleware/auth";

const router = Router();

// All interconsultation routes require authentication - PHI and specialist data
router.use(requireAuth);

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

// Get all specialist profiles
router.get("/specialists", async (req, res) => {
  try {
    const { data: specialists, error } = await supabase
      .from("specialist_profiles")
      .select(
        `
        *,
        physicians!inner(
          id,
          name,
          email,
          clinics!inner(
            name,
            address
          )
        )
      `
      )
      .eq("accepts_referrals", true)
      .order("specialty", { ascending: true });

    if (error) throw error;

    res.json(specialists || []);
  } catch (error) {
    console.error("Error fetching specialists:", error);
    res.status(500).json({ error: "Failed to fetch specialists" });
  }
});

// Get specialist's referral templates
router.get("/specialists/:id/templates", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: templates, error } = await supabase
      .from("referral_templates")
      .select("*")
      .eq("specialist_id", id)
      .order("is_default", { ascending: false });

    if (error) throw error;

    res.json(templates || []);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// Create new interconsultation request
router.post("/interconsultations", async (req, res) => {
  try {
    const {
      consultation_id,
      patient_id,
      referring_physician_id,
      referring_clinic_id,
      consulting_specialist_id,
      template_used_id,
      urgency,
      reason_for_referral,
      specific_questions,
      formatted_referral,
    } = req.body;

    // Generate AI summary of the referral
    const ai_generated_summary = await generateReferralSummary(formatted_referral);

    const { data: interconsultation, error } = await supabase
      .from("interconsultations")
      .insert({
        consultation_id,
        patient_id,
        referring_physician_id,
        referring_clinic_id,
        consulting_specialist_id,
        template_used_id,
        urgency,
        reason_for_referral,
        specific_questions,
        formatted_referral,
        ai_generated_summary,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification to specialist (webhook or email)
    await notifySpecialist(interconsultation);

    res.json(interconsultation);
  } catch (error) {
    console.error("Error creating interconsultation:", error);
    res.status(500).json({ error: "Failed to create interconsultation" });
  }
});

// Get interconsultations for a physician
router.get("/interconsultations", async (req, res) => {
  try {
    const { physician_id, role } = req.query;

    let query = supabase.from("interconsultations").select(`
        *,
        referring_physician:physicians!interconsultations_referring_physician_id_fkey(
          id,
          name,
          email
        ),
        consulting_specialist:specialist_profiles!interconsultations_consulting_specialist_id_fkey(
          id,
          specialty,
          title,
          physicians!inner(
            name,
            email
          )
        ),
        consultations!inner(
          chief_complaint,
          created_at
        )
      `);

    if (role === "referring") {
      query = query.eq("referring_physician_id", physician_id);
    } else if (role === "specialist") {
      const { data: specialistProfile } = await supabase
        .from("specialist_profiles")
        .select("id")
        .eq("physician_id", physician_id)
        .single();

      if (specialistProfile) {
        query = query.eq("consulting_specialist_id", specialistProfile.id);
      }
    }

    const { data: interconsultations, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    res.json(interconsultations || []);
  } catch (error) {
    console.error("Error fetching interconsultations:", error);
    res.status(500).json({ error: "Failed to fetch interconsultations" });
  }
});

// Update interconsultation status
router.patch("/interconsultations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      specialist_response,
      specialist_recommendations,
      follow_up_required,
      follow_up_timeline,
    } = req.body;

    const updateData: any = { status, updated_at: new Date().toISOString() };

    if (status === "accepted") {
      updateData.accepted_at = new Date().toISOString();
    } else if (status === "reviewing") {
      updateData.reviewed_at = new Date().toISOString();
    } else if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
      updateData.specialist_response = specialist_response;
      updateData.specialist_recommendations = specialist_recommendations;
      updateData.follow_up_required = follow_up_required;
      updateData.follow_up_timeline = follow_up_timeline;
    }

    const { data: interconsultation, error } = await supabase
      .from("interconsultations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(interconsultation);
  } catch (error) {
    console.error("Error updating interconsultation:", error);
    res.status(500).json({ error: "Failed to update interconsultation" });
  }
});

// Add message to interconsultation thread
router.post("/interconsultations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const { sender_id, message, attachments } = req.body;

    const { data: newMessage, error } = await supabase
      .from("interconsultation_messages")
      .insert({
        interconsultation_id: id,
        sender_id,
        message,
        attachments,
      })
      .select()
      .single();

    if (error) throw error;

    res.json(newMessage);
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ error: "Failed to add message" });
  }
});

// Get messages for an interconsultation
router.get("/interconsultations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: messages, error } = await supabase
      .from("interconsultation_messages")
      .select(
        `
        *,
        sender:physicians!interconsultation_messages_sender_id_fkey(
          id,
          name,
          email
        )
      `
      )
      .eq("interconsultation_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    res.json(messages || []);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Create or update specialist profile
router.post("/specialist-profiles", async (req, res) => {
  try {
    const {
      physician_id,
      specialty,
      sub_specialty,
      title,
      credentials,
      languages,
      response_time_hours,
      bio,
      expertise_areas,
      hospital_affiliations,
    } = req.body;

    const { data: profile, error } = await supabase
      .from("specialist_profiles")
      .upsert(
        {
          physician_id,
          specialty,
          sub_specialty,
          title,
          credentials,
          languages,
          response_time_hours,
          bio,
          expertise_areas,
          hospital_affiliations,
        },
        {
          onConflict: "physician_id",
        }
      )
      .select()
      .single();

    if (error) throw error;

    res.json(profile);
  } catch (error) {
    console.error("Error creating specialist profile:", error);
    res.status(500).json({ error: "Failed to create specialist profile" });
  }
});

// Create or update referral template
router.post("/referral-templates", async (req, res) => {
  try {
    const {
      specialist_id,
      template_name,
      is_default,
      required_sections,
      custom_questions,
      priority_conditions,
      excluded_conditions,
      minimum_info_requirements,
      preferred_format,
    } = req.body;

    // If this is being set as default, unset other defaults
    if (is_default) {
      await supabase
        .from("referral_templates")
        .update({ is_default: false })
        .eq("specialist_id", specialist_id);
    }

    const { data: template, error } = await supabase
      .from("referral_templates")
      .insert({
        specialist_id,
        template_name,
        is_default,
        required_sections,
        custom_questions,
        priority_conditions,
        excluded_conditions,
        minimum_info_requirements,
        preferred_format,
      })
      .select()
      .single();

    if (error) throw error;

    res.json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
});

// Helper function to generate AI summary
async function generateReferralSummary(referralData: any): Promise<string> {
  try {
    // Use OpenAI to generate concise summary
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Generate a concise medical referral summary in French. Focus on key clinical findings and reason for referral.",
          },
          {
            role: "user",
            content: JSON.stringify(referralData),
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return "Summary generation failed";
  }
}

// Helper function to notify specialist
async function notifySpecialist(interconsultation: any): Promise<void> {
  try {
    // Get specialist email
    const { data: specialist } = await supabase
      .from("specialist_profiles")
      .select(
        `
        physicians!inner(
          email,
          name
        )
      `
      )
      .eq("id", interconsultation.consulting_specialist_id)
      .single();

    if (specialist) {
      // Send email notification
      const physicians = specialist.physicians as { email: string; name: string } | { email: string; name: string }[];
      const email = Array.isArray(physicians) ? physicians[0]?.email : physicians.email;
      console.log(`Notifying specialist: ${email}`);
      // Email sending logic would go here
    }
  } catch (error) {
    console.error("Error notifying specialist:", error);
  }
}

export default router;
