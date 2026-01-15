export const USER_MEDICAL_TEMPLATES = [
    {
        id: 'soap-gastro',
        name: 'SOAP: Gastro-enteritis',
        content: `Femme de 27 ans ayant présenté un épisode aigu de vomissements (5 à 6 épisodes) et de diarrhée survenu le 14 octobre 2025 après ingestion d’un poke bowl. Symptômes résolus vers 13 h, avec persistance d’une faiblesse et d’un inconfort sus-pubien modéré (6/10). Aucun sang dans les selles, pas de fièvre, pas de frissons, pas de déshydratation significative. Aucun antécédent gastro-intestinal ni médication récente.
Impression clinique: gastro-entérite alimentaire aiguë autolimitée, probablement liée à une intoxication alimentaire bénigne.
Plan: repos à domicile, hydratation orale fractionnée (eau, bouillon, solution d’électrolytes), reprise graduelle de l’alimentation (riz, banane, compote, rôties sèches, puis protéines légères et légumes cuits après 24 h sans vomissement). Éviter aliments gras, épicés, produits laitiers, café et alcool pendant 72 h. Offrir arrêt de travail de 2 jours pour récupération complète. Aucun examen complémentaire ni traitement médicamenteux requis. Recommander suivi via Spruce dans 2 à 3 jours ou plus tôt si fièvre, sang dans les selles, vomissements persistants ou signes de déshydratation.`
    },
    {
        id: 'soap-cough',
        name: 'SOAP: Chronic Cough',
        content: `S: Homme de 24 ans consultant pour une toux productive persistante depuis le 20 juillet 2025. Expectorations claires à blanches, adhérentes dans la gorge, soulagées temporairement par l’eau et l’expectoration. Aucun symptôme systémique associé. N’a pas tenté de traitement pharmacologique. Pas de fièvre, dyspnée, douleur thoracique, exposition connue, antécédent d’asthme, allergies ou RGO. Symptômes constants, non aggravés la nuit ou en position couchée. État général bon.
A: Toux chronique probablement post-infectieuse avec hypersécrétion bronchique. Composante bactérienne persistante possible.
P: Azithromycine (Z-Pak) x 5 jours et Ventolin PRN. Prescription à faxer à sa pharmacie dès que l’information sera transmise. Suivi recommandé via messagerie dans 7 jours. Si amélioration <70 %, envisager CXR.`
    },
    {
        id: 'soap-uti',
        name: 'SOAP: Recurrent UTI',
        content: `S: Femme de 53 ans connue pour cystites récidivantes, consulte pour symptômes typiques débutés le 26 septembre : dysurie intense, pollakiurie sévère persistante malgré vidange vésicale, sensation de brûlure, inconfort sus-pubien. ATCD de cystite il y a 2 semaines traitée avec un autre antibactérien (non précisé, mais inefficace selon patiente), puis rémission complète pendant 10 jours. Efficacité antérieure documentée avec ciprofloxacine.
A: Cystite récidivante probable, réponse partielle ou échec au traitement initial. Rechute précoce avec symptômes classiques.
P: Ciprofloxacine 500 mg BID x 5 jours faxée à sa pharmacie. Recommandé de faire une culture urinaire avant début du traitement si possible. Surveillance des symptômes et réévaluation PRN.`
    },
    {
        id: 'patient-msg-gastro',
        name: 'Message: Gastro Instructions',
        content: `Votre épisode correspond à une gastro-entérite alimentaire aiguë probablement liée au repas pris plus tôt aujourd’hui. Les vomissements et la diarrhée sont maintenant terminés, ce qui est un bon signe. L’objectif principal pour les prochaines 48 heures est de bien vous réhydrater afin d’éviter la fatigue et les étourdissements; buvez de petites gorgées d’eau régulièrement ainsi que des liquides riches en électrolytes ou du bouillon de poulet, selon votre tolérance. Dès que l’estomac le permet, reprenez doucement l’alimentation avec des aliments faciles à digérer comme riz, bananes, compote, rôties sèches, puis progressivement du poulet ou des légumes cuits. Évitez pendant 72 heures les produits laitiers, les aliments gras ou épicés, l’alcool et le café. Vous pouvez me réécrire dans Spruce d’ici deux à trois jours pour me dire comment vous vous sentez. Si vous souhaitez un congé de travail de deux jours pour vous permettre de bien récupérer, je peux vous le préparer. Consultez rapidement si la fièvre, le sang dans les selles ou les vomissements réapparaissent, ou si la douleur abdominale s’intensifie.`
    },
    {
        id: 'discussion-pyelo',
        name: 'Discussion: Pyelonephritis in Elderly',
        content: `Here is the evidence-based approach for treating acute pyelonephritis in a patient who is over 60 years old, on corticosteroids, and has renal disease — exactly the population where fluoroquinolones should be avoided due to high risk of tendon rupture and aortic dissection.

✅ 1. FIRST-LINE (When fluoroquinolones are contraindicated)
Ceftriaxone IM/IV + oral step-down therapy. This is the safest and most effective strategy.
Initial dose: Ceftriaxone 1 g IM or IV x 1 dose (no renal adjustment needed).
Then switch to oral therapy once stable: Cefixime 400 mg PO daily x 7–10 days (Renal adjust if CrCl < 60) OR Cefpodoxime 200 mg PO BID x 7–10 days.

❌ 3. WHAT TO AVOID
Fluoroquinolones (Cipro/Levo/Norflox). High risk of tendon rupture and aortic aneurysm, especially in age > 60 + steroids.`
    },
    {
        id: 'req-imaging',
        name: 'Requisition: Abdominal Ultrasound',
        content: `Échographie abdominale complète – Femme de 25 ans présentant des douleurs abdominales post-prandiales déclenchées par les aliments gras depuis 6 mois, avec progression de la fréquence des épisodes, nausées associées, intensité 7/10.
Indication: Recherche de lithiase vésiculaire, évaluation de l'épaisseur de la paroi vésiculaire, recherche de signes de cholécystite chronique, évaluation du parenchyme hépatique et des voies biliaires intra et extra-hépatiques, évaluation du pancréas.
Urgent - dans les 48-72 heures`
    }
];
