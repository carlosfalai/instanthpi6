import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Settings, Eye, Save, Loader2, MessageSquare } from "lucide-react";

interface MedicalTemplate {
  id: string;
  template_name: string;
  template_category: string;
  template_type: string;
  case_type: string | null;
  template_content: string;
  is_enabled: boolean;
  is_default: boolean;
  usage_count: number;
}

// Default templates data
const DEFAULT_TEMPLATES: Omit<
  MedicalTemplate,
  "id" | "physician_id" | "created_at" | "updated_at" | "usage_count" | "last_used_at"
>[] = [
  // SOAP Note Styles (6 models)
  {
    template_name: "SOAP Style 1 - Gastroenteritis",
    template_category: "soap_note",
    template_type: "soap_style_1",
    case_type: "gastroenteritis",
    template_content:
      "Femme de 27 ans ayant présenté un épisode aigu de vomissements (5 à 6 épisodes) et de diarrhée survenu le 14 octobre 2025 après ingestion d'un poke bowl. Symptômes résolus vers 13 h, avec persistance d'une faiblesse et d'un inconfort sus-pubien modéré (6/10). Aucun sang dans les selles, pas de fièvre, pas de frissons, pas de déshydratation significative. Aucun antécédent gastro-intestinal ni médication récente.\n\nImpression clinique: gastro-entérite alimentaire aiguë autolimitée, probablement liée à une intoxication alimentaire bénigne.\n\nPlan: repos à domicile, hydratation orale fractionnée (eau, bouillon, solution d'électrolytes), reprise graduelle de l'alimentation (riz, banane, compote, rôties sèches, puis protéines légères et légumes cuits après 24 h sans vomissement). Éviter aliments gras, épicés, produits laitiers, café et alcool pendant 72 h. Offrir arrêt de travail de 2 jours pour récupération complète. Aucun examen complémentaire ni traitement médicamenteux requis. Recommander suivi via Spruce dans 2 à 3 jours ou plus tôt si fièvre, sang dans les selles, vomissements persistants ou signes de déshydratation.",
    is_enabled: true,
    is_default: true,
  },
  {
    template_name: "SOAP Style 2 - Cough",
    template_category: "soap_note",
    template_type: "soap_style_2",
    case_type: "cough",
    template_content:
      "S: Homme de 24 ans consultant pour une toux productive persistante depuis le 20 juillet 2025. Expectorations claires à blanches, adhérentes dans la gorge, soulagées temporairement par l'eau et l'expectoration. Aucun symptôme systémique associé. N'a pas tenté de traitement pharmacologique. Pas de fièvre, dyspnée, douleur thoracique, exposition connue, antécédent d'asthme, allergies ou RGO. Symptômes constants, non aggravés la nuit ou en position couchée. État général bon.\n\nA: Toux chronique probablement post-infectieuse avec hypersécrétion bronchique. Composante bactérienne persistante possible.\n\nP: Azithromycine (Z-Pak) x 5 jours et Ventolin PRN. Prescription à faxer à sa pharmacie dès que l'information sera transmise. Suivi recommandé via messagerie dans 7 jours. Si amélioration <70 %, envisager CXR.",
    is_enabled: true,
    is_default: true,
  },
  {
    template_name: "SOAP Style 3 - Professional License 4B",
    template_category: "soap_note",
    template_type: "soap_style_3",
    case_type: "license_assessment",
    template_content:
      "S: Homme demandant l'obtention d'une classe professionnelle 4B. Aucun antécédent médical, aucun usage d'alcool ou de drogues récréatives. Porte des lunettes. Pas de symptômes cardiaques. Pas de médecin de famille attitré. Aucun antécédent de conduite avec facultés affaiblies. Questionnaire CAGE et critères de dépendance tous négatifs.\n\nO: Auto-questionnaire complété, aucune alerte clinique.\n\nA: Aucun facteur médical ou psychiatrique limitant pour l'obtention de la classe 4B.\n\nP: Déclaration de santé favorable. Attestation à émettre.",
    is_enabled: true,
    is_default: false,
  },
  {
    template_name: "SOAP Style 4 - Cystitis",
    template_category: "soap_note",
    template_type: "soap_style_4",
    case_type: "cystitis",
    template_content:
      "S: Femme de 53 ans connue pour cystites récidivantes, consulte pour symptômes typiques débutés le 26 septembre : dysurie intense, pollakiurie sévère persistante malgré vidange vésicale, sensation de brûlure, inconfort sus-pubien. ATCD de cystite il y a 2 semaines traitée avec un autre antibactérien (non précisé, mais inefficace selon patiente), puis rémission complète pendant 10 jours. Efficacité antérieure documentée avec ciprofloxacine.\n\nA: Cystite récidivante probable, réponse partielle ou échec au traitement initial. Rechute précoce avec symptômes classiques.\n\nP: Ciprofloxacine 500 mg BID x 5 jours faxée à sa pharmacie. Recommandé de faire une culture urinaire avant début du traitement si possible. Surveillance des symptômes et réévaluation PRN.",
    is_enabled: true,
    is_default: true,
  },
  {
    template_name: "SOAP Style 5 - STI Screening",
    template_category: "soap_note",
    template_type: "soap_style_5",
    case_type: "sti_screening",
    template_content:
      "S: Femme de 21 ans, asymptomatique, souhaite dépistage ITSS complet incluant prise de sang (VIH, syphilis, hépatites B et C, herpès génital), dans un contexte de rapports non protégés et nouvelle fréquentation. Pratiques sexuelles variées incluant pénétration vaginale, anale, et sexe oral. Aucun symptôme chez partenaire. Antécédents de partenaires multiples dans les 3 derniers mois.\n\nA: Demande de dépistage ITSS à visée préventive. Facteurs de risque modérés à élevés.\n\nP: Requête émise pour dépistage complet ITSS (PCR et sérologies). À faire dans un CLSC ou autre centre de dépistage. Résultats suivis via messagerie sécurisée. Prévention, counseling et contraception à discuter selon résultats. Aucune contre-indication immédiate.",
    is_enabled: true,
    is_default: true,
  },
  {
    template_name: "SOAP Style 6 - License 4B with Substance Use",
    template_category: "soap_note",
    template_type: "soap_style_6",
    case_type: "license_assessment",
    template_content:
      "S: Homme demandant l'obtention d'une classe professionnelle 4B. Aucun antécédent médical ou usage régulier de substances. Consommation occasionnelle d'alcool et de drogues récréatives déclarée. Aucun symptôme cardiaque. Pas de médecin de famille. Aucun antécédent de sanctions liées à la conduite avec facultés affaiblies. Score CAGE négatif.\n\nO: Auto-questionnaire sans signe de dépendance. Réponses négatives à tous les critères DSM liés à l'usage problématique de substances.\n\nA: Aucun obstacle médical ou psychiatrique apparent à l'obtention de la classe 4B.\n\nP: Déclaration de santé complétée favorablement. Attestation à émettre si aucun autre élément limitant.",
    is_enabled: true,
    is_default: false,
  },
  // Work Leave (1)
  {
    template_name: "Work Leave - Gastroenteritis",
    template_category: "work_leave",
    template_type: "work_leave_1",
    case_type: "gastroenteritis",
    template_content:
      "Arrêt de travail médical du 14/10/2025 au 16/10/2025 inclus pour gastro-entérite aiguë nécessitant repos et hydratation à domicile. Reprise du travail prévue le 17/10/2025 sous réserve d'amélioration clinique.",
    is_enabled: true,
    is_default: true,
  },
  // Patient Messages (5)
  {
    template_name: "Patient Message - Gastroenteritis",
    template_category: "patient_message",
    template_type: "patient_message_1",
    case_type: "gastroenteritis",
    template_content:
      "Votre épisode correspond à une gastro-entérite alimentaire aiguë probablement liée au repas pris plus tôt aujourd'hui. Les vomissements et la diarrhée sont maintenant terminés, ce qui est un bon signe. L'objectif principal pour les prochaines 48 heures est de bien vous réhydrater afin d'éviter la fatigue et les étourdissements; buvez de petites gorgées d'eau régulièrement ainsi que des liquides riches en électrolytes ou du bouillon de poulet, selon votre tolérance. Dès que l'estomac le permet, reprenez doucement l'alimentation avec des aliments faciles à digérer comme riz, bananes, compote, rôties sèches, puis progressivement du poulet ou des légumes cuits. Évitez pendant 72 heures les produits laitiers, les aliments gras ou épicés, l'alcool et le café. Vous pouvez me réécrire dans Spruce d'ici deux à trois jours pour me dire comment vous vous sentez. Si vous souhaitez un congé de travail de deux jours pour vous permettre de bien récupérer, je peux vous le préparer. Consultez rapidement si la fièvre, le sang dans les selles ou les vomissements réapparaissent, ou si la douleur abdominale s'intensifie.",
    is_enabled: true,
    is_default: true,
  },
  {
    template_name: "Patient Message - Mental Health Leave",
    template_category: "patient_message",
    template_type: "patient_message_2",
    case_type: "mental_health",
    template_content:
      "Je vous propose de prendre un congé de travail d'une durée de deux semaines pour vous permettre de récupérer émotionnellement et de retrouver un meilleur équilibre. Aucun médicament n'est nécessaire pour le moment; l'objectif est surtout de vous accorder le temps et l'espace nécessaires pour reprendre votre souffle. Si, après ces deux semaines, vous ne constatez pas d'amélioration notable, nous pourrons prolonger l'arrêt pour une autre période de deux semaines, mais il faudra alors prévoir une réévaluation en personne. À ce moment, si le sommeil demeure difficile, je pourrai envisager avec vous une faible dose de zopiclone pour quelques nuits. Je vous réfère dès maintenant en psychothérapie afin de vous offrir un soutien adapté; il est normal que cette période d'ajustement prenne un peu de temps. S'éloigner temporairement d'un environnement aussi stressant que l'urgence vous permettra de prendre un recul, de respirer et de vous recentrer sur ce qui est important pour vous et votre famille. Souhaitez-vous que je prépare ces éléments pour vous dès maintenant?",
    is_enabled: true,
    is_default: true,
  },
  {
    template_name: "Patient Message - STI Testing",
    template_category: "patient_message",
    template_type: "patient_message_3",
    case_type: "sti_screening",
    template_content:
      "Je vous ai préparé une requête pour effectuer un bilan urinaire et vaginal au CLSC, étant donné vos symptômes de douleur post-mictionnelle, inconfort vaginal et sensation de pression depuis la pose du stérilet. Ce bilan inclut une analyse d'urine, une culture, un dépistage des infections vaginales (bactéries, levures, trichomonas) ainsi que les tests pour chlamydia et gonorrhée. Il faudra l'imprimer et l'apporter au CLSC, de préférence en évitant d'uriner 2 heures avant le prélèvement. Si les symptômes persistent après le retrait du stérilet prévu lundi, on pourra réévaluer à ce moment-là. Souhaitez-vous que je vous envoie ce document dès maintenant?",
    is_enabled: true,
    is_default: true,
  },
  {
    template_name: "Patient Message - Mental Health Extension",
    template_category: "patient_message",
    template_type: "patient_message_4",
    case_type: "mental_health",
    template_content:
      "Je vous ai prolongé votre arrêt de travail de quatre semaines pour vous permettre de poursuivre votre suivi psychologique et de revoir le psychiatre du même groupe que vous aviez consulté; ce type de dépression nécessite un suivi en personne pour ajuster le traitement et envisager une combinaison de médicaments au besoin; continuez la venlafaxine 225 mg comme à l'habitude d'ici là et tenez-moi au courant de la date de votre prochain rendez-vous; je vous souhaite bon courage pour la suite, vous êtes déjà bien encadrée et c'est la bonne direction.",
    is_enabled: true,
    is_default: false,
  },
  {
    template_name: "Patient Message - Emergency Referral",
    template_category: "patient_message",
    template_type: "patient_message_5",
    case_type: "emergency",
    template_content:
      "Je vais vous préparer une note de référence pour une évaluation en personne, étant donné votre épisode de vision floue et d'éclairs lumineux à l'œil gauche suivi d'un engourdissement du bras. Il est important de faire un examen sur place pour s'assurer que la circulation au niveau du cerveau et de l'œil est normale et exclure un petit trouble vasculaire avant de conclure à une migraine avec aura. Vous pourrez présenter cette note à l'urgence sans avoir à tout réexpliquer; ils feront les examens nécessaires comme la tension artérielle, l'examen neurologique et, si besoin, une imagerie.",
    is_enabled: true,
    is_default: true,
  },
  // Case Discussion Examples (4)
  {
    template_name: "Case Discussion - Mental Health",
    template_category: "case_discussion",
    template_type: "case_discussion_1",
    case_type: "mental_health",
    template_content:
      "🧠 Case Discussion\n\nSummary: 35-year-old woman with a 6-month history of intense headaches, insomnia, anxiety, fatigue, pruritic skin eruptions, and low mood in a high-stress work context (collections industry). Sleep significantly disrupted, often awake 3–5 a.m., with difficulty returning to sleep. No suicidal ideation. Occasional nausea, but negative pregnancy tests. On Depo-Provera every 3 months. No current treatment or follow-up in place.\n\n🔎 Clinical Impression:\n• Likely adjustment disorder with anxious and depressive features or mixed anxiety-depression.\n• Psychophysiological insomnia possibly worsened by occupational stress.\n• Chronic tension-type headaches or stress-induced migraine possible.\n• Cutaneous symptoms may be stress-related eczema or prurigo, though specifics still unclear — could merit dermatology input if persistent.\n\n⚠️ Red flags ruled out:\n• No suicidal ideation\n• No signs of migraine with aura, photophobia, or severe nausea\n• No substance use or family psych history (so far)\n\n🧭 Next Steps Strategy (Spartan):\n1. Sleep: Start low-dose trazodone 25 mg HS, increase by 25 mg every 2–3 days as needed, up to 100 mg max.\n2. Psych follow-up: Recommend referral to psychologist for CBT/supportive therapy → ask patient if she wants this sent.\n3. Work: Issue temporary sick leave for 2–4 weeks if she feels unable to perform.\n4. Labs: Recommend baseline bloodwork (CBC, TSH, B12, ferritin, glucose, liver enzymes, vitamin D) to rule out reversible fatigue causes.\n5. Limitations: Remind patient this cannot be managed long term via telemed — she needs regular in-person follow-up for chronic mental health care.",
    is_enabled: true,
    is_default: true,
  },
  {
    template_name: "Case Discussion - Cough",
    template_category: "case_discussion",
    template_type: "case_discussion_2",
    case_type: "cough",
    template_content:
      '🩺 Clinical Discussion – Persistent Dry Cough in 43M Post-Viral (Since Oct 4, 2025)\n\nSummary of presentation: 43-year-old male presenting with a persistent, non-productive dry cough lasting ~2 weeks, following a flu-like illness. No fever, no dyspnea, no chest pain, no hemoptysis, no GERD symptoms, no smoking history, and no relevant exposures. OTC meds ineffective.\n\nMost likely etiology: This appears to be post-viral cough (post-infectious bronchial hyperreactivity), which is a common benign condition that can last up to 3–8 weeks after a viral URTI, especially in non-smokers with no other red flags.\n\nDifferential to consider if symptoms persist or worsen:\n• Pertussis (especially in prolonged cough >3 weeks — even without classic "whoop")\n• Cough variant asthma\n• Post-nasal drip (upper airway cough syndrome)\n• GERD-related cough (silent reflux)\n• Less likely but worth ruling out: atypical pneumonia, eosinophilic bronchitis, TB (depending on epidemiology)\n\nPlan:\n• Trial of inhaled salbutamol (Ventolin) as a bronchodilator for symptomatic relief\n• Consider short course of oral corticosteroids (e.g., prednisone 5 days) if cough remains very disruptive and unresponsive\n• Empirical treatment with azithromycin may be considered if concern for atypical infection (e.g., mycoplasma, pertussis), especially given the duration\n• If cough lasts >3–4 weeks with no improvement: order chest x-ray + consider spirometry + ENT referral if ENT source suspected',
    is_enabled: true,
    is_default: true,
  },
  {
    template_name: "Case Discussion - Testicular Pain",
    template_category: "case_discussion",
    template_type: "case_discussion_3",
    case_type: "emergency",
    template_content:
      "Ce tableau clinique correspond à une urgence potentielle — la torsion testiculaire doit être écartée en priorité, surtout en présence de douleur soudaine, intense, avec gonflement, irradiation vers l'aine, et aucun soulagement. Même en l'absence de fièvre ou de symptômes urinaires, la présentation est compatible avec une torsion ou, à défaut, une épididymite aiguë à germes sexuellement transmis.\n\n🔍 Raisonnement clinique :\n• Début soudain, douleur 8/10 → torsion testiculaire possible\n• Gonflement du scrotum, douleur irradiante → red flags\n• Pas de fièvre, ni brûlure urinaire → infection moins probable mais pas exclue\n• Rapport sexuel non protégé → chlamydia/gonorrhée possible → épididymite\n• Pas de trauma ou ATCD → torsion spontanée possible\n\n✅ Plan immédiat :\nCe n'est pas un cas télémed. Il doit se rendre immédiatement à l'urgence pour un examen physique complet, échographie doppler scrotale en urgence, et un traitement rapide si torsion (fenêtre thérapeutique <6h).\n\nSi ce n'est pas une torsion, une épididymite infectieuse devra être considérée et traitée selon les protocoles ITSS.",
    is_enabled: true,
    is_default: true,
  },
  {
    template_name: "Case Discussion - Achilles Tendinopathy",
    template_category: "case_discussion",
    template_type: "case_discussion_4",
    case_type: "orthopedic",
    template_content:
      "Stepwise Strategy – Achilles Tendinopathy / Inflammatory Arthropathy Workup (Spartan Format)\n\n1. Symptoms\nChronic bilateral Achilles tendon pain, worse on left, worsened by activity and now even at rest. Morning stiffness and swelling suggest inflammatory etiology. Negative rheumatoid workup, but family history of arthritis present.\n\n2. Physical Red Flags\nPain on walking and increased morning stiffness → raises suspicion for insertional tendinopathy, spondyloarthropathy, or enthesitis-related inflammation.\n\n3. Labs\nOrder to rule out seronegative arthropathy and systemic inflammatory process:\n• CBC, CRP, ESR\n• HLA-B27\n• Uric acid\n• TSH\n• Renal function (if on NSAIDs)\n\n4. Imaging\n• Bilateral ankle X-rays → rule out calcification, Haglund deformity, erosions\n• If X-rays inconclusive or persistent pain → Ultrasound or MRI of Achilles tendon (to assess for tendon thickening, partial tear, or retrocalcaneal bursitis)\n\n5. Treatment\n• Continue NSAIDs short term, stop if no benefit or if side effects\n• Activity modification – stop all sports temporarily\n• Physiotherapy referral – focus on eccentric loading of Achilles, gradual reconditioning\n• Consider custom orthotics if biomechanical overload suspected\n• If poor response to 4–6 weeks conservative care: refer to sports med or orthopedics\n\n6. Follow-Up\n• Monitor in 3–4 weeks with lab and imaging results\n• Earlier follow-up if worsening symptoms\n• Reinforce need to avoid high-impact activity until diagnosis clarified and rehab plan in place",
    is_enabled: true,
    is_default: true,
  },
  // Imaging Requisition Templates (2)
  {
    template_name: "Imaging - Abdominal Ultrasound",
    template_category: "imaging_requisition",
    template_type: "imaging_1",
    case_type: "abdominal_pain",
    template_content:
      "Échographie abdominale complète – Femme de 25 ans présentant des douleurs abdominales post-prandiales déclenchées par les aliments gras depuis 6 mois, avec progression de la fréquence des épisodes, nausées associées, intensité 7/10.\n\nIndication: Recherche de lithiase vésiculaire, évaluation de l'épaisseur de la paroi vésiculaire, recherche de signes de cholécystite chronique, évaluation du parenchyme hépatique et des voies biliaires intra et extra-hépatiques, évaluation du pancréas.\n\nUrgent - dans les 48-72 heures",
    is_enabled: true,
    is_default: true,
  },
  {
    template_name: "Imaging - MRCP",
    template_category: "imaging_requisition",
    template_type: "imaging_2",
    case_type: "abdominal_pain",
    template_content:
      "Cholangio-IRM – Femme de 25 ans avec suspicion de pathologie biliaire, douleurs abdominales récurrentes post-prandiales depuis 6 mois, progression symptomatique.\n\nIndication: Si échographie non concluante, évaluation détaillée de l'arbre biliaire, recherche de microlithiase, évaluation du sphincter d'Oddi, exclusion de variants anatomiques ou de pathologie canalaire.\n\nSemi-urgent - dans les 2 semaines si échographie négative",
    is_enabled: true,
    is_default: false,
  },
  // Specialist Referral Templates (2)
  {
    template_name: "Referral - General Surgery",
    template_category: "specialist_referral",
    template_type: "referral_1",
    case_type: "abdominal_pain",
    template_content:
      "Chirurgie générale – Femme de 25 ans présentant des douleurs abdominales post-prandiales typiques de colique biliaire depuis 6 mois, avec progression de la fréquence des épisodes (maintenant aux 2 jours), intensité 7/10, déclenchées par les aliments gras, associées à des nausées. Traitement actuel: citalopram 30mg pour anxiété.\n\nMerci d'évaluer cette patiente pour cholécystectomie laparoscopique élective. Bilan préopératoire et imagerie en cours.\n\nSemi-urgent - consultation dans les 2-4 semaines",
    is_enabled: true,
    is_default: true,
  },
  {
    template_name: "Referral - Gastroenterology",
    template_category: "specialist_referral",
    template_type: "referral_2",
    case_type: "abdominal_pain",
    template_content:
      "Gastro-entérologie – Femme de 25 ans avec douleurs abdominales post-prandiales depuis 6 mois, nausées, reflux gastro-œsophagien, perte d'appétit. Suspicion de pathologie biliaire vs dyspepsie fonctionnelle. Anxiété traitée par citalopram 30mg.\n\nMerci d'évaluer pour endoscopie digestive haute si bilan initial négatif, considérer manométrie œsophagienne si symptômes de reflux persistants, évaluation pour dysfonction du sphincter d'Oddi si imagerie normale.\n\nRoutine - consultation dans les 6-8 semaines si bilan initial négatif",
    is_enabled: true,
    is_default: true,
  },
];

