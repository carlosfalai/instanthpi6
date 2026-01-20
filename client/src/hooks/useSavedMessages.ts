import { useState, useEffect, useCallback, useMemo } from "react";

export interface SavedMessage {
  id: string;
  title: string;
  content: string;
  shortcut?: string;
  category: "greeting" | "appointment" | "followup" | "payment" | "general" | "ai_prompt" | "codes";
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "instanthpi_saved_messages";
const VERSION_KEY = "instanthpi_saved_messages_version";
const CURRENT_VERSION = "3.0"; // Increment to force reset to new defaults (added usageCount)

// Default saved messages from Stream Deck profile
const DEFAULT_MESSAGES: SavedMessage[] = [
  // === PATIENT COMMUNICATION ===
  {
    id: "1",
    title: "Bonjour",
    content: `Bonjour je suis le Dr Font du Centre Médical Font, votre demande de rendez-vous m'a été assignée: Veuillez accepter l'invitation qui vous a été envoyée par email.

Sinon, inscrivez-vous directement via le lien suivant : https://spruce.care/centremdicalfont

Si vous n'avez pas de cellulaire, vous pouvez utiliser votre ordinateur et vous communiquer en allant à ce même site web par votre navigateur internet.

Il n'y a aucun frais pour annuler, si vous voulez annuler le rendez-vous dites-moi le par ici: Annuler.`,
    shortcut: ".bonjour",
    category: "greeting",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "dossier",
    content: "Merci, je revise votre dossier, un moment svp.",
    shortcut: ".dossier",
    category: "greeting",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Pharm?",
    content: "J'aurai besoin que vous me donniez l'adresse ou le numéro de téléphone d'une pharmacie où je pourrai envoyer votre prescription. La pharmacie devrait la recevoir dans les 15 minutes suivant son envoi par fax.",
    shortcut: ".pharm",
    category: "appointment",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "fAXED",
    content: "Votre prescription a été transmise à votre pharmacie. Je vous recommande de vérifier auprès d'eux qu'elle est prête avant de vous y rendre.",
    shortcut: ".faxed",
    category: "appointment",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    title: "f/u 7d fr",
    content: `Étant donné que vous recevez un traitement et que vous avez des symptômes, veuillez garder un suivi avec moi ici dans 5 à 7 jours. Ne prenez pas de rendez-vous, écrivez-moi simplement ici.`,
    shortcut: ".fu7d",
    category: "followup",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    title: "Radio/Echo",
    content: "La requête pour votre étude d'image est jointe en format PDF. Veuillez l'imprimer et l'apporter au service de radiologie de votre choix (hôpital ou clinique d'imagerie) dans votre région. Une fois les résultats disponibles, je les consulterai et vous recontacterai ici pour le suivi. Cependant écrivez-moi 2-3 jours suite à avoir fait le test pour que je puisse vérifier directement dans votre dossier santé Québec voir s'il y a eu une publication de rapport par le radiologiste consulté.",
    shortcut: ".radio",
    category: "followup",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "7",
    title: "Truck Stop",
    content: `🛻💨 ➕ 🤧🤒😩 ➡️ 📲👨‍⚕️📝💊 ➡️ 😌💪🛣️🌟
Truck Stop Santé à votre service. 🫡🚚

Merci de partager votre expérience avec notre clinique : cela aide et encourage d'autres personnes à mieux comprendre comment fonctionnent nos services. Nous utilisons des technologies avancées pour offrir un suivi efficace et sécuritaire. Votre témoignage contribue à faire connaître le système de santé et à guider d'autres patients. Vous pouvez laisser votre avis ici : https://g.page/r/CS7XOfBDzFhoEAI/review

Gardez-nous en tête pour vos consultations urgences mineures ponctuelles, on est asynchrone.`,
    shortcut: ".truck",
    category: "general",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8",
    title: "that's all folks",
    content: "🌅 ☀️ 🚶‍♂️ 😄 💪 ⬅️💤 😴🛏️❤️ 😌 ✨ 🏠 🚶‍♂️😊 ⬅️ 👋👨‍⚕️ 🏥",
    shortcut: ".bye",
    category: "general",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // === AI PROMPTS ===
  {
    id: "9",
    title: "no dashes",
    content: "rewrite the whole message without dashes",
    shortcut: ".nodash",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10",
    title: "short soap",
    content: "i need a 1 paragraph spartan, no wrApping no soap note identificaiton like SAOP, just the paragraph resuming the updated case. since this is af ollow up i do not want full recap like putting their name age or gender, we already know this and its been documented in the last note. this is meant to give an update on giving the new things dicsussed on the date of today or the last conversation.never talk about messagerie.",
    shortcut: ".shortsoap",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "11",
    title: "paragraph",
    content: `messages to patients are single paragraphs spartan, with casual/professional tone, make it sound human and should ressemble this example "Je vais vous préparer une requête pour effectuer un bilan urinaire et vaginal au CLSC, étant donné vos symptômes de douleur post-mictionnelle, inconfort vaginal et sensation de pression depuis la pose du stérilet. Ce bilan inclut une analyse d'urine, une culture, un dépistage des infections vaginales (bactéries, levures, trichomonas) ainsi que les tests pour chlamydia et gonorrhée. Il faudra l'imprimer et l'apporter au CLSC, de préférence en évitant d'uriner 2 heures avant le prélèvement. Si les symptômes persistent après le retrait du stérilet prévu lundi, on pourra réévaluer à ce moment-là.   no dashes or wrapping`,
    shortcut: ".para",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "12",
    title: "labs",
    content: `when youg ive out labs give them like this (no explanation in parenthesis as to what they are, 1 per line,  no bullets or wrapping):
example:

FSC
CRP
ESR
HLA-B27
Uric acid
TSH
Free T4
Creatinine`,
    shortcut: ".labs",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "13",
    title: "pt plan",
    content: `medical explanation for the patient using this template: 	•	A single concise paragraph, written in a spartan, natural, professional tone (no headers like "S/A/P").
	•	It should explain briefly what the problem likely is (in simple terms).
	•	Then describe the prescribed medications, including how each one works and why it helps.
	•	Finish by giving clear, practical instructions (e.g., what to avoid, when to follow up).

example: Parfait merci pour le numéro, je vais transmettre la prescription à votre pharmacie. Je vous prescris le Dymista à utiliser 1 vaporisation dans chaque narine deux fois par jour pendant 7 jours, pour dégager les sinus et permettre à la trompe d'Eustache de se rouvrir, ainsi que le Gelomyrtol forte, une capsule trois fois par jour pendant 5 jours. Le Gelomyrtol est un médicament à base d'huiles essentielles naturelles (eucalyptus, citron, myrte et orange douce) qui fluidifie le mucus, améliore le drainage des sinus et aide à dégager la trompe d'Eustache. Ces deux traitements combinés devraient accélérer le retour à la normale. Évitez les manœuvres de Valsalva (se pincer le nez pour souffler), les environnements secs ou enfumés, et dormez avec la tête légèrement surélevée. Suivi ici dans 5 jours. *(never use dashes wrapping or things that make it look like machine wrote it)`,
    shortcut: ".ptplan",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "14",
    title: "soap",
    content: `tempaltes do not contain wraps so dont wrap, follow it to the letter: for the case we have just discussed and #7, give following the follwoing templates: S: Homme de 24 ans consultant pour une toux productive persistante depuis le 20 juillet 2025. Expectorations claires à blanches, adhérentes dans la gorge, soulagées temporairement par l'eau et l'expectoration. Aucun symptôme systémique associé. N'a pas tenté de traitement pharmacologique. Pas de fièvre, dyspnée, douleur thoracique, exposition connue, antécédent d'asthme, allergies ou RGO. Symptômes constants, non aggravés la nuit ou en position couchée. État général bon.
A: Toux chronique probablement post-infectieuse avec hypersécrétion bronchique. Composante bactérienne persistante possible.
P: Azithromycine (Z-Pak) x 5 jours et Ventolin PRN. Prescription à faxer à sa pharmacie dès que l'information sera transmise. Suivi recommandé via messagerie dans 7 jours. Si amélioration <70 %, envisager CXR. no dashes or wrappiong, never talk abotu messagerie.`,
    shortcut: ".soap",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "15",
    title: "meds",
    content: `prepare the prescriptions i said i would give him for this case in this template prdonnances, actually look at the case the azithromycin ventolin gelomyrtol Are NOT theyre the template for you to follow, preapre using thir template the meds above in the discussion:

	1.	Azithromycine (Z-Pak)
500 mg PO jour 1, puis 250 mg PO DIE jours 2 à 5
Quantité: 6 comprimés
Renouvellements: 0
	2.	Gelomyrtol forte 300 mg
1 capsule PO TID x 5 jours
Quantité: 15 capsules
Renouvellements: 0
	3.	Ventolin (Salbutamol) 100 mcg inhalateur-doseur
2 inhalations PO q4-6h PRN toux ou oppression
Quantité: 1 inhalateur (200 doses)
Renouvellements: 0

IMPORTANT CONTEXT CONTROL
The case we are working on is the last patient discussed immediately before this message.
Any SOAP / S-A-P / prescription templates I provide below are FORMAT EXAMPLES ONLY.

DO NOT reuse the demographics, diagnosis, or treatment from the example.
DO NOT mix cases.
DO NOT summarize or restate the example case.

Your task is to:

Apply the example template structure

Populate it only with data from the current case we just discussed

Respect all formatting rules previously stated (no dashes, no wrapping, no extra text, no "messagerie" mentions, etc.)

If there is any ambiguity, default to the most recently discussed patient and treatment plan, not the example.`,
    shortcut: ".meds",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "16",
    title: "Imaging study",
    content: `Give me imaging study using this template:

Échographie abdominale complète:  Recherche de lithiase vésiculaire, évaluation de l'épaisseur de la paroi vésiculaire, recherche de signes de cholécystite chronique, évaluation du parenchyme hépatique et des voies biliaires intra et extra-hépatiques, évaluation du pancréas.

Femme de 25 ans présentant des douleurs abdominales post-prandiales déclenchées par les aliments gras depuis 6 mois, avec progression de la fréquence des épisodes, nausées associées, intensité 7/10.

Urgent - dans les 48-72 heures

XXXX

Cholangio-IRM: Si échographie non concluante, évaluation détaillée de l'arbre biliaire, recherche de microlithiase, évaluation du sphincter d'Oddi, exclusion de variants anatomiques ou de pathologie canalaire.

Femme de 25 ans avec suspicion de pathologie biliaire, douleurs abdominales récurrentes post-prandiales depuis 6 mois, progression symptomatique.

Semi-urgent - dans les 2 semaines si échographie négative

XXX

Radiographie pied droit (AP, latérale, oblique) et cheville droite (AP, latérale): Exclure fracture ou entorse significative du pied ou de la cheville suite à un traumatisme en torsion, évaluer l'intégrité osseuse et rechercher un œdème des parties molles.

Homme de 48 ans ayant subi une torsion du pied droit le 7 novembre 2025 avec douleur localisée d'intensité 7/10, paresthésies, difficulté à marcher, sans ecchymose ni déformation apparente.

Urgent – dans les 48-72 heures.`,
    shortcut: ".imaging",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "17",
    title: "Work leave",
    content: `make me work leave using this template

Arrêt de travail médical du 14/10/2025 au 16/10/2025 inclus pour gastro-entérite aiguë nécessitant repos et hydratation à domicile. Reprise du travail prévue le 17/10/2025 sous réserve d'amélioration clinique.`,
    shortcut: ".workleave",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "18",
    title: "referral",
    content: `using these referral template and follow their structure to the letter "Chirurgie générale: Merci d'évaluer cette patiente pour cholécystectomie laparoscopique élective. Bilan préopératoire et imagerie en cours. (do note i work telmedicine, for all referrals requests if i say pt needs to be seen in perosn the referral should be seen by primary care a family doctor, so dont refer to specialist when its a telemedicine case that needes in person eval, unless specified by me)

Femme de 25 ans présentant des douleurs abdominales post-prandiales typiques de colique biliaire depuis 6 mois, avec progression de la fréquence des épisodes (maintenant aux 2 jours), intensité 7/10, déclenchées par les aliments gras, associées à des nausées. Traitement actuel: citalopram 30mg pour anxiété.

Semi-urgent - consultation dans les 2-4 semaines

Gastro-entérologie: Merci d'évaluer pour endoscopie digestive haute si bilan initial négatif, considérer manométrie œsophagienne si symptômes de reflux persistants, évaluation pour dysfonction du sphincter d'Oddi si imagerie normale.

Femme de 25 ans avec douleurs abdominales post-prandiales depuis 6 mois, nausées, reflux gastro-œsophagien, perte d'appétit. Suspicion de pathologie biliaire vs dyspepsie fonctionnelle. Anxiété traitée par citalopram 30mg.

Routine - consultation dans les 6-8 semaines si bilan initial négatif" preare one for the case discussed.`,
    shortcut: ".referral",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "19",
    title: "Discuss case",
    content: `Prepare discussion for this case using the following template:  in english always

Stepwise Strategy – Genital Lesions and Menstrual Irregularity Evaluation (Spartan Format)

Horizontal Timeline ascii discussion of the case giving exact dates and how many days into the disease at each iteration

Horizontal Timeline ascii discussion of the case:

Give me a timeline in ASCII of the symptoms and key events for this case. Make me a horizontal ASCII timeline of this patient's symptom evolution with emojis and dates, like the Dec 13 → Dec 24 example you made before. From start of symptoms to today.

0. What She Wants and Needs
She wants to confirm whether the small genital lesions she and her partner have are caused by HPV or another sexually transmitted infection and to receive testing for HPV and other STIs. She needs a complete STI workup with laboratory testing, since genital warts and herpes are diagnosed visually and cannot be confirmed without in-person examination. She also needs reassurance and guidance on how to proceed safely while awaiting results.

1. Symptoms
Persistent small genital lesions first noticed after sexual contact in July, associated with local burning and mild pain during friction. Lesions sometimes release clear fluid and remain relatively unchanged. Menstrual cycles are delayed and shortened to two days. No systemic symptoms such as fever or malaise.

2. Physical Red Flags
No visible photo confirmation available. Reported lesions are small, non-ulcerated, and localized externally. Partner reportedly has similar lesions, raising suspicion of HPV transmission. No systemic or pelvic pain symptoms suggesting complications.

3. Labs
Full STI panel to exclude co-infections:
FSC
VIH
Syphilis
Hépatite B
Hépatite C
Chlamydia
Gonorrhée
Herpès simplex type 1 et 2

4. Imaging
None indicated at this stage. Pelvic imaging only if persistent menstrual irregularity or pelvic pain develops.

5. Treatment
No medication prescribed until in-person assessment confirms diagnosis. Continue gentle hygiene, avoid topical irritants or over-the-counter wart products. Abstain from sexual contact until results are available. If confirmed HPV: cryotherapy or imiquimod through gynecology or dermatology. If HSV confirmed: antiviral therapy (valacyclovir).

6. Follow-Up
Repeat evaluation when results are available or sooner if new lesions appear or symptoms worsen. Recommend in-person consultation for clinical confirmation and Pap test if sexually active with genital contact.

7. Additional Recommendation
Advise partner testing and treatment if needed. Educate that both HPV and HSV can spread through skin-to-skin contact even without penetration, and protection reduces but does not eliminate transmission risk.

8: (Family Medicine): Clinical Teaching Points — Key diagnostic pearls, clinical presentation hallmarks, and important differential diagnoses
Management Approach — Evidence-based treatment strategy, critical interventions, and follow-up care
Care Improvement & Performance Metrics — Relevant KPIs (Key Performance Indicators) specific to this case, quality metrics, and institutional benchmarks for optimal care delivery
Board Review Exam Preparation — High-yield facts, commonly tested concepts, and exam-style questions related to this case`,
    shortcut: ".discuss",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "20",
    title: "reasoning",
    content: `i am here giving u a template to use in order to show me the reasoning of the above discussed case: "here is the clinical reasoning presented in an ASCII decision-flow format, similar in spirit to the timelines, but focused on diagnostic logic and exclusion, using the fact that we already have the X-ray. HAND TRAUMA WITH THUMB DYSFUNCTION
          │
          ▼
Mechanism: torsion + immediate loss of thumb function
          │
          ▼
X-ray obtained 📸
          │
          ▼
Finding: ulnar sesamoid fracture at thumb MCP
Alignment preserved
          │
          ├───────────────► Question 1: Is this ONLY a stable bone fracture?
          │                               │
          │                               ├─ X-ray answers bone position ✔
          │                               └─ X-ray does NOT assess ligaments ✘
          │
          ▼
We must rule out associated injuries ⛔
          │
          ├───────────────► 1. UCL injury or Stener lesion?
          │                    │
          │                    ├─ Sesamoid embedded in UCL complex
          │                    ├─ Persistent inability to flex thumb
          │                    └─ Missed tear → chronic instability
          │
          ├───────────────► 2. MCP joint instability?
          │                    │
          │                    ├─ Static alignment ≠ functional stability
          │                    └─ Stress exam required in person
          │
          ├───────────────► 3. Neurovascular compromise?
          │                    │
          │                    ├─ Reported coldness of entire hand
          │                    └─ Not explained by fracture alone
          │
          ▼
These cannot be excluded remotely ❌
          │
          ▼
Decision threshold crossed
          │
          ▼
In-person evaluation required 🏥
          │
          ├─ Neurovascular exam
          ├─ Ligament stability testing
          ├─ Proper immobilization decision
          └─ Prevent permanent loss of pinch and grip

Summary in one line:
The X-ray confirms what is broken, but not what could be permanently damaged — and those unanswered questions are exactly why in-person assessment is mandatory. "`,
    shortcut: ".reasoning",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "21",
    title: "EDu",
    content: `using the elemnts provided in the strategy discussion template for this case: now do Education: (Optimized for Natural Flow + Warm Final Paragraph)

Do for this case: Teaching Pearl – and quality measures [Condition or Case Title]
	1.	Rest and Protection
What happened in this case:
[Briefly summarize what the patient has been doing so far regarding rest, immobilization, or protection.]
What can be added to improve:
[Explain the ideal evidence-based adjustment to rest or protection for optimal recovery.]

	2.	Pain and Inflammation Control
What happened in this case:
[Summarize the patient's current pain management and medications.]
What can be added to improve:
[Describe the optimal regimen, non-pharmacologic measures, and what should be modified.]

	3.	Activity Restriction
What happened in this case:
[Describe the current activity level or avoidance.]
What can be added to improve:
[Clarify the appropriate level of activity, what to avoid, and when to reintroduce movements.]

	4.	Rehabilitation
What happened in this case:
[Indicate whether rehab has started, is planned, or hasn't begun.]
What can be added to improve:
[Give the ideal timing and focus of rehabilitation, and risks of inappropriate timing.]

	5.	Follow-Up and Monitoring
What happened in this case:
[Summarize current follow-up or exams.]
What can be added to improve:
[State the ideal follow-up timeline and what complications must be checked.]

	6.	Work and Return to Activity
What happened in this case:
[Describe the patient's work status and capacity.]
What can be added to improve:
[Provide specific guidance on work restrictions and timeline for full duties.]

	7.	Patient Explanation Paragraph (this paragrpah should also include reaosnable recommendations we should give all pateints in this situation THAT you hae mentioned above in what wasnt done and what was done, this advise councelling can make the differnece).
Write one single paragraph, natural, warm and professional (no bullets, no lists, no dashes).
Explain the diagnosis in simple terms, what the treatment is meant to do, what the patient should avoid or continue, and when to follow up.
This paragraph must flow like normal conversation.
Use this example as style reference:
« Votre dos réagit encore comme une entorse lombaire qui n'est pas complètement consolidée, et le fait que ça allait bien tant que vous preniez vos médicaments puis que ça s'est rebloqué dès que vous les avez arrêtés confirme que l'inflammation et les spasmes ne sont pas encore partis… »
(You may adjust tone slightly depending on the case, but keep it warm, simple, and reassuring.) - make sure in the structure we begin with what i htink his is, what treatment i am proposing and how it works, if they need to consult in person and when. this paragprahp should never say i sent you in the past but rather i will send you, or je vais vous prescrire, *special attention. ALWAYS this paragrpah involves the plans discussed in the strategy which was earlier in this discussion; this is pure telemed, NEVER offer in person appointment if thye need to be seen in person tell them i will provide a referral note so they dont have to repeat everything i can also help them accomodate with 1-3 days work leave depending so that they can focus on getting that appoitnmetn stress free. this would be the priority to get them seen asap. This final paragraph is NEVER generalized answers like I'll prescribe you treatment. All prescriptions need to explain what medicaiton it is and how it works and how its taken. What side effefcts to look up to and how to minimze them. Also they are always based on the strategy discussed in the previous paragraph, so always look section 0 to 7 inclusively when you build this summary plan paragraph for the patient. never end with promises of follow up. if a patient needs to be seen in perosn, they have to arrange their own visits. when you say i will provide the note for the referral; i dont have a place to refer you so you would have to find the person urself, however the note will help in not having to explain everything to them as it will be a doctor to doctor document already oragnized for them
always put #7 aat the top of this message reply in the chat, never in a wrapped bubble and #7 should always be in the language of the patient writing`,
    shortcut: ".edu",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "22",
    title: "hpi confirmation",
    content: "prepare hpi confirmaiton summaryfor this case and 10 qs.",
    shortcut: ".hpi",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "23",
    title: "mix cases",
    content: "reread what i said, u mixed the cases up, i gave u a template, i dont needs whats in the template i wanted u to do the other patien we were talking about and presend these parts of that case folloowing the template, theyre just the user prompt example",
    shortcut: ".mixcases",
    category: "ai_prompt",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // === SHORTCUT CODES ===
  {
    id: "24",
    title: "7777",
    content: "7777",
    shortcut: ".7777",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "25",
    title: "8691",
    content: "8691",
    shortcut: ".8691",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "26",
    title: "15773#tt",
    content: "15773#tt",
    shortcut: ".15773",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "27",
    title: "15773#tt,15230:15#tt",
    content: "15773#tt,15230:15#tt",
    shortcut: ".combo",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "28",
    title: "9990:5167",
    content: "9990:5167",
    shortcut: ".9990",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "29",
    title: "cfont",
    content: "cfont",
    shortcut: ".cfont",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "30",
    title: "cff@cmf.ca",
    content: "cff@centremedicalfont.ca",
    shortcut: ".email",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "31",
    title: "ver1",
    content: ".ver1",
    shortcut: ".ver1",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "32",
    title: "srvonly",
    content: ".srvonly",
    shortcut: ".srvonly",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "33",
    title: "stdonly",
    content: ".stdonly",
    shortcut: ".stdonly",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "34",
    title: "rad",
    content: ".rad",
    shortcut: ".rad",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "35",
    title: "docs",
    content: ".docs",
    shortcut: ".docs",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "36",
    title: "doc2",
    content: ".doc2",
    shortcut: ".doc2",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "37",
    title: "Pseud1",
    content: ".Pseud1",
    shortcut: ".pseud1",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "38",
    title: "saaq1",
    content: ".saaq1",
    shortcut: ".saaq1",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "39",
    title: "clsc1",
    content: ".clsc1",
    shortcut: ".clsc1",
    category: "codes",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useSavedMessages() {
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load messages from localStorage
  useEffect(() => {
    try {
      const storedVersion = localStorage.getItem(VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);

      // Reset to defaults if version changed or no data
      if (storedVersion !== CURRENT_VERSION || !stored) {
        console.log("[useSavedMessages] Loading new defaults (version", CURRENT_VERSION, ")");
        setMessages(DEFAULT_MESSAGES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MESSAGES));
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      } else {
        setMessages(JSON.parse(stored));
      }
    } catch (e) {
      console.error("[useSavedMessages] Failed to load:", e);
      setMessages(DEFAULT_MESSAGES);
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever messages change
  const saveMessages = useCallback((newMessages: SavedMessage[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
      setMessages(newMessages);
    } catch (e) {
      console.error("[useSavedMessages] Failed to save:", e);
    }
  }, []);

  // Add a new saved message
  const addMessage = useCallback((message: Omit<SavedMessage, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newMessage: SavedMessage = {
      ...message,
      id: `msg_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    saveMessages([...messages, newMessage]);
    return newMessage;
  }, [messages, saveMessages]);

  // Update an existing message
  const updateMessage = useCallback((id: string, updates: Partial<Omit<SavedMessage, "id" | "createdAt">>) => {
    const updatedMessages = messages.map((msg) =>
      msg.id === id
        ? { ...msg, ...updates, updatedAt: new Date().toISOString() }
        : msg
    );
    saveMessages(updatedMessages);
  }, [messages, saveMessages]);

  // Delete a message
  const deleteMessage = useCallback((id: string) => {
    saveMessages(messages.filter((msg) => msg.id !== id));
  }, [messages, saveMessages]);

  // Increment usage count for a message
  const incrementUsage = useCallback((id: string) => {
    const updatedMessages = messages.map((msg) =>
      msg.id === id
        ? { ...msg, usageCount: (msg.usageCount || 0) + 1 }
        : msg
    );
    saveMessages(updatedMessages);
  }, [messages, saveMessages]);

  // Get messages sorted by usage (most used first)
  const sortedByUsage = useMemo(() => {
    return [...messages].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  }, [messages]);

  // Find message by shortcut
  const findByShortcut = useCallback((shortcut: string) => {
    return messages.find((msg) => msg.shortcut === shortcut);
  }, [messages]);

  // Get messages by category
  const getByCategory = useCallback((category: SavedMessage["category"]) => {
    return messages.filter((msg) => msg.category === category);
  }, [messages]);

  // Reset to defaults (useful if user wants to restore)
  const resetToDefaults = useCallback(() => {
    saveMessages(DEFAULT_MESSAGES);
  }, [saveMessages]);

  return {
    messages,
    sortedByUsage,
    isLoading,
    addMessage,
    updateMessage,
    deleteMessage,
    incrementUsage,
    findByShortcut,
    getByCategory,
    resetToDefaults,
  };
}
