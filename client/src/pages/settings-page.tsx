import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import NavigationBar from '@/components/navigation/NavigationBar';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// Define our AI settings interface
interface AiSetting {
  id: number;
  name: string;
  category: string;
  enabled: boolean;
  promptText: string;
  order: number;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for new prompt
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState('documentation');
  const [newPromptText, setNewPromptText] = useState('');
  
  // Query AI settings
  const { 
    data: aiSettings = [], 
    isLoading 
  } = useQuery<AiSetting[]>({
    queryKey: ['/api/ai/settings'],
  });
  
  // Update settings mutation
  const updateSettingMutation = useMutation({
    mutationFn: async (setting: Partial<AiSetting>) => {
      const response = await fetch(`/api/ai/settings/${setting.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setting),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update setting');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/settings'] });
      toast({
        title: 'Settings updated',
        description: 'Your AI settings have been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update settings: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Add new prompt mutation
  const addPromptMutation = useMutation({
    mutationFn: async (newPrompt: Omit<AiSetting, 'id'>) => {
      const response = await fetch('/api/ai/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPrompt),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add new prompt');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/settings'] });
      setNewPromptName('');
      setNewPromptText('');
      toast({
        title: 'Prompt added',
        description: 'Your new AI prompt has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add prompt: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Delete prompt mutation
  const deletePromptMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/ai/settings/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete prompt');
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/settings'] });
      toast({
        title: 'Prompt deleted',
        description: 'The AI prompt has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete prompt: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Handle toggle change
  const handleToggleChange = (setting: AiSetting, enabled: boolean) => {
    updateSettingMutation.mutate({ id: setting.id, enabled });
  };
  
  // Handle prompt text change
  const handlePromptTextChange = (setting: AiSetting, promptText: string) => {
    updateSettingMutation.mutate({ id: setting.id, promptText });
  };
  
  // Handle add new prompt
  const handleAddPrompt = () => {
    if (!newPromptName || !newPromptText) {
      toast({
        title: 'Error',
        description: 'Please provide both a name and text for the new prompt.',
        variant: 'destructive',
      });
      return;
    }
    
    // Calculate the next order value
    const maxOrder = aiSettings.reduce(
      (max, setting) => (setting.category === newPromptCategory && setting.order > max ? setting.order : max),
      0
    );
    
    addPromptMutation.mutate({
      name: newPromptName,
      category: newPromptCategory,
      enabled: true,
      promptText: newPromptText,
      order: maxOrder + 1,
    });
  };
  
  // Filter settings by category
  const documentationSettings = aiSettings.filter(s => s.category === 'documentation').sort((a, b) => a.order - b.order);
  const responseSettings = aiSettings.filter(s => s.category === 'response').sort((a, b) => a.order - b.order);
  const analysisSettings = aiSettings.filter(s => s.category === 'analysis').sort((a, b) => a.order - b.order);
  
  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Header */}
      <header className="h-14 flex items-center px-4 bg-[#1e1e1e] border-b border-gray-800">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">InstantHPI</h1>
        <div className="ml-6 flex-1">
          <NavigationBar />
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">AI Behavior Settings</h2>
          <p className="text-gray-400">Customize how the AI generates content and responds to inputs</p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <Tabs defaultValue="documentation" className="w-full">
            <TabsList className="mb-6 bg-[#1e1e1e]">
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
              <TabsTrigger value="response">Patient Responses</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="add">Add New Prompt</TabsTrigger>
            </TabsList>
            
            <TabsContent value="documentation">
              <div className="space-y-6">
                {documentationSettings.map((setting) => (
                  <SettingCard
                    key={setting.id}
                    setting={setting}
                    onToggleChange={handleToggleChange}
                    onPromptTextChange={handlePromptTextChange}
                    onDelete={() => deletePromptMutation.mutate(setting.id)}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="response">
              <div className="space-y-6">
                {responseSettings.map((setting) => (
                  <SettingCard
                    key={setting.id}
                    setting={setting}
                    onToggleChange={handleToggleChange}
                    onPromptTextChange={handlePromptTextChange}
                    onDelete={() => deletePromptMutation.mutate(setting.id)}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="analysis">
              <div className="space-y-6">
                {analysisSettings.map((setting) => (
                  <SettingCard
                    key={setting.id}
                    setting={setting}
                    onToggleChange={handleToggleChange}
                    onPromptTextChange={handlePromptTextChange}
                    onDelete={() => deletePromptMutation.mutate(setting.id)}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="add">
              <Card className="bg-[#1e1e1e] border-gray-800">
                <CardHeader>
                  <CardTitle>Add New Prompt</CardTitle>
                  <CardDescription className="text-gray-400">
                    Create a new AI prompt to customize the application's behavior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prompt-name">Prompt Name</Label>
                        <Input
                          id="prompt-name"
                          placeholder="Enter a descriptive name..."
                          value={newPromptName}
                          onChange={(e) => setNewPromptName(e.target.value)}
                          className="bg-[#262626] border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prompt-category">Category</Label>
                        <select
                          id="prompt-category"
                          value={newPromptCategory}
                          onChange={(e) => setNewPromptCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-md bg-[#262626] border border-gray-700 text-white"
                        >
                          <option value="documentation">Documentation</option>
                          <option value="response">Patient Response</option>
                          <option value="analysis">Analysis</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="prompt-text">Prompt Text</Label>
                      <Textarea
                        id="prompt-text"
                        placeholder="Enter the prompt text with any variables enclosed in {curly braces}..."
                        value={newPromptText}
                        onChange={(e) => setNewPromptText(e.target.value)}
                        rows={8}
                        className="bg-[#262626] border-gray-700 text-white min-h-[200px]"
                      />
                      <p className="text-sm text-gray-500">
                        Use variables like {"{patient_name}"}, {"{condition}"}, {"{symptoms}"}, etc. These will be replaced with actual data when the prompt is used.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleAddPrompt} 
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                      disabled={addPromptMutation.isPending}
                    >
                      {addPromptMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Plus className="mr-2 h-4 w-4" />
                      Add Prompt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

// Setting Card Component
interface SettingCardProps {
  setting: AiSetting;
  onToggleChange: (setting: AiSetting, enabled: boolean) => void;
  onPromptTextChange: (setting: AiSetting, promptText: string) => void;
  onDelete: () => void;
}

function SettingCard({ setting, onToggleChange, onPromptTextChange, onDelete }: SettingCardProps) {
  const [editedText, setEditedText] = useState(setting.promptText);
  const [isEditing, setIsEditing] = useState(false);
  
  // Reset edited text when setting changes
  useEffect(() => {
    setEditedText(setting.promptText);
  }, [setting.promptText]);
  
  const handleSave = () => {
    onPromptTextChange(setting, editedText);
    setIsEditing(false);
  };
  
  return (
    <Card className="bg-[#1e1e1e] border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{setting.name}</CardTitle>
            <CardDescription className="text-gray-400">
              Category: {setting.category.charAt(0).toUpperCase() + setting.category.slice(1)}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor={`toggle-${setting.id}`} className="mr-2">
              Enabled
            </Label>
            <Switch
              id={`toggle-${setting.id}`}
              checked={setting.enabled}
              onCheckedChange={(checked) => onToggleChange(setting, checked)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="bg-[#262626] border-gray-700 text-white min-h-[150px]"
              rows={5}
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditedText(setting.promptText);
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-[#262626] rounded-md text-sm text-gray-300 whitespace-pre-wrap">
              {setting.promptText}
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
                className="border-gray-700 text-gray-300"
              >
                Edit
              </Button>
              <Button 
                variant="destructive" 
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}