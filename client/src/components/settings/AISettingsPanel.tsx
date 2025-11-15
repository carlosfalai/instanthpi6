import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, AlertCircle, Settings, Key, Brain } from 'lucide-react';

interface AISettings {
  userId: number;
  preferredAiProvider: 'openai' | 'claude';
  openaiModel: string;
  claudeModel: string;
  hasOpenaiKey: boolean;
  hasClaudeKey: boolean;
  availableModels: {
    openai: string[];
    claude: string[];
  };
  hpiConfirmationEnabled: boolean;
  differentialDiagnosisEnabled: boolean;
  followUpQuestionsEnabled: boolean;
  preventativeCareEnabled: boolean;
  labworkSuggestionsEnabled: boolean;
  inPersonReferralEnabled: boolean;
  prescriptionSuggestionsEnabled: boolean;
  medicalNotesDraftEnabled: boolean;
  pendingItemsTrackingEnabled: boolean;
  billingOptimizationEnabled: boolean;
  functionalMedicineEnabled: boolean;
}

interface AISettingsPanelProps {
  userId: number;
}

export function AISettingsPanel({ userId }: AISettingsPanelProps) {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [formData, setFormData] = useState({
    preferredAiProvider: 'openai' as 'openai' | 'claude',
    openaiApiKey: '',
    claudeApiKey: '',
    openaiModel: 'gpt-4o',
    claudeModel: 'claude-3-5-haiku-20241022',
  });

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai-settings/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setFormData({
          preferredAiProvider: data.preferredAiProvider,
          openaiApiKey: '',
          claudeApiKey: '',
          openaiModel: data.openaiModel,
          claudeModel: data.claudeModel,
        });
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/ai-settings/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          ...formData,
        }),
      });

      if (response.ok) {
        await loadSettings();
        setTestResult({ success: true, message: 'Settings saved successfully!' });
      } else {
        setTestResult({ success: false, message: 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setTestResult({ success: false, message: 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const testConfiguration = async () => {
    try {
      setTesting(true);
      const response = await fetch(`/api/ai-settings/${userId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok) {
        setTestResult({ 
          success: true, 
          message: `AI test successful! Using ${result.provider} (${result.model})` 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: result.error || 'AI test failed' 
        });
      }
    } catch (error) {
      console.error('Error testing AI configuration:', error);
      setTestResult({ 
        success: false, 
        message: 'Error testing AI configuration' 
      });
    } finally {
      setTesting(false);
    }
  };

  const toggleSetting = (setting: keyof AISettings) => {
    if (settings) {
      setSettings({
        ...settings,
        [setting]: !settings[setting],
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading AI settings...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load AI settings. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Provider Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Provider Configuration
          </CardTitle>
          <CardDescription>
            Configure your preferred AI provider and API keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <Select
                value={formData.preferredAiProvider}
                onValueChange={(value: 'openai' | 'claude') => 
                  setFormData({ ...formData, preferredAiProvider: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                  <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={formData.preferredAiProvider === 'openai' ? formData.openaiModel : formData.claudeModel}
                onValueChange={(value) => 
                  setFormData({
                    ...formData,
                    [formData.preferredAiProvider === 'openai' ? 'openaiModel' : 'claudeModel']: value
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {settings.availableModels[formData.preferredAiProvider].map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                OpenAI API Key
                {settings.hasOpenaiKey && <Badge variant="secondary">Configured</Badge>}
              </Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={formData.openaiApiKey}
                onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claude-key" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Claude API Key
                {settings.hasClaudeKey && <Badge variant="secondary">Configured</Badge>}
              </Label>
              <Input
                id="claude-key"
                type="password"
                placeholder="sk-ant-..."
                value={formData.claudeApiKey}
                onChange={(e) => setFormData({ ...formData, claudeApiKey: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button variant="outline" onClick={testConfiguration} disabled={testing}>
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>

          {testResult && (
            <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* AI Features Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI Features</CardTitle>
          <CardDescription>
            Enable or disable specific AI-powered features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>HPI Confirmation</Label>
                <p className="text-sm text-gray-600">Generate patient confirmation summaries</p>
              </div>
              <Switch
                checked={settings.hpiConfirmationEnabled}
                onCheckedChange={() => toggleSetting('hpiConfirmationEnabled')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Follow-up Questions</Label>
                <p className="text-sm text-gray-600">Generate clinical follow-up questions</p>
              </div>
              <Switch
                checked={settings.followUpQuestionsEnabled}
                onCheckedChange={() => toggleSetting('followUpQuestionsEnabled')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Differential Diagnosis</Label>
                <p className="text-sm text-gray-600">Suggest differential diagnoses</p>
              </div>
              <Switch
                checked={settings.differentialDiagnosisEnabled}
                onCheckedChange={() => toggleSetting('differentialDiagnosisEnabled')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Lab Work Suggestions</Label>
                <p className="text-sm text-gray-600">Recommend laboratory tests</p>
              </div>
              <Switch
                checked={settings.labworkSuggestionsEnabled}
                onCheckedChange={() => toggleSetting('labworkSuggestionsEnabled')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Prescription Suggestions</Label>
                <p className="text-sm text-gray-600">Suggest medications and dosages</p>
              </div>
              <Switch
                checked={settings.prescriptionSuggestionsEnabled}
                onCheckedChange={() => toggleSetting('prescriptionSuggestionsEnabled')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Medical Notes Draft</Label>
                <p className="text-sm text-gray-600">Generate draft medical notes</p>
              </div>
              <Switch
                checked={settings.medicalNotesDraftEnabled}
                onCheckedChange={() => toggleSetting('medicalNotesDraftEnabled')}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save AI Features'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
