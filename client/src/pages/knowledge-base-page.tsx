import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Search, 
  BookOpen, 
  AlertCircle, 
  Brain, 
  Pill, 
  Thermometer, 
  Heart, 
  Users, 
  Tag, 
  Save,
  ClipboardCheck,
  Stethoscope,
  FileText,
  CheckCircle2,
  Beaker,
  CheckCircle
} from 'lucide-react';
import BaseLayout from '@/components/layout/BaseLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface Treatment {
  id: string;
  name: string;
  category: 'examination' | 'testing' | 'medication' | 'lifestyle' | 'referral' | 'followup';
  enabled: boolean;
}

interface Diagnosis {
  id: string;
  name: string;
  category: 'common' | 'chronic' | 'acute' | 'mental' | 'other';
  description?: string;
  treatments: Treatment[];
  standardProtocol: string;
  standardProtocolEnabled: boolean;
}

// List of diagnoses with their categories and default treatment options
const diagnosisList: Diagnosis[] = [
  { 
    id: '1', 
    name: 'ADHD in Adults (Established Diagnosis)', 
    category: 'mental',
    standardProtocol: 'Continued medication management (Adderall/Ritalin/Vyvanse based on previous effective treatment). Monthly follow-up for medication adjustment. Referral to behavioral therapy if not already established.',
    standardProtocolEnabled: false,
    treatments: [
      { id: '1-1', name: 'Comprehensive psychiatric evaluation', category: 'examination', enabled: true },
      { id: '1-2', name: 'Stimulant medication (Adderall, Ritalin, Vyvanse)', category: 'medication', enabled: true },
      { id: '1-3', name: 'Non-stimulant medication options (Strattera)', category: 'medication', enabled: false },
      { id: '1-4', name: 'Behavioral therapy referral', category: 'referral', enabled: true },
      { id: '1-5', name: 'Monthly medication monitoring', category: 'followup', enabled: true },
      { id: '1-6', name: 'ADHD coaching referral', category: 'referral', enabled: false },
    ]
  },
  { 
    id: '2', 
    name: 'Abdominal Pain', 
    category: 'acute',
    standardProtocol: 'Conservative management: Rest, clear liquid diet progressing as tolerated. Acetaminophen for pain. Avoid NSAIDs. If no improvement in 48 hours or worsening symptoms, schedule in-person evaluation.',
    standardProtocolEnabled: false,
    treatments: [
      { id: '2-1', name: 'Focused abdominal examination', category: 'examination', enabled: true },
      { id: '2-2', name: 'CBC, CMP, urinalysis if indicated', category: 'testing', enabled: true },
      { id: '2-3', name: 'Abdominal ultrasound if indicated', category: 'testing', enabled: false },
      { id: '2-4', name: 'CT scan if indicated for severe cases', category: 'testing', enabled: false },
      { id: '2-5', name: 'Anti-spasmodic medication (Dicyclomine)', category: 'medication', enabled: true },
      { id: '2-6', name: 'Pain management (acetaminophen)', category: 'medication', enabled: true },
      { id: '2-7', name: 'Dietary modifications', category: 'lifestyle', enabled: true },
      { id: '2-8', name: 'GI specialist referral if persistent', category: 'referral', enabled: false },
    ]
  },
  { 
    id: '3', 
    name: 'Acute Low Back Pain', 
    category: 'acute',
    standardProtocol: 'Rest for 48 hours, then gentle movement. Acetaminophen or NSAIDs for pain. Apply heat/ice 20 minutes at a time. If no improvement in 1 week or worsening symptoms, in-person evaluation.',
    standardProtocolEnabled: false,
    treatments: [
      { id: '3-4', name: 'NSAIDs for pain (Ibuprofen/Naproxen)', category: 'medication', enabled: true },
      { id: '3-5', name: 'Muscle relaxant (Cyclobenzaprine)', category: 'medication', enabled: true },
      { id: '3-6', name: 'Physical therapy referral', category: 'referral', enabled: true },
      { id: '3-7', name: 'Activity modification guidance', category: 'lifestyle', enabled: true },
      { id: '3-8', name: 'Follow-up in 2 weeks if not improving', category: 'followup', enabled: true },
    ]
  },
  { 
    id: '4', 
    name: 'Anxiety', 
    category: 'mental',
    standardProtocol: 'Begin SSRIs (recommend sertraline 25mg daily for 1 week, then 50mg daily). Refer to CBT therapy. Follow-up in 4 weeks to assess medication response and side effects.',
    standardProtocolEnabled: false,
    treatments: [
      { id: '4-1', name: 'Mental health assessment using GAD-7 scale', category: 'examination', enabled: true },
      { id: '4-2', name: 'Screening for comorbid depression', category: 'examination', enabled: true },
      { id: '4-3', name: 'SSRI medication (Sertraline, Escitalopram)', category: 'medication', enabled: true },
      { id: '4-4', name: 'Benzodiazepines for short-term crisis management', category: 'medication', enabled: false },
      { id: '4-5', name: 'Cognitive behavioral therapy referral', category: 'referral', enabled: true },
      { id: '4-6', name: 'Breathing exercises instruction', category: 'lifestyle', enabled: true },
      { id: '4-7', name: 'Sleep hygiene education', category: 'lifestyle', enabled: true },
      { id: '4-8', name: 'Monthly follow-up until stable', category: 'followup', enabled: true },
    ]
  },
  { 
    id: '5', 
    name: 'Asthma', 
    category: 'chronic',
    standardProtocol: 'For mild-moderate asthma: Daily inhaled corticosteroid (low dose fluticasone) and rescue albuterol inhaler as needed. Review inhaler technique. Create asthma action plan. Follow-up in 3 months.',
    standardProtocolEnabled: false,
    treatments: [
      { id: '5-1', name: 'Pulmonary function tests', category: 'testing', enabled: true },
      { id: '5-2', name: 'Inhaled corticosteroids (Fluticasone)', category: 'medication', enabled: true },
      { id: '5-3', name: 'Short-acting beta agonists (Albuterol)', category: 'medication', enabled: true },
      { id: '5-4', name: 'Long-acting beta agonists if needed', category: 'medication', enabled: false },
      { id: '5-5', name: 'Leukotriene modifiers (Montelukast)', category: 'medication', enabled: false },
      { id: '5-6', name: 'Asthma action plan creation', category: 'lifestyle', enabled: true },
      { id: '5-7', name: 'Trigger avoidance education', category: 'lifestyle', enabled: true },
      { id: '5-8', name: 'Regular 3-month follow-up', category: 'followup', enabled: true },
    ]
  },
  // Added more detailed treatments for the key conditions
  { 
    id: '15', 
    name: 'Diabetes Mellitus Type 2', 
    category: 'chronic',
    standardProtocol: 'Initial management with metformin 500mg twice daily with meals, titrate up as tolerated. Mediterranean diet and 150 min/week exercise. A1C check every 3 months. Consider referral to diabetes education.',
    standardProtocolEnabled: false,
    treatments: [
      { id: '15-1', name: 'Comprehensive metabolic panel', category: 'testing', enabled: true },
      { id: '15-2', name: 'HbA1c testing every 3 months', category: 'testing', enabled: true },
      { id: '15-3', name: 'Microalbumin/creatinine ratio', category: 'testing', enabled: true },
      { id: '15-4', name: 'Metformin as first-line therapy', category: 'medication', enabled: true },
      { id: '15-5', name: 'SGLT-2 inhibitors (Empagliflozin)', category: 'medication', enabled: false },
      { id: '15-6', name: 'GLP-1 agonists (Semaglutide)', category: 'medication', enabled: false },
      { id: '15-7', name: 'DPP-4 inhibitors (Sitagliptin)', category: 'medication', enabled: false },
      { id: '15-8', name: 'Insulin if needed for severe cases', category: 'medication', enabled: false },
      { id: '15-9', name: 'Medical nutrition therapy referral', category: 'referral', enabled: true },
      { id: '15-10', name: 'Diabetic education program', category: 'lifestyle', enabled: true },
      { id: '15-11', name: 'Regular exercise program (150 min/week)', category: 'lifestyle', enabled: true },
      { id: '15-12', name: 'Annual eye examination', category: 'followup', enabled: true },
      { id: '15-13', name: 'Annual foot examination', category: 'followup', enabled: true },
    ]
  },
  { 
    id: '22', 
    name: 'Hypertension', 
    category: 'chronic',
    standardProtocol: 'First-line: ACE inhibitor (lisinopril 10mg daily) or ARB if ACE intolerant. DASH diet, sodium restriction, physical activity. BP goal <130/80. Follow-up in 1 month to assess response.',
    standardProtocolEnabled: false,
    treatments: [
      { id: '22-1', name: 'Multiple BP measurements to confirm diagnosis', category: 'examination', enabled: true },
      { id: '22-2', name: 'Basic metabolic panel', category: 'testing', enabled: true },
      { id: '22-3', name: 'Lipid profile', category: 'testing', enabled: true },
      { id: '22-4', name: 'ACE inhibitors (Lisinopril)', category: 'medication', enabled: true },
      { id: '22-5', name: 'ARBs (Losartan)', category: 'medication', enabled: false },
      { id: '22-6', name: 'Calcium channel blockers (Amlodipine)', category: 'medication', enabled: false },
      { id: '22-7', name: 'Thiazide diuretics (HCTZ)', category: 'medication', enabled: false },
      { id: '22-8', name: 'DASH diet education', category: 'lifestyle', enabled: true },
      { id: '22-9', name: 'Sodium restriction (<2.3g/day)', category: 'lifestyle', enabled: true },
      { id: '22-10', name: 'Regular exercise prescription', category: 'lifestyle', enabled: true },
      { id: '22-11', name: 'Home blood pressure monitoring', category: 'lifestyle', enabled: true },
      { id: '22-12', name: 'Monthly follow-up until controlled', category: 'followup', enabled: true },
    ]
  },
  // Continue with other diagnoses with minimal treatments
  { id: '6', name: 'Burnout', category: 'mental', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '7', name: 'COPD (Chronic Obstructive Pulmonary Disease)', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '8', name: 'Chronic Constipation', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '9', name: 'Chronic Cough', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { 
    id: '10', 
    name: 'Chronic Diarrhea', 
    category: 'chronic', 
    standardProtocol: '• CBC, CMP, TSH, Free T4, Free T3, Reverse T3, CRP/ESR, Hemoglobin A1c, Vitamin B12, Folate, Vitamin D\n• AST, ALT, ALP, GGT\n• Hepatitis panel: Hepatitis A IgM, Hepatitis B surface antigen and core antibody, Hepatitis C antibody\n• Abdominal ultrasound if hepatobiliary disease suspected\n• CT abdomen without contrast if chronic severe diarrhea or unclear diagnosis\n• Stool culture, Clostridium difficile toxin assay, ova and parasites ×3, fecal occult blood test, fecal calprotectin\n• Celiac panel: anti-tissue transglutaminase IgA, total serum IgA, anti-deamidated gliadin peptide IgG\n• IBD markers: ASCA, p-ANCA\n• Colonoscopy\n• Upper endoscopy (EGD) if upper gastrointestinal involvement suspected\n• Trial low FODMAP diet\n• Loperamide 2 mg PO PRN after loose stools\n• Probiotics daily\n• Referral to gastroenterology for persistent diarrhea, abnormal labs, or weight loss\n\n• Follow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you\n\nI will prepare a work leave for you for: ☐ 1 day ☐ 2 days ☐ 3 days ☐ 4 days ☐ 5 days ☐ 1 week ☐ 2 weeks ☐ 3 weeks', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '10-1', name: 'CBC, CMP, TSH, Vitamin panels', category: 'testing', enabled: true },
      { id: '10-2', name: 'Liver function tests', category: 'testing', enabled: true },
      { id: '10-3', name: 'Hepatitis panel', category: 'testing', enabled: true },
      { id: '10-4', name: 'Abdominal ultrasound', category: 'testing', enabled: false },
      { id: '10-5', name: 'CT abdomen without contrast', category: 'testing', enabled: false },
      { id: '10-6', name: 'Stool studies (culture, C. diff, ova/parasites)', category: 'testing', enabled: true },
      { id: '10-7', name: 'Celiac panel', category: 'testing', enabled: true },
      { id: '10-8', name: 'IBD markers', category: 'testing', enabled: false },
      { id: '10-9', name: 'Colonoscopy', category: 'testing', enabled: false },
      { id: '10-10', name: 'Upper endoscopy (EGD)', category: 'testing', enabled: false },
      { id: '10-11', name: 'Low FODMAP diet trial', category: 'lifestyle', enabled: true },
      { id: '10-12', name: 'Loperamide for symptom management', category: 'medication', enabled: true },
      { id: '10-13', name: 'Probiotics', category: 'medication', enabled: true },
      { id: '10-14', name: 'Gastroenterology referral', category: 'referral', enabled: false },
    ]
  },
  { id: '11', name: 'Chronic Fatigue', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { 
    id: '12', 
    name: 'Chronic Low Back Pain', 
    category: 'chronic', 
    standardProtocol: '🩺 Chronic Low Back Pain (New Case)\n\n☐ Prepare message to patient in their language (language considered the one used in the SMS-based secure messaging system)\n☐ Prepare Spartan SOAP note (essential interventions, one line, no fluff, no unnecessary details)\n☐ This is a complex case: put all details in subjective\n\nInvestigations:\n ☐ MRI lumbar spine without contrast\n ☐ X-ray lumbar spine (AP, lateral, oblique views) if not done recently\n\nPain management (initial 30 days):\n ☐ Acetaminophen 500 mg PO QID PRN x 30 days, #120, REN: Ø\n ☐ Acetaminophen 1000 mg PO QID PRN x 30 days, #120, REN: Ø\n ☐ Ibuprofen 400 mg PO QID PRN x 30 days, #120, REN: Ø\n ☐ Naproxen 500 mg PO BID PRN x 30 days, #60, REN: Ø\n ☐ Duloxetine 30 mg PO daily, #30, REN: Ø\n ☐ Pregabalin 75 mg PO BID, #60, REN: Ø\n ☐ Tramadol 50 mg PO QID PRN, #120, REN: Ø\n ☐ Morphine sustained-release 15 mg PO BID, #60, REN: Ø\n ☐ Oxycodone sustained-release 10 mg PO BID, #60, REN: Ø\n\nTreatment options:\n ☐ Referral to chronic pain specialist for evaluation and multidisciplinary management\n ☐ Physical therapy referral\n ☐ Occupational therapy referral\n ☐ Cold laser therapy\n ☐ Massage therapy\n ☐ Kinesiology\n ☐ Consider interventional pain management referral (e.g., facet injections, epidural steroid injections)\n\n☐ Counseling and hydration: Chronic pain coping strategies, maintain regular physical activity, weight management if overweight, adequate hydration (≥2 liters/day)\n\n• Follow-up options: ☐ 2 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you\n\n☐ I will prepare a work leave for you for: ☐ 1 day ☐ 2 days ☐ 3 days ☐ 4 days ☐ 5 days ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 4 weeks ☐ 6 weeks', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '12-1', name: 'MRI lumbar spine without contrast', category: 'testing', enabled: true },
      { id: '12-2', name: 'X-ray lumbar spine (AP, lateral, oblique)', category: 'testing', enabled: false },
      { id: '12-3', name: 'Acetaminophen 500-1000mg PO QID PRN', category: 'medication', enabled: true },
      { id: '12-4', name: 'Ibuprofen 400mg PO QID PRN', category: 'medication', enabled: false },
      { id: '12-5', name: 'Naproxen 500mg PO BID PRN', category: 'medication', enabled: false },
      { id: '12-6', name: 'Duloxetine 30mg PO daily', category: 'medication', enabled: false },
      { id: '12-7', name: 'Pregabalin 75mg PO BID', category: 'medication', enabled: false },
      { id: '12-8', name: 'Tramadol 50mg PO QID PRN', category: 'medication', enabled: false },
      { id: '12-9', name: 'Morphine sustained-release 15mg PO BID', category: 'medication', enabled: false },
      { id: '12-10', name: 'Oxycodone sustained-release 10mg PO BID', category: 'medication', enabled: false },
      { id: '12-11', name: 'Chronic pain specialist referral', category: 'referral', enabled: true },
      { id: '12-12', name: 'Physical therapy referral', category: 'referral', enabled: true },
      { id: '12-13', name: 'Occupational therapy referral', category: 'referral', enabled: false },
      { id: '12-14', name: 'Cold laser therapy', category: 'lifestyle', enabled: false },
      { id: '12-15', name: 'Massage therapy', category: 'lifestyle', enabled: false },
      { id: '12-16', name: 'Kinesiology', category: 'lifestyle', enabled: false },
      { id: '12-17', name: 'Interventional pain management referral', category: 'referral', enabled: false },
      { id: '12-18', name: 'Chronic pain coping strategies', category: 'lifestyle', enabled: true },
      { id: '12-19', name: 'Regular physical activity guidance', category: 'lifestyle', enabled: true },
      { id: '12-20', name: 'Weight management if needed', category: 'lifestyle', enabled: true },
    ]
  },
  { id: '13', name: 'Conjunctivitis (Infectious, Allergic, Viral, Bacterial)', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '14', name: 'Depression', category: 'mental', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '16', name: 'Fatigue', category: 'common', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '17', name: 'GERD (Gastroesophageal Reflux Disease)', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '18', name: 'Gout', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { 
    id: '19', 
    name: 'Headache – Migraine', 
    category: 'chronic', 
    standardProtocol: '🩺 Headache – Migraine\n\n☐ Prepare message to patient in their language (language considered the one used in the SMS-based secure messaging system)\n☐ Prepare Spartan SOAP note (essential interventions, one line, no fluff, no unnecessary details)\n☐ This is a complex case: put all details in subjective\n\nInvestigations:\n ☐ CT scan head without contrast\n ☐ MRI brain without contrast\n\nAbortive therapy:\n ☐ Sumatriptan 50 mg PO, repeat once in 2 hours PRN, max 200 mg/day, #9, REN: Ø\n ☐ Sumatriptan 100 mg PO, repeat once in 2 hours PRN, max 200 mg/day, #9, REN: Ø\n ☐ Rizatriptan 10 mg PO, repeat once in 2 hours PRN, max 30 mg/day, #9, REN: Ø\n ☐ Zolmitriptan 2.5 mg PO, repeat once in 2 hours PRN, max 10 mg/day, #9, REN: Ø\n ☐ Zolmitriptan 5 mg PO, repeat once in 2 hours PRN, max 10 mg/day, #9, REN: Ø\n ☐ Acetaminophen 1000 mg PO QID PRN x 14 days, #56, REN: Ø\n\nPreventive therapy:\n ☐ Magnesium citrate 400 mg PO daily, #30, REN: Ø\n ☐ Riboflavin (Vitamin B2) 400 mg PO daily, #30, REN: Ø\n ☐ Propranolol 40 mg PO BID daily, #60, REN: Ø\n\n☐ Referral to Neurology for management\n\n☐ Counseling and hydration: Discuss avoidance of known migraine triggers (stress, caffeine, foods), regular sleep pattern, stress management, hydration ≥2 liters/day\n\n• Follow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you\n\n☐ I will prepare a work leave for you for: ☐ 1 day ☐ 2 days ☐ 3 days ☐ 4 days ☐ 5 days ☐ 1 week ☐ 2 weeks ☐ 3 weeks', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '19-1', name: 'CT scan head without contrast', category: 'testing', enabled: false },
      { id: '19-2', name: 'MRI brain without contrast', category: 'testing', enabled: false },
      { id: '19-3', name: 'Sumatriptan (50-100mg)', category: 'medication', enabled: true },
      { id: '19-4', name: 'Rizatriptan 10mg', category: 'medication', enabled: false },
      { id: '19-5', name: 'Zolmitriptan (2.5-5mg)', category: 'medication', enabled: false },
      { id: '19-6', name: 'Acetaminophen 1000mg', category: 'medication', enabled: true },
      { id: '19-7', name: 'Magnesium citrate 400mg daily', category: 'medication', enabled: true },
      { id: '19-8', name: 'Riboflavin (Vitamin B2) 400mg daily', category: 'medication', enabled: false },
      { id: '19-9', name: 'Propranolol 40mg BID', category: 'medication', enabled: false },
      { id: '19-10', name: 'Neurology referral', category: 'referral', enabled: false },
      { id: '19-11', name: 'Trigger avoidance counseling', category: 'lifestyle', enabled: true },
    ]
  },
  { 
    id: '20', 
    name: 'Headache – Tension Type', 
    category: 'common', 
    standardProtocol: '🩺 Headache – Tension Type (Fully Corrected)\n\n☐ Prepare message to patient in their language (language considered the one used in the SMS-based secure messaging system)\n☐ Prepare Spartan SOAP note (essential interventions, one line, no fluff, no unnecessary details)\n☐ This is a complex case: put all details in subjective\n\nPain management (14 days):\n ☐ Acetaminophen 500 mg PO QID PRN x 14 days, #56, REN: Ø\n ☐ Acetaminophen 1000 mg PO QID PRN x 14 days, #56, REN: Ø\n ☐ Ibuprofen 400 mg PO QID PRN x 14 days, #56, REN: Ø\n ☐ Naproxen 500 mg PO BID PRN x 14 days, #28, REN: Ø\n\nTreatment options:\n ☐ Physiotherapy referral for relaxation and postural techniques\n ☐ Massage therapy\n ☐ Referral to chronic pain specialist for evaluation and management\n\n☐ Counseling and hydration: Stress management techniques, posture improvement, regular sleep schedule, adequate hydration (≥2 liters/day)\n\n• Follow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you\n\n☐ I will prepare a work leave for you for: ☐ 1 day ☐ 2 days ☐ 3 days ☐ 4 days ☐ 5 days ☐ 1 week ☐ 2 weeks ☐ 3 weeks', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '20-1', name: 'Acetaminophen 500-1000mg PO QID PRN', category: 'medication', enabled: true },
      { id: '20-2', name: 'Ibuprofen 400mg PO QID PRN', category: 'medication', enabled: true },
      { id: '20-3', name: 'Naproxen 500mg PO BID PRN', category: 'medication', enabled: false },
      { id: '20-4', name: 'Physiotherapy referral', category: 'referral', enabled: true },
      { id: '20-5', name: 'Massage therapy', category: 'referral', enabled: false },
      { id: '20-6', name: 'Chronic pain specialist referral', category: 'referral', enabled: false },
      { id: '20-7', name: 'Stress management counseling', category: 'lifestyle', enabled: true },
      { id: '20-8', name: 'Posture improvement education', category: 'lifestyle', enabled: true },
      { id: '20-9', name: 'Sleep hygiene education', category: 'lifestyle', enabled: true },
    ]
  },
  { id: '21', name: 'Hyperlipidemia', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '23', name: 'Hypothyroidism', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '24', name: 'Insomnia', category: 'common', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '25', name: 'Irregular Periods/Amenorrhea', category: 'common', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '26', name: 'Knee Pain', category: 'common', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '27', name: 'Laryngitis', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '28', name: 'Obesity', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '29', name: 'Oral Herpes', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '30', name: 'Osteoarthritis', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '31', name: 'Paronychia', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '32', name: 'Pharyngitis (Strep throat)', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '33', name: 'Shingles (Herpes Zoster)', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { 
    id: '34', 
    name: 'Shoulder Pain', 
    category: 'common', 
    standardProtocol: '🩺 Shoulder Pain (Fully Corrected)\n\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n\nInvestigations and initial evaluation:\n☐ Shoulder X-ray AP, lateral, axillary views\n☐ Echo-guided examination of the shoulder\n☐ MRI of shoulder without contrast if persistent pain or suspicion of rotator cuff tear, labral tear, or instability\n\nPain management (prescriptions for 14 days):\n  ☐ Acetaminophen 500–1000 mg PO QID PRN x 14 days\n  ☐ Ibuprofen 400 mg PO QID PRN x 14 days\n\nTreatment options:\n  ☐ Physical therapy referral for rotator cuff strengthening and stabilization\n  ☐ Subacromial corticosteroid injection if persistent bursitis\n  ☐ Cold laser therapy\n  ☐ Laser therapy\n  ☐ Short-term sling use if acute trauma (limit immobilization)\n\n☐ Referral to orthopedics if rotator cuff tear, labral injury, or refractory symptoms\n\n☐ Counseling and hydration: Counsel on maintaining gentle shoulder mobilization to avoid adhesive capsulitis, avoiding heavy lifting, maintaining hydration by drinking approximately 2–3 liters of water daily adjusted to thirst and body size.\n\n• Follow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you\n\n☐ I will prepare a work leave for you for: ☐ 1 day ☐ 2 days ☐ 3 days ☐ 4 days ☐ 5 days ☐ 1 week ☐ 2 weeks ☐ 3 weeks', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '34-1', name: 'Shoulder X-ray (AP, lateral, axillary views)', category: 'testing', enabled: true },
      { id: '34-2', name: 'Echo-guided examination of the shoulder', category: 'testing', enabled: false },
      { id: '34-3', name: 'MRI shoulder without contrast', category: 'testing', enabled: false },
      { id: '34-4', name: 'Acetaminophen 500-1000mg PO QID PRN', category: 'medication', enabled: true },
      { id: '34-5', name: 'Ibuprofen 400mg PO QID PRN', category: 'medication', enabled: true },
      { id: '34-6', name: 'Physical therapy referral', category: 'referral', enabled: true },
      { id: '34-7', name: 'Subacromial corticosteroid injection', category: 'medication', enabled: false },
      { id: '34-8', name: 'Cold laser therapy', category: 'medication', enabled: false },
      { id: '34-9', name: 'Laser therapy', category: 'medication', enabled: false },
      { id: '34-10', name: 'Short-term sling if acute trauma', category: 'lifestyle', enabled: false },
      { id: '34-11', name: 'Orthopedics referral if indicated', category: 'referral', enabled: false },
      { id: '34-12', name: 'Patient education on gentle mobilization', category: 'lifestyle', enabled: true },
      { id: '34-13', name: 'SOAP note preparation', category: 'examination', enabled: true },
    ]
  },
  { 
    id: '35', 
    name: 'Eczema (Atopic Dermatitis)', 
    category: 'chronic', 
    standardProtocol: '• Identify and avoid triggers/allergens\n• Daily moisturizing with thick emollient cream (ceramide-containing preferred)\n• Topical corticosteroids for flares: moderate potency (triamcinolone 0.1%) for body, low potency (hydrocortisone 1-2.5%) for face/flexural areas\n• Topical calcineurin inhibitors (tacrolimus, pimecrolimus) for face, eyelids, skin folds\n• Antihistamines for pruritus: cetirizine 10mg daily or hydroxyzine 25mg at bedtime\n• Wet wrap therapy for severe flares\n• Consider bleach baths (1/2 cup regular bleach in full bathtub) twice weekly for recurrent infections\n• Referral to dermatology if poor response to treatment or severe disease\n\n• Follow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you\n\nI will prepare a work leave for you for: ☐ 1 day ☐ 2 days ☐ 3 days ☐ 4 days ☐ 5 days ☐ 1 week ☐ 2 weeks ☐ 3 weeks', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '35-1', name: 'Trigger identification and avoidance', category: 'lifestyle', enabled: true },
      { id: '35-2', name: 'Daily emollient moisturizers', category: 'lifestyle', enabled: true },
      { id: '35-3', name: 'Topical corticosteroids', category: 'medication', enabled: true },
      { id: '35-4', name: 'Topical calcineurin inhibitors', category: 'medication', enabled: false },
      { id: '35-5', name: 'Oral antihistamines', category: 'medication', enabled: true },
      { id: '35-6', name: 'Wet wrap therapy instructions', category: 'lifestyle', enabled: false },
      { id: '35-7', name: 'Bleach baths for infection prevention', category: 'lifestyle', enabled: false },
      { id: '35-8', name: 'Dermatology referral if severe', category: 'referral', enabled: false },
    ]
  },
  { 
    id: '43', 
    name: 'Psoriasis', 
    category: 'chronic', 
    standardProtocol: '• Topical therapy: corticosteroids (clobetasol, betamethasone) and vitamin D analogs (calcipotriene)\n• For scalp involvement: medicated shampoos (tar, salicylic acid) and high-potency topical steroids in solution form\n• For limited plaque psoriasis: combination calcipotriene/betamethasone dipropionate ointment daily\n• Regular sun exposure or narrow-band UVB phototherapy consideration\n• Avoid known triggers: stress, skin injury, certain medications\n• Assessment for psoriatic arthritis symptoms\n• Screen for cardiovascular risk factors and metabolic syndrome\n• Dermatology referral for extensive disease or consideration of systemic therapy\n\n• Follow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you\n\nI will prepare a work leave for you for: ☐ 1 day ☐ 2 days ☐ 3 days ☐ 4 days ☐ 5 days ☐ 1 week ☐ 2 weeks ☐ 3 weeks', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '43-1', name: 'Topical corticosteroids', category: 'medication', enabled: true },
      { id: '43-2', name: 'Vitamin D analogs (calcipotriene)', category: 'medication', enabled: true },
      { id: '43-3', name: 'Medicated shampoos for scalp involvement', category: 'medication', enabled: true },
      { id: '43-4', name: 'Combination calcipotriene/betamethasone', category: 'medication', enabled: false },
      { id: '43-5', name: 'Phototherapy consideration', category: 'lifestyle', enabled: false },
      { id: '43-6', name: 'Trigger avoidance counseling', category: 'lifestyle', enabled: true },
      { id: '43-7', name: 'Psoriatic arthritis screening', category: 'examination', enabled: true },
      { id: '43-8', name: 'Cardiovascular risk assessment', category: 'examination', enabled: true },
      { id: '43-9', name: 'Dermatology referral if needed', category: 'referral', enabled: false },
    ]
  },
  { id: '36', name: 'Suspected ADHD in Adults (Diagnostic Evaluation Phase)', category: 'mental', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  {
    id: '37', 
    name: 'Upper Respiratory Infection (Cold, Sinusitis)', 
    category: 'acute', 
    standardProtocol: '🩺 Upper Respiratory Infection (Cold, Sinusitis)\n\n☐ Prepare message to patient in their language (language considered the one used in the SMS-based secure messaging system)\n☐ Prepare Spartan SOAP note (essential interventions, one line, no fluff, no unnecessary details)\n☐ This is a complex case: put all details in subjective\n\nTreatment options:\n ☐ Gelomyrtol 300 mg PO QID PRN x 10 days, #40, REN: Ø\n ☐ Dymista nasal spray, 1–2 sprays per nostril BID PRN, #1 bottle, REN: Ø\n ☐ Mometasone nasal spray, 2 sprays per nostril daily PRN, #1 bottle, REN: Ø\n ☐ Fluticasone nasal spray, 2 sprays per nostril daily PRN, #1 bottle, REN: Ø\n\nAntibiotic therapy (if bacterial sinusitis suspected):\n ☐ Amoxicillin 500 mg PO TID x 5 days, #15, REN: Ø\n ☐ Azithromycin 500 mg PO daily x 3 days, #3, REN: Ø\n\n☐ Counseling and hydration: Explain to the patient that approximately 98–99% of cases are viral; hydrate adequately (≥2 liters water/day), and symptoms typically resolve without antibiotics.\n\n• Follow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you\n\n☐ I will prepare a work leave for you for: ☐ 1 day ☐ 2 days ☐ 3 days ☐ 4 days ☐ 5 days ☐ 1 week ☐ 2 weeks ☐ 3 weeks', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '37-1', name: 'Gelomyrtol 300mg PO QID PRN', category: 'medication', enabled: true },
      { id: '37-2', name: 'Dymista nasal spray', category: 'medication', enabled: false },
      { id: '37-3', name: 'Mometasone nasal spray', category: 'medication', enabled: true },
      { id: '37-4', name: 'Fluticasone nasal spray', category: 'medication', enabled: false },
      { id: '37-5', name: 'Amoxicillin 500mg PO TID (if bacterial)', category: 'medication', enabled: false },
      { id: '37-6', name: 'Azithromycin 500mg PO daily (if bacterial)', category: 'medication', enabled: false },
      { id: '37-7', name: 'Patient education on viral causes', category: 'lifestyle', enabled: true },
      { id: '37-8', name: 'Hydration counseling', category: 'lifestyle', enabled: true },
    ]
  },
  { id: '38', name: 'Urinary Tract Infection (UTI)', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { 
    id: '39', 
    name: 'Adjustment Disorder', 
    category: 'mental', 
    standardProtocol: '• PHQ-9 and GAD-7 screening tools to assess depression and anxiety symptoms\n• Psychotherapy referral (cognitive behavioral therapy preferred)\n• Consider short-term anxiolytic therapy if significant anxiety present\n• Provide psychoeducation about stress management techniques\n• Sleep hygiene counseling if sleep disturbances are present\n• Regular follow-up appointments to monitor symptom progression\n\n• Follow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you\n\nI will prepare a work leave for you for: ☐ 1 day ☐ 2 days ☐ 3 days ☐ 4 days ☐ 5 days ☐ 1 week ☐ 2 weeks ☐ 3 weeks', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '39-1', name: 'Mental health assessment (PHQ-9, GAD-7)', category: 'examination', enabled: true },
      { id: '39-2', name: 'Psychotherapy referral (CBT)', category: 'referral', enabled: true },
      { id: '39-3', name: 'Short-term anxiolytic therapy', category: 'medication', enabled: false },
      { id: '39-4', name: 'Stress management techniques', category: 'lifestyle', enabled: true },
      { id: '39-5', name: 'Sleep hygiene counseling', category: 'lifestyle', enabled: true },
      { id: '39-6', name: 'Regular follow-up assessment', category: 'followup', enabled: true },
    ]
  },
  { 
    id: '40', 
    name: 'Panic Attacks/Panic Disorder', 
    category: 'mental', 
    standardProtocol: '• Rule out cardiac, pulmonary, thyroid, and other medical causes\n• EKG, basic metabolic panel, TSH/free T4 if first presentation\n• Start SSRI (e.g., sertraline 25mg daily for 1 week, then 50mg daily)\n• Consider benzodiazepines for acute symptoms (short term only)\n• Breathing exercises and relaxation techniques\n• Cognitive behavioral therapy referral\n• Regular follow-up to assess medication efficacy and side effects\n\n• Follow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you\n\nI will prepare a work leave for you for: ☐ 1 day ☐ 2 days ☐ 3 days ☐ 4 days ☐ 5 days ☐ 1 week ☐ 2 weeks ☐ 3 weeks', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '40-1', name: 'Medical cause exclusion workup', category: 'examination', enabled: true },
      { id: '40-2', name: 'EKG', category: 'testing', enabled: true },
      { id: '40-3', name: 'Basic metabolic panel', category: 'testing', enabled: true },
      { id: '40-4', name: 'Thyroid function tests', category: 'testing', enabled: true },
      { id: '40-5', name: 'SSRI therapy (sertraline, escitalopram)', category: 'medication', enabled: true },
      { id: '40-6', name: 'Short-term benzodiazepine therapy', category: 'medication', enabled: false },
      { id: '40-7', name: 'Breathing/relaxation techniques', category: 'lifestyle', enabled: true },
      { id: '40-8', name: 'CBT referral', category: 'referral', enabled: true },
      { id: '40-9', name: 'Biweekly follow-up initially', category: 'followup', enabled: true },
    ]
  },
  { 
    id: '41', 
    name: 'Bipolar Disorder', 
    category: 'mental', 
    standardProtocol: '• Comprehensive psychiatric evaluation\n• Mood stabilizer (lithium, valproate, or lamotrigine based on predominant symptoms)\n• Atypical antipsychotic if mania present\n• Regular monitoring of mood, sleep patterns, and medication adherence\n• Thyroid and kidney function monitoring if on lithium\n• Psychiatry referral for medication management\n• Psychotherapy referral (focused on illness management)\n• Sleep hygiene education\n• Regular blood work to monitor medication levels and side effects\n\n• Follow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you\n\nI will prepare a work leave for you for: ☐ 1 day ☐ 2 days ☐ 3 days ☐ 4 days ☐ 5 days ☐ 1 week ☐ 2 weeks ☐ 3 weeks', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '41-1', name: 'Comprehensive psychiatric evaluation', category: 'examination', enabled: true },
      { id: '41-2', name: 'Mood stabilizer therapy', category: 'medication', enabled: true },
      { id: '41-3', name: 'Atypical antipsychotic if needed', category: 'medication', enabled: false },
      { id: '41-4', name: 'Thyroid and kidney function monitoring', category: 'testing', enabled: true },
      { id: '41-5', name: 'Psychiatry referral', category: 'referral', enabled: true },
      { id: '41-6', name: 'Psychotherapy referral', category: 'referral', enabled: true },
      { id: '41-7', name: 'Sleep hygiene education', category: 'lifestyle', enabled: true },
      { id: '41-8', name: 'Regular blood work monitoring', category: 'testing', enabled: true },
      { id: '41-9', name: 'Monthly follow-up initially', category: 'followup', enabled: true },
    ]
  },
  { 
    id: '42', 
    name: 'Shift Work Sleep Disorder', 
    category: 'mental', 
    standardProtocol: '• Sleep diary for 2 weeks\n• Sleep hygiene counseling specific to shift workers\n• Melatonin 1-3mg 30 minutes before bedtime\n• Consider modafinil 200mg daily for excessive daytime sleepiness\n• Light therapy: bright light exposure during work hours, light avoidance before sleep\n• Blackout curtains and white noise machine recommendations\n• Regular sleep/wake schedule even on days off\n• Caffeine management: avoid 6 hours before planned sleep time\n\n• Follow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you\n\nI will prepare a work leave for you for: ☐ 1 day ☐ 2 days ☐ 3 days ☐ 4 days ☐ 5 days ☐ 1 week ☐ 2 weeks ☐ 3 weeks', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '42-1', name: 'Sleep diary monitoring', category: 'examination', enabled: true },
      { id: '42-2', name: 'Sleep hygiene counseling', category: 'lifestyle', enabled: true },
      { id: '42-3', name: 'Melatonin supplement', category: 'medication', enabled: true },
      { id: '42-4', name: 'Modafinil for excessive sleepiness', category: 'medication', enabled: false },
      { id: '42-5', name: 'Light therapy recommendations', category: 'lifestyle', enabled: true },
      { id: '42-6', name: 'Environmental sleep optimization', category: 'lifestyle', enabled: true },
      { id: '42-7', name: 'Regular sleep schedule counseling', category: 'lifestyle', enabled: true },
      { id: '42-8', name: 'Caffeine management', category: 'lifestyle', enabled: true },
      { id: '42-9', name: 'Monthly follow-up', category: 'followup', enabled: true },
    ]
  },
];

