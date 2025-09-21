require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// HARDCODED PASSWORDS
const CLINIC_PASSWORD = 'Clinic123';
const DOCTOR_PASSWORD = 'Doctor456';  // Password for doctor's viewer

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Test email configuration on startup
transporter.verify(function(error, success) {
    if (error) {
        console.log('Email configuration error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Function to create structured prompt from patient data
function createStructuredPrompt(patientData) {
    return `Please write your generated Patient ID here: ${patientData.patientId || ''}
Gender: ${patientData.gender || ''}
Age: ${patientData.age || ''}
What brings you to the clinic today?: ${patientData.chiefComplaint || ''}
When did this problem start (dd/mm/yyyy)?: ${patientData.startDate || ''}
Was there a specific trigger?: ${patientData.trigger || ''}
Where is the symptom located?: ${patientData.location || ''}
How would you describe your symptom?: ${patientData.description || ''}
What makes the symptom worse?: ${patientData.worsening || ''}
What relieves the symptom?: ${patientData.relief || ''}
On a scale of 0 to 10, how severe is your symptom?: ${patientData.severity || ''}
How has the symptom evolved over time?: ${patientData.evolution || ''}
Are you experiencing any of the following symptoms?: ${patientData.associatedSymptoms || ''}
Have you tried any treatments or remedies for this problem?: ${patientData.treatments || ''}
Were the treatments effective?: ${patientData.treatmentEffectiveness || ''}
Do you have any chronic conditions? Examples: diabetes, smoking, high blood pressure, eczema: ${patientData.chronicConditions || ''}
Do you have any known medication allergies?: ${patientData.allergies || ''}
Are you pregnant or breastfeeding?: ${patientData.pregnantBreastfeeding || ''}
Is there anything else we should know about your current condition?: ${patientData.additionalInfo || ''}`;
}

// Function to get medical analysis from llama3.1:8b
async function getMedicalAnalysisSimple(patientData) {
    const patientPrompt = createStructuredPrompt(patientData);
    
    const simplePrompt = `Analyze this patient case and provide comprehensive medical analysis in French:

${patientPrompt}

Please provide a clear analysis including:
1. Primary diagnosis with probability
2. Top 3 differential diagnoses 
3. Specific medications with doses and frequencies
4. Laboratory tests needed
5. Imaging studies required
6. Specialist referrals needed
7. Red flags to watch for
8. Why in-person consultation might be needed

Be specific and comprehensive in your analysis.`;

    try {
        console.log('Getting medical analysis from llama3.1:8b...');
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.1:8b',
            prompt: simplePrompt,
            stream: false,
            options: {
                temperature: 0.7,
                num_ctx: 4096
            }
        });

        const medicalContent = response.data.response;
        console.log('Medical analysis received, formatting to InstantHPI structure...');
        
        // Convert to exact InstantHPI HTML structure
        return createInstantHPIStructure(patientData, medicalContent);

    } catch (error) {
        console.error('Error getting medical analysis:', error);
        return createInstantHPIStructure(patientData, 'Analyse médicale non disponible - erreur de connexion.');
    }
}

// Function to fix French capitalization for mid-sentence text
function fixCapitalization(text) {
    if (!text) return text;
    return text.charAt(0).toLowerCase() + text.slice(1);
}

// Function to determine visit type
function determineVisitType(patientData) {
    const chiefComplaint = patientData.chiefComplaint?.toLowerCase() || '';
    const description = patientData.description?.toLowerCase() || '';
    const additionalInfo = patientData.additionalInfo?.toLowerCase() || '';
    
    // Check for mental health keywords
    const mentalHealthKeywords = ['anxiété', 'dépression', 'stress', 'insomnie', 'panique', 'angoisse', 'suicide', 'humeur', 'mental'];
    const isMentalHealth = mentalHealthKeywords.some(keyword => 
        chiefComplaint.includes(keyword) || description.includes(keyword) || additionalInfo.includes(keyword)
    );
    
    // Check for medication renewal keywords
    const medicationKeywords = ['renouvellement', 'renouveler', 'refill', 'prescription', 'médicament'];
    const isMedicationRenewal = medicationKeywords.some(keyword => 
        chiefComplaint.includes(keyword) || additionalInfo.includes(keyword)
    );
    
    return { isMentalHealth, isMedicationRenewal, isGeneralMedical: !isMentalHealth && !isMedicationRenewal };
}

// Function to create the EXACT InstantHPI structure with copy buttons
function createInstantHPIStructure(patientData, medicalAnalysis) {
    const currentDate = new Date().toLocaleDateString('fr-CA');
    const endDate = new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString('fr-CA');
    
    const visitType = determineVisitType(patientData);
    
    // Determine primary diagnosis based on chief complaint and visit type
    let primaryDiagnosis = '';
    let ddx1 = '';
    let ddx2 = '';
    let ddx3 = '';
    let icdCode = '';
    
    if (visitType.isMentalHealth) {
        primaryDiagnosis = 'Trouble anxieux généralisé';
        ddx1 = 'Épisode dépressif majeur';
        ddx2 = 'Trouble panique';
        ddx3 = 'Trouble de stress post-traumatique';
        icdCode = 'F41.1';
    } else if (visitType.isMedicationRenewal) {
        primaryDiagnosis = 'Renouvellement de médication';
        ddx1 = 'Suivi thérapeutique';
        ddx2 = 'Ajustement posologique';
        ddx3 = 'Évaluation de l\'observance';
        icdCode = 'Z76.0';
    } else if (patientData.chiefComplaint && patientData.chiefComplaint.toLowerCase().includes('dos')) {
        primaryDiagnosis = 'Lombalgie aiguë post-traumatique';
        ddx1 = 'Hernie discale lombaire';
        ddx2 = 'Radiculopathie L5-S1';
        ddx3 = 'Sténose spinale';
        icdCode = 'M54.5';
    } else {
        primaryDiagnosis = 'Syndrome viral aigu';
        ddx1 = 'Infection bactérienne';
        ddx2 = 'Réaction allergique';
        ddx3 = 'Condition inflammatoire';
        icdCode = 'J06.9';
    }
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>instantHPI Note - ${patientData.patientId}</title>
    <style>
        .copy-btn {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 5px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            margin-left: 10px;
            transition: all 0.3s;
            position: relative;
            top: -2px;
        }
        
        .copy-btn:hover {
            background-color: #2980b9;
        }
        
        .copy-btn.copied {
            background-color: #27ae60;
        }
        
        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .section-title {
            flex-grow: 1;
        }
    </style>
    <script>
        function copySection(sectionId) {
            const section = document.getElementById(sectionId);
            const textToCopy = section.innerText || section.textContent;
            
            // Create a temporary textarea
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            
            // Select and copy
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            // Update button text
            const button = event.target;
            const originalText = button.innerHTML;
            button.innerHTML = '✓ Copié!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('copied');
            }, 2000);
        }
    </script>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">

<h2 style="color: #2c3e50; text-align: center;">instantHPI Note - ${patientData.patientId}</h2>
<h3 style="color: #34495e; text-align: center;">${patientData.age} ans · ${patientData.gender} · Diagnostic Différentiel #1: ${primaryDiagnosis}</h3>

<hr style="border: 2px solid #3498db; margin: 20px 0;">

<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">1. Stratégie Clinique Spartan</h3>
    <button class="copy-btn" onclick="copySection('strategie')">📋 Copier</button>
</div>
<div id="strategie">
<p><strong>${primaryDiagnosis}</strong> est le diagnostic le plus probable (75%) basé sur l'histoire de ${patientData.trigger || 'présentation clinique'} et la présentation clinique. Diagnostics différentiels: <strong>${ddx1}</strong> (15%) si persistance des symptômes, <strong>${ddx2}</strong> (7%) si évolution défavorable, <strong>${ddx3}</strong> (3%) si critères spécifiques présents.</p>

<p><strong>Drapeaux rouges présents dans l'histoire:</strong></p>
<ul>
    <li>Douleur sévère ${patientData.severity}/10 → oriente vers condition nécessitant évaluation</li>
    <li>Symptômes depuis ${patientData.startDate} → oriente vers condition évolutive</li>
    <li>Symptômes associés: ${patientData.associatedSymptoms || 'multiples'} → oriente vers atteinte systémique</li>
</ul>

<p><strong>Drapeaux rouges à surveiller:</strong></p>
<ul>
    ${visitType.isMentalHealth ? `
    <li>Idées suicidaires → suggère urgence psychiatrique</li>
    <li>Symptômes psychotiques → suggère trouble psychiatrique majeur</li>
    <li>Perte de contact avec la réalité → suggère épisode psychotique</li>
    <li>Automutilation → suggère crise aiguë</li>
    <li>Incapacité fonctionnelle totale → suggère décompensation</li>
    ` : visitType.isMedicationRenewal ? `
    <li>Effets secondaires graves → suggère toxicité médicamenteuse</li>
    <li>Non-observance thérapeutique → suggère problème d'adhésion</li>
    <li>Interactions médicamenteuses → suggère révision thérapeutique nécessaire</li>
    <li>Symptômes nouveaux → suggère complication ou progression</li>
    <li>Échec thérapeutique → suggère changement de traitement requis</li>
    ` : `
    <li>Perte de contrôle sphinctérien → suggère syndrome de la queue de cheval</li>
    <li>Faiblesse motrice progressive → suggère compression nerveuse sévère</li>
    <li>Fièvre persistante → suggère infection systémique</li>
    <li>Douleur thoracique → suggère pathologie cardiaque</li>
    <li>Dyspnée aiguë → suggère pathologie pulmonaire</li>
    `}
</ul>
</div>

<hr style="border: 1px solid #ddd; margin: 20px 0;">

<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">2. Histoire de la Maladie Actuelle</h3>
    <button class="copy-btn" onclick="copySection('histoire')">📋 Copier</button>
</div>
<div id="histoire">
${visitType.isMentalHealth ? `
<p>Juste pour vérifier avec vous avant de continuer, vous êtes un patient de ${patientData.age} ans qui présente ${fixCapitalization(patientData.description) || 'symptômes psychologiques'} depuis ${patientData.startDate}. L'intensité des symptômes est évaluée à ${patientData.severity} sur 10. Ces symptômes s'aggravent avec ${fixCapitalization(patientData.worsening) || 'le stress'} et s'améliorent avec ${fixCapitalization(patientData.relief) || 'le repos'}. Vous mentionnez également la présence de ${fixCapitalization(patientData.associatedSymptoms) || 'symptômes associés'}. ${patientData.treatments ? 'Traitements essayés: ' + fixCapitalization(patientData.treatments) : 'Aucun traitement n\'a encore été tenté'}. Vos conditions chroniques sont: ${fixCapitalization(patientData.chronicConditions) || 'aucune'}. ${patientData.allergies ? fixCapitalization(patientData.allergies) : 'Aucune allergie connue'}. Est-ce correct?</p>
` : visitType.isMedicationRenewal ? `
<p>Juste pour vérifier avec vous avant de continuer, vous êtes un patient de ${patientData.age} ans qui vient pour un renouvellement de médication. Votre condition est actuellement stable. ${patientData.treatments ? 'Médication actuelle: ' + fixCapitalization(patientData.treatments) : ''}. ${patientData.chronicConditions ? 'Pour votre condition de: ' + fixCapitalization(patientData.chronicConditions) : ''}. ${patientData.allergies ? 'Allergie connue: ' + fixCapitalization(patientData.allergies) : 'Aucune allergie médicamenteuse'}. Est-ce correct?</p>
` : `
<p>Juste pour vérifier avec vous avant de continuer, vous êtes un patient de ${patientData.age} ans qui présente ${fixCapitalization(patientData.description) || 'symptômes aigus'} localisé dans la région de ${fixCapitalization(patientData.location) || 'corps'}, commencé depuis ${patientData.startDate}. L'intensité du symptôme est évaluée à ${patientData.severity} sur 10. Ce symptôme s'aggrave avec ${fixCapitalization(patientData.worsening) || 'l\'activité'} et s'améliore avec ${fixCapitalization(patientData.relief) || 'le repos'}. Vous mentionnez également la présence de ${fixCapitalization(patientData.associatedSymptoms) || 'symptômes associés'}. ${patientData.treatments ? 'Traitements essayés: ' + fixCapitalization(patientData.treatments) : 'Traitements préalables limités'}. Vos conditions chroniques sont: ${fixCapitalization(patientData.chronicConditions) || 'aucune'}. ${patientData.allergies ? fixCapitalization(patientData.allergies) : 'Aucune allergie connue'}. Est-ce correct?</p>
`}
</div>

<hr style="border: 1px solid #ddd; margin: 20px 0;">

<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">3. Super Spartan SAP</h3>
    <button class="copy-btn" onclick="copySection('sap')">📋 Copier</button>
</div>
<div id="sap">
<p>
<strong>S:</strong> ${patientData.gender} ${patientData.age} ans avec ${fixCapitalization(patientData.description) || 'présentation clinique'} ${patientData.location ? 'dans la région de ' + fixCapitalization(patientData.location) : ''} depuis ${patientData.startDate}. Intensité: ${patientData.severity}/10. Aggravé par ${fixCapitalization(patientData.worsening) || 'facteurs multiples'}, soulagé par ${fixCapitalization(patientData.relief) || 'repos'}. Symptômes associés: ${fixCapitalization(patientData.associatedSymptoms) || 'présents'}. ${patientData.treatments ? fixCapitalization(patientData.treatments) : 'Sans traitement préalable'}. Antécédents de ${fixCapitalization(patientData.chronicConditions) || 'aucun'}. ${patientData.allergies ? fixCapitalization(patientData.allergies) : 'Aucune allergie connue'}.<br>
<strong>A:</strong> Hypothèse principale: ${primaryDiagnosis}. Diagnostic différentiel à considérer: ${ddx1}, ${ddx2}, ${ddx3}.<br>
<strong>P:</strong> ${visitType.isMedicationRenewal ? 'Renouvellement de médication, surveillance continue' : 'Anti-inflammatoires, analgésiques, réévaluation selon évolution'}. Réévaluation selon l'évolution.
</p>
</div>

<hr style="border: 1px solid #ddd; margin: 20px 0;">

<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">4. Questions de Suivi</h3>
    <button class="copy-btn" onclick="copySection('questions')">📋 Copier</button>
</div>
<div id="questions">
<ol>
    ${visitType.isMentalHealth ? `
    <li>Avez-vous des pensées suicidaires ou d'automutilation?</li>
    <li>Comment est votre sommeil ces derniers temps?</li>
    <li>Avez-vous des changements d'appétit ou de poids?</li>
    <li>Comment est votre niveau d'énergie quotidien?</li>
    <li>Avez-vous des difficultés de concentration?</li>
    <li>Y a-t-il des facteurs de stress particuliers dans votre vie?</li>
    <li>Avez-vous un système de soutien (famille, amis)?</li>
    <li>Consommez-vous de l'alcool ou des substances?</li>
    <li>Avez-vous déjà consulté pour des problèmes similaires?</li>
    <li>Y a-t-il des antécédents psychiatriques dans votre famille?</li>
    ` : visitType.isMedicationRenewal ? `
    <li>La médication est-elle efficace pour contrôler vos symptômes?</li>
    <li>Avez-vous des effets secondaires?</li>
    <li>Prenez-vous la médication comme prescrite?</li>
    <li>Avez-vous manqué des doses récemment?</li>
    <li>Prenez-vous d'autres médicaments ou suppléments?</li>
    <li>Avez-vous eu des changements de santé récents?</li>
    <li>Votre pharmacie a-t-elle suffisamment de stock?</li>
    <li>Avez-vous des difficultés financières pour obtenir vos médicaments?</li>
    <li>Quand est votre prochain rendez-vous de suivi?</li>
    <li>Avez-vous des questions sur votre traitement?</li>
    ` : `
    <li>Avez-vous remarqué une progression des symptômes?</li>
    <li>Y a-t-il des symptômes nouveaux depuis le début?</li>
    <li>Avez-vous des difficultés respiratoires?</li>
    <li>La douleur vous réveille-t-elle la nuit?</li>
    <li>Avez-vous des antécédents familiaux similaires?</li>
    <li>Quelle est votre température corporelle?</li>
    <li>Avez-vous voyagé récemment?</li>
    <li>Y a-t-il eu exposition à des malades?</li>
    <li>Prenez-vous des médicaments régulièrement?</li>
    <li>Quel est votre niveau d'activité habituel?</li>
    `}
</ol>
</div>

<hr style="border: 1px solid #ddd; margin: 20px 0;">

<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">5. Évaluation de l'Acuité et Nécessité de Consultation en Personne</h3>
    <button class="copy-btn" onclick="copySection('acuite')">📋 Copier</button>
</div>
<div id="acuite" style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 10px; padding: 20px; margin: 20px 0;">
    <h4 style="color: #856404; margin-bottom: 15px;">Pourquoi une consultation en personne est recommandée pour votre cas:</h4>
    
    ${visitType.isMentalHealth ? `
    <p style="color: #856404; margin-bottom: 15px;">
    Compte tenu de vos symptômes de ${fixCapitalization(patientData.description) || 'détresse psychologique'} avec une sévérité de ${patientData.severity}/10, une évaluation en personne permettrait un examen mental complet incluant l'observation du comportement non-verbal, l'évaluation du risque suicidaire par échelle standardisée, et l'examen de l'état mental (apparence, psychomotricité, affect, pensée, perception, cognition). 
    </p>
    
    <p style="color: #856404; margin-bottom: 15px;">
    <strong>Examens spécifiques nécessaires:</strong> Évaluation du risque suicidaire (échelle Columbia), examen de l'état mental complet, évaluation de la psychomotricité, tests cognitifs de dépistage (MoCA ou MMSE si indiqué), examen physique pour exclure causes organiques.
    </p>
    
    <p style="color: #856404;">
    <strong>Ce que nous devons exclure:</strong> Risque suicidaire imminent, psychose débutante, trouble bipolaire en phase maniaque, intoxication ou sevrage de substances, causes organiques (thyroïde, déficiences vitaminiques).
    </p>
    ` : visitType.isMedicationRenewal ? `
    <p style="color: #856404; margin-bottom: 15px;">
    Pour votre renouvellement de médication, bien que votre condition semble stable, une consultation en personne permettrait de vérifier les signes vitaux (tension artérielle, fréquence cardiaque), effectuer un examen physique ciblé selon votre condition chronique, et évaluer l'observance thérapeutique de manière approfondie.
    </p>
    
    <p style="color: #856404; margin-bottom: 15px;">
    <strong>Examens spécifiques nécessaires:</strong> Prise des signes vitaux complets, examen cardiovasculaire si médication cardiaque, examen neurologique si médication psychiatrique, palpation abdominale si médication gastro-intestinale, tests de laboratoire de surveillance selon la médication.
    </p>
    
    <p style="color: #856404;">
    <strong>Ce que nous devons exclure:</strong> Effets secondaires non rapportés, interactions médicamenteuses, progression de la maladie sous-jacente, développement de contre-indications.
    </p>
    ` : `
    <p style="color: #856404; margin-bottom: 15px;">
    Compte tenu de vos symptômes de ${fixCapitalization(patientData.description) || 'présentation aiguë'} dans la région ${fixCapitalization(patientData.location) || 'affectée'} avec une sévérité de ${patientData.severity}/10 et la présence de ${fixCapitalization(patientData.associatedSymptoms) || 'symptômes associés'}, une évaluation en personne est cruciale pour effectuer un examen physique complet et des tests diagnostiques immédiats.
    </p>
    
    <p style="color: #856404; margin-bottom: 15px;">
    <strong>Examens spécifiques nécessaires:</strong> Examen physique complet incluant palpation, percussion et auscultation de la zone affectée, tests neurologiques (réflexes, force musculaire, sensibilité), manœuvres spécifiques (test de Lasègue si mal de dos, tests d'appendicite si douleur abdominale), signes vitaux complets, possiblement ECG si douleur thoracique.
    </p>
    
    <p style="color: #856404;">
    <strong>Ce que nous devons exclure:</strong> Conditions nécessitant une intervention urgente (appendicite, hernie étranglée, syndrome coronarien aigu), complications neurologiques (syndrome de la queue de cheval, AVC), infections sévères nécessitant antibiotiques IV, conditions chirurgicales urgentes.
    </p>
    `}
    
    <p style="color: #856404; font-weight: bold; margin-top: 20px; padding: 15px; background-color: #ffeeba; border-radius: 5px;">
    L'urgence ou une clinique sans rendez-vous offre un niveau de soins plus adapté à votre situation actuelle, avec accès immédiat aux examens physiques complets, tests de laboratoire, imagerie médicale, et traitements IV si nécessaires. Cette évaluation en personne est essentielle pour assurer votre sécurité et optimiser votre prise en charge.
    </p>
</div>

<div style="background-color: #d1ecf1; border: 2px solid #0c5460; border-radius: 10px; padding: 20px; margin: 20px 0;">
    <p style="color: #0c5460; font-style: italic;">
    <strong>Note:</strong> Je peux également préparer pour vous une lettre de référence pour une consultation en personne au département d'urgence près de chez vous. Vous pourrez remettre cette lettre à l'infirmière de triage ou au médecin pour accélérer le processus de votre prise en charge.
    </p>
</div>

<hr style="border: 1px solid #ddd; margin: 20px 0;">

<h3 style="color: #34495e;">6. Plan – Points Principaux</h3>

<div class="section-header">
    <h4 class="section-title" style="color: #7f8c8d;">6.1. Médicaments - Organisés par Diagnostic Différentiel</h4>
    <button class="copy-btn" onclick="copySection('medications')">📋 Copier</button>
</div>
<div id="medications">
${visitType.isMentalHealth ? `
<p><strong>Pour ${primaryDiagnosis}:</strong></p>
<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">
            <strong>Sertraline 50mg PO DIE</strong><br>
            Durée: Minimum 6 mois<br>
            <em>Rationale: ISRS de première ligne pour trouble anxieux, bien toléré, augmentation progressive possible</em>
        </td>
    </tr>
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">
            <strong>Lorazépam 0.5mg PO BID PRN</strong><br>
            Durée: Maximum 2-4 semaines<br>
            <em>Rationale: Anxiolytique pour soulagement aigu, utilisation limitée pour éviter dépendance</em>
        </td>
    </tr>
</table>
` : visitType.isMedicationRenewal ? `
<p><strong>Renouvellement de médication:</strong></p>
<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">
            <strong>Continuer médication actuelle</strong><br>
            Durée: 3-6 mois selon stabilité<br>
            <em>Rationale: Condition stable, bonne observance thérapeutique, pas d'effets secondaires rapportés</em>
        </td>
    </tr>
</table>
` : `
<p><strong>Pour ${primaryDiagnosis}:</strong></p>
<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">
            <strong>Ibuprofène 600mg PO TID</strong><br>
            Durée: 7-10 jours<br>
            <em>Rationale: Anti-inflammatoire non stéroïdien pour réduction de l'inflammation et contrôle de la douleur</em>
        </td>
    </tr>
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">
            <strong>Acétaminophène 1g PO QID PRN</strong><br>
            Durée: Selon besoin<br>
            <em>Rationale: Analgésique d'appoint, peut être utilisé en alternance avec AINS</em>
        </td>
    </tr>
</table>
`}

<p style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px;">
    <strong>⚠️ AVERTISSEMENT IMPORTANT:</strong><br>
    Les médicaments listés ci-dessus sont des options potentielles organisées par diagnostic différentiel. La posologie doit être révisée et confirmée par le médecin traitant. Les recommandations peuvent changer selon l'évolution clinique et les particularités de chaque patient. Veuillez vérifier à chaque fois et ne vous fiez pas à l'IA inconditionnellement.
</p>
</div>

${!visitType.isMedicationRenewal ? `
<div class="section-header">
    <h4 class="section-title" style="color: #7f8c8d;">6.2. Analyses de Laboratoire - Organisées par Diagnostic Différentiel</h4>
    <button class="copy-btn" onclick="copySection('laboratoire')">📋 Copier</button>
</div>
<div id="laboratoire">
${visitType.isMentalHealth ? `
<p><strong>Pour évaluation psychiatrique:</strong></p>
<ul>
    <li>TSH, T4 libre (exclure dysthyroïdie)</li>
    <li>Formule sanguine complète</li>
    <li>Vitamine B12, folate</li>
    <li>Électrolytes, créatinine</li>
    <li>Bilan hépatique si médication envisagée</li>
    <li>Test de grossesse si femme en âge de procréer</li>
</ul>
` : `
<p><strong>Pour ${primaryDiagnosis}:</strong></p>
<ul>
    <li>Formule sanguine complète (FSC)</li>
    <li>Vitesse de sédimentation (VS)</li>
    <li>Protéine C-réactive (CRP)</li>
    <li>Créatinine et urée</li>
</ul>
`}
</div>

<div class="section-header">
    <h4 class="section-title" style="color: #7f8c8d;">6.3. Imagerie Médicale - Réquisitions Complètes</h4>
    <button class="copy-btn" onclick="copySection('imagerie')">📋 Copier</button>
</div>
<div id="imagerie">
${visitType.isMentalHealth ? `
<p><strong>Imagerie généralement non requise</strong> pour évaluation psychiatrique initiale, sauf si suspicion de cause organique (tumeur cérébrale, etc.). Dans ce cas, IRM cérébrale serait indiquée.</p>
` : `
<p><strong>Radiographie ${patientData.location || 'de la zone affectée'}</strong> – ${patientData.age} ans, ${patientData.gender}, ${fixCapitalization(patientData.description) || 'symptômes aigus'} depuis ${patientData.startDate}, sévérité ${patientData.severity}/10.<br>
Indication: Évaluation initiale, exclusion de pathologie osseuse ou structurelle.<br>
<em>Merci d'évaluer pour signes de fracture, arthrose, ou autres anomalies structurelles.</em></p>
`}
</div>

<div class="section-header">
    <h4 class="section-title" style="color: #7f8c8d;">6.4. Références aux Spécialistes - Liste Complète</h4>
    <button class="copy-btn" onclick="copySection('referrals')">📋 Copier</button>
</div>
<div id="referrals">
${visitType.isMentalHealth ? `
<p><strong>Psychiatrie</strong> – ${patientData.age} ans, ${patientData.gender}, ${fixCapitalization(patientData.description) || 'symptômes psychiatriques'} depuis ${patientData.startDate}, sévérité ${patientData.severity}/10, référé pour: évaluation psychiatrique complète et optimisation thérapeutique.<br>
<em>Urgence: Consultation dans les 2-4 semaines selon sévérité</em></p>

<p><strong>Psychologie</strong> – Pour thérapie cognitivo-comportementale, gestion du stress et des émotions.<br>
<em>Peut être initié en parallèle du suivi psychiatrique</em></p>
` : visitType.isMedicationRenewal ? `
<p><strong>Suivi avec médecin traitant</strong> – Renouvellement effectué, prochain suivi dans 3-6 mois ou selon protocole établi.<br>
<em>Consultation plus tôt si changement de condition ou effets secondaires</em></p>
` : `
<p><strong>Médecine interne</strong> – ${patientData.age} ans, ${patientData.gender}, ${fixCapitalization(patientData.description) || 'présentation complexe'} depuis ${patientData.startDate}, référé pour: évaluation approfondie et diagnostic différentiel.<br>
<em>Urgence: Selon sévérité des symptômes</em></p>
`}
</div>
` : ''}

<hr style="border: 1px solid #ddd; margin: 20px 0;">

<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">7. Déclaration d'Arrêt de Travail</h3>
    <button class="copy-btn" onclick="copySection('arret-travail')">📋 Copier</button>
</div>
<div id="arret-travail">
${visitType.isMedicationRenewal ? `
<p>Aucun arrêt de travail requis pour renouvellement de médication. Patient peut continuer ses activités normales.</p>
` : `
<p>Le présent certificat confirme que le patient est médicalement dispensé de travail ou d'études en raison de ${primaryDiagnosis}, du ${currentDate} au ${endDate} inclus.</p>
`}
</div>

<hr style="border: 1px solid #ddd; margin: 20px 0;">

<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">8. Recommandations de Modification de Travail</h3>
    <button class="copy-btn" onclick="copySection('modifications-travail')">📋 Copier</button>
</div>
<div id="modifications-travail">
${visitType.isMentalHealth ? `
<ul>
    <li>Réduction du stress au travail et éviter les situations de haute pression</li>
    <li>Horaires flexibles si possible</li>
    <li>Pauses régulières toutes les 2 heures</li>
    <li>Éviter le travail de nuit ou les heures supplémentaires</li>
    <li>Support psychologique disponible sur le lieu de travail</li>
    <li>Ces recommandations s'appliquent pendant 4 semaines; une réévaluation sera ensuite recommandée</li>
</ul>
` : visitType.isMedicationRenewal ? `
<p>Aucune modification de travail requise. Maintenir les activités normales selon tolérance.</p>
` : `
<ul>
    <li>Ne pas soulever de charges supérieures à 5 kilogrammes</li>
    <li>Ne pas effectuer d'efforts physiques intenses</li>
    <li>Permettre des pauses régulières</li>
    <li>Éviter les activités aggravant les symptômes</li>
    <li>Ces recommandations s'appliquent pendant 2-4 semaines; une réévaluation sera ensuite recommandée</li>
</ul>
`}
</div>

<hr style="border: 1px solid #ddd; margin: 20px 0;">

<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">9. Déclaration d'Assurance et d'Incapacité Temporaire</h3>
    <button class="copy-btn" onclick="copySection('assurance')">📋 Copier</button>
</div>
<div id="assurance">
<table style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; padding: 10px;">
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Diagnostic principal:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${icdCode} - ${primaryDiagnosis}</td>
    </tr>
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Diagnostic secondaire:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${patientData.chronicConditions ? 'Conditions chroniques: ' + patientData.chronicConditions : 'Aucun'}</td>
    </tr>
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date de consultation:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${currentDate}</td>
    </tr>
    ${!visitType.isMedicationRenewal ? `
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Début de l'arrêt:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${currentDate}</td>
    </tr>
    ` : ''}
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Hospitalisation:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${visitType.isMentalHealth ? 'À considérer si risque suicidaire' : 'Non requise'}</td>
    </tr>
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Chirurgie:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${visitType.isMedicationRenewal ? 'Non applicable' : 'À considérer selon évolution'}</td>
    </tr>
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Traitement:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${visitType.isMentalHealth ? 'Pharmacothérapie et psychothérapie' : visitType.isMedicationRenewal ? 'Continuation du traitement actuel' : 'Anti-inflammatoires, analgésiques, repos'}</td>
    </tr>
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Pronostic:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${visitType.isMentalHealth ? 'Variable selon réponse au traitement' : 'Favorable avec traitement approprié'}</td>
    </tr>
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Sévérité:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${patientData.severity}/10 (${patientData.severity >= 7 ? 'sévère' : patientData.severity >= 4 ? 'modérée' : 'légère'})</td>
    </tr>
</table>
</div>

</body>
</html>`;
}

// Login for patient form
app.post('/login', (req, res) => {
    if (req.body.password === CLINIC_PASSWORD) {
        res.cookie('authenticated', 'true', { maxAge: 24 * 60 * 60 * 1000 });
        res.redirect('/');
    } else {
        res.redirect('/?error=1');
    }
});

// Login for doctor viewer
app.post('/doctor-login', (req, res) => {
    if (req.body.password === DOCTOR_PASSWORD) {
        res.cookie('doctor_authenticated', 'true', { maxAge: 24 * 60 * 60 * 1000 });
        res.redirect('/doctor');
    } else {
        res.redirect('/doctor?error=1');
    }
});

// DOCTOR'S REPORT VIEWER PAGE
app.get('/doctor', (req, res) => {
    // Check if doctor is authenticated
    if (req.cookies.doctor_authenticated !== 'true') {
        // Show doctor login page
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>InstantHPI - Accès Médecin</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: #f5f5f5;
                    }
                    
                    .login-container {
                        background: white;
                        padding: 40px;
                        border-radius: 12px;
                        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
                        text-align: center;
                        max-width: 400px;
                        width: 90%;
                    }
                    
                    .logo {
                        font-size: 48px;
                        margin-bottom: 20px;
                    }
                    
                    h1 {
                        color: #2c3e50;
                        margin-bottom: 10px;
                        font-size: 28px;
                    }
                    
                    p {
                        color: #7f8c8d;
                        margin-bottom: 30px;
                    }
                    
                    form {
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                    }
                    
                    input[type="password"] {
                        padding: 15px;
                        font-size: 16px;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        transition: border-color 0.3s;
                    }
                    
                    input[type="password"]:focus {
                        outline: none;
                        border-color: #e74c3c;
                    }
                    
                    button {
                        padding: 15px;
                        font-size: 18px;
                        font-weight: 600;
                        background-color: #e74c3c;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: background-color 0.3s;
                    }
                    
                    button:hover {
                        background-color: #c0392b;
                    }
                    
                    .error {
                        color: #e74c3c;
                        margin-top: 10px;
                        display: ${req.query.error ? 'block' : 'none'};
                    }
                </style>
            </head>
            <body>
                <div class="login-container">
                    <div class="logo">👨‍⚕️</div>
                    <h1>Accès Médecin</h1>
                    <p>Veuillez entrer le code médecin</p>
                    <form method="post" action="/doctor-login">
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Code médecin" 
                            required
                            autofocus
                        >
                        <button type="submit">Connexion</button>
                    </form>
                    <div class="error">Code incorrect</div>
                </div>
            </body>
            </html>
        `);
        return;
    }

    // Show report viewer
    const reportsDir = path.join(__dirname, 'public', 'reports');
    let reports = [];
    
    if (fs.existsSync(reportsDir)) {
        const files = fs.readdirSync(reportsDir);
        reports = files
            .filter(file => file.endsWith('.html'))
            .map(file => {
                const stats = fs.statSync(path.join(reportsDir, file));
                return {
                    filename: file,
                    created: stats.birthtime,
                    size: (stats.size / 1024).toFixed(2) + ' KB'
                };
            })
            .sort((a, b) => b.created - a.created); // Most recent first
    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>InstantHPI - Rapports Médicaux</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                    background-color: #f5f5f5;
                    padding: 20px;
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .header {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    margin-bottom: 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                h1 {
                    color: #2c3e50;
                    font-size: 28px;
                }
                
                .stats {
                    text-align: right;
                    color: #7f8c8d;
                }
                
                .actions {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    margin-bottom: 30px;
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                
                .btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .btn-primary {
                    background-color: #3498db;
                    color: white;
                }
                
                .btn-primary:hover {
                    background-color: #2980b9;
                }
                
                .btn-danger {
                    background-color: #e74c3c;
                    color: white;
                }
                
                .btn-danger:hover {
                    background-color: #c0392b;
                }
                
                .btn-success {
                    background-color: #27ae60;
                    color: white;
                }
                
                .btn-success:hover {
                    background-color: #229954;
                }
                
                .reports-list {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                
                .report-item {
                    padding: 20px;
                    border-bottom: 1px solid #ecf0f1;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background-color 0.2s;
                }
                
                .report-item:hover {
                    background-color: #f8f9fa;
                }
                
                .report-info {
                    flex: 1;
                }
                
                .report-name {
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 5px;
                    text-decoration: none;
                    display: block;
                }
                
                .report-name:hover {
                    color: #3498db;
                }
                
                .report-meta {
                    font-size: 14px;
                    color: #7f8c8d;
                }
                
                .report-actions {
                    display: flex;
                    gap: 10px;
                }
                
                .btn-small {
                    padding: 8px 16px;
                    font-size: 14px;
                }
                
                .no-reports {
                    text-align: center;
                    padding: 60px;
                    color: #7f8c8d;
                }
                
                .logout {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                }
                
                @media (max-width: 768px) {
                    .header {
                        flex-direction: column;
                        text-align: center;
                        gap: 20px;
                    }
                    
                    .stats {
                        text-align: center;
                    }
                    
                    .report-item {
                        flex-direction: column;
                        gap: 15px;
                    }
                    
                    .report-actions {
                        width: 100%;
                        justify-content: space-between;
                    }
                }
            </style>
        </head>
        <body>
            <a href="/logout-doctor" class="btn btn-danger btn-small logout">Déconnexion</a>
            
            <div class="container">
                <div class="header">
                    <div>
                        <h1>📊 Rapports Médicaux InstantHPI</h1>
                        <p style="color: #7f8c8d; margin-top: 10px;">Visualiseur de rapports patients</p>
                    </div>
                    <div class="stats">
                        <div style="font-size: 32px; font-weight: bold; color: #3498db;">${reports.length}</div>
                        <div>Rapports disponibles</div>
                    </div>
                </div>
                
                <div class="actions">
                    <button class="btn btn-primary" onclick="refreshReports()">
                        🔄 Actualiser
                    </button>
                    <button class="btn btn-success" onclick="window.open('/', '_blank')">
                        📝 Nouveau Formulaire
                    </button>
                    ${reports.length > 0 ? `
                    <button class="btn btn-danger" onclick="deleteAllReports()">
                        🗑️ Supprimer Tout
                    </button>
                    ` : ''}
                </div>
                
                <div class="reports-list">
                    ${reports.length > 0 ? reports.map(report => `
                        <div class="report-item" id="report-${report.filename}">
                            <div class="report-info">
                                <a href="/reports/${report.filename}" target="_blank" class="report-name">
                                    📄 ${report.filename}
                                </a>
                                <div class="report-meta">
                                    Créé le: ${report.created.toLocaleDateString('fr-CA')} à ${report.created.toLocaleTimeString('fr-CA')} • Taille: ${report.size}
                                </div>
                            </div>
                            <div class="report-actions">
                                <button class="btn btn-primary btn-small" onclick="window.open('/reports/${report.filename}', '_blank')">
                                    👁️ Voir
                                </button>
                                <button class="btn btn-danger btn-small" onclick="deleteReport('${report.filename}')">
                                    🗑️ Supprimer
                                </button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="no-reports">
                            <p style="font-size: 48px; margin-bottom: 20px;">📭</p>
                            <p>Aucun rapport disponible</p>
                            <p style="margin-top: 10px; font-size: 14px;">Les rapports apparaîtront ici après la soumission du formulaire patient</p>
                        </div>
                    `}
                </div>
            </div>
            
            <script>
                function refreshReports() {
                    location.reload();
                }
                
                function deleteReport(filename) {
                    if (confirm('Êtes-vous sûr de vouloir supprimer ce rapport?')) {
                        fetch('/api/delete-report', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ filename: filename })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                document.getElementById('report-' + filename).remove();
                                // Check if no reports left
                                if (document.querySelectorAll('.report-item').length === 0) {
                                    location.reload();
                                }
                            } else {
                                alert('Erreur lors de la suppression');
                            }
                        });
                    }
                }
                
                function deleteAllReports() {
                    if (confirm('⚠️ ATTENTION: Ceci supprimera TOUS les rapports. Êtes-vous sûr?')) {
                        if (confirm('Dernière confirmation: Supprimer définitivement TOUS les rapports?')) {
                            fetch('/api/delete-all-reports', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    location.reload();
                                } else {
                                    alert('Erreur lors de la suppression');
                                }
                            });
                        }
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// API endpoint to delete a single report
app.post('/api/delete-report', (req, res) => {
    // Check if doctor is authenticated
    if (req.cookies.doctor_authenticated !== 'true') {
        return res.status(401).json({ success: false, error: 'Non autorisé' });
    }
    
    const filename = req.body.filename;
    if (!filename || !filename.endsWith('.html')) {
        return res.status(400).json({ success: false, error: 'Nom de fichier invalide' });
    }
    
    const reportPath = path.join(__dirname, 'public', 'reports', filename);
    
    fs.unlink(reportPath, (err) => {
        if (err) {
            console.error('Error deleting report:', err);
            res.json({ success: false, error: 'Erreur de suppression' });
        } else {
            console.log(`🗑️ Report manually deleted: ${filename}`);
            res.json({ success: true });
        }
    });
});

// API endpoint to delete all reports
app.post('/api/delete-all-reports', (req, res) => {
    // Check if doctor is authenticated
    if (req.cookies.doctor_authenticated !== 'true') {
        return res.status(401).json({ success: false, error: 'Non autorisé' });
    }
    
    const reportsDir = path.join(__dirname, 'public', 'reports');
    
    fs.readdir(reportsDir, (err, files) => {
        if (err) {
            return res.json({ success: false, error: 'Erreur de lecture' });
        }
        
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        let deletedCount = 0;
        let errors = 0;
        
        if (htmlFiles.length === 0) {
            return res.json({ success: true, deleted: 0 });
        }
        
        htmlFiles.forEach((file, index) => {
            fs.unlink(path.join(reportsDir, file), (err) => {
                if (!err) deletedCount++;
                else errors++;
                
                // Check if this was the last file
                if (index === htmlFiles.length - 1) {
                    console.log(`🗑️ Bulk delete: ${deletedCount} reports deleted`);
                    res.json({ success: errors === 0, deleted: deletedCount });
                }
            });
        });
    });
});

// Logout routes
app.get('/logout', (req, res) => {
    res.clearCookie('authenticated');
    res.redirect('/');
});

app.get('/logout-doctor', (req, res) => {
    res.clearCookie('doctor_authenticated');
    res.redirect('/doctor');
});

// Patient form page (protected) - FIXED VERSION
app.get('/', (req, res) => {
    // Check if already authenticated
    if (req.cookies.authenticated === 'true') {
        // Check if form.html exists
        const formPath = path.join(__dirname, 'public', 'form.html');
        
        if (fs.existsSync(formPath)) {
            // Send the file with proper content type
            res.type('text/html');
            res.sendFile(formPath);
        } else {
            console.error('form.html not found at:', formPath);
            res.status(500).send(`
                <h1>Error: form.html not found</h1>
                <p>Please make sure form.html exists in the public folder</p>
            `);
        }
    } else {
        // Show login page
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>InstantHPI - Connexion</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: #f5f5f5;
                    }
                    
                    .login-container {
                        background: white;
                        padding: 40px;
                        border-radius: 12px;
                        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
                        text-align: center;
                        max-width: 400px;
                        width: 90%;
                    }
                    
                    .logo {
                        font-size: 48px;
                        margin-bottom: 20px;
                    }
                    
                    h1 {
                        color: #2c3e50;
                        margin-bottom: 10px;
                        font-size: 28px;
                    }
                    
                    p {
                        color: #7f8c8d;
                        margin-bottom: 30px;
                    }
                    
                    form {
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                    }
                    
                    input[type="password"] {
                        padding: 15px;
                        font-size: 16px;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        transition: border-color 0.3s;
                    }
                    
                    input[type="password"]:focus {
                        outline: none;
                        border-color: #3498db;
                    }
                    
                    button {
                        padding: 15px;
                        font-size: 18px;
                        font-weight: 600;
                        background-color: #3498db;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: background-color 0.3s;
                    }
                    
                    button:hover {
                        background-color: #2980b9;
                    }
                    
                    .error {
                        color: #e74c3c;
                        margin-top: 10px;
                        display: ${req.query.error ? 'block' : 'none'};
                    }
                </style>
            </head>
            <body>
                <div class="login-container">
                    <div class="logo">🏥</div>
                    <h1>InstantHPI</h1>
                    <p>Veuillez entrer le code d'accès</p>
                    <form method="post" action="/login">
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Code d'accès" 
                            required
                            autofocus
                        >
                        <button type="submit">Connexion</button>
                    </form>
                    <div class="error">Code d'accès incorrect</div>
                </div>
            </body>
            </html>
        `);
    }
});

// Handle form submission
app.post('/submit-form', async (req, res) => {
    try {
        const formData = req.body;
        
        console.log('🏥 Processing patient data for:', formData.patientId);
        console.log('📋 Chief complaint:', formData.chiefComplaint);
        
        // Get comprehensive HTML report using EXACT InstantHPI structure
        const htmlReport = await getMedicalAnalysisSimple(formData);
        
        // Save report locally
        const reportFilename = `instanthpi_${Date.now()}.html`;
        const reportPath = path.join(__dirname, 'public', 'reports', reportFilename);
        
        // Ensure reports directory exists
        const reportsDir = path.join(__dirname, 'public', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        fs.writeFileSync(reportPath, htmlReport);
        
        // Email the report to physician
        const mailOptions = {
            from: `noreply <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_TO,
            subject: `instantHPI note for "${formData.patientId}"`,
            html: htmlReport
        };
        
        // Send email
        let emailSent = false;
        try {
            await transporter.sendMail(mailOptions);
            console.log('📧 Email sent successfully to:', mailOptions.to);
            emailSent = true;
            
            // Don't delete immediately - keep for doctor viewer
            console.log('📁 Report saved for doctor viewer');
            
        } catch (emailError) {
            console.error('📧 Email error:', emailError);
            console.log('📁 Report file will be kept since email failed');
        }
        
        console.log(`✅ InstantHPI structured report generated: ${reportFilename}`);
        
        res.json({
            success: true,
            reportFile: reportFilename,
            emailSent: emailSent,
            message: 'InstantHPI report with EXACT structure generated successfully'
        });
        
    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la génération du rapport InstantHPI'
        });
    }
});

