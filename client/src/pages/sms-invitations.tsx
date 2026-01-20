import React, { useState, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Upload,
  Image as ImageIcon,
  Send,
  Loader2,
  Check,
  X,
  AlertCircle,
  Phone,
  User,
  Trash2,
  Edit2,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ModernLayout from "@/components/layout/ModernLayout";

interface ExtractedPatient {
  name: string;
  phone: string;
  confidence: "high" | "medium" | "low";
  selected?: boolean;
  editing?: boolean;
}

interface InvitationResult {
  name: string;
  phone: string;
  success: boolean;
  messageSid?: string;
  error?: string;
}

const DEFAULT_MESSAGE = `Bonjour je suis le Dr Font du Centre Medical Font, votre demande de rendez-vous sur Bonjour Sante m'a ete assignee: Veuillez accepter l'invitation qui vous a ete envoyee par email.

Sinon, inscrivez-vous directement via le lien suivant : https://spruce.care/centremdicalfont

Si vous n'avez pas de cellulaire, vous pouvez utiliser votre ordinateur et vous communiquer en allant a ce meme site web par votre navigateur internet.

Il n'y a aucun frais pour annuler, si vous voulez annuler le rendez-vous dites-moi le par ici: Annuler.`;

export default function SmsInvitations() {
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [patients, setPatients] = useState<ExtractedPatient[]>([]);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [results, setResults] = useState<InvitationResult[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Extract patients from screenshot
  const extractMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("screenshot", file);

      const response = await fetch("/api/sms-invitations/extract-patients", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to extract patients");
      }

      return response.json();
    },
    onSuccess: (data) => {
      const extractedPatients = data.patients.map((p: ExtractedPatient) => ({
        ...p,
        selected: true,
        editing: false,
      }));
      setPatients(extractedPatients);
      toast({
        title: "Extraction complete",
        description: `Found ${data.totalFound} patient(s) in the screenshot`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Extraction failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send invitations
  const sendMutation = useMutation({
    mutationFn: async (selectedPatients: ExtractedPatient[]) => {
      const response = await fetch("/api/sms-invitations/send-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patients: selectedPatients.map((p) => ({ name: p.name, phone: p.phone })),
          message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send invitations");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResults(data.results);
      toast({
        title: "Invitations sent",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle file upload
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPatients([]);
      setResults(null);
    }
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPatients([]);
      setResults(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Extract patients from screenshot
  const handleExtract = useCallback(() => {
    if (screenshot) {
      extractMutation.mutate(screenshot);
    }
  }, [screenshot, extractMutation]);

  // Toggle patient selection
  const togglePatient = useCallback((index: number) => {
    setPatients((prev) => prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p)));
  }, []);

  // Remove patient
  const removePatient = useCallback((index: number) => {
    setPatients((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Edit patient
  const toggleEdit = useCallback((index: number) => {
    setPatients((prev) => prev.map((p, i) => (i === index ? { ...p, editing: !p.editing } : p)));
  }, []);

  // Update patient field
  const updatePatient = useCallback((index: number, field: "name" | "phone", value: string) => {
    setPatients((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }, []);

  // Send invitations
  const handleSend = useCallback(() => {
    const selectedPatients = patients.filter((p) => p.selected);
    if (selectedPatients.length === 0) {
      toast({
        title: "No patients selected",
        description: "Please select at least one patient to send invitations",
        variant: "destructive",
      });
      return;
    }
    sendMutation.mutate(selectedPatients);
  }, [patients, sendMutation, toast]);

  // Reset everything
  const handleReset = useCallback(() => {
    setScreenshot(null);
    setPreviewUrl(null);
    setPatients([]);
    setResults(null);
    setMessage(DEFAULT_MESSAGE);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const selectedCount = patients.filter((p) => p.selected).length;
  const confidenceColor = {
    high: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <ModernLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#fafafa]">SMS Patient Invitations</h1>
            <p className="text-sm text-[#888]">
              Upload a screenshot with patient names and phone numbers to send bulk invitations
            </p>
          </div>
          {(screenshot || patients.length > 0) && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-[#333] hover:bg-[#222]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload & Preview */}
          <div className="space-y-4">
            {/* Upload Area */}
            <Card className="bg-[#111] border-[#222]">
              <CardHeader>
                <CardTitle className="text-[#fafafa] text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-[#d4af37]" />
                  Screenshot Upload
                </CardTitle>
                <CardDescription className="text-[#666]">
                  Upload a screenshot containing patient names and phone numbers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all",
                    "hover:border-[#d4af37]/50 hover:bg-[#d4af37]/5",
                    previewUrl ? "border-[#d4af37]/30" : "border-[#333]"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl}
                        alt="Screenshot preview"
                        className="max-h-[300px] mx-auto rounded-lg border border-[#333]"
                      />
                      <p className="text-center text-sm text-[#888]">Click to change image</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <Upload className="h-12 w-12 mx-auto text-[#444]" />
                      <div>
                        <p className="text-[#fafafa]">Drop image here or click to upload</p>
                        <p className="text-sm text-[#666]">PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {screenshot && !extractMutation.isPending && patients.length === 0 && (
                  <Button
                    onClick={handleExtract}
                    className="w-full mt-4 bg-[#d4af37] text-[#0a0908] hover:bg-[#e6c75a]"
                  >
                    <Loader2
                      className={cn("h-4 w-4 mr-2", extractMutation.isPending && "animate-spin")}
                    />
                    Extract Patient Data
                  </Button>
                )}

                {extractMutation.isPending && (
                  <div className="mt-4 text-center space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#d4af37]" />
                    <p className="text-sm text-[#888]">Analyzing screenshot with AI...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Template */}
            <Card className="bg-[#111] border-[#222]">
              <CardHeader>
                <CardTitle className="text-[#fafafa] text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#d4af37]" />
                  Invitation Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter the invitation message..."
                  className="min-h-[120px] bg-[#0a0908] border-[#222] text-[#fafafa] resize-none"
                />
                <p className="text-xs text-[#666] mt-2">
                  {message.length} / 160 characters (SMS may be split if longer)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Extracted Patients */}
          <div className="space-y-4">
            <Card className="bg-[#111] border-[#222]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#fafafa] text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-[#d4af37]" />
                      Extracted Patients
                    </CardTitle>
                    <CardDescription className="text-[#666]">
                      {patients.length > 0
                        ? `${selectedCount} of ${patients.length} selected`
                        : "Upload and extract to see patients"}
                    </CardDescription>
                  </div>
                  {patients.length > 0 && (
                    <Badge className="bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30">
                      {patients.length} found
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {patients.length === 0 ? (
                  <div className="text-center py-12 text-[#555]">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No patients extracted yet</p>
                    <p className="text-sm">Upload a screenshot to get started</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {patients.map((patient, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-3 rounded-lg border transition-all",
                            patient.selected
                              ? "bg-[#d4af37]/5 border-[#d4af37]/30"
                              : "bg-[#0a0908] border-[#222]"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <button
                              onClick={() => togglePatient(index)}
                              className={cn(
                                "mt-1 h-5 w-5 rounded border flex items-center justify-center transition-colors",
                                patient.selected
                                  ? "bg-[#d4af37] border-[#d4af37]"
                                  : "border-[#444] hover:border-[#666]"
                              )}
                            >
                              {patient.selected && <Check className="h-3 w-3 text-[#0a0908]" />}
                            </button>

                            {/* Patient Info */}
                            <div className="flex-1 min-w-0">
                              {patient.editing ? (
                                <div className="space-y-2">
                                  <Input
                                    value={patient.name}
                                    onChange={(e) => updatePatient(index, "name", e.target.value)}
                                    placeholder="Patient name"
                                    className="h-8 text-sm bg-[#111] border-[#333]"
                                  />
                                  <Input
                                    value={patient.phone}
                                    onChange={(e) => updatePatient(index, "phone", e.target.value)}
                                    placeholder="Phone number"
                                    className="h-8 text-sm bg-[#111] border-[#333]"
                                  />
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-[#fafafa] truncate">
                                      {patient.name}
                                    </span>
                                    <Badge
                                      className={cn(
                                        "text-[10px]",
                                        confidenceColor[patient.confidence]
                                      )}
                                    >
                                      {patient.confidence}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-[#888]">
                                    <Phone className="h-3 w-3" />
                                    {patient.phone}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleEdit(index)}
                                className="p-1.5 rounded hover:bg-[#222] transition-colors"
                                title={patient.editing ? "Save" : "Edit"}
                              >
                                {patient.editing ? (
                                  <Check className="h-4 w-4 text-green-400" />
                                ) : (
                                  <Edit2 className="h-4 w-4 text-[#666]" />
                                )}
                              </button>
                              <button
                                onClick={() => removePatient(index)}
                                className="p-1.5 rounded hover:bg-[#222] transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Send Button */}
                {patients.length > 0 && !results && (
                  <Button
                    onClick={handleSend}
                    disabled={selectedCount === 0 || sendMutation.isPending}
                    className="w-full mt-4 bg-[#d4af37] text-[#0a0908] hover:bg-[#e6c75a]"
                  >
                    {sendMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send {selectedCount} Invitation{selectedCount !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {results && (
              <Card className="bg-[#111] border-[#222]">
                <CardHeader>
                  <CardTitle className="text-[#fafafa] text-lg flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-400" />
                    Invitation Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-3 rounded-lg border flex items-center gap-3",
                          result.success
                            ? "bg-green-500/5 border-green-500/30"
                            : "bg-red-500/5 border-red-500/30"
                        )}
                      >
                        {result.success ? (
                          <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-red-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#fafafa] truncate">{result.name}</p>
                          <p className="text-xs text-[#888]">{result.phone}</p>
                        </div>
                        {result.success ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Sent
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            Failed
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-[#0a0908] border border-[#222]">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#888]">Success rate:</span>
                      <span className="text-[#fafafa] font-medium">
                        {results.filter((r) => r.success).length} / {results.length}
                      </span>
                    </div>
                    <Progress
                      value={(results.filter((r) => r.success).length / results.length) * 100}
                      className="mt-2 h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
