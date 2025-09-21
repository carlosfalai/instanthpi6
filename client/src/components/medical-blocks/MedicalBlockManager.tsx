import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Settings, Eye, EyeOff, Copy, Edit, Trash2 } from 'lucide-react';

// Standard medical blocks with examples
const STANDARD_BLOCKS = {
  HPI_Confirmation_Summary: {
    name: "HPI Confirmation Summary",
    description: "Patient confirmation paragraph",
    example: "Juste pour confirmer avec vous avant de continuer; vous êtes un homme de 45 ans présentant depuis ce matin une douleur thoracique aiguë, localisée côté gauche, aggravée par la respiration profonde, soulagée par le repos; Est-ce que ce résumé est exact ?",
    enabled: true
  },
  "10_FollowUpQuestions_BasedOn_3Differentials": {
    name: "10 Follow-up Questions",
    description: "Clinical questions based on differentials",
    example: "Avez-vous des douleurs thoraciques ou des difficultés respiratoires?\nAvez-vous eu de la fièvre dans les dernières 24 heures?\nVos symptômes vous réveillent-ils la nuit?\nAvez-vous voyagé récemment?\nPrenez-vous des médicaments actuellement?\nAvez-vous des antécédents de problèmes cardiaques?\nVos symptômes s'aggravent-ils avec l'effort?\nAvez-vous des nausées ou des vomissements?\nAvez-vous des sueurs froides?\nAvez-vous des palpitations?",
    enabled: true
  },
  Super_Spartan_SAP_Note: {
    name: "Super Spartan SAP Note",
    description: "Concise clinical note",
    example: "S: Homme 45 ans, douleur thoracique aiguë depuis ce matin, aggravée par inspiration profonde.\nA: Douleur thoracique d'origine à déterminer, possible origine cardiaque ou pleurale.\nP: ECG, radiographie thoracique, marqueurs cardiaques, consultation cardiologie si nécessaire.",
    enabled: true
  },
  Medications_ReadyToUse_Prescriptions: {
    name: "Ready-to-Use Prescriptions",
    description: "Complete prescription orders",
    example: "Paracétamol 1000mg, comprimé, voie orale, 3 fois par jour, 7 jours, 21 comprimés, 0 renouvellement, à prendre avec un verre d'eau.\nIbuprofène 400mg, comprimé, voie orale, 2 fois par jour, 5 jours, 10 comprimés, 0 renouvellement, à prendre avec les repas.",
    enabled: true
  },
  Lab_Works: {
    name: "Lab Works",
    description: "Laboratory investigations",
    example: "NFS\nIonogramme\nCRP\nTroponine\nD-dimères\nBilan lipidique",
    enabled: true
  },
  Imagerie_Medicale: {
    name: "Medical Imaging",
    description: "Imaging requests",
    example: "5.3. Imagerie Médicale\nRadiographie thoracique [Homme, 45 ans], [douleur thoracique aiguë depuis ce matin, aggravée par inspiration profonde, antécédents d'hypertension]\nIndication: Douleur thoracique aiguë\nDélai recommandé: Immédiat",
    enabled: true
  },
  "Reference_aux_Specialistes_Cardiologie": {
    name: "Cardiology Referral",
    description: "Specialist referral",
    example: "5.4. Références aux Spécialistes\nCardiologie [Homme, 45 ans], [douleur thoracique aiguë depuis ce matin], [hypertension], [aucun traitement en cours], référé pour: évaluation cardiaque\nDélai recommandé: Immédiat",
    enabled: true
  },
  Work_Leave_Certificate: {
    name: "Work Leave Certificate",
    description: "Medical leave documentation",
    example: "Arrêt de travail du 21/09/2025 au 24/09/2025 (72 heures)\nJustification: Douleur thoracique aiguë nécessitant investigations et repos",
    enabled: true
  },
  Workplace_Modifications: {
    name: "Workplace Modifications",
    description: "Work accommodation recommendations",
    example: "Éviter les efforts physiques importants, travail de bureau privilégié, pauses fréquentes, éviter le port de charges lourdes.",
    enabled: true
  },
  Insurance_Documentation: {
    name: "Insurance Documentation",
    description: "Insurance claim documentation",
    example: "Diagnostic: Douleur thoracique aiguë\nMécanisme: Apparition brutale\nImpact fonctionnel: Limitation des activités physiques\nTraitement: Investigations en cours\nDates d'arrêt: 21/09/2025 au 24/09/2025\nPronostic: Favorable sous réserve des résultats",
    enabled: true
  },
  Telemedicine_NeedsInPersonEvaluation: {
    name: "Telemedicine Limitations",
    description: "In-person evaluation requirements",
    example: "La téléconsultation a ses limites et ne peut remplacer un examen physique complet. Il est nécessaire de procéder à un examen clinique, mesure des signes vitaux, imagerie et bilans biologiques. Les examens neurologique, infectieux, organique, métabolique, mécanique et circulatoire nécessitent une évaluation en personne. Veuillez préparer un résumé de triage pour la consultation en présentiel.",
    enabled: true
  },
  Patient_Message: {
    name: "Patient Message",
    description: "Direct patient communication",
    example: "Bonjour, nous avons bien reçu vos informations. Votre douleur thoracique nécessite une évaluation médicale en personne. Veuillez vous présenter aux urgences ou prendre rendez-vous avec votre médecin de famille dans les plus brefs délais.",
    enabled: true
  }
};

