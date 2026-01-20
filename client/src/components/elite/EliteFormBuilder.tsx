import React, { useState } from "react";
import { EliteCard } from "./EliteCard";
import { EliteButton } from "./EliteButton";
import { EliteInput } from "./EliteInput";
import {
  Plus,
  Trash2,
  Move,
  Eye,
  Edit2,
  Check,
  Brain,
  Webhook,
  Save,
  Play,
  Settings2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { USER_MEDICAL_TEMPLATES } from "@/data/user-templates";

export type FormFieldType = "text" | "number" | "email" | "textarea" | "date" | "select";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select types
}

export interface AIContextConfig {
  personaName: string;
  tone: "professional" | "empathetic" | "direct" | "technical";
  systemInstructions: string;
  examples: string;
  templateId?: string;
}

export interface APIIntegrationConfig {
  enabled: boolean;
  targetUrl: string;
  method: "POST" | "GET" | "PUT";
  headers: { key: string; value: string }[];
  bodyMapping: string; // JSON string representing the mapping
}

interface EliteFormBuilderProps {
  onSave?: (schema: {
    fields: FormField[];
    aiConfig: AIContextConfig;
    apiConfig: APIIntegrationConfig;
  }) => void;
  initialSchema?: FormField[];
}

export function EliteFormBuilder({ onSave, initialSchema = [] }: EliteFormBuilderProps) {
  const [activeTab, setActiveTab] = useState<"builder" | "ai" | "api">("builder");
  const [fields, setFields] = useState<FormField[]>(initialSchema);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState<AIContextConfig>({
    personaName: "Dr. Default",
    tone: "professional",
    systemInstructions: "Analyze the patient data and provide a concise clinical summary.",
    examples: "",
  });

  // API Integration State
  const [apiConfig, setApiConfig] = useState<APIIntegrationConfig>({
    enabled: false,
    targetUrl: "",
    method: "POST",
    headers: [{ key: "Content-Type", value: "application/json" }],
    bodyMapping: '{\n  "patient_name": "{{name}}",\n  "symptoms": "{{symptoms}}"\n}',
  });

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      placeholder: "",
      required: false,
      options: type === "select" ? ["Option 1", "Option 2"] : undefined,
    };
    setFields([...fields, newField]);
    setActiveField(newField.id);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (activeField === id) setActiveField(null);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const currentField = fields.find((f) => f.id === activeField);

  const handleSave = () => {
    if (onSave) {
      onSave({
        fields,
        aiConfig,
        apiConfig,
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between bg-black/20 p-2 rounded-2xl glass border-white/5">
        <div className="flex gap-2">
          <EliteButton
            variant={activeTab === "builder" ? "primary" : "ghost"}
            onClick={() => setActiveTab("builder")}
            className="h-10 px-4 text-sm"
          >
            <Edit2 className="w-4 h-4 mr-2" /> Builder
          </EliteButton>
          <EliteButton
            variant={activeTab === "ai" ? "primary" : "ghost"}
            onClick={() => setActiveTab("ai")}
            className="h-10 px-4 text-sm"
          >
            <Brain className="w-4 h-4 mr-2" /> AI Context
          </EliteButton>
          <EliteButton
            variant={activeTab === "api" ? "primary" : "ghost"}
            onClick={() => setActiveTab("api")}
            className="h-10 px-4 text-sm"
          >
            <Webhook className="w-4 h-4 mr-2" /> Integrations
          </EliteButton>
        </div>
        <div className="flex gap-2">
          {activeTab === "builder" && (
            <EliteButton
              variant={previewMode ? "secondary" : "ghost"}
              onClick={() => setPreviewMode(!previewMode)}
              className="h-10 w-10 p-0"
              title="Toggle Preview"
            >
              {previewMode ? <Edit2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </EliteButton>
          )}
          <EliteButton onClick={handleSave} className="h-10 px-6 neon-glow-primary">
            <Save className="w-4 h-4 mr-2" /> Save Form
          </EliteButton>
        </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* BUILDER TAB */}
        {activeTab === "builder" && (
          <>
            {/* Sidebar - Tools */}
            <EliteCard
              className="w-64 flex-shrink-0 flex flex-col gap-4 overflow-y-auto"
              hover={false}
            >
              <h3 className="text-lg font-bold text-foreground mb-2">Toolbox</h3>
              <div className="grid grid-cols-1 gap-2">
                {(["text", "number", "email", "textarea", "date", "select"] as FormFieldType[]).map(
                  (type) => (
                    <EliteButton
                      key={type}
                      variant="ghost"
                      onClick={() => addField(type)}
                      className="justify-start border border-white/5 hover:border-primary/20"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </EliteButton>
                  )
                )}
              </div>
            </EliteCard>

            {/* Main Canvas */}
            <div className="flex-1 flex flex-col gap-4">
              <EliteCard className="flex-1 overflow-y-auto bg-black/40" hover={false}>
                <div className="max-w-2xl mx-auto space-y-6 py-6">
                  {fields.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                      <Move className="w-12 h-12 mb-4" />
                      <p>Drag fields or click to add from the toolbox</p>
                    </div>
                  ) : (
                    fields.map((field) => (
                      <div
                        key={field.id}
                        onClick={() => !previewMode && setActiveField(field.id)}
                        className={cn(
                          "relative p-6 rounded-2xl transition-all border-l-4",
                          activeField === field.id && !previewMode
                            ? "bg-white/5 border-l-primary border-t border-r border-b border-primary/20 shadow-lg"
                            : "bg-white/0 border-l-transparent border-t border-r border-b border-white/5 hover:bg-white/5"
                        )}
                      >
                        {!previewMode && activeField === field.id && (
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeField(field.id);
                              }}
                              className="p-2 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        <div className="space-y-3 pointer-events-none">
                          <label className="text-sm font-bold text-foreground flex gap-1 tracking-wide">
                            {field.label}
                            {field.required && <span className="text-destructive">*</span>}
                          </label>
                          {field.type === "textarea" ? (
                            <textarea
                              className="w-full p-4 bg-black/20 border border-white/10 rounded-xl resize-none"
                              placeholder={field.placeholder}
                              rows={3}
                              readOnly
                            />
                          ) : (
                            <input
                              type={field.type}
                              className="w-full p-4 bg-black/20 border border-white/10 rounded-xl"
                              placeholder={field.placeholder}
                              readOnly
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </EliteCard>
            </div>

            {/* Properties Panel */}
            {!previewMode && currentField && (
              <EliteCard className="w-80 flex-shrink-0" hover={false}>
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <Settings2 className="w-5 h-5" />
                  <h3 className="text-lg font-bold text-foreground">Properties</h3>
                </div>
                <div className="space-y-6">
                  <EliteInput
                    label="Field Label"
                    value={currentField.label}
                    onChange={(e) => updateField(currentField.id, { label: e.target.value })}
                  />
                  <EliteInput
                    label="Placeholder Text"
                    value={currentField.placeholder || ""}
                    onChange={(e) => updateField(currentField.id, { placeholder: e.target.value })}
                  />

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="required-check"
                        checked={currentField.required}
                        onChange={(e) =>
                          updateField(currentField.id, { required: e.target.checked })
                        }
                        className="w-5 h-5 rounded border-gray-600 bg-background/50 accent-primary"
                      />
                      <label
                        htmlFor="required-check"
                        className="text-sm font-medium text-foreground cursor-pointer"
                      >
                        Required Field
                      </label>
                    </div>
                  </div>
                </div>
              </EliteCard>
            )}
          </>
        )}

        {/* AI CONTEXT TAB */}
        {activeTab === "ai" && (
          <div className="flex-1 flex gap-6">
            <EliteCard className="w-1/3 space-y-6" glow>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" /> Consultant Persona
              </h3>
              <p className="text-muted-foreground text-sm">
                Define the "Artificial Identity" that will process this form. This ensures the
                output matches your personal style.
              </p>

              <EliteInput
                label="Persona Name"
                value={aiConfig.personaName}
                onChange={(e) => setAiConfig({ ...aiConfig, personaName: e.target.value })}
                placeholder="e.g. Dr. House, The Efficient Cardiologist"
              />

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                  Tone of Voice
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["professional", "empathetic", "direct", "technical"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setAiConfig({ ...aiConfig, tone: t as any })}
                      className={cn(
                        "p-2 rounded-lg text-sm border transition-all",
                        aiConfig.tone === t
                          ? "bg-primary/20 border-primary text-primary font-bold"
                          : "bg-transparent border-white/10 text-muted-foreground hover:bg-white/5"
                      )}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </EliteCard>

            <EliteCard className="flex-1 flex flex-col overflow-y-auto" hover={false}>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">System Instructions (The "Brain")</h3>
                  <textarea
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm leading-relaxed resize-none focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    rows={4}
                    value={aiConfig.systemInstructions}
                    onChange={(e) =>
                      setAiConfig({ ...aiConfig, systemInstructions: e.target.value })
                    }
                    placeholder="Enter specific instructions for the AI on how to interpret this form's data..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-secondary" /> Template Examples (Few-Shot)
                    </h3>
                    <div className="flex gap-2">
                      {USER_MEDICAL_TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() =>
                            setAiConfig((prev) => ({
                              ...prev,
                              examples: prev.examples
                                ? prev.examples + "\n\n" + t.content
                                : t.content,
                            }))
                          }
                          className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded transition-colors"
                          title={t.name}
                        >
                          + {t.name.split(":")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs mb-3">
                    Paste examples of your ideal output here. The AI will "back-engineer" your style
                    from these examples.
                  </p>
                  <textarea
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm font-mono leading-relaxed resize-none focus:ring-2 focus:ring-secondary/50 focus:outline-none"
                    rows={12}
                    value={aiConfig.examples}
                    onChange={(e) => setAiConfig({ ...aiConfig, examples: e.target.value })}
                    placeholder="Paste your 'Gold Standard' examples here..."
                  />
                </div>
              </div>
            </EliteCard>
          </div>
        )}

        {/* API INTEGRATION TAB */}
        {activeTab === "api" && (
          <div className="flex-1 flex gap-6">
            <EliteCard className="w-full max-w-2xl mx-auto space-y-6" hover={false}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-secondary" /> API Webhook
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {apiConfig.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    onClick={() => setApiConfig({ ...apiConfig, enabled: !apiConfig.enabled })}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      apiConfig.enabled ? "bg-primary" : "bg-white/10"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                        apiConfig.enabled ? "left-7" : "left-1"
                      )}
                    />
                  </button>
                </div>
              </div>

              <div
                className={cn(
                  "space-y-6 transition-opacity",
                  !apiConfig.enabled && "opacity-50 pointer-events-none"
                )}
              >
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2 block">
                      Method
                    </label>
                    <select
                      className="w-full h-12 px-4 bg-black/20 border border-white/10 rounded-xl text-foreground"
                      value={apiConfig.method}
                      onChange={(e) =>
                        setApiConfig({ ...apiConfig, method: e.target.value as any })
                      }
                    >
                      <option>POST</option>
                      <option>GET</option>
                      <option>PUT</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <EliteInput
                      label="Target URL"
                      value={apiConfig.targetUrl}
                      onChange={(e) => setApiConfig({ ...apiConfig, targetUrl: e.target.value })}
                      placeholder="https://api.example.com/webhook"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2 block">
                    Payload Mapping (JSON)
                  </label>
                  <div className="relative">
                    <textarea
                      className="w-full h-64 font-mono text-sm bg-black/40 border border-white/10 rounded-xl p-4 resize-none focus:ring-2 focus:ring-secondary/50 focus:outline-none"
                      value={apiConfig.bodyMapping}
                      onChange={(e) => setApiConfig({ ...apiConfig, bodyMapping: e.target.value })}
                    />
                    <div className="absolute bottom-4 right-4">
                      <EliteButton variant="secondary" className="px-4 py-2 h-auto text-xs">
                        <Play className="w-3 h-3 mr-1" /> Test Request
                      </EliteButton>
                    </div>
                  </div>
                </div>
              </div>
            </EliteCard>
          </div>
        )}
      </div>
    </div>
  );
}
