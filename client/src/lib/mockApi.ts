// All data now comes exclusively from Spruce Health API
// This file is kept for compatibility but no longer loads any mock data
export function loadDemoData() {
  // All patient data, conversations, and medical information now comes from Spruce API
  // No mock data is loaded - system exclusively uses authentic Spruce Health data
}
    {
      patientId: 1,
      patientName: "Lily Raibaud",
      initials: "LR",
      avatarUrl: null,
      avatarColor: "#6987bf",
      lastMessage: {
        id: "1001",
        content: "mince je n'avais pas vu votre message merci !",
        timestamp: new Date(new Date().getTime() - 20 * 60000),
        isFromPatient: true,
        isRead: false
      },
      hasUnread: true,
      isActive: true
    },
    {
      patientId: 2,
      patientName: "Vanessa Bastien",
      initials: "VB",
      avatarUrl: null,
      avatarColor: "#6987bf",
      lastMessage: {
        id: "1002",
        content: "Bien reçu, merci! Devrais-je faire urine et gorge également? Ou puisque cela a été...",
        timestamp: new Date(new Date().getTime() - 45 * 60000),
        isFromPatient: true,
        isRead: false
      },
      hasUnread: true,
      isActive: true
    },
    {
      patientId: 3,
      patientName: "Isabelle D'Anjou",
      initials: "ID",
      avatarUrl: null,
      avatarColor: "#6987bf",
      lastMessage: {
        id: "1003",
        content: "Carlos Faviel Font, MD:",
        timestamp: new Date(new Date().getTime() - 55 * 60000),
        isFromPatient: false,
        isRead: true
      },
      hasUnread: false,
      isActive: true
    },
    {
      patientId: 4,
      patientName: "Nicolas Girard",
      initials: "NG",
      avatarUrl: null,
      avatarColor: "#6987bf",
      lastMessage: {
        id: "1004",
        content: "Non",
        timestamp: new Date(new Date().getTime() - 90 * 60000),
        isFromPatient: true,
        isRead: true
      },
      hasUnread: false,
      isActive: true
    },
    {
      patientId: 5,
      patientName: "Guerty César",
      initials: "GC",
      avatarUrl: null,
      avatarColor: "#6987bf",
      lastMessage: {
        id: "1005",
        content: "parfait",
        timestamp: new Date(new Date().getTime() - 150 * 60000),
        isFromPatient: true,
        isRead: true
      },
      hasUnread: false,
      isActive: true
    },
    {
      patientId: 6,
      patientName: "Emile Pavez-Buist",
      initials: "EP",
      avatarUrl: null,
      avatarColor: "#6987bf",
      lastMessage: {
        id: "1006",
        content: "Carlos Faviel Font, MD: Votre document est maintenant disponible sur votre portal patient...",
        timestamp: new Date(new Date().getTime() - 180 * 60000),
        isFromPatient: false,
        isRead: true
      },
      hasUnread: false,
      isActive: true
    }
  ];

  // Mock AI suggestions
  const mockAiSuggestion = {
    hpi: "Patient is a 34-year-old female presenting with fatigue, headaches, and dizziness that have been ongoing for approximately 2 weeks. She describes the headaches as throbbing, primarily in the frontal region, and worsening in the afternoon. The dizziness is intermittent and accompanied by some lightheadedness when standing quickly. Patient reports sleeping 5-6 hours per night and increased work stress over the past month. She has tried over-the-counter analgesics with minimal relief. No history of migraines, recent trauma, or vision changes. Last physical examination was 14 months ago with normal findings.",
    differentialDiagnosis: [
      "Tension headache secondary to stress",
      "Dehydration",
      "Fatigue due to insufficient sleep",
      "Anemia",
      "Vestibular migraine",
      "Orthostatic hypotension"
    ],
    plan: "1. Complete blood count to evaluate for anemia\n2. Basic metabolic panel to assess hydration status\n3. Review sleep hygiene practices and provide recommendations\n4. Recommend stress management techniques including meditation and regular exercise\n5. Suggest adequate hydration (2L water daily minimum)\n6. Trial of scheduled ibuprofen 400mg q8h for 3 days for headache management\n7. Follow-up in 2 weeks to review labs and symptom progression",
    followupQuestions: [
      "Have you noticed any patterns with your headaches related to food intake or specific activities?",
      "Are you experiencing any visual changes or sensitivity to light with the headaches?",
      "Have you had any recent changes to medications or started any new supplements?",
      "Can you describe your current water intake throughout the day?"
    ],
    labSuggestions: "- Complete Blood Count (CBC) with differential\n- Comprehensive Metabolic Panel (CMP)\n- Ferritin level\n- Vitamin D, 25-Hydroxy\n- Thyroid Stimulating Hormone (TSH)",
    medicationOptions: [
      {
        name: "Ibuprofen",
        dosage: "400mg",
        frequency: "Every 8 hours as needed for headache",
        notes: "Take with food to minimize GI side effects. Not to exceed 1200mg in 24 hours."
      },
      {
        name: "Meclizine",
        dosage: "25mg",
        frequency: "Once daily as needed for dizziness",
        notes: "May cause drowsiness. Avoid driving or operating machinery when taking this medication."
      }
    ],
    telemedicineComplexity: "Patient symptoms warrant consideration for in-person evaluation if no improvement with initial management plan due to the need for potential neurological examination and vitals assessment."
  };

  // Mock pending items
  const mockPendingItems = [
    {
      id: "pi-1",
      patientId: 1,
      type: "bloodwork",
      description: "CBC with differential",
      requestedDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
      priority: "medium",
      status: "pending",
      createdAt: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: "pi-2",
      patientId: 1,
      type: "imaging",
      description: "Chest X-ray",
      requestedDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
      dueDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000),
      priority: "high",
      status: "pending",
      createdAt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: "pi-3",
      patientId: 1,
      type: "referral",
      description: "Neurology consult",
      requestedDate: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
      priority: "high",
      status: "pending",
      notes: "Patient reports frequent headaches, refer to Dr. Bernard",
      createdAt: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: "pi-4",
      patientId: 1,
      type: "test",
      description: "Ferritin level",
      requestedDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000),
      priority: "low",
      status: "pending",
      createdAt: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: "pi-5",
      patientId: 1,
      type: "test",
      description: "Vitamin D level",
      requestedDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
      priority: "low",
      status: "completed",
      createdAt: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000)
    }
  ];

  // Mock preventative care items
  const mockPreventativeCare = [
    {
      id: "pc-1",
      patientId: 1,
      name: "Annual Flu Vaccine",
      description: "Seasonal influenza vaccination",
      category: "vaccine",
      relevantTo: ["all_patients"],
      messageTemplate: "It's time for your annual flu vaccine. This helps protect you and those around you from seasonal influenza. Would you like to schedule this preventative care measure?",
      suggestedDate: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
      status: "suggested",
      billingCode: "90686",
      createdAt: new Date()
    },
    {
      id: "pc-2",
      patientId: 1,
      name: "Pap Smear",
      description: "Cervical cancer screening",
      category: "screening",
      relevantTo: ["female_patients"],
      messageTemplate: "It's time for your routine cervical cancer screening (Pap smear). This important preventative measure helps detect any abnormal cells early. Would you like to schedule this procedure?",
      suggestedDate: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000),
      status: "suggested",
      billingCode: "88164",
      createdAt: new Date()
    },
    {
      id: "pc-3",
      patientId: 1,
      name: "Cholesterol Screening",
      description: "Lipid panel blood test",
      category: "screening",
      relevantTo: ["all_adults"],
      messageTemplate: "It's been over a year since your last cholesterol screening. This simple blood test helps assess your cardiovascular health. Would you like to schedule this preventative measure?",
      suggestedDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
      status: "suggested",
      billingCode: "80061",
      createdAt: new Date()
    }
  ];

  // Add the mock data to the query cache
  queryClient.setQueryData(["/api/conversations"], mockConversations);
  queryClient.setQueryData([`/api/ai/suggestions/1`], mockAiSuggestion);
  queryClient.setQueryData([`/api/patients/1/pending-items`], mockPendingItems);
  queryClient.setQueryData([`/api/patients/1/preventative-care`], mockPreventativeCare);
  
  // Add mock messages for first patient
  queryClient.setQueryData([`/api/conversations/1/messages`], [
    {
      id: '1',
      content: "Bonjour Lily, comment puis-je vous aider aujourd'hui?",
      timestamp: new Date(new Date().getTime() - 60 * 60 * 1000),
      isFromPatient: false,
      isRead: true,
      sender: 'Dr. Carlos Faviel Font'
    },
    {
      id: '2',
      content: "Bonjour Docteur, j'ai des maux de tête depuis quelques jours et je me sens fatiguée. Est-ce normal?",
      timestamp: new Date(new Date().getTime() - 55 * 60 * 1000),
      isFromPatient: true,
      isRead: true
    },
    {
      id: '3',
      content: "Je comprends votre inquiétude. Pouvez-vous me décrire la douleur? Où est-elle localisée et avez-vous d'autres symptômes comme des vertiges ou des nausées?",
      timestamp: new Date(new Date().getTime() - 50 * 60 * 1000),
      isFromPatient: false,
      isRead: true,
      sender: 'Dr. Carlos Faviel Font'
    },
    {
      id: '4',
      content: "C'est plutôt dans le front et parfois ça pulse. J'ai aussi des vertiges quand je me lève trop vite.",
      timestamp: new Date(new Date().getTime() - 45 * 60 * 1000),
      isFromPatient: true,
      isRead: true
    },
    {
      id: '5',
      content: "D'accord, merci pour ces précisions. Je vais vous prescrire quelques examens pour vérifier votre tension et votre taux de fer. En attendant, essayez de bien vous hydrater et de vous reposer suffisamment.",
      timestamp: new Date(new Date().getTime() - 40 * 60 * 1000),
      isFromPatient: false,
      isRead: true,
      sender: 'Dr. Carlos Faviel Font'
    },
    {
      id: '6',
      content: "mince je n'avais pas vu votre message merci !",
      timestamp: new Date(new Date().getTime() - 20 * 60000),
      isFromPatient: true,
      isRead: false
    }
  ]);
}