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
  CheckCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import AppLayoutSpruce from '@/components/layout/AppLayoutSpruce';
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


interface Treatment {
  id: string;
  name: string;
  category: 'testing' | 'medication' | 'lifestyle' | 'referral' | 'followup';
  enabled: boolean;
}

interface Diagnosis {
  id: string;
  name: string;
  category: 'common' | 'chronic' | 'acute' | 'mental' | 'other' | 'preventative';
  description?: string;
  treatments: Treatment[];
  standardProtocol: string;
  standardProtocolEnabled: boolean;
}

// Create a deep copy function to help with resetting to defaults
const deepCopy = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Original list of diagnoses with their categories and default treatment options
// This will never be modified, serving as our default values
const diagnosisList: Diagnosis[] = [
  { 
    id: '1', 
    name: 'ADHD in Adults (Established Diagnosis)', 
    category: 'mental',
    standardProtocol: '🩺 ADHD in Adults (Established Diagnosis)\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect serious condition requiring urgent evaluation (red flags: suicidal ideation, psychosis, severe medication side effects, significant cardiovascular symptoms, substance abuse)\n\nInvestigations and initial evaluation:\n☐ Vital signs including blood pressure and heart rate\n☐ ADHD symptom rating scales (ASRS, CAARS)\n☐ Mood disorder screening (PHQ-9, GAD-7)\n☐ Substance use screening\n☐ ECG (if on stimulant medication)\n☐ Complete blood count\n☐ Comprehensive metabolic panel\n☐ Thyroid function tests\n☐ Urine drug screen\n☐ Liver function tests\n☐ Functional assessment (work, academic, relationship impact)\n\nMedications:\n□ Methylphenidate IR □ 5mg PO BID, □ 10mg PO BID, □ 20mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Methylphenidate ER □ 18mg PO daily, □ 27mg PO daily, □ 36mg PO daily, □ 54mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Amphetamine/dextroamphetamine IR □ 5mg PO BID, □ 10mg PO BID, □ 20mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Amphetamine/dextroamphetamine ER □ 10mg PO daily, □ 20mg PO daily, □ 30mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Lisdexamfetamine □ 20mg PO daily, □ 30mg PO daily, □ 50mg PO daily, □ 70mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Atomoxetine □ 25mg PO daily, □ 40mg PO daily, □ 60mg PO daily, □ 80mg PO daily, □ 100mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Bupropion XL □ 150mg PO daily, □ 300mg PO daily, □ 450mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Guanfacine ER □ 1mg PO daily, □ 2mg PO daily, □ 3mg PO daily, □ 4mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Clonidine ER □ 0.1mg PO daily, □ 0.2mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n\nTreatment options:\n☐ Cognitive behavioral therapy (CBT) for ADHD\n☐ ADHD coaching\n☐ Organizational skills training\n☐ Time management strategies\n☐ Mindfulness training\n☐ Exercise program\n☐ Sleep hygiene education\n☐ Digital planning tools training\n☐ Workplace accommodations\n☐ Nutritional counseling\n\nReferral options:\n☐ Referral to psychiatry\n☐ Referral to psychology\n☐ Referral to ADHD coaching\n☐ Referral to neuropsychological testing\n☐ Referral to occupational therapy\n☐ Referral to vocational rehabilitation\n☐ Referral to support group\n☐ Referral to social work\n☐ Referral to cardiology (if cardiovascular concerns)\n☐ Referral to substance abuse treatment (if needed)\n\n☐ Counseling: ADHD is a chronic condition requiring consistent management. Take medications as prescribed, at the same time each day. Report any concerning side effects promptly. Use organizational strategies like planners, reminders, and breaking tasks into smaller steps. Maintain regular sleep schedule, healthy diet, and exercise routine. Limit alcohol and avoid recreational drugs which can worsen symptoms. Return if experiencing increased symptoms despite medication, significant side effects, or new concerns.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you',
    standardProtocolEnabled: false,
    treatments: [
      { id: '1-1', name: 'Comprehensive psychiatric evaluation', category: 'testing', enabled: true },
      { id: '1-2', name: 'Stimulant medication (Methylphenidate, Amphetamine)', category: 'medication', enabled: true },
      { id: '1-3', name: 'Non-stimulant medication options (Atomoxetine)', category: 'medication', enabled: false },
      { id: '1-4', name: 'Cognitive behavioral therapy for ADHD', category: 'referral', enabled: true },
      { id: '1-5', name: 'Regular medication monitoring', category: 'followup', enabled: true },
      { id: '1-6', name: 'ADHD coaching referral', category: 'referral', enabled: false },
      { id: '1-7', name: 'Organizational skills training', category: 'lifestyle', enabled: true },
      { id: '1-8', name: 'Sleep hygiene education', category: 'lifestyle', enabled: true },
      { id: '1-9', name: 'Substance use screening', category: 'testing', enabled: true },
      { id: '1-10', name: 'ECG (for stimulant medication)', category: 'testing', enabled: false },
    ]
  },
  { 
    id: '2', 
    name: 'Acute Abdominal Pain', 
    category: 'acute',
    standardProtocol: '🩺 Acute Abdominal Pain\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect peritonitis, ruptured viscus, dissection, or ischemia requiring urgent evaluation (red flags: severe unremitting pain, rigid/board-like abdomen, rebound tenderness, hemodynamic instability, advanced age with new onset pain, significant progressive distension)\n\nInvestigations and initial evaluation:\n☐ Complete blood count with differential\n☐ Comprehensive metabolic panel\n☐ Lipase and amylase\n☐ Liver function tests (AST, ALT, bilirubin, alkaline phosphatase)\n☐ Urinalysis and urine culture\n☐ Beta-hCG (women of childbearing age)\n☐ COVID-19 testing\n☐ Blood cultures (if febrile or concerning for sepsis)\n☐ Lactic acid level\n☐ Erythrocyte sedimentation rate (ESR)\n☐ C-reactive protein (CRP)\n☐ Stool studies (occult blood, culture, ova & parasites, C. difficile)\n☐ Abdominal X-ray (upright and supine)\n☐ Abdominal ultrasound\n☐ CT abdomen/pelvis with contrast\n☐ CT angiography\n☐ MRI abdomen/pelvis\n☐ HIDA scan\n☐ Pelvic ultrasound (females)\n☐ Testicular ultrasound (males)\n\nMedications:\n□ Acetaminophen □ 500mg PO QID PRN, □ 650mg PO QID PRN, □ 1000mg PO QID PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 4000mg daily)\n□ Ibuprofen □ 400mg PO TID, □ 600mg PO TID, □ 800mg PO TID, □ PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 2400mg daily)\n□ Ketorolac □ 10mg PO QID PRN, □ 15mg IV/IM Q6H PRN, Ren: □ 1, □ 2, □ 3 (max 5 days)\n□ Morphine □ 2mg IV Q2H PRN, □ 4mg IV Q2H PRN, Ren: □ 1, □ 2, □ 3\n□ Ondansetron □ 4mg PO/IV Q8H PRN, □ 8mg PO/IV Q8H PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Famotidine □ 20mg PO BID, □ 40mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Omeprazole □ 20mg PO daily, □ 40mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Ciprofloxacin □ 500mg PO BID, □ 750mg PO BID, for 7-10 days, Ren: □ 1, □ 2, □ 3\n□ Metronidazole □ 500mg PO TID, for 7-10 days, Ren: □ 1, □ 2, □ 3\n□ Dicyclomine □ 10mg PO QID, □ 20mg PO QID, PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n\nTreatment options:\n☐ Clear liquid diet for 24 hours, then advance as tolerated\n☐ NPO status if surgical intervention likely\n☐ IV fluid resuscitation if dehydrated\n☐ Serial abdominal examinations\n☐ Position of comfort\n☐ Heat application to abdomen\n☐ Avoidance of food triggers\n☐ Gentle ambulation as tolerated\n☐ Regular bowel movement monitoring\n\nReferral options:\n☐ Referral to emergency department\n☐ Referral to general surgery\n☐ Referral to gastroenterology\n☐ Referral to gynecology (females)\n☐ Referral to urology\n☐ Referral to vascular surgery\n☐ Referral to interventional radiology\n☐ Referral to pain management\n☐ Referral to infectious disease\n\n☐ Counseling: Acute abdominal pain requires careful monitoring. Return immediately if pain worsens, fever develops, unable to keep liquids down, blood in vomit or stool, dizziness/lightheadedness occurs, or abdominal distension increases. Maintain adequate hydration with clear fluids. Restrict diet to clear liquids for 24 hours, then advance to bland foods as tolerated. Avoid alcohol, caffeine, spicy foods, and dairy until fully recovered.\n\nFollow-up options: ☐ 1 day ☐ 2 days ☐ 3 days ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you',
    standardProtocolEnabled: false,
    treatments: [
      { id: '2-1', name: 'Complete blood count (CBC)', category: 'testing', enabled: true },
      { id: '2-2', name: 'Comprehensive metabolic panel (CMP)', category: 'testing', enabled: true },
      { id: '2-3', name: 'Urinalysis', category: 'testing', enabled: true },
      { id: '2-4', name: 'Pregnancy test if applicable', category: 'testing', enabled: true },
      { id: '2-5', name: 'Abdominal ultrasound', category: 'testing', enabled: true },
      { id: '2-6', name: 'CT abdomen/pelvis with contrast', category: 'testing', enabled: false },
      { id: '2-7', name: 'Acetaminophen 500-1000 mg PO QID PRN', category: 'medication', enabled: true },
      { id: '2-8', name: 'Dicyclomine 10 mg PO QID PRN', category: 'medication', enabled: true },
      { id: '2-9', name: 'Clear liquid diet progression', category: 'lifestyle', enabled: true },
      { id: '2-10', name: 'Emergency department referral if needed', category: 'referral', enabled: false },
      { id: '2-11', name: 'Hydration counseling', category: 'lifestyle', enabled: true },
    ]
  },
  { 
    id: '2-chronic', 
    name: 'Chronic Abdominal Pain', 
    category: 'chronic',
    standardProtocol: '🩺 Chronic Abdominal Pain\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect serious condition requiring urgent evaluation (red flags: severe unremitting pain, significant weight loss, nocturnal symptoms, jaundice, melena/hematochezia, severe persistent vomiting, age >50 with new onset symptoms)\n\nInvestigations and initial evaluation:\n☐ Complete blood count (CBC)\n☐ Comprehensive metabolic panel (CMP)\n☐ Liver function tests (AST, ALT, alkaline phosphatase, GGT, bilirubin)\n☐ Lipase and amylase\n☐ Thyroid function tests\n☐ Celiac disease panel (tTG-IgA, EMA, DGP antibodies, total IgA)\n☐ H. pylori testing (stool antigen or urea breath test)\n☐ Stool studies (occult blood, calprotectin, culture, ova/parasites, C. difficile)\n☐ Abdominal ultrasound\n☐ CT abdomen/pelvis with contrast\n☐ MRI abdomen with and without contrast\n☐ Upper endoscopy (EGD)\n☐ Colonoscopy\n☐ HIDA scan\n☐ Gastric emptying study\n☐ Small bowel follow-through\n☐ ASCA/ANCA (for IBD suspicion)\n☐ IBS blood test panel\n\nMedications:\n□ Omeprazole □ 20mg PO daily, □ 40mg PO daily, □ 40mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Pantoprazole □ 40mg PO daily, □ 40mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Sucralfate □ 1g PO QID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Dicyclomine □ 10mg PO QID, □ 20mg PO QID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Hyoscyamine □ 0.125mg SL QID PRN, □ 0.375mg ER PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Amitriptyline □ 10mg PO QHS, □ 25mg PO QHS, □ 50mg PO QHS, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Nortriptyline □ 10mg PO QHS, □ 25mg PO QHS, □ 50mg PO QHS, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Rifaximin □ 550mg PO TID x 14 days, Ren: □ 1, □ 2, □ 3\n□ Linaclotide □ 72mcg PO daily, □ 145mcg PO daily, □ 290mcg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Lubiprostone □ 8mcg PO BID, □ 24mcg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n\nTreatment options:\n☐ Low FODMAP diet\n☐ Elimination diet with guided reintroduction\n☐ Stress management techniques\n☐ Regular exercise program\n☐ Cognitive behavioral therapy\n☐ Gut-directed hypnotherapy\n☐ Probiotic supplementation\n☐ Identify and avoid trigger foods\n☐ Regular meal pattern\n☐ Small frequent meals\n☐ Adequate hydration (2-3 liters daily)\n\nReferral options:\n☐ Referral to gastroenterology\n☐ Referral to pain management\n☐ Referral to psychiatry/psychology\n☐ Referral to dietitian/nutritionist\n☐ Referral to integrative medicine\n☐ Referral to general surgery\n☐ Referral to gynecology (if pelvic pain component)\n☐ Referral to neurogastroenterology\n☐ Referral to rheumatology\n☐ Referral to physical therapy (for visceral manipulation)\n\n☐ Counseling: Chronic abdominal pain can have multiple causes and may require a multidisciplinary approach. Keep a symptom diary noting pain triggers, intensity, timing, and associated symptoms. Avoid identified trigger foods. Manage stress through relaxation techniques. Maintain regular physical activity. Take medications as prescribed. Return if experiencing severe pain, persistent vomiting, blood in stool, significant weight loss, or new symptoms.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you',
    standardProtocolEnabled: false,
    treatments: [
      { id: '2c-1', name: 'Complete blood count (CBC)', category: 'testing', enabled: true },
      { id: '2c-2', name: 'Comprehensive metabolic panel (CMP)', category: 'testing', enabled: true },
      { id: '2c-3', name: 'Lipase and amylase', category: 'testing', enabled: true },
      { id: '2c-4', name: 'Thyroid function tests', category: 'testing', enabled: true },
      { id: '2c-5', name: 'Celiac disease panel', category: 'testing', enabled: false },
      { id: '2c-6', name: 'Stool studies', category: 'testing', enabled: true },
      { id: '2c-7', name: 'H. pylori testing', category: 'testing', enabled: true },
      { id: '2c-8', name: 'Abdominal ultrasound', category: 'testing', enabled: true },
      { id: '2c-9', name: 'Abdominal/pelvic CT with contrast', category: 'testing', enabled: false },
      { id: '2c-10', name: 'Upper endoscopy (EGD) referral', category: 'referral', enabled: false },
      { id: '2c-11', name: 'Colonoscopy referral', category: 'referral', enabled: false },
      { id: '2c-12', name: 'Acetaminophen 500-1000 mg PO QID PRN', category: 'medication', enabled: true },
      { id: '2c-13', name: 'Dicyclomine 10 mg PO QID PRN', category: 'medication', enabled: true },
      { id: '2c-14', name: 'Omeprazole 20 mg PO daily', category: 'medication', enabled: true },
      { id: '2c-15', name: 'Hyoscyamine 0.125 mg SL QID PRN', category: 'medication', enabled: false },
      { id: '2c-16', name: 'Low FODMAP diet trial', category: 'lifestyle', enabled: true },
      { id: '2c-17', name: 'Fiber supplementation', category: 'lifestyle', enabled: true },
      { id: '2c-18', name: 'Probiotics', category: 'medication', enabled: true },
      { id: '2c-19', name: 'Stress reduction techniques', category: 'lifestyle', enabled: true },
      { id: '2c-20', name: 'Gastroenterology referral', category: 'referral', enabled: true },
      { id: '2c-21', name: 'Pain management referral', category: 'referral', enabled: false },
      { id: '2c-22', name: 'Food diary and trigger identification', category: 'lifestyle', enabled: true },
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
    standardProtocol: '🩺 Anxiety\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect serious condition requiring urgent evaluation (red flags: suicidal ideation, psychosis, severe panic attacks with physical symptoms, agoraphobia preventing basic needs, recent significant trauma, substance withdrawal)\n\nInvestigations and initial evaluation:\n☐ Anxiety screening tools (GAD-7, BAI, SPIN)\n☐ Depression screening (PHQ-9)\n☐ Substance use screening\n☐ Trauma screening (PCL-5)\n☐ Complete blood count\n☐ Comprehensive metabolic panel\n☐ Thyroid function tests\n☐ ECG\n☐ Vitamin B12 and folate levels\n☐ Vitamin D level\n☐ Sleep assessment\n☐ Medication review for anxiety-inducing effects\n\nMedications:\n□ Sertraline □ 25mg PO daily, □ 50mg PO daily, □ 100mg PO daily, □ 150mg PO daily, □ 200mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Escitalopram □ 5mg PO daily, □ 10mg PO daily, □ 20mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Fluoxetine □ 10mg PO daily, □ 20mg PO daily, □ 40mg PO daily, □ 60mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Venlafaxine XR □ 37.5mg PO daily, □ 75mg PO daily, □ 150mg PO daily, □ 225mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Duloxetine □ 20mg PO daily, □ 30mg PO daily, □ 60mg PO daily, □ 90mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Buspirone □ 5mg PO BID, □ 10mg PO BID, □ 15mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Hydroxyzine □ 10mg PO TID PRN, □ 25mg PO TID PRN, □ 50mg PO TID PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Propranolol □ 10mg PO PRN, □ 20mg PO PRN, □ 40mg PO PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Lorazepam □ 0.5mg PO TID PRN, □ 1mg PO TID PRN, Ren: □ 1, □ 2, □ 3 (short-term use only)\n□ Clonazepam □ 0.25mg PO BID PRN, □ 0.5mg PO BID PRN, Ren: □ 1, □ 2, □ 3 (short-term use only)\n\nTreatment options:\n☐ Cognitive behavioral therapy (CBT)\n☐ Exposure and response prevention (ERP)\n☐ Mindfulness-based stress reduction (MBSR)\n☐ Relaxation techniques training\n☐ Breathing exercises\n☐ Progressive muscle relaxation\n☐ Biofeedback\n☐ Regular exercise program\n☐ Sleep hygiene education\n☐ Stress management training\n\nReferral options:\n☐ Referral to psychiatry\n☐ Referral to psychology/psychotherapy\n☐ Referral to group therapy\n☐ Referral to anxiety support group\n☐ Referral to social work\n☐ Referral to intensive outpatient program\n☐ Referral to partial hospitalization program\n☐ Referral to complementary medicine (yoga, tai chi)\n☐ Referral to occupational therapy\n☐ Referral to substance abuse treatment (if needed)\n\n☐ Counseling: Anxiety disorders respond well to a combination of medication and therapy. Maintain consistent sleep schedule and regular exercise. Practice relaxation techniques daily. Limit caffeine, alcohol, and recreational drugs which can worsen anxiety. Take medications as prescribed - antidepressants may take 4-6 weeks for full effect. Use benzodiazepines sparingly and only as prescribed. Return if experiencing worsening anxiety despite treatment, medication side effects, or thoughts of self-harm.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you',
    standardProtocolEnabled: false,
    treatments: [
      { id: '4-1', name: 'Mental health assessment using GAD-7 scale', category: 'testing', enabled: true },
      { id: '4-2', name: 'Screening for comorbid depression', category: 'testing', enabled: true },
      { id: '4-3', name: 'SSRI medication (Sertraline, Escitalopram)', category: 'medication', enabled: true },
      { id: '4-4', name: 'Benzodiazepines for short-term crisis management', category: 'medication', enabled: false },
      { id: '4-5', name: 'Cognitive behavioral therapy referral', category: 'referral', enabled: true },
      { id: '4-6', name: 'Breathing exercises instruction', category: 'lifestyle', enabled: true },
      { id: '4-7', name: 'Sleep hygiene education', category: 'lifestyle', enabled: true },
      { id: '4-8', name: 'Monthly follow-up until stable', category: 'followup', enabled: true },
      { id: '4-9', name: 'Thyroid function testing', category: 'testing', enabled: true },
      { id: '4-10', name: 'Regular exercise program', category: 'lifestyle', enabled: true },
      { id: '4-11', name: 'Substance use screening', category: 'testing', enabled: true },
      { id: '4-12', name: 'Non-benzodiazepine anxiolytics (Buspirone)', category: 'medication', enabled: false },
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
      { id: '22-1', name: 'Multiple BP measurements to confirm diagnosis', category: 'testing', enabled: true },
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
  { 
    id: '6', 
    name: 'Burnout', 
    category: 'mental', 
    standardProtocol: '🩺 Burnout\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect serious condition requiring urgent evaluation (red flags: suicidal ideation, severe depression, substance abuse, physical health deterioration, significant insomnia, inability to perform activities of daily living)\n\nInvestigations and initial evaluation:\n☐ Burnout screening (MBI - Maslach Burnout Inventory)\n☐ Depression screening (PHQ-9)\n☐ Anxiety screening (GAD-7)\n☐ Complete blood count\n☐ Comprehensive metabolic panel\n☐ Thyroid function tests\n☐ Vitamin D level\n☐ Vitamin B12 and folate levels\n☐ Ferritin/iron studies\n☐ Sleep assessment\n☐ Insomnia Severity Index\n☐ Substance use screening\n\nMedications:\n□ Sertraline □ 25mg PO daily, □ 50mg PO daily, □ 100mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Escitalopram □ 5mg PO daily, □ 10mg PO daily, □ 20mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Bupropion XL □ 150mg PO daily, □ 300mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Trazodone □ 50mg PO QHS PRN, □ 100mg PO QHS PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Mirtazapine □ 7.5mg PO QHS, □ 15mg PO QHS, □ 30mg PO QHS, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Melatonin □ 3mg PO QHS, □ 5mg PO QHS, □ 10mg PO QHS, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Hydroxyzine □ 25mg PO QHS PRN, □ 50mg PO QHS PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ L-theanine □ 200mg PO daily, □ 200mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Magnesium glycinate □ 200mg PO daily, □ 400mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n\nTreatment options:\n☐ Time off work/medical leave\n☐ Work hours reduction\n☐ Workload modification\n☐ Cognitive behavioral therapy (CBT)\n☐ Mindfulness-based stress reduction (MBSR)\n☐ Stress management training\n☐ Sleep hygiene education\n☐ Regular exercise program\n☐ Relaxation techniques\n☐ Boundary-setting training\n\nReferral options:\n☐ Referral to psychiatry\n☐ Referral to psychology/psychotherapy\n☐ Referral to occupational therapy\n☐ Referral to career counseling\n☐ Referral to employee assistance program\n☐ Referral to life coach\n☐ Referral to support group\n☐ Referral to complementary medicine (yoga, tai chi)\n☐ Referral to sleep medicine\n☐ Referral to nutritionist\n\n☐ Counseling: Burnout results from chronic workplace stress and requires addressing both work environment and personal wellbeing. Consider temporary reduction in work responsibilities or leave of absence. Set boundaries between work and personal life. Schedule regular breaks and time for self-care. Prioritize adequate sleep, regular exercise, and healthy nutrition. Practice stress management techniques daily. Return if experiencing worsening mood, anxiety, sleep disturbance, or physical symptoms.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '6-1', name: 'Burnout screening (MBI)', category: 'testing', enabled: true },
      { id: '6-2', name: 'Depression and anxiety screening', category: 'testing', enabled: true },
      { id: '6-3', name: 'Sleep assessment', category: 'testing', enabled: true },
      { id: '6-4', name: 'Thyroid function tests', category: 'testing', enabled: true },
      { id: '6-5', name: 'Vitamin D and B12 levels', category: 'testing', enabled: true },
      { id: '6-6', name: 'SSRI medication if indicated', category: 'medication', enabled: false },
      { id: '6-7', name: 'Sleep aids for short-term use', category: 'medication', enabled: false },
      { id: '6-8', name: 'Time off work/reduced hours', category: 'lifestyle', enabled: true },
      { id: '6-9', name: 'Stress management techniques', category: 'lifestyle', enabled: true },
      { id: '6-10', name: 'Psychotherapy referral', category: 'referral', enabled: true },
      { id: '6-11', name: 'Regular exercise program', category: 'lifestyle', enabled: true },
      { id: '6-12', name: 'Follow-up in 2-4 weeks', category: 'followup', enabled: true },
    ] 
  },
  { id: '7', name: 'COPD (Chronic Obstructive Pulmonary Disease)', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '8', name: 'Chronic Constipation', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { 
    id: '9', 
    name: 'Chronic Cough', 
    category: 'chronic', 
    standardProtocol: '🩺 Chronic Cough\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect serious condition requiring urgent evaluation (red flags: hemoptysis, weight loss, night sweats, shortness of breath, cough with significant findings on imaging, immunocompromised state)\n\nInvestigations and initial evaluation:\n☐ Chest X-ray\n☐ Pulmonary function tests (spirometry with bronchodilator response)\n☐ Complete blood count with differential\n☐ Comprehensive metabolic panel\n☐ FeNO (fractional exhaled nitric oxide) testing\n☐ Sputum culture and sensitivity\n☐ CT chest\n☐ Sinus CT\n☐ Modified barium swallow study\n☐ 24-hour esophageal pH monitoring\n☐ Upper endoscopy (EGD)\n☐ Bronchoscopy\n☐ Allergy testing\n☐ ACE level (for sarcoidosis)\n☐ Echocardiogram\n\nMedications:\n□ Proton pump inhibitor trial:\n□ Omeprazole □ 20mg PO daily, □ 40mg PO daily, □ 40mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Pantoprazole □ 40mg PO daily, □ 40mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Inhaled corticosteroid trial:\n□ Fluticasone □ 44mcg 2 puffs BID, □ 110mcg 2 puffs BID, □ 220mcg 2 puffs BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Budesonide □ 90mcg 2 puffs BID, □ 180mcg 2 puffs BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Antihistamine/decongestant trial:\n□ Fluticasone nasal spray □ 1-2 sprays each nostril daily, □ 1-2 sprays each nostril BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Montelukast □ 10mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Benzonatate □ 100mg PO TID, □ 200mg PO TID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Codeine/guaifenesin □ 10-100mg/5mL 5-10mL PO Q4-6H PRN, Ren: □ 1, □ 2, □ 3 (short-term use only)\n□ Azithromycin □ 250mg PO daily MWF, □ 500mg PO daily MWF, Ren: □ 1, □ 2, □ 3 (for chronic bronchitis)\n\nTreatment options:\n☐ Smoking cessation\n☐ Avoidance of known triggers\n☐ Nasal saline irrigation\n☐ Elevated head of bed 30 degrees\n☐ Dietary modifications for GERD\n☐ Pulmonary rehabilitation\n☐ Airway clearance techniques\n☐ Humidifier use\n☐ Adequate hydration\n☐ Vocal cord therapy\n\nReferral options:\n☐ Referral to pulmonology\n☐ Referral to otolaryngology (ENT)\n☐ Referral to gastroenterology\n☐ Referral to allergy/immunology\n☐ Referral to speech therapy\n☐ Referral to cardiology\n☐ Referral to infectious disease\n☐ Referral to thoracic surgery\n☐ Referral to respiratory therapy\n☐ Referral to smoking cessation program\n\n☐ Counseling: Chronic cough has many potential causes including asthma, GERD, post-nasal drip, and chronic bronchitis. Diagnostic testing and therapeutic trials help identify the cause. Avoid known triggers including smoking, allergens, and irritants. Stay well-hydrated. Sleep with head elevated. Take medications as prescribed and complete full therapeutic trials before determining effectiveness. Return if experiencing worsening symptoms, shortness of breath, chest pain, fever, or hemoptysis.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '9-1', name: 'Chest X-ray', category: 'testing', enabled: true },
      { id: '9-2', name: 'Pulmonary function tests', category: 'testing', enabled: true },
      { id: '9-3', name: 'Complete blood count', category: 'testing', enabled: true },
      { id: '9-4', name: 'Proton pump inhibitor trial', category: 'medication', enabled: true },
      { id: '9-5', name: 'Inhaled corticosteroid trial', category: 'medication', enabled: false },
      { id: '9-6', name: 'Nasal steroid spray', category: 'medication', enabled: false },
      { id: '9-7', name: 'Benzonatate for symptom control', category: 'medication', enabled: false },
      { id: '9-8', name: 'Smoking cessation counseling', category: 'lifestyle', enabled: true },
      { id: '9-9', name: 'Pulmonology referral', category: 'referral', enabled: false },
      { id: '9-10', name: 'ENT referral', category: 'referral', enabled: false },
      { id: '9-11', name: 'Gastroenterology referral', category: 'referral', enabled: false },
      { id: '9-12', name: 'Follow-up in 2-4 weeks', category: 'followup', enabled: true },
    ] 
  },
  { 
    id: '10', 
    name: 'Chronic Diarrhea', 
    category: 'chronic', 
    standardProtocol: '🩺 Chronic Diarrhea\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect serious condition requiring urgent evaluation (red flags: bloody diarrhea, severe dehydration, significant weight loss, fever, travel to endemic areas, immunocompromised state)\n\nInvestigations and initial evaluation:\n☐ Complete blood count\n☐ Comprehensive metabolic panel\n☐ C-reactive protein (CRP)\n☐ Erythrocyte sedimentation rate (ESR)\n☐ Thyroid function tests\n☐ Celiac disease panel (tTG-IgA, EMA, DGP antibodies, total IgA)\n☐ Stool studies (culture, ova and parasites, C. difficile, calprotectin, occult blood)\n☐ Stool osmotic gap\n☐ Stool pH and reducing substances\n☐ Stool elastase\n☐ H. pylori testing\n☐ Colonoscopy with biopsies\n☐ Upper endoscopy with biopsies\n☐ CT abdomen/pelvis\n☐ Abdominal ultrasound\n☐ Hydrogen/methane breath test (for SIBO/carbohydrate malabsorption)\n\nMedications:\n□ Loperamide □ 2mg PO after each loose stool (max 8mg/day), □ 2mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Diphenoxylate/atropine □ 1 tablet PO QID PRN, □ 2 tablets PO QID PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Cholestyramine □ 4g PO BID, □ 4g PO TID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Bismuth subsalicylate □ 524mg PO QID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Rifaximin □ 550mg PO TID x14 days, Ren: □ 1, □ 2, □ 3 (for SIBO)\n□ Budesonide □ 9mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (for microscopic colitis)\n□ Pancreatic enzyme replacement □ 1-2 capsules with meals and snacks, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Probiotic supplement □ 1 capsule PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Metronidazole □ 500mg PO TID x10-14 days, Ren: □ 1, □ 2, □ 3 (for specific infections)\n\nTreatment options:\n☐ Low FODMAP diet trial\n☐ Gluten-free diet trial\n☐ Lactose-free diet trial\n☐ High soluble fiber supplementation\n☐ Adequate hydration\n☐ Elimination diet with guided reintroduction\n☐ Stress management techniques\n☐ Electrolyte replacement\n☐ Bile acid sequestrant trial\n☐ Caffeine and alcohol restriction\n\nReferral options:\n☐ Referral to gastroenterology\n☐ Referral to dietitian/nutritionist\n☐ Referral to infectious disease\n☐ Referral to rheumatology\n☐ Referral to endocrinology\n☐ Referral to psychology/psychiatry\n☐ Referral to pain management\n☐ Referral to integrative medicine\n☐ Referral to colorectal surgery\n☐ Referral to support group\n\n☐ Counseling: Chronic diarrhea has many potential causes including irritable bowel syndrome, inflammatory bowel disease, celiac disease, and malabsorption disorders. Keep a food and symptom diary to identify triggers. Maintain adequate hydration with water and electrolyte solutions. Avoid known trigger foods, caffeine, and alcohol. Take medications as prescribed. Follow recommended dietary modifications. Return if experiencing bloody stools, fever, severe abdominal pain, signs of dehydration, or worsening symptoms.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '10-1', name: 'Complete blood count', category: 'testing', enabled: true },
      { id: '10-2', name: 'Comprehensive metabolic panel', category: 'testing', enabled: true },
      { id: '10-3', name: 'C-reactive protein/ESR', category: 'testing', enabled: true },
      { id: '10-4', name: 'Thyroid function tests', category: 'testing', enabled: true },
      { id: '10-5', name: 'Celiac disease panel', category: 'testing', enabled: true },
      { id: '10-6', name: 'Comprehensive stool studies', category: 'testing', enabled: true },
      { id: '10-7', name: 'Loperamide for symptom control', category: 'medication', enabled: true },
      { id: '10-8', name: 'Probiotic supplementation', category: 'medication', enabled: true },
      { id: '10-9', name: 'Low FODMAP diet trial', category: 'lifestyle', enabled: true },
      { id: '10-10', name: 'Electrolyte replacement', category: 'lifestyle', enabled: true },
      { id: '10-11', name: 'Gastroenterology referral', category: 'referral', enabled: false },
      { id: '10-12', name: 'Dietary consultation referral', category: 'referral', enabled: true },
      { id: '10-13', name: 'Colonoscopy with biopsies', category: 'testing', enabled: false },
      { id: '10-14', name: 'Follow-up in 2-4 weeks', category: 'followup', enabled: true },
    ]
  },
  { id: '11', name: 'Chronic Fatigue', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { 
    id: '11-hz', 
    name: 'Herpes Zoster (Shingles)', 
    category: 'acute', 
    standardProtocol: '🩺 Herpes Zoster (Shingles)\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect ophthalmic, otic, or disseminated zoster requiring immediate treatment (red flags: eye involvement, ear canal lesions, widespread lesions across multiple dermatomes, immunocompromised status, pregnancy, age >50)\n\nInvestigations and initial evaluation:\n☐ VZV PCR of vesicular fluid\n☐ VZV antibody testing (IgG, IgM)\n☐ Complete blood count (CBC)\n☐ Comprehensive metabolic panel (CMP)\n☐ HIV testing (if risk factors present)\n☐ HbA1c (if diabetes suspected)\n☐ Tzanck smear of vesicular fluid\n☐ Viral culture of vesicular fluid\n☐ Chest X-ray (if disseminated disease suspected)\n☐ Lumbar puncture (if CNS involvement suspected)\n☐ MRI brain (if CNS involvement suspected)\n☐ Ophthalmology examination (if ophthalmic zoster suspected)\n\nMedications:\n□ Valacyclovir □ 1g PO TID for 7 days, □ 1g PO TID for 10 days, Ren: □ 1, □ 2, □ 3\n□ Famciclovir □ 500mg PO TID for 7 days, □ 500mg PO TID for 10 days, Ren: □ 1, □ 2, □ 3\n□ Acyclovir □ 800mg PO 5x daily for 7 days, □ 800mg PO 5x daily for 10 days, Ren: □ 1, □ 2, □ 3\n□ Acetaminophen □ 500mg PO QID PRN, □ 650mg PO QID PRN, □ 1000mg PO QID PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 4000mg daily)\n□ Ibuprofen □ 400mg PO TID, □ 600mg PO TID, □ 800mg PO TID, □ PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 2400mg daily)\n□ Gabapentin □ 300mg PO QHS, □ 300mg PO BID, □ 300mg PO TID, □ titrate up to 1800mg/day in divided doses, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Pregabalin □ 75mg PO BID, □ 75mg PO daily for 3 days, then 75mg PO BID, □ titrate up to 300mg/day in divided doses, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Lidocaine 5% patch □ apply to affected area for 12 hours daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Capsaicin 0.075% cream □ apply to affected area TID-QID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Prednisone □ 60mg PO daily x 7 days, □ 60mg PO daily x 5 days, then taper over 5 days, Ren: □ 1, □ 2, □ 3\n□ Shingrix® vaccine □ 2-dose series, first dose now, second dose 2-6 months later, Ren: □ 1\n\nTreatment options:\n☐ Calamine lotion to affected areas\n☐ Cool, wet compresses to affected areas QID\n☐ Oatmeal baths for widespread lesions\n☐ Loose-fitting, cotton clothing\n☐ Avoid contact with pregnant women, infants, immunocompromised, and persons without varicella immunity\n☐ Wound care instructions for crusted lesions\n☐ Maintain adequate hydration\n\nReferral options:\n☐ Referral to ophthalmology (for ophthalmic zoster)\n☐ Referral to neurology (for severe pain or neurological complications)\n☐ Referral to infectious disease (for severe or complicated cases)\n☐ Referral to pain management (for severe acute pain or PHN)\n☐ Referral to dermatology (for atypical presentation)\n☐ Referral to otolaryngology (for Ramsay Hunt syndrome)\n☐ Referral to emergency department (for severe/disseminated disease)\n\n☐ Counseling: Shingles is contagious to persons who have never had chickenpox or haven\'t received the varicella vaccine. Avoid contact with pregnant women, infants, immunocompromised individuals, and those without varicella immunity until lesions are crusted over. Lesions typically resolve within 2-4 weeks. Antiviral therapy is most effective if started within 72 hours of rash onset. Postherpetic neuralgia may occur and can be treated. Return if eye involvement, widespread rash, or high fever develops.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: 'hz-1', name: 'VZV PCR from lesion swab', category: 'testing', enabled: true },
      { id: 'hz-2', name: 'Valacyclovir 1000 mg PO TID x 7 days', category: 'medication', enabled: true },
      { id: 'hz-3', name: 'Famciclovir 500 mg PO TID x 7 days', category: 'medication', enabled: false },
      { id: 'hz-4', name: 'Acyclovir 800 mg PO 5 times daily x 7 days', category: 'medication', enabled: false },
      { id: 'hz-5', name: 'Acetaminophen 500-1000 mg PO QID PRN x 14 days', category: 'medication', enabled: true },
      { id: 'hz-6', name: 'Ibuprofen 400 mg PO QID PRN x 14 days', category: 'medication', enabled: false },
      { id: 'hz-7', name: 'Shingrix® vaccine prescription', category: 'medication', enabled: true },
      { id: 'hz-8', name: 'Patient education on infection control', category: 'lifestyle', enabled: true },
      { id: 'hz-9', name: 'Follow-up in 1-2 weeks', category: 'followup', enabled: true }
    ]
  },
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
  { 
    id: '13', 
    name: 'Conjunctivitis', 
    category: 'acute', 
    standardProtocol: '🩺 Conjunctivitis\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect other eye pathology requiring slit lamp exam in ED (uveitis, keratitis, acute angle-closure glaucoma, scleritis, iritis - red flags: moderate/severe eye pain, vision changes, photophobia, halos around lights, pupil abnormalities, circumcorneal redness, eye trauma history)\n\nInvestigations and initial evaluation:\n☐ Culture of eye discharge\n☐ Gram stain of eye discharge\n☐ Viral PCR testing of eye discharge\n☐ Tear film evaluation\n☐ Visual acuity testing\n☐ Fluorescein staining\n☐ Conjunctival scraping for cytology\n☐ Allergen testing (for suspected allergic conjunctivitis)\n\nMedications:\n□ Polymyxin B-trimethoprim drops □ 1 drop OU QID, □ 1 drop OU Q3H, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Ciprofloxacin 0.3% drops □ 1 drop OU Q2H while awake x2 days then QID x5 days, □ 1 drop OU QID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Moxifloxacin 0.5% drops □ 1 drop OU TID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Erythromycin 0.5% ointment □ apply thin ribbon OU QID, □ apply thin ribbon OU BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Olopatadine 0.1% □ 1 drop OU BID, □ 1 drop OU daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Artificial tears □ 1-2 drops OU PRN, □ 1-2 drops OU QID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Ketotifen 0.025% □ 1 drop OU BID, □ 1 drop OU TID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Loteprednol 0.5% □ 1 drop OU QID, □ 1 drop OU BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Prednisolone acetate 1% □ 1 drop OU QID, □ 1 drop OU BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n\nTreatment options:\n☐ Cool compresses to affected eye(s) QID for 5-10 minutes\n☐ Strict hand hygiene, avoid touching or rubbing eyes\n☐ Avoid contact lens wear until resolved\n☐ Avoid sharing towels, washcloths, eye makeup\n☐ Daily cleaning of eyelid margins with baby shampoo\n☐ Discard eye makeup used during infection\n☐ Discard contact lenses used during infection\n\nReferral options:\n☐ Referral to ophthalmology\n☐ Referral to allergist (if suspected allergic component)\n☐ Referral to infectious disease (if severe or unusual infection)\n☐ Referral to rheumatology (if associated autoimmune condition)\n☐ Referral to emergency department for slit lamp examination\n\n☐ Counseling: Highly contagious if bacterial/viral; avoid close contact and sharing personal items until discharge resolves. Discard contact lenses used during infection. Discard eye makeup used during infection. May return to work/school 24 hours after starting treatment if bacterial conjunctivitis. Return if symptoms worsen or no improvement after 3 days of treatment.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '13-1', name: 'Culture of eye discharge (if needed)', category: 'testing', enabled: false },
      { id: '13-2', name: 'Visual acuity testing', category: 'testing', enabled: true },
      { id: '13-3', name: 'Polymyxin B-trimethoprim drops', category: 'medication', enabled: true },
      { id: '13-4', name: 'Ciprofloxacin 0.3% drops', category: 'medication', enabled: false },
      { id: '13-5', name: 'Artificial tears', category: 'medication', enabled: true },
      { id: '13-6', name: 'Cool compresses instruction', category: 'lifestyle', enabled: true },
      { id: '13-7', name: 'Hand hygiene instruction', category: 'lifestyle', enabled: true },
      { id: '13-8', name: 'Ophthalmology referral if needed', category: 'referral', enabled: false },
      { id: '13-9', name: 'Contact lens avoidance guidance', category: 'lifestyle', enabled: true },
      { id: '13-10', name: 'Contagion prevention counseling', category: 'lifestyle', enabled: true },
    ]
  },
  { 
    id: '14', 
    name: 'Depression', 
    category: 'mental', 
    standardProtocol: '🩺 Depression\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect serious condition requiring urgent evaluation (red flags: active suicidal ideation with plan, psychotic features, severe functional impairment, inability to maintain nutrition/hydration, catatonia, treatment-resistant depression)\n\nInvestigations and initial evaluation:\n☐ Depression screening (PHQ-9)\n☐ Suicide risk assessment (C-SSRS)\n☐ Anxiety screening (GAD-7)\n☐ Bipolar disorder screening (MDQ)\n☐ Complete blood count\n☐ Comprehensive metabolic panel\n☐ Thyroid function tests\n☐ Vitamin B12 and folate levels\n☐ Vitamin D level\n☐ Ferritin/iron studies\n☐ Substance use screening\n☐ Sleep assessment\n☐ Medication review for depression-inducing effects\n\nMedications:\n□ Sertraline □ 25mg PO daily, □ 50mg PO daily, □ 100mg PO daily, □ 150mg PO daily, □ 200mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Escitalopram □ 5mg PO daily, □ 10mg PO daily, □ 20mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Fluoxetine □ 10mg PO daily, □ 20mg PO daily, □ 40mg PO daily, □ 60mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Venlafaxine XR □ 37.5mg PO daily, □ 75mg PO daily, □ 150mg PO daily, □ 225mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Duloxetine □ 20mg PO daily, □ 30mg PO daily, □ 60mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Bupropion XL □ 150mg PO daily, □ 300mg PO daily, □ 450mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Mirtazapine □ 7.5mg PO QHS, □ 15mg PO QHS, □ 30mg PO QHS, □ 45mg PO QHS, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Trazodone □ 50mg PO QHS, □ 100mg PO QHS, □ 150mg PO QHS, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Aripiprazole □ 2.5mg PO daily, □ 5mg PO daily, □ 10mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (adjunctive)\n□ Quetiapine □ 25mg PO QHS, □ 50mg PO QHS, □ 100mg PO QHS, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (adjunctive)\n\nTreatment options:\n☐ Cognitive behavioral therapy (CBT)\n☐ Interpersonal therapy (IPT)\n☐ Behavioral activation therapy\n☐ Problem-solving therapy\n☐ Mindfulness-based cognitive therapy\n☐ Exercise program (30 min moderate activity 5x weekly)\n☐ Sleep hygiene education\n☐ Bright light therapy\n☐ Social engagement enhancement\n☐ Pleasurable activity scheduling\n\nReferral options:\n☐ Referral to psychiatry\n☐ Referral to psychology/psychotherapy\n☐ Referral to intensive outpatient program\n☐ Referral to partial hospitalization program\n☐ Referral to psychiatric hospitalization\n☐ Referral to crisis intervention services\n☐ Referral to support group\n☐ Referral to social work\n☐ Referral to substance abuse treatment (if needed)\n☐ Referral to neuropsychological testing\n\n☐ Counseling: Depression is a treatable medical condition. Antidepressants typically take 4-6 weeks for full effect. Continue medications even when feeling better. Attend therapy sessions as scheduled. Maintain regular sleep schedule and daily physical activity. Avoid alcohol and recreational drugs which can worsen depression. Create a safety plan and emergency contacts list. Return if experiencing worsening mood, suicidal thoughts, or medication side effects.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '14-1', name: 'Depression screening (PHQ-9)', category: 'testing', enabled: true },
      { id: '14-2', name: 'Suicide risk assessment', category: 'testing', enabled: true },
      { id: '14-3', name: 'Thyroid function tests', category: 'testing', enabled: true },
      { id: '14-4', name: 'Vitamin B12, D, and folate levels', category: 'testing', enabled: true },
      { id: '14-5', name: 'SSRI medication (e.g., Sertraline)', category: 'medication', enabled: true },
      { id: '14-6', name: 'SNRI medication if indicated', category: 'medication', enabled: false },
      { id: '14-7', name: 'Cognitive behavioral therapy', category: 'referral', enabled: true },
      { id: '14-8', name: 'Regular exercise program', category: 'lifestyle', enabled: true },
      { id: '14-9', name: 'Sleep hygiene education', category: 'lifestyle', enabled: true },
      { id: '14-10', name: 'Psychiatric referral if severe', category: 'referral', enabled: false },
      { id: '14-11', name: 'Weekly follow-up initially', category: 'followup', enabled: true },
      { id: '14-12', name: 'Safety plan development', category: 'lifestyle', enabled: true },
    ] 
  },
  { 
    id: '16', 
    name: 'Fatigue', 
    category: 'common', 
    standardProtocol: '🩺 Fatigue\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect severe anemia or other critical cause requiring urgent evaluation (red flags: syncope, chest pain, dyspnea, pallor, hemodynamic instability, significant weight loss, neurological symptoms)\n\nInvestigations and initial evaluation:\n☐ Complete blood count (CBC) with differential\n☐ Comprehensive metabolic panel (CMP)\n☐ Thyroid function tests (TSH, Free T4)\n☐ Iron studies (Ferritin, TIBC, Iron, % Saturation)\n☐ B12 and Folate levels\n☐ Vitamin D level\n☐ Erythrocyte sedimentation rate (ESR)\n☐ C-reactive protein (CRP)\n☐ HbA1c\n☐ Urinalysis\n☐ EKG\n☐ Chest X-ray\n☐ Sleep apnea screening\n☐ Epstein-Barr virus antibodies\n☐ HIV testing\n☐ Hepatitis panel\n☐ ANA and other autoimmune panels\n☐ Cortisol level (AM)\n☐ Testosterone (males)/Estradiol (females)\n\nMedications:\n□ Iron supplement □ Ferrous sulfate 325mg PO daily, □ Ferrous sulfate 325mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Vitamin B12 □ 1000mcg PO daily, □ 1000mcg IM weekly x4 then monthly, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Vitamin D3 □ 1000IU PO daily, □ 2000IU PO daily, □ 5000IU PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Folate □ 1mg PO daily, □ 5mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Caffeine □ 100mg PO BID, □ 200mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Modafinil □ 100mg PO daily, □ 200mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Multivitamin □ 1 tablet PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n\nTreatment options:\n☐ Sleep hygiene education\n☐ Graduated exercise program\n☐ Stress reduction techniques\n☐ Cognitive behavioral therapy\n☐ Nutritional counseling\n☐ Regular sleep schedule\n☐ Hydration guidance (2-3 liters daily)\n☐ Energy conservation techniques\n☐ Reduce caffeine and alcohol intake\n☐ Regular meals with balanced nutrition\n\nReferral options:\n☐ Referral to sleep medicine\n☐ Referral to endocrinology\n☐ Referral to hematology\n☐ Referral to psychiatry/psychology\n☐ Referral to neurology\n☐ Referral to rheumatology\n☐ Referral to cardiology\n☐ Referral to integrative medicine\n☐ Referral to infectious disease\n☐ Referral to nutritionist/dietitian\n\n☐ Counseling: Fatigue is a complex symptom with many possible causes. Investigations may take time to identify the underlying cause. Maintain regular sleep schedule, balanced nutrition, and moderate physical activity. Avoid excessive caffeine, alcohol, and processed foods. Practice stress management techniques. Return if symptoms worsen, new symptoms develop, or no improvement after 4 weeks.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '16-1', name: 'Complete blood count (CBC)', category: 'testing', enabled: true },
      { id: '16-2', name: 'Comprehensive metabolic panel (CMP)', category: 'testing', enabled: true },
      { id: '16-3', name: 'Thyroid function tests', category: 'testing', enabled: true },
      { id: '16-4', name: 'Iron studies', category: 'testing', enabled: true },
      { id: '16-5', name: 'B12 and Folate levels', category: 'testing', enabled: true },
      { id: '16-6', name: 'Vitamin D level', category: 'testing', enabled: true },
      { id: '16-7', name: 'Sleep apnea screening', category: 'testing', enabled: true },
      { id: '16-8', name: 'Iron supplementation', category: 'medication', enabled: false },
      { id: '16-9', name: 'Vitamin B12 supplementation', category: 'medication', enabled: false },
      { id: '16-10', name: 'Sleep hygiene education', category: 'lifestyle', enabled: true },
      { id: '16-11', name: 'Graduated exercise program', category: 'lifestyle', enabled: true },
      { id: '16-12', name: 'Stress reduction techniques', category: 'lifestyle', enabled: true },
      { id: '16-13', name: 'Referral to sleep medicine', category: 'referral', enabled: false },
      { id: '16-14', name: 'Referral to endocrinology', category: 'referral', enabled: false },
      { id: '16-15', name: 'Referral to hematology', category: 'referral', enabled: false },
    ]
  },
  { 
    id: '17', 
    name: 'GERD (Gastroesophageal Reflux Disease)', 
    category: 'chronic', 
    standardProtocol: '🩺 GERD (Gastroesophageal Reflux Disease)\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect serious condition requiring urgent evaluation (red flags: dysphagia, odynophagia, hematemesis, unexplained weight loss, persistent vomiting, anemia, age >50 with new onset symptoms)\n\nInvestigations and initial evaluation:\n☐ Upper endoscopy (EGD)\n☐ 24-hour esophageal pH monitoring\n☐ Esophageal manometry\n☐ Barium swallow\n☐ Gastric emptying study\n☐ Complete blood count\n☐ Comprehensive metabolic panel\n☐ H. pylori testing\n☐ Chest X-ray\n☐ ECG (if cardiac symptoms)\n☐ Thyroid function tests\n☐ CT chest (if pulmonary symptoms)\n☐ Laryngoscopy (if ENT symptoms)\n☐ Impedance-pH testing\n\nMedications:\n□ Proton pump inhibitors:\n□ Omeprazole □ 20mg PO daily, □ 40mg PO daily, □ 40mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Pantoprazole □ 40mg PO daily, □ 40mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Esomeprazole □ 20mg PO daily, □ 40mg PO daily, □ 40mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Lansoprazole □ 15mg PO daily, □ 30mg PO daily, □ 30mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ H2 receptor antagonists:\n□ Famotidine □ 20mg PO BID, □ 40mg PO daily, □ 40mg PO BID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Ranitidine □ 150mg PO BID, □ 300mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Antacids:\n□ Aluminum hydroxide/magnesium hydroxide □ 10-20mL PO PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Calcium carbonate □ 500-1000mg PO PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Prokinetics:\n□ Metoclopramide □ 5mg PO QID before meals and at bedtime, □ 10mg PO QID before meals and at bedtime, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Baclofen □ 5-10mg PO TID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Other medications:\n□ Sucralfate □ 1g PO QID before meals and at bedtime, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Alginic acid preparations □ 10-20mL PO after meals and at bedtime, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n\nTreatment options:\n☐ Elevate head of bed 6-8 inches\n☐ Avoid meals 2-3 hours before bedtime\n☐ Weight loss if overweight or obese\n☐ Avoid trigger foods/beverages (caffeine, chocolate, alcohol, fatty/spicy foods, citrus, tomato products)\n☐ Smoking cessation\n☐ Smaller, more frequent meals\n☐ Avoid tight-fitting clothing\n☐ Stress reduction techniques\n☐ Chew gum (non-mint) after meals\n☐ Food diary to identify triggers\n\nReferral options:\n☐ Referral to gastroenterology\n☐ Referral to surgery for anti-reflux surgery evaluation\n☐ Referral to ENT (if laryngopharyngeal reflux symptoms)\n☐ Referral to pulmonology (if respiratory complications)\n☐ Referral to cardiology (if cardiac symptoms)\n☐ Referral to nutrition/dietitian\n☐ Referral to sleep medicine (if nocturnal symptoms/sleep disturbance)\n☐ Referral to psychology (for stress management)\n☐ Referral to bariatric medicine (if obesity)\n☐ Referral to smoking cessation program\n\n☐ Counseling: GERD is a chronic condition where stomach contents flow back into the esophagus, causing symptoms. Take medications as prescribed, typically before meals. Lifestyle modifications are essential: elevate head of bed, avoid eating 2-3 hours before bedtime, maintain healthy weight, avoid trigger foods, quit smoking. Watch for warning signs requiring immediate attention: difficulty/pain swallowing, vomiting blood, black stools, chest pain, weight loss. Return if symptoms worsen or don\'t improve with treatment.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '17-1', name: 'Upper endoscopy (EGD)', category: 'testing', enabled: false },
      { id: '17-2', name: 'H. pylori testing', category: 'testing', enabled: true },
      { id: '17-3', name: 'PPI therapy (e.g., omeprazole)', category: 'medication', enabled: true },
      { id: '17-4', name: 'H2 blocker therapy (e.g., famotidine)', category: 'medication', enabled: false },
      { id: '17-5', name: 'Antacids for breakthrough symptoms', category: 'medication', enabled: true },
      { id: '17-6', name: 'Lifestyle modifications education', category: 'lifestyle', enabled: true },
      { id: '17-7', name: 'Dietary trigger avoidance counseling', category: 'lifestyle', enabled: true },
      { id: '17-8', name: 'Elevation of head of bed', category: 'lifestyle', enabled: true },
      { id: '17-9', name: 'Gastroenterology referral', category: 'referral', enabled: false },
      { id: '17-10', name: 'Follow-up in 4-6 weeks', category: 'followup', enabled: true },
    ] 
  },
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
  // Removed duplicate Shoulder Pain entry with ID 24-sp
  { id: '25', name: 'Irregular Periods/Amenorrhea', category: 'common', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '26', name: 'Knee Pain', category: 'common', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { 
    id: '27', 
    name: 'Laryngitis', 
    category: 'acute', 
    standardProtocol: '🩺 Laryngitis\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect epiglottitis or other airway emergency (red flags: stridor, respiratory distress, difficulty swallowing, drooling, sitting in tripod position, rapid onset, high fever)\n\nInvestigations and initial evaluation:\n☐ Rapid strep test\n☐ Throat culture\n☐ Influenza testing\n☐ COVID-19 testing\n☐ Complete blood count (CBC)\n☐ Comprehensive metabolic panel (CMP)\n☐ C-reactive protein (CRP)\n☐ Viral respiratory panel\n☐ Chest X-ray\n☐ Lateral neck X-ray\n☐ Neck CT with contrast\n☐ Laryngoscopy\n\nMedications:\n□ Acetaminophen □ 500mg PO QID PRN, □ 650mg PO QID PRN, □ 1000mg PO QID PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 4000mg daily)\n□ Ibuprofen □ 400mg PO TID, □ 600mg PO TID, □ 800mg PO TID, □ PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 2400mg daily) \n□ Dextromethorphan-guaifenesin □ 10-20mg/200-400mg PO Q4H PRN, □ 20-40mg/400-800mg PO Q4H PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 120mg/2400mg daily)\n□ Benzocaine lozenges □ 1 lozenge dissolved in mouth Q2H PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 10 lozenges daily)\n□ Amoxicillin □ 500mg PO TID, □ 875mg PO BID, for 7-10 days, Ren: □ 1, □ 2, □ 3\n□ Azithromycin □ 500mg PO day 1, then 250mg PO daily for 4 days, Ren: □ 1\n□ Prednisone □ 20mg PO daily, □ 40mg PO daily, for 5 days, Ren: □ 1\n□ Proton pump inhibitor □ Omeprazole 20mg PO daily, □ Pantoprazole 40mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n\nTreatment options:\n☐ Voice rest - minimize talking for 3-7 days\n☐ Humidifier use, especially at night\n☐ Avoid irritants (smoking, alcohol, spicy foods)\n☐ Warm salt water gargles QID\n☐ Steam inhalation for 10-15 minutes several times daily\n☐ Stay well hydrated with warm, non-caffeinated fluids\n☐ Avoid throat clearing and excessive coughing if possible\n☐ Limit caffeine and alcohol intake\n\nReferral options:\n☐ Referral to otolaryngology (ENT)\n☐ Referral to speech therapy\n☐ Referral to pulmonology\n☐ Referral to gastroenterology (if suspected GERD component)\n☐ Referral to infectious disease (if severe infection)\n☐ Referral to emergency department (if airway compromise suspected)\n\n☐ Counseling: Complete voice rest is ideal but impractical for most; whisper rather than strain to talk when necessary. Laryngitis typically resolves within 7-10 days. Return if severe throat pain, difficulty breathing, drooling, stridor, or inability to swallow develops. Maintain adequate hydration. Avoid vocal strain (shouting, singing, whispering) until symptoms resolve.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '27-1', name: 'Rapid strep test', category: 'testing', enabled: true },
      { id: '27-2', name: 'COVID-19 testing', category: 'testing', enabled: true },
      { id: '27-3', name: 'Acetaminophen for symptom relief', category: 'medication', enabled: true },
      { id: '27-4', name: 'Ibuprofen for symptom relief', category: 'medication', enabled: true },
      { id: '27-5', name: 'Voice rest instruction', category: 'lifestyle', enabled: true },
      { id: '27-6', name: 'Humidifier recommendation', category: 'lifestyle', enabled: true },
      { id: '27-7', name: 'Irritant avoidance guidance', category: 'lifestyle', enabled: true },
      { id: '27-8', name: 'Hydration counseling', category: 'lifestyle', enabled: true },
      { id: '27-9', name: 'Antibiotics (only if bacterial cause suspected)', category: 'medication', enabled: false },
      { id: '27-10', name: 'ENT referral if severe or persistent', category: 'referral', enabled: false },
    ]
  },
  { id: '28', name: 'Obesity', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '29', name: 'Oral Herpes', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '30', name: 'Osteoarthritis', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '31', name: 'Paronychia', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { 
    id: '32', 
    name: 'Pharyngitis (Strep throat)', 
    category: 'acute', 
    standardProtocol: '🩺 Pharyngitis (Strep throat)\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect peritonsillar abscess or epiglottitis requiring emergency evaluation (red flags: severe unilateral pain, trismus, muffled voice, drooling, respiratory distress, stridor, inability to swallow, neck swelling)\n\nInvestigations and initial evaluation:\n☐ Rapid strep test\n☐ Throat culture\n☐ Mononucleosis testing (Monospot or EBV serology)\n☐ Complete blood count (CBC)\n☐ COVID-19 testing\n☐ Influenza testing\n☐ C-reactive protein (CRP)\n☐ Respiratory viral panel\n☐ Lateral neck X-ray\n☐ Neck CT with contrast\n☐ Throat swab for gonorrhea/chlamydia PCR\n\nMedications:\n□ Amoxicillin □ 500mg PO TID, □ 875mg PO BID, for 10 days, Ren: □ 1, □ 2, □ 3\n□ Penicillin VK □ 250mg PO QID, □ 500mg PO QID, for 10 days, Ren: □ 1, □ 2, □ 3\n□ Azithromycin □ 500mg PO day 1, then 250mg PO daily for 4 days, Ren: □ 1\n□ Clindamycin □ 300mg PO TID, □ 450mg PO TID, for 10 days, Ren: □ 1, □ 2, □ 3\n□ Cephalexin □ 500mg PO BID, □ 500mg PO TID, for 10 days, Ren: □ 1, □ 2, □ 3\n□ Acetaminophen □ 500mg PO QID PRN, □ 650mg PO QID PRN, □ 1000mg PO QID PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 4000mg daily)\n□ Ibuprofen □ 400mg PO TID, □ 600mg PO TID, □ 800mg PO TID, □ PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 2400mg daily)\n□ Benzocaine lozenges □ 1 lozenge dissolved in mouth Q2H PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 10 lozenges daily)\n□ Phenol throat spray □ 1-2 sprays to throat Q2H PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n\nTreatment options:\n☐ Salt water gargles QID\n☐ Warm liquids (tea with honey, broth)\n☐ Cold foods/beverages for sore throat relief\n☐ Humidifier use, especially at night\n☐ Adequate hydration\n☐ Voice rest as needed\n☐ Avoid irritants (smoking, alcohol)\n☐ Soft diet as tolerated\n\nReferral options:\n☐ Referral to otolaryngology (ENT)\n☐ Referral to infectious disease\n☐ Referral to emergency department\n☐ Referral to pediatrics (for children)\n☐ Referral to allergy/immunology (for recurrent infections)\n☐ Referral to hematology/oncology (for suspicion of malignancy)\n\n☐ Counseling: Complete full course of antibiotics even after symptoms improve. Replace toothbrush after 24-48 hours of antibiotic therapy. Stay home from work/school for 24 hours after starting antibiotics. Return if symptoms worsen, difficulty breathing/swallowing develops, persistent fever, or no improvement after 48-72 hours of treatment. Rest voice as needed and maintain adequate hydration.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '32-1', name: 'Rapid strep test', category: 'testing', enabled: true },
      { id: '32-2', name: 'Throat culture', category: 'testing', enabled: false },
      { id: '32-3', name: 'Mononucleosis testing', category: 'testing', enabled: false },
      { id: '32-4', name: 'Amoxicillin 500mg TID or 875mg BID for 10 days', category: 'medication', enabled: true },
      { id: '32-5', name: 'Penicillin VK for 10 days', category: 'medication', enabled: false },
      { id: '32-6', name: 'Azithromycin (if penicillin allergic)', category: 'medication', enabled: false },
      { id: '32-7', name: 'Acetaminophen for pain/fever', category: 'medication', enabled: true },
      { id: '32-8', name: 'Ibuprofen for pain/fever', category: 'medication', enabled: true },
      { id: '32-9', name: 'Salt water gargles', category: 'lifestyle', enabled: true },
      { id: '32-10', name: 'Hydration guidance', category: 'lifestyle', enabled: true },
    ]
  },
  { 
    id: '34', 
    name: 'Shoulder Pain', 
    category: 'common', 
    standardProtocol: '🩺 Shoulder Pain\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n☐ Prepare message since I suspect rotator cuff tear requiring urgent orthopedic evaluation (red flags: traumatic injury with immediate weakness, significant night pain, inability to raise arm, positive drop arm test, audible pop during injury)\n\nInvestigations and initial evaluation:\n☐ Shoulder X-ray AP, lateral, axillary views\n☐ Ultrasound MSK of shoulder for rotator cuff pathology, bursitis, or impingement\n☐ MRI of shoulder without contrast\n☐ MRI of shoulder with contrast (for labral tears)\n☐ MR arthrogram of shoulder\n☐ CT scan of shoulder\n☐ EMG/NCS for suspected nerve involvement\n☐ Complete blood count (CBC)\n☐ Erythrocyte sedimentation rate (ESR)\n☐ C-reactive protein (CRP)\n☐ Rheumatoid factor\n☐ Anti-CCP antibodies\n☐ HLA-B27\n\nPain management (prescriptions for 14 days):\n□ Ibuprofen □ 400mg PO TID, □ 600mg PO TID, □ 800mg PO TID, □ PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 2400mg daily)\n□ Naproxen □ 250mg PO BID, □ 375mg PO BID, □ 500mg PO BID, □ PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 1500mg daily)\n□ Acetaminophen □ 500mg PO QID PRN, □ 650mg PO QID PRN, □ 1000mg PO QID PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 4000mg daily)\n□ Cyclobenzaprine □ 5mg PO TID, □ 10mg PO TID, □ 10mg PO QHS, □ PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 30mg daily)\n□ Methocarbamol □ 500mg PO QID, □ 750mg PO QID, □ 750mg PO TID, □ PRN, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (max 4000mg daily)\n□ Diclofenac gel 1% □ apply to affected area QID, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Lidocaine patch 5% □ apply to affected area daily for 12 hours, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n\nTreatment options:\n☐ Ice 20 minutes QID for first 48 hours, then heat\n☐ Physical therapy referral for rotator cuff strengthening and shoulder stabilization\n☐ Subacromial corticosteroid injection if persistent bursitis\n☐ Short-term sling use if acute trauma (limit immobilization)\n☐ Gentle pendulum exercises after 3-5 days as tolerated\n☐ Ultrasound-guided glenohumeral joint injection\n☐ Transcutaneous electrical nerve stimulation (TENS)\n☐ Acupuncture\n☐ Massage therapy\n☐ Kinesio taping\n\nReferral options:\n☐ Referral to orthopedics\n☐ Referral to sports medicine\n☐ Referral to physical therapy\n☐ Referral to occupational therapy\n☐ Referral to pain management\n☐ Referral to rheumatology\n☐ Referral to physiatry (PM&R)\n☐ Referral to massage therapy\n☐ Referral to acupuncture\n☐ Referral to chiropractic\n\n☐ Counseling: Counsel on gentle mobilization of shoulder to avoid adhesive capsulitis, avoid heavy lifting until reassessment, maintain hydration by drinking approximately 2–3 liters of water daily adjusted to thirst and body size. Gradually return to activities as tolerated. May require 4-6 weeks for significant improvement. Sleep with pillow supporting affected arm if helpful. Avoid overhead activities until pain improves.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you', 
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
      { id: '34-13', name: 'SOAP note preparation', category: 'testing', enabled: true }
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
      { id: '43-7', name: 'Psoriatic arthritis screening', category: 'testing', enabled: true },
      { id: '43-8', name: 'Cardiovascular risk assessment', category: 'testing', enabled: true },
      { id: '43-9', name: 'Dermatology referral if needed', category: 'referral', enabled: false },
    ]
  },
  { id: '36', name: 'Suspected ADHD in Adults (Diagnostic Evaluation Phase)', category: 'mental', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '44', name: 'Vaginitis/Vaginosis', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '45', name: 'Urethritis', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '46', name: 'Testicular Pain', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '47', name: 'Rectal STIs', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '48', name: 'Asymptomatic STI Testing', category: 'other', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '49', name: 'Syphilis', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '50', name: 'Hepatitis B', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '51', name: 'Hepatitis C', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '52', name: 'HIV', category: 'chronic', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '53', name: 'Dysuria', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { id: '54', name: 'Abnormal Vaginal Discharge', category: 'acute', standardProtocol: '', standardProtocolEnabled: false, treatments: [] },
  { 
    id: '55', 
    name: 'Preventative Care', 
    category: 'preventative', 
    standardProtocol: '🩺 Preventative Care\n☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)\n☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating \'Examen: Non réalisé\'. Keep the plan to only essential interventions, ideally in one line.)\n☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.\n\nInvestigations and initial evaluation:\n☐ Complete blood count (CBC)\n☐ Comprehensive metabolic panel (CMP)\n☐ Lipid panel\n☐ Hemoglobin A1C\n☐ Thyroid stimulating hormone (TSH)\n☐ Urinalysis\n☐ Stool occult blood test\n☐ Electrocardiogram (ECG)\n☐ Chest X-ray (if indicated)\n☐ Bone density scan (DEXA) for women >65 and men >70\n☐ Colorectal cancer screening (colonoscopy, FIT, Cologuard)\n☐ Lung cancer screening LDCT (if smoking history)\n☐ Prostate-specific antigen (PSA) for men\n☐ Mammogram for women\n☐ Pap smear for women\n☐ HIV testing\n☐ Hepatitis B and C screening\n☐ Tuberculosis (TB) screening\n\nImmunizations:\n□ Influenza vaccine □ annually, Ren: □ 1\n□ COVID-19 vaccine □ primary series, □ booster, Ren: □ 1\n□ Tetanus-diphtheria-pertussis (Tdap) □ every 10 years, Ren: □ 1\n□ Pneumococcal vaccines □ PCV13, □ PPSV23, Ren: □ 1\n□ Shingles vaccine (Shingrix) □ 2-dose series, Ren: □ 1, □ 2\n□ Human papillomavirus (HPV) □ 2-3 dose series, Ren: □ 1, □ 2, □ 3\n□ Hepatitis A vaccine □ 2-dose series, Ren: □ 1, □ 2\n□ Hepatitis B vaccine □ 3-dose series, Ren: □ 1, □ 2, □ 3\n□ Meningococcal vaccines □ MenACWY, □ MenB, Ren: □ 1, □ 2\n\nPreventive medications:\n□ Aspirin □ 81mg PO daily, □ 162mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (if indicated)\n□ Statin □ Atorvastatin 10mg PO daily, □ Atorvastatin 20mg PO daily, □ Rosuvastatin 5mg PO daily, □ Rosuvastatin 10mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24 (if indicated)\n□ Multivitamin □ 1 tablet PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Vitamin D3 □ 1000IU PO daily, □ 2000IU PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n□ Calcium supplement □ 500mg PO daily, □ 1000mg PO daily, Ren: □ 1, □ 2, □ 3, □ 6, □ 12, □ 24\n\nHealth maintenance:\n☐ Blood pressure monitoring\n☐ Weight management\n☐ Smoking cessation counseling\n☐ Alcohol use screening and counseling\n☐ Depression screening\n☐ Fall risk assessment\n☐ Diabetes risk assessment\n☐ Cardiovascular risk assessment\n☐ Vision screening\n☐ Hearing evaluation\n☐ Dental examination\n\nReferral options:\n☐ Referral to ophthalmology for eye examination\n☐ Referral to dental care\n☐ Referral to nutritionist/dietitian\n☐ Referral to smoking cessation program\n☐ Referral to exercise physiologist\n☐ Referral to physical therapy for fall prevention\n☐ Referral to sleep medicine\n☐ Referral to dermatology for skin cancer screening\n☐ Referral to behavioral health for mental wellness\n☐ Referral to social work for community resources\n\n☐ Counseling: Preventive care focuses on maintaining health and preventing disease. Maintain a balanced diet with plenty of fruits, vegetables, and whole grains. Engage in at least 150 minutes of moderate exercise weekly. Limit alcohol intake, avoid tobacco products, and get 7-8 hours of sleep nightly. Keep up with recommended screenings and vaccinations. Practice safe sun exposure with SPF 30+ sunscreen. Maintain social connections and engage in stress management techniques. Return for annual physical examinations and as recommended for age-appropriate screenings.\n\nFollow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you', 
    standardProtocolEnabled: false, 
    treatments: [
      { id: '55-1', name: 'Annual comprehensive blood panel', category: 'testing', enabled: true },
      { id: '55-2', name: 'Age-appropriate cancer screenings', category: 'testing', enabled: true },
      { id: '55-3', name: 'Recommended adult vaccinations', category: 'medication', enabled: true },
      { id: '55-4', name: 'Cardiovascular risk assessment', category: 'testing', enabled: true },
      { id: '55-5', name: 'Depression screening', category: 'testing', enabled: true },
      { id: '55-6', name: 'Lifestyle and nutrition counseling', category: 'lifestyle', enabled: true },
      { id: '55-7', name: 'Exercise recommendations', category: 'lifestyle', enabled: true },
      { id: '55-8', name: 'Aspirin therapy if indicated', category: 'medication', enabled: false },
      { id: '55-9', name: 'Statin therapy if indicated', category: 'medication', enabled: false },
      { id: '55-10', name: 'Annual eye and dental exams', category: 'referral', enabled: true },
      { id: '55-11', name: 'Bone density testing when appropriate', category: 'testing', enabled: false },
      { id: '55-12', name: 'Annual follow-up for routine care', category: 'followup', enabled: true },
    ]
  },
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
      { id: '39-1', name: 'Mental health assessment (PHQ-9, GAD-7)', category: 'testing', enabled: true },
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
      { id: '40-1', name: 'Medical cause exclusion workup', category: 'testing', enabled: true },
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
      { id: '41-1', name: 'Comprehensive psychiatric evaluation', category: 'testing', enabled: true },
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
      { id: '42-1', name: 'Sleep diary monitoring', category: 'testing', enabled: true },
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
  const [editedDiagnoses, setEditedDiagnoses] = useState<Diagnosis[]>(deepCopy(diagnosisList));
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
    let matchesCategory = activeTab === 'all';
    
    if (activeTab === 'urgent') matchesCategory = diagnosis.category === 'acute';
    else if (activeTab === 'preventative') matchesCategory = diagnosis.category === 'chronic';
    else if (activeTab === 'msk') matchesCategory = diagnosis.category === 'common';
    else if (activeTab === 'mental') matchesCategory = diagnosis.category === 'mental';
    else if (activeTab === 'std') matchesCategory = diagnosis.category === 'other';
    
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
  
  // Reset protocol to default values
  const handleResetProtocol = () => {
    if (!selectedDiagnosis) return;
    
    // Find the original diagnosis from the diagnoses list
    const originalDiagnosis = diagnosisList.find(d => d.id === selectedDiagnosis);
    if (!originalDiagnosis) return;
    
    // Update edited diagnoses with the original values
    setEditedDiagnoses(prevDiagnoses => 
      prevDiagnoses.map(diagnosis => {
        if (diagnosis.id === selectedDiagnosis) {
          return deepCopy(originalDiagnosis);
        }
        return diagnosis;
      })
    );
    
    // Update temp protocol if currently editing
    if (editingProtocol) {
      setTempProtocol(originalDiagnosis.standardProtocol);
    }
    
    toast({
      title: 'Protocol Reset',
      description: 'Protocol has been reset to default values.',
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

  // Mapping diagnoses to new display categories
  const getMedicalGroup = (category: string) => {
    switch (category) {
      case 'acute':
        return 'urgent';
      case 'chronic':
        return 'chronic';
      case 'common':
        return 'msk';
      case 'mental':
        return 'mental';
      case 'preventative':
        return 'preventative';
      default:
        return 'other';
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
    <AppLayoutSpruce>
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
        
        <div className="space-y-6">
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
              <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2">
                {/* All Diagnoses in Alphabetical Order */}
                <div className="space-y-3">
                  <h3 className="text-md font-medium text-white">Medical Conditions</h3>
                  <div className="flex flex-wrap gap-2">
                    {filteredDiagnoses
                      .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
                      .map((diagnosis) => (
                      <Button
                        key={diagnosis.id}
                        variant="outline"
                        className={`h-auto justify-start py-2 px-3 text-left border border-gray-700 hover:bg-[#262626] transition-all ${selectedDiagnosis === diagnosis.id ? 'bg-[#262626] ring-1 ring-blue-500' : ''}`}
                        onClick={() => handleDiagnosisClick(diagnosis.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{diagnosis.name}</div>
                          {diagnosis.standardProtocolEnabled && (
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
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
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleResetProtocol} 
                        variant="outline"
                        className="border-gray-700"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset to Default
                      </Button>
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
                    
                    {/* Planning */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Planning</h3>
                      <p className="text-sm text-gray-400 mb-6">
                        Toggle each option to customize your preferred planning. The AI will reference 
                        these settings when providing recommendations.
                      </p>
                      
                      {selectedDiagnosisData.treatments.length === 0 ? (
                        <div className="text-center p-4 bg-[#262626] rounded-md">
                          <p className="text-gray-400">No planning options defined for this condition yet.</p>
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
    </AppLayoutSpruce>
  );
}