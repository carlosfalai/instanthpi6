const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test cases data (without additional_notes field)
const testCases = [
  {
    patient_id: 'C1H3S7P4A9',
    chief_complaint: 'Douleur thoracique',
    symptoms: 'Douleur thoracique rétrosternale, palpitations, essoufflement',
    severity: '8',
    triage_level: 'P2',
    status: 'pending',
    age: '45',
    gender: 'Homme',
    problem_start_date: 'Il y a 2 heures',
    specific_trigger: 'Effort physique',
    symptom_location: 'Rétrosternal, irradiant vers le bras gauche',
    symptom_description: 'Douleur en pression, sensation de serrement',
    symptom_aggravators: 'Effort, respiration profonde',
    symptom_relievers: 'Repos, position assise',
    symptom_progression: 'Apparition brutale, stable depuis',
    selected_symptoms: ['Palpitations', 'Essoufflement', 'Sueurs froides'],
    treatments_attempted: 'Paracétamol 1000mg',
    treatment_effectiveness: 'Aucune amélioration',
    chronic_conditions: 'Hypertension artérielle, diabète type 2',
    medication_allergies: 'Aucune allergie connue',
    pregnancy_status: 'Non applicable'
  },
  {
    patient_id: 'M2I8G9R3A1',
    chief_complaint: 'Céphalée sévère',
    symptoms: 'Céphalée pulsatile, photophobie, nausées',
    severity: '7',
    triage_level: 'P3',
    status: 'pending',
    age: '32',
    gender: 'Femme',
    problem_start_date: 'Il y a 6 heures',
    specific_trigger: 'Stress au travail',
    symptom_location: 'Fronto-temporale droite',
    symptom_description: 'Douleur pulsatile, battements',
    symptom_aggravators: 'Lumière, bruit, mouvement',
    symptom_relievers: 'Obscurité, repos, sommeil',
    symptom_progression: 'Intensité croissante depuis le matin',
    selected_symptoms: ['Photophobie', 'Nausées', 'Vomissements'],
    treatments_attempted: 'Ibuprofène 400mg, sommeil',
    treatment_effectiveness: 'Légère amélioration avec le sommeil',
    chronic_conditions: 'Migraines chroniques',
    medication_allergies: 'Aspirine (urticaire)',
    pregnancy_status: 'Non enceinte'
  },
  {
    patient_id: 'A3B5D9O7M2',
    chief_complaint: 'Douleur abdominale',
    symptoms: 'Douleur abdominale, nausées, perte d\'appétit',
    severity: '6',
    triage_level: 'P3',
    status: 'pending',
    age: '28',
    gender: 'Femme',
    problem_start_date: 'Il y a 12 heures',
    specific_trigger: 'Repas copieux hier soir',
    symptom_location: 'Épigastre, irradiant vers le dos',
    symptom_description: 'Douleur en crampes, sensation de brûlure',
    symptom_aggravators: 'Alimentation, position couchée',
    symptom_relievers: 'Position assise, jeûne',
    symptom_progression: 'Douleur constante avec pics',
    selected_symptoms: ['Nausées', 'Perte d\'appétit', 'Ballonnements'],
    treatments_attempted: 'Antiacides, tisane à la menthe',
    treatment_effectiveness: 'Légère amélioration',
    chronic_conditions: 'Reflux gastro-œsophagien',
    medication_allergies: 'Aucune allergie connue',
    pregnancy_status: 'Non enceinte'
  },
  {
    patient_id: 'B4A8C6K1P5',
    chief_complaint: 'Lombalgie aiguë',
    symptoms: 'Douleur lombaire, raideur, difficulté à bouger',
    severity: '5',
    triage_level: 'P4',
    status: 'pending',
    age: '55',
    gender: 'Homme',
    problem_start_date: 'Il y a 3 jours',
    specific_trigger: 'Soulèvement de charges lourdes',
    symptom_location: 'Lombaire bas, irradiant vers la fesse droite',
    symptom_description: 'Douleur mécanique, raideur matinale',
    symptom_aggravators: 'Mouvement, position debout prolongée',
    symptom_relievers: 'Repos, chaleur, position couchée',
    symptom_progression: 'Amélioration progressive avec le repos',
    selected_symptoms: ['Raideur', 'Difficulté à se pencher', 'Spasmes musculaires'],
    treatments_attempted: 'Diclofénac gel, chaleur locale',
    treatment_effectiveness: 'Amélioration partielle',
    chronic_conditions: 'Lombalgie chronique, arthrose',
    medication_allergies: 'Aucune allergie connue',
    pregnancy_status: 'Non applicable'
  },
  {
    patient_id: 'R5E8S9P2I6',
    chief_complaint: 'Toux persistante',
    symptoms: 'Toux sèche, essoufflement, fatigue',
    severity: '4',
    triage_level: 'P4',
    status: 'pending',
    age: '67',
    gender: 'Femme',
    problem_start_date: 'Il y a 1 semaine',
    specific_trigger: 'Exposition à la poussière',
    symptom_location: 'Thorax, sensation d\'oppression',
    symptom_description: 'Toux sèche, irritante, nocturne',
    symptom_aggravators: 'Position couchée, air froid',
    symptom_relievers: 'Position assise, humidité',
    symptom_progression: 'Toux nocturne plus fréquente',
    selected_symptoms: ['Essoufflement', 'Fatigue', 'Perte d\'appétit'],
    treatments_attempted: 'Sirop antitussif, humidificateur',
    treatment_effectiveness: 'Aucune amélioration',
    chronic_conditions: 'Asthme, hypertension',
    medication_allergies: 'Pénicilline (éruption cutanée)',
    pregnancy_status: 'Non applicable'
  }
];

async function insertTestCases() {
  console.log('Inserting test cases...');
  
  for (const testCase of testCases) {
    const { data, error } = await supabase
      .from('consultations')
      .insert([testCase])
      .select();
    
    if (error) {
      console.error('Error inserting case:', testCase.patient_id, error);
    } else {
      console.log('✅ Inserted case:', testCase.patient_id, '-', testCase.chief_complaint);
    }
  }
  
  console.log('\nTest cases insertion completed!');
}

insertTestCases().catch(console.error);