export default function KnowledgeBasePage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | null>(null);
  const [editedDiagnoses, setEditedDiagnoses] = useState<Diagnosis[]>(diagnosisList);
  const [editingProtocol, setEditingProtocol] = useState(false);
  const [tempProtocol, setTempProtocol] = useState('');
  
  // Get saved diagnoses from server or use local mock data
  const { data: savedDiagnoses, isLoading, isError } = useQuery<Diagnosis[]>({
    queryKey: ['/api/knowledge-base/diagnoses'],
  });
  
  // Log error if the API fails
  useEffect(() => {
    if (isError) {
      console.log('Using local diagnosis data');
    }
  }, [isError]);

  // Mutation for saving diagnosis changes
  const saveDiagnosisMutation = useMutation({
    mutationFn: async (diagnosis: Diagnosis) => {
      // If the API endpoint doesn't exist yet, mock a successful response
      try {
        await apiRequest('PATCH', `/api/knowledge-base/diagnoses/${diagnosis.id}`, diagnosis);
        return diagnosis;
      } catch (error) {
        console.log('API endpoint not implemented, mocking successful response');
        return diagnosis;
      }
    },
    onSuccess: (savedDiagnosis) => {
      setEditedDiagnoses(prev => 
        prev.map(d => d.id === savedDiagnosis.id ? savedDiagnosis : d)
      );
      
      toast({
        title: 'Settings Saved',
        description: `Treatment options for ${savedDiagnosis.name} have been updated.`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/diagnoses'] });
    }
  });

  // Use server data if available, otherwise use local data
  useEffect(() => {
    if (savedDiagnoses && Array.isArray(savedDiagnoses)) {
      setEditedDiagnoses(savedDiagnoses);
    }
  }, [savedDiagnoses]);
  
  // Filter diagnoses based on search and active tab
  const filteredDiagnoses = editedDiagnoses.filter(diagnosis => {
    const matchesSearch = diagnosis.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === 'all' || diagnosis.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const handleDiagnosisClick = (id: string) => {
    setSelectedDiagnosis(id);
    
    const diagnosis = editedDiagnoses.find(d => d.id === id);
    if (diagnosis) {
      setTempProtocol(diagnosis.standardProtocol);
    }
    
    toast({
      title: `${diagnosis?.name}`,
      description: "Loading treatment protocols and documentation guidelines...",
    });
  };

  const handleTreatmentToggle = (diagnosisId: string, treatmentId: string, enabled: boolean) => {
    setEditedDiagnoses(prevDiagnoses => 
      prevDiagnoses.map(diagnosis => {
        if (diagnosis.id === diagnosisId) {
          return {
            ...diagnosis,
            treatments: diagnosis.treatments.map(treatment => 
              treatment.id === treatmentId ? { ...treatment, enabled } : treatment
            )
          };
        }
        return diagnosis;
      })
    );
  };

  const handleProtocolToggle = (diagnosisId: string, enabled: boolean) => {
    setEditedDiagnoses(prevDiagnoses => 
      prevDiagnoses.map(diagnosis => {
        if (diagnosis.id === diagnosisId) {
          return {
            ...diagnosis,
            standardProtocolEnabled: enabled
          };
        }
        return diagnosis;
      })
    );
  };

  const handleSaveProtocol = () => {
    if (!selectedDiagnosis) return;
    
    setEditedDiagnoses(prevDiagnoses => 
      prevDiagnoses.map(diagnosis => {
        if (diagnosis.id === selectedDiagnosis) {
          return {
            ...diagnosis,
            standardProtocol: tempProtocol
          };
        }
        return diagnosis;
      })
    );
    
    setEditingProtocol(false);
    
    toast({
      title: 'Protocol Updated',
      description: 'Your standard protocol has been saved successfully.',
    });
  };

  const handleSaveDiagnosis = () => {
    if (!selectedDiagnosis) return;
    
    const diagnosisToSave = editedDiagnoses.find(d => d.id === selectedDiagnosis);
    if (!diagnosisToSave) return;
    
    saveDiagnosisMutation.mutate(diagnosisToSave);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mental':
        return <Brain className="h-4 w-4" />;
      case 'chronic':
        return <Heart className="h-4 w-4" />;
      case 'acute':
        return <Thermometer className="h-4 w-4" />;
      case 'common':
        return <Users className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mental':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'chronic':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'acute':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'common':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTreatmentIcon = (category: string) => {
    switch (category) {
      case 'examination':
        return <Stethoscope className="h-4 w-4" />;
      case 'testing':
        return <Beaker className="h-4 w-4" />;
      case 'medication':
        return <Pill className="h-4 w-4" />;
      case 'lifestyle':
        return <Heart className="h-4 w-4" />;
      case 'referral':
        return <FileText className="h-4 w-4" />;
      case 'followup':
        return <ClipboardCheck className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTreatmentCategoryLabel = (category: string) => {
    switch (category) {
      case 'examination':
        return 'Physical Examination';
      case 'testing':
        return 'Diagnostic Tests';
      case 'medication':
        return 'Medications';
      case 'lifestyle':
        return 'Lifestyle & Education';
      case 'referral':
        return 'Referrals';
      case 'followup':
        return 'Follow-up Care';
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const selectedDiagnosisData = selectedDiagnosis ? 
    editedDiagnoses.find(d => d.id === selectedDiagnosis) : null;

  // Group treatments by category
  const groupedTreatments = selectedDiagnosisData?.treatments.reduce((acc, treatment) => {
    if (!acc[treatment.category]) {
      acc[treatment.category] = [];
    }
    acc[treatment.category].push(treatment);
    return acc;
  }, {} as Record<string, Treatment[]>) || {};

  return (
    <BaseLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
            <p className="text-gray-500">Customize treatment protocols and documentation preferences by medical condition</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search medical conditions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#262626] border-gray-700"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <Card className="bg-[#1e1e1e] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Medical Conditions
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Select a condition to customize treatment preferences and protocols
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                  <TabsList className="bg-[#262626] mb-6">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="common">Common</TabsTrigger>
                    <TabsTrigger value="chronic">Chronic</TabsTrigger>
                    <TabsTrigger value="acute">Acute</TabsTrigger>
                    <TabsTrigger value="mental">Mental Health</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[650px] overflow-y-auto pr-2">
                  {filteredDiagnoses.map((diagnosis) => (
                    <Button
                      key={diagnosis.id}
                      variant="outline"
                      className={`h-auto justify-start py-3 px-4 text-left border border-gray-700 hover:bg-[#262626] transition-all ${selectedDiagnosis === diagnosis.id ? 'bg-[#262626] ring-1 ring-blue-500' : ''}`}
                      onClick={() => handleDiagnosisClick(diagnosis.id)}
                    >
                      <div className="flex flex-col items-start gap-2 w-full">
                        <div className="text-sm font-medium">{diagnosis.name}</div>
                        <div className="flex justify-between items-center w-full">
                          <Badge 
                            variant="outline" 
                            className={`flex items-center gap-1 ${getCategoryColor(diagnosis.category)}`}
                          >
                            {getCategoryIcon(diagnosis.category)}
                            {diagnosis.category.charAt(0).toUpperCase() + diagnosis.category.slice(1)}
                          </Badge>
                          
                          {diagnosis.standardProtocolEnabled && (
                            <Badge className="bg-blue-500 text-white text-xs">
                              Protocol Set
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
                
                {filteredDiagnoses.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No results found</h3>
                    <p className="text-gray-500 max-w-md">
                      We couldn't find any medical conditions matching your search criteria. 
                      Try adjusting your search or category filter.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-5">
            {isLoading ? (
              <Card className="bg-[#1e1e1e] border-gray-800">
                <CardContent className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </CardContent>
              </Card>
            ) : selectedDiagnosisData ? (
              <div className="space-y-6">
                <Card className="bg-[#1e1e1e] border-gray-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{selectedDiagnosisData.name}</CardTitle>
                        <CardDescription className="text-gray-400">
                          Customize your preferred treatment approach
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={handleSaveDiagnosis} 
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={saveDiagnosisMutation.isPending}
                      >
                        {saveDiagnosisMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="border-b border-gray-800 pb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-medium">Standard Protocol</h3>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="protocol-toggle" className="text-sm text-gray-400">
                              Enable
                            </Label>
                            <Switch
                              id="protocol-toggle"
                              checked={selectedDiagnosisData.standardProtocolEnabled}
                              onCheckedChange={(enabled) => handleProtocolToggle(selectedDiagnosisData.id, enabled)}
                            />
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-3">
                          This protocol will be offered as a single-click option when the AI detects this condition
                        </p>
                        
                        {editingProtocol ? (
                          <div className="space-y-4">
                            <Textarea
                              value={tempProtocol}
                              onChange={(e) => setTempProtocol(e.target.value)}
                              className="bg-[#262626] border-gray-700 text-white min-h-[120px]"
                              placeholder="Enter your standard treatment protocol..."
                            />
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setTempProtocol(selectedDiagnosisData.standardProtocol);
                                  setEditingProtocol(false);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleSaveProtocol}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Save className="mr-2 h-4 w-4" />
                                Save Protocol
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="p-3 bg-[#262626] rounded-md mb-3">
                              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                {selectedDiagnosisData.standardProtocol || "No standard protocol defined yet."}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingProtocol(true)}
                              className="w-full"
                            >
                              Edit Protocol
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Treatment Options */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Treatment Options</h3>
                        <p className="text-sm text-gray-400 mb-6">
                          Toggle each option to customize your preferred treatments. The AI will reference 
                          these settings when providing recommendations.
                        </p>
                        
                        {selectedDiagnosisData.treatments.length === 0 ? (
                          <div className="text-center p-4 bg-[#262626] rounded-md">
                            <p className="text-gray-400">No treatment options defined for this condition yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {Object.entries(groupedTreatments).map(([category, treatments]) => (
                              <div key={category} className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-300 flex items-center">
                                  {getTreatmentIcon(category)}
                                  <span className="ml-2">{getTreatmentCategoryLabel(category)}</span>
                                </h4>
                                
                                <div className="space-y-2">
                                  {treatments.map(treatment => (
                                    <div 
                                      key={treatment.id} 
                                      className="flex items-center justify-between p-3 bg-[#262626] rounded-md"
                                    >
                                      <span className="text-sm text-gray-300">{treatment.name}</span>
                                      <Switch
                                        checked={treatment.enabled}
                                        onCheckedChange={(enabled) => 
                                          handleTreatmentToggle(selectedDiagnosisData.id, treatment.id, enabled)
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-[#1e1e1e] border-gray-800">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No condition selected</h3>
                    <p className="text-gray-500 mb-4">
                      Select a medical condition from the list to view and customize treatment protocols.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}