interface CustomBlock {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userExample: string;
  enabled: boolean;
}

interface MedicalBlockManagerProps {
  patientId: string;
  onGenerateBlocks: (blocks: string[], patientId: string) => Promise<void>;
  generatedBlocks: Record<string, string>;
  isGenerating: boolean;
}

export default function MedicalBlockManager({ 
  patientId, 
  onGenerateBlocks, 
  generatedBlocks, 
  isGenerating 
}: MedicalBlockManagerProps) {
  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([]);
  const [blockSettings, setBlockSettings] = useState<Record<string, boolean>>({});
  const [showCreateBlock, setShowCreateBlock] = useState(false);
  const [newBlock, setNewBlock] = useState<Partial<CustomBlock>>({
    name: '',
    description: '',
    systemPrompt: '',
    userExample: '',
    enabled: true
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('medicalBlockSettings');
    if (savedSettings) {
      setBlockSettings(JSON.parse(savedSettings));
    } else {
      // Default all blocks enabled
      const defaultSettings: Record<string, boolean> = {};
      Object.keys(STANDARD_BLOCKS).forEach(key => {
        defaultSettings[key] = true;
      });
      setBlockSettings(defaultSettings);
    }

    const savedCustomBlocks = localStorage.getItem('customMedicalBlocks');
    if (savedCustomBlocks) {
      setCustomBlocks(JSON.parse(savedCustomBlocks));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: Record<string, boolean>) => {
    setBlockSettings(newSettings);
    localStorage.setItem('medicalBlockSettings', JSON.stringify(newSettings));
  };

  const toggleBlock = (blockId: string) => {
    const newSettings = { ...blockSettings, [blockId]: !blockSettings[blockId] };
    saveSettings(newSettings);
  };

  const createCustomBlock = () => {
    if (!newBlock.name || !newBlock.description || !newBlock.systemPrompt || !newBlock.userExample) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const block: CustomBlock = {
      id: `custom_${Date.now()}`,
      name: newBlock.name!,
      description: newBlock.description!,
      systemPrompt: newBlock.systemPrompt!,
      userExample: newBlock.userExample!,
      enabled: newBlock.enabled ?? true
    };

    const updatedBlocks = [...customBlocks, block];
    setCustomBlocks(updatedBlocks);
    localStorage.setItem('customMedicalBlocks', JSON.stringify(updatedBlocks));

    // Add to block settings
    const newSettings = { ...blockSettings, [block.id]: block.enabled };
    saveSettings(newSettings);

    setNewBlock({
      name: '',
      description: '',
      systemPrompt: '',
      userExample: '',
      enabled: true
    });
    setShowCreateBlock(false);
  };

  const deleteCustomBlock = (blockId: string) => {
    const updatedBlocks = customBlocks.filter(block => block.id !== blockId);
    setCustomBlocks(updatedBlocks);
    localStorage.setItem('customMedicalBlocks', JSON.stringify(updatedBlocks));

    // Remove from block settings
    const newSettings = { ...blockSettings };
    delete newSettings[blockId];
    saveSettings(newSettings);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generateAllBlocks = async () => {
    const enabledBlocks = Object.entries(blockSettings)
      .filter(([_, enabled]) => enabled)
      .map(([blockId, _]) => blockId);
    
    await onGenerateBlocks(enabledBlocks, patientId);
  };

  return (
    <div className="space-y-6">
      {/* Block Management Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des Blocs Médicaux</CardTitle>
              <CardDescription>
                Configurez et générez les blocs de transcription médicale
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={showCreateBlock} onOpenChange={setShowCreateBlock}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un Bloc
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Créer un Nouveau Bloc Médical</DialogTitle>
                    <DialogDescription>
                      Définissez un bloc personnalisé avec votre propre prompt et exemple
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nom du Bloc</label>
                      <Input
                        value={newBlock.name || ''}
                        onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
                        placeholder="ex: Note de Consultation Spécialisée"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        value={newBlock.description || ''}
                        onChange={(e) => setNewBlock({ ...newBlock, description: e.target.value })}
                        placeholder="Description courte du bloc"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Prompt Système</label>
                      <Textarea
                        value={newBlock.systemPrompt || ''}
                        onChange={(e) => setNewBlock({ ...newBlock, systemPrompt: e.target.value })}
                        placeholder="Instructions pour l'IA sur comment générer ce bloc..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Exemple de Sortie</label>
                      <Textarea
                        value={newBlock.userExample || ''}
                        onChange={(e) => setNewBlock({ ...newBlock, userExample: e.target.value })}
                        placeholder="Exemple de ce que vous voulez comme sortie..."
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newBlock.enabled ?? true}
                        onCheckedChange={(checked) => setNewBlock({ ...newBlock, enabled: checked })}
                      />
                      <label className="text-sm font-medium">Activé par défaut</label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateBlock(false)}>
                        Annuler
                      </Button>
                      <Button onClick={createCustomBlock}>
                        Créer le Bloc
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                onClick={generateAllBlocks} 
                disabled={isGenerating || !patientId}
                size="sm"
              >
                {isGenerating ? "Génération..." : "Générer Tous"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Block Configuration */}
      <Tabs defaultValue="standard" className="w-full">
        <TabsList>
          <TabsTrigger value="standard">Blocs Standard</TabsTrigger>
          <TabsTrigger value="custom">Blocs Personnalisés</TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(STANDARD_BLOCKS).map(([blockId, block]) => (
              <Card key={blockId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{block.name}</h3>
                        <Badge variant="secondary">{block.description}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{block.example}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={blockSettings[blockId] ?? true}
                        onCheckedChange={() => toggleBlock(blockId)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(block.example)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="grid gap-4">
            {customBlocks.map((block) => (
              <Card key={block.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{block.name}</h3>
                        <Badge variant="outline">Personnalisé</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{block.description}</p>
                      <p className="text-xs text-gray-500 mb-3">Exemple: {block.userExample}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={blockSettings[block.id] ?? true}
                        onCheckedChange={() => toggleBlock(block.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(block.userExample)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCustomBlock(block.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {customBlocks.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Aucun bloc personnalisé créé</p>
                  <p className="text-sm text-gray-400">Créez votre premier bloc personnalisé</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Generated Blocks Display */}
      {Object.keys(generatedBlocks).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Blocs Générés</CardTitle>
            <CardDescription>Résultats pour le patient {patientId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(generatedBlocks).map(([blockId, content]) => (
              <div key={blockId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">
                    {STANDARD_BLOCKS[blockId as keyof typeof STANDARD_BLOCKS]?.name || 
                     customBlocks.find(b => b.id === blockId)?.name || 
                     blockId}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                  {content}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
