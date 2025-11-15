import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/medical-templates/:physicianId - Get enabled templates for a doctor
router.get("/:physicianId", async (req: Request, res: Response) => {
  try {
    const { physicianId } = req.params;
    const { category, case_type } = req.query;

    let query = supabase
      .from("medical_templates")
      .select("*")
      .eq("physician_id", physicianId)
      .eq("is_enabled", true);

    if (category) {
      query = query.eq("template_category", category);
    }

    if (case_type) {
      query = query.or(`case_type.is.null,case_type.eq.${case_type}`);
    }

    const { data, error } = await query.order("is_default", { ascending: false });

    if (error) throw error;

    res.json({ templates: data || [] });
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/medical-templates/:physicianId/default/:category - Get default template for category/case_type
router.get("/:physicianId/default/:category", async (req: Request, res: Response) => {
  try {
    const { physicianId, category } = req.params;
    const { case_type } = req.query;

    let query = supabase
      .from("medical_templates")
      .select("*")
      .eq("physician_id", physicianId)
      .eq("template_category", category)
      .eq("is_enabled", true)
      .eq("is_default", true);

    if (case_type) {
      query = query.or(`case_type.is.null,case_type.eq.${case_type}`);
    } else {
      query = query.is("case_type", null);
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(1);

    if (error) throw error;

    res.json({ template: data?.[0] || null });
  } catch (error: any) {
    console.error("Error fetching default template:", error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to detect case type from patient data
export function detectCaseType(variables: any): string | null {
  const chiefComplaint = (variables.ChiefComplaint || "").toLowerCase();
  const description = (variables.Description || "").toLowerCase();
  const associatedSymptoms = (variables.AssociatedSymptoms || "").toLowerCase();
  const allText = `${chiefComplaint} ${description} ${associatedSymptoms}`.toLowerCase();

  // Gastroenteritis
  if (allText.includes("vomissement") || allText.includes("diarrhée") || 
      allText.includes("gastro") || allText.includes("nausée")) {
    return "gastroenteritis";
  }

  // Cough
  if (allText.includes("toux") || allText.includes("cough") || 
      allText.includes("expectoration")) {
    return "cough";
  }

  // Cystitis
  if (allText.includes("cystite") || allText.includes("dysurie") || 
      allText.includes("brûlure urinaire") || allText.includes("pollakiurie")) {
    return "cystitis";
  }

  // STI Screening
  if (allText.includes("itss") || allText.includes("dépistage") || 
      allText.includes("sti") || allText.includes("chlamydia") || 
      allText.includes("gonorrhée")) {
    return "sti_screening";
  }

  // Mental Health
  if (allText.includes("anxiété") || allText.includes("dépression") || 
      allText.includes("insomnie") || allText.includes("stress") || 
      allText.includes("trouble") || allText.includes("psych")) {
    return "mental_health";
  }

  // Emergency
  if (allText.includes("urgence") || allText.includes("douleur thoracique") || 
      allText.includes("essoufflement") || allText.includes("vision floue") ||
      allText.includes("torsion") || allText.includes("testiculaire")) {
    return "emergency";
  }

  // Abdominal Pain
  if (allText.includes("douleur abdominale") || allText.includes("colique") ||
      allText.includes("biliaire") || allText.includes("cholécystite")) {
    return "abdominal_pain";
  }

  // Orthopedic
  if (allText.includes("tendon") || allText.includes("achille") || 
      allText.includes("articulaire") || allText.includes("arthropathie")) {
    return "orthopedic";
  }

  // License Assessment
  if (allText.includes("classe") || allText.includes("license") || 
      allText.includes("conduite") || allText.includes("professionnelle")) {
    return "license_assessment";
  }

  return null;
}

export default router;