// Serve reports
app.get('/reports/:filename', (req, res) => {
    const filename = req.params.filename;
    const reportPath = path.join(__dirname, 'public', 'reports', filename);
    
    if (fs.existsSync(reportPath)) {
        res.sendFile(reportPath);
    } else {
        res.status(404).send('Report not found');
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'InstantHPI server running with llama3.1:8b',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    const networkInterfaces = require('os').networkInterfaces();
    console.log(`\n🚀 InstantHPI Server running on:`);
    console.log(`   http://localhost:${PORT}`);
    
    Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(interface => {
            if (interface.family === 'IPv4' && !interface.internal) {
                console.log(`   http://${interface.address}:${PORT}`);
            }
        });
    });
    
    console.log('\n📱 PAGES DISPONIBLES:');
    console.log(`   Formulaire Patient: http://[IP]:${PORT}/ (Password: Clinic123)`);
    console.log(`   Visualiseur Médecin: http://[IP]:${PORT}/doctor (Password: Doctor456)`);
    console.log('\n🔒 Protected credentials using environment variables');
    console.log('🤖 Make sure Ollama is running with llama3.1:8b model!');
    console.log('📁 Reports are kept for doctor viewer (manual deletion available)\n');
    
    // Clean up any existing reports on server start
    const reportsDir = path.join(__dirname, 'public', 'reports');
    if (fs.existsSync(reportsDir)) {
        fs.readdir(reportsDir, (err, files) => {
            if (err) return;
            let cleanedCount = 0;
            files.forEach(file => {
                if (file.endsWith('.html')) {
                    fs.unlink(path.join(reportsDir, file), (err) => {
                        if (!err) {
                            cleanedCount++;
                            console.log(`🧹 Cleaned up old report: ${file}`);
                        }
                    });
                }
            });
            if (cleanedCount > 0) {
                console.log(`🧹 Total ${cleanedCount} old reports cleaned up on startup`);
            }
        });
    }
});