export default function MedicalTemplatesManager() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MedicalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("soap_note");
  const [editingTemplate, setEditingTemplate] = useState<MedicalTemplate | null>(null);

  const categories = [
    { value: "soap_note", label: "SOAP Note Styles", icon: FileText },
    { value: "work_leave", label: "Work Leave", icon: FileText },
    { value: "patient_message", label: "Patient Messages", icon: MessageSquare },
    { value: "case_discussion", label: "Case Discussion", icon: Settings },
    { value: "imaging_requisition", label: "Imaging Requisitions", icon: Eye },
    { value: "specialist_referral", label: "Specialist Referrals", icon: FileText },
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("medical_templates")
        .select("*")
        .eq("physician_id", user.id)
        .order("template_category", { ascending: true })
        .order("template_name", { ascending: true });

      if (error) throw error;

      // If no templates exist, initialize with defaults
      if (!data || data.length === 0) {
        await initializeDefaultTemplates();
      } else {
        setTemplates(data);
      }
    } catch (error: any) {
      console.error("Error loading templates:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultTemplates = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const templatesToInsert = DEFAULT_TEMPLATES.map((t) => ({
        ...t,
        physician_id: user.id,
      }));

      const { error } = await supabase.from("medical_templates").insert(templatesToInsert);

      if (error) throw error;

      await loadTemplates();
      toast({
        title: "Templates Initialized",
        description: "Default templates have been added to your profile.",
      });
    } catch (error: any) {
      console.error("Error initializing templates:", error);
    }
  };

  const toggleTemplate = async (templateId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("medical_templates")
        .update({ is_enabled: enabled })
        .eq("id", templateId);

      if (error) throw error;

      setTemplates(templates.map((t) => (t.id === templateId ? { ...t, is_enabled: enabled } : t)));

      toast({
        title: enabled ? "Template Enabled" : "Template Disabled",
        description: `Template ${enabled ? "enabled" : "disabled"} successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const setDefaultTemplate = async (
    templateId: string,
    category: string,
    caseType: string | null
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // First, unset all defaults for this category/case_type
      await supabase
        .from("medical_templates")
        .update({ is_default: false })
        .eq("physician_id", user.id)
        .eq("template_category", category)
        .eq("case_type", caseType || null);

      // Then set this one as default
      const { error } = await supabase
        .from("medical_templates")
        .update({ is_default: true })
        .eq("id", templateId);

      if (error) throw error;

      await loadTemplates();
      toast({
        title: "Default Template Set",
        description: "This template is now the default for this case type.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredTemplates = templates.filter((t) => t.template_category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-[#0d0d0d]">
        <Loader2 className="h-6 w-6 animate-spin text-[#999]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#0d0d0d] min-h-screen p-6">
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-[#e6e6e6]">Medical Templates Management</CardTitle>
          <CardDescription className="text-[#999]">
            Enable or disable templates for different case types. Templates are used when generating
            medical documentation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6 bg-[#0d0d0d] border-[#2a2a2a]">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.value}
                  value={cat.value}
                  className="data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#e6e6e6] text-[#999]"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.value} value={cat.value} className="mt-6">
                <div className="space-y-4">
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-8 text-[#999]">
                      <p>No templates in this category yet.</p>
                    </div>
                  ) : (
                    filteredTemplates.map((template) => (
                      <Card key={template.id} className="border-[#2a2a2a] bg-[#1a1a1a]">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-[#e6e6e6]">
                                  {template.template_name}
                                </h4>
                                {template.is_default && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30"
                                  >
                                    Default
                                  </Badge>
                                )}
                                {template.case_type && (
                                  <Badge variant="outline" className="border-[#333] text-[#999]">
                                    {template.case_type}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-[#999] mb-3 line-clamp-2">
                                {template.template_content.substring(0, 200)}...
                              </p>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={template.is_enabled}
                                    onCheckedChange={(checked) =>
                                      toggleTemplate(template.id, checked)
                                    }
                                  />
                                  <Label className="text-sm text-[#999]">
                                    {template.is_enabled ? "Enabled" : "Disabled"}
                                  </Label>
                                </div>
                                {template.is_enabled && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setDefaultTemplate(
                                        template.id,
                                        template.template_category,
                                        template.case_type
                                      )
                                    }
                                    disabled={template.is_default}
                                    className="bg-[#1a1a1a] border-[#333] text-[#e6e6e6] hover:bg-[#222] disabled:opacity-50"
                                  >
                                    {template.is_default ? "Default" : "Set as Default"}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingTemplate(template)}
                                  className="text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Template Preview/Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] max-w-4xl w-full max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-[#e6e6e6]">
                <span>{editingTemplate.template_name}</span>
                <Button
                  variant="ghost"
                  onClick={() => setEditingTemplate(null)}
                  className="text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]"
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-[#e6e6e6]">Template Content</Label>
                  <Textarea
                    value={editingTemplate.template_content}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        template_content: e.target.value,
                      })
                    }
                    className="min-h-[400px] font-mono text-sm bg-[#0d0d0d] border-[#333] text-[#e6e6e6]"
                    readOnly
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from("medical_templates")
                          .update({
                            template_content: editingTemplate.template_content,
                          })
                          .eq("id", editingTemplate.id);

                        if (error) throw error;

                        await loadTemplates();
                        setEditingTemplate(null);
                        toast({
                          title: "Template Updated",
                          description: "Template content has been saved.",
                        });
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message,
                          variant: "destructive",
                        });
                      }
                    }}
                    className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingTemplate(null)}
                    className="bg-[#1a1a1a] border-[#333] text-[#e6e6e6] hover:bg-[#222]"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
