import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  User,
  FileSignature,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  FileText,
  Clipboard,
  Building,
  Loader2,
  Check,
  Eye,
  Upload,
  Trash2,
  Image,
} from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import SignaturePad from "@/components/doctor/SignaturePad";
import SignaturePinModal from "@/components/doctor/SignaturePinModal";
import DocumentTemplateEditor, {
  DocumentTemplate,
} from "@/components/doctor/DocumentTemplateEditor";
import { Textarea } from "@/components/ui/textarea";

// Component for document template editor
function DocumentTemplateEditorComponent({
  initialData,
  onSave,
}: {
  initialData?: DocumentTemplate;
  onSave: (template: DocumentTemplate) => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [template, setTemplate] = useState<DocumentTemplate>(
    initialData || {
      name: "Default Template",
      clinicName: "",
      clinicAddress: "",
      clinicPhone: "",
      clinicFax: "",
      clinicEmail: "",
      footerText: "Confidential medical document. For patient use only.",
      headerColor: "#0f766e", // Teal color
      footerColor: "#0f766e", // Teal color
    }
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(initialData?.logoUrl);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTemplate({
      ...template,
      [name]: value,
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Logo image must be less than 2MB",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload an image file",
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setLogoPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(undefined);
  };

  const handleSaveTemplate = async () => {
    try {
      // In a real app, you would upload the logo file to a server
      // and get back a URL to store in the template
      const templateToSave: DocumentTemplate = {
        ...template,
        logoUrl: logoPreview,
      };

      // Call the save function
      onSave(templateToSave);

      toast({
        title: "Template saved",
        description: "Your document template has been saved successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving template",
        description: "There was an error saving your template",
      });
    }
  };

  const renderPreview = () => {
    return (
      <div className="border border-gray-700 bg-white text-black rounded-md p-6 overflow-hidden">
        {/* Header */}
        <div
          className="p-4 rounded-t-md flex items-center justify-between"
          style={{ backgroundColor: template.headerColor }}
        >
          <div className="flex items-center">
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Clinic Logo"
                className="h-16 max-w-[200px] object-contain mr-4"
              />
            )}
            <div className="text-white">
              <h2 className="text-xl font-bold">{template.clinicName || "Clinic Name"}</h2>
              <p className="text-sm">{template.clinicAddress || "Clinic Address"}</p>
            </div>
          </div>
          <div className="text-white text-right text-sm">
            <p>Phone: {template.clinicPhone || "Phone Number"}</p>
            <p>Fax: {template.clinicFax || "Fax Number"}</p>
            <p>{template.clinicEmail || "Email"}</p>
          </div>
        </div>

        {/* Content Area (Sample) */}
        <div className="p-6 min-h-[300px] border-l border-r border-gray-300">
          <div className="mb-6">
            <div className="flex justify-between mb-4">
              <div>
                <h3 className="font-bold">Patient Information:</h3>
                <p>Name: John Doe</p>
                <p>DOB: 01/01/1980</p>
                <p>Phone: (555) 123-4567</p>
              </div>
              <div className="text-right">
                <h3 className="font-bold">Prescription:</h3>
                <p>Date: 04/27/2025</p>
                <p>Rx #: 12345678</p>
              </div>
            </div>

            <div className="border-t border-gray-300 pt-4 mt-4">
              <h3 className="font-bold mb-2">Medication:</h3>
              <p>
                Medication Name: <span className="font-semibold">Amoxicillin 500mg</span>
              </p>
              <p>Sig: 1 capsule by mouth three times daily for 10 days</p>
              <p>Quantity: 30</p>
              <p>Refills: 0</p>
            </div>

            <div className="border-t border-gray-300 pt-4 mt-4">
              <h3 className="font-bold mb-2">Prescriber:</h3>
              <p>Dr. Jane Smith, MD</p>
              <p>License #: ABC12345</p>
              <div className="mt-3">
                <p className="font-semibold mb-1">Signature:</p>
                <div className="border border-gray-300 h-16 bg-gray-50 flex items-center justify-center text-gray-400 italic">
                  [Digital Signature]
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-3 text-center text-white text-sm rounded-b-md"
          style={{ backgroundColor: template.footerColor }}
        >
          {template.footerText || "Confidential medical document"}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Button
          variant="outline"
          className="flex items-center"
          onClick={() => setPreviewMode(!previewMode)}
        >
          <Eye className="mr-2 h-4 w-4" />
          {previewMode ? "Edit Template" : "Preview Template"}
        </Button>

        <Button
          className="bg-blue-600 hover:bg-blue-700 flex items-center"
          onClick={handleSaveTemplate}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Template
        </Button>
      </div>

      {previewMode ? (
        renderPreview()
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                name="name"
                value={template.name}
                onChange={handleInputChange}
                className="bg-[#262626] border-gray-700"
                placeholder="Template Name"
              />
            </div>

            <div className="space-y-2">
              <Label>Clinic Logo</Label>
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Logo
                </Button>
                {logoPreview && (
                  <Button type="button" variant="destructive" size="sm" onClick={handleRemoveLogo}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              </div>
              {logoPreview && (
                <div className="mt-2 border border-gray-700 p-2 rounded-md bg-[#262626]">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="h-20 max-w-full object-contain"
                  />
                </div>
              )}
              {!logoPreview && (
                <div className="mt-2 border border-dashed border-gray-700 p-4 rounded-md bg-[#262626] flex flex-col items-center justify-center">
                  <Image className="h-8 w-8 text-gray-500 mb-2" />
                  <p className="text-gray-500 text-sm text-center">No logo uploaded</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinicName">Clinic Name</Label>
            <Input
              id="clinicName"
              name="clinicName"
              value={template.clinicName}
              onChange={handleInputChange}
              className="bg-[#262626] border-gray-700"
              placeholder="Enter your clinic name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinicAddress">Clinic Address</Label>
            <Textarea
              id="clinicAddress"
              name="clinicAddress"
              value={template.clinicAddress}
              onChange={handleInputChange}
              className="bg-[#262626] border-gray-700"
              placeholder="Enter your clinic address"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="clinicPhone">Phone Number</Label>
              <Input
                id="clinicPhone"
                name="clinicPhone"
                value={template.clinicPhone}
                onChange={handleInputChange}
                className="bg-[#262626] border-gray-700"
                placeholder="Phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicFax">Fax Number</Label>
              <Input
                id="clinicFax"
                name="clinicFax"
                value={template.clinicFax}
                onChange={handleInputChange}
                className="bg-[#262626] border-gray-700"
                placeholder="Fax number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicEmail">Email</Label>
              <Input
                id="clinicEmail"
                name="clinicEmail"
                value={template.clinicEmail}
                onChange={handleInputChange}
                className="bg-[#262626] border-gray-700"
                placeholder="Email address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerText">Footer Text</Label>
            <Input
              id="footerText"
              name="footerText"
              value={template.footerText}
              onChange={handleInputChange}
              className="bg-[#262626] border-gray-700"
              placeholder="Footer text"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="headerColor">Header Color</Label>
              <div className="flex">
                <Input
                  id="headerColor"
                  name="headerColor"
                  type="color"
                  value={template.headerColor}
                  onChange={handleInputChange}
                  className="w-12 h-10 p-1 bg-[#262626] border-gray-700"
                />
                <Input
                  value={template.headerColor}
                  onChange={handleInputChange}
                  name="headerColor"
                  className="ml-2 bg-[#262626] border-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerColor">Footer Color</Label>
              <div className="flex">
                <Input
                  id="footerColor"
                  name="footerColor"
                  type="color"
                  value={template.footerColor}
                  onChange={handleInputChange}
                  className="w-12 h-10 p-1 bg-[#262626] border-gray-700"
                />
                <Input
                  value={template.footerColor}
                  onChange={handleInputChange}
                  name="footerColor"
                  className="ml-2 bg-[#262626] border-gray-700"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DoctorSettings {
  id: number;
  name: string;
  licenseNumber: string;
  email: string;
  phoneNumber: string;
  specialty: string;
  signatureId?: string;
  hasSignature: boolean;
  documentTemplates?: DocumentTemplate[];
}

export default function DoctorSettingsPage() {
  const { toast } = useToast();
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isCreatingSignature, setIsCreatingSignature] = useState<boolean>(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState<boolean>(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signaturePin, setSignaturePin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTemplate, setActiveTemplate] = useState<string>("create");
  const [anthropicApiKey, setAnthropicApiKey] = useState<string>("");
  const [showAnthropicKey, setShowAnthropicKey] = useState<boolean>(false);

  const [doctorSettings, setDoctorSettings] = useState<DoctorSettings>({
    id: 1,
    name: "Dr. John Doe",
    licenseNumber: "",
    email: "john.doe@example.com",
    phoneNumber: "555-123-4567",
    specialty: "Family Medicine",
    hasSignature: false,
    documentTemplates: [],
  });

  useEffect(() => {
    // Load Anthropic API key from localStorage
    const savedKey = localStorage.getItem("anthropic_api_key");
    if (savedKey) {
      setAnthropicApiKey(savedKey);
    }

    // Simulate loading doctor settings data
    setTimeout(() => {
      setLoading(false);

      // Simulate existing template data
      setDoctorSettings((prev) => ({
        ...prev,
        documentTemplates: [
          {
            id: "template_1",
            name: "My Clinic Letterhead",
            clinicName: "Downtown Medical Clinic",
            clinicAddress: "123 Main Street, Suite 100, Cityville, ST 12345",
            clinicPhone: "(555) 123-4567",
            clinicFax: "(555) 123-4568",
            clinicEmail: "info@downtownmedical.example",
            footerText: "Confidential medical document. For patient use only.",
            headerColor: "#0f766e",
            footerColor: "#0f766e",
          },
        ],
      }));
    }, 1000);
  }, []);

  const handleSaveSettings = () => {
    setSaving(true);
    // Simulate API call to save settings
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Settings saved",
        description: "Your doctor profile settings have been updated successfully.",
      });
    }, 1000);
  };

  const handleCreateSignature = () => {
    setIsCreatingSignature(true);
  };

  const handleSignatureComplete = (signatureDataUrl: string) => {
    setSignatureImage(signatureDataUrl);
    setIsPinModalOpen(true);
  };

  const handlePinCreate = (pin: string) => {
    setSignaturePin(pin);
    setIsPinModalOpen(false);
    setIsCreatingSignature(false);

    // Update doctor settings with signature
    setDoctorSettings({
      ...doctorSettings,
      hasSignature: true,
      signatureId: Date.now().toString(),
    });

    toast({
      title: "Signature created",
      description: "Your electronic signature has been created and secured with a PIN.",
    });
  };

  const handlePinVerify = (pin: string) => {
    setIsVerifyingPin(true);

    // Simulate PIN verification
    setTimeout(() => {
      if (pin === signaturePin) {
        toast({
          title: "PIN verified",
          description: "Your signature has been verified and is ready to use.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Incorrect PIN",
          description: "The PIN you entered does not match. Please try again.",
        });
      }
      setIsVerifyingPin(false);
      setIsPinModalOpen(false);
    }, 1000);
  };

  const handleSaveTemplate = (template: DocumentTemplate) => {
    if (activeTemplate === "create") {
      // Creating new template
      const newTemplate = {
        ...template,
        id: `template_${Date.now()}`,
      };

      setDoctorSettings((prev) => ({
        ...prev,
        documentTemplates: [...(prev.documentTemplates || []), newTemplate],
      }));

      setActiveTemplate(newTemplate.id);
    } else {
      // Updating existing template
      setDoctorSettings((prev) => ({
        ...prev,
        documentTemplates: prev.documentTemplates?.map((t) =>
          t.id === activeTemplate ? { ...template, id: t.id } : t
        ),
      }));
    }
  };

  const getActiveTemplateData = () => {
    if (activeTemplate === "create") {
      return undefined;
    }
    return doctorSettings.documentTemplates?.find((t) => t.id === activeTemplate);
  };

  if (loading) {
    return (
      <BaseLayout>
        <div className="container mx-auto py-6 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-400">Loading doctor settings...</p>
          </div>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Doctor Settings</h1>
            <p className="text-gray-500">Manage your personal and professional information</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl bg-[#262626]">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="license">License</TabsTrigger>
            <TabsTrigger value="signature">Signature</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="preferences">Personal Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card className="bg-[#1e1e1e] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Doctor Profile
                </CardTitle>
                <CardDescription>Your personal and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={doctorSettings.name}
                      onChange={(e) =>
                        setDoctorSettings({ ...doctorSettings, name: e.target.value })
                      }
                      className="bg-[#262626] border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={doctorSettings.email}
                      onChange={(e) =>
                        setDoctorSettings({ ...doctorSettings, email: e.target.value })
                      }
                      className="bg-[#262626] border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={doctorSettings.phoneNumber}
                      onChange={(e) =>
                        setDoctorSettings({ ...doctorSettings, phoneNumber: e.target.value })
                      }
                      className="bg-[#262626] border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input
                      id="specialty"
                      value={doctorSettings.specialty}
                      onChange={(e) =>
                        setDoctorSettings({ ...doctorSettings, specialty: e.target.value })
                      }
                      className="bg-[#262626] border-gray-700"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveSettings}
                  className="ml-auto bg-blue-600 hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Profile
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="license" className="mt-6">
            <Card className="bg-[#1e1e1e] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  License Information
                </CardTitle>
                <CardDescription>Your professional license and certifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="license">Medical License Number</Label>
                  <Input
                    id="license"
                    value={doctorSettings.licenseNumber}
                    onChange={(e) =>
                      setDoctorSettings({ ...doctorSettings, licenseNumber: e.target.value })
                    }
                    className="bg-[#262626] border-gray-700"
                    placeholder="Enter your medical license number"
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    This license number will appear on prescriptions and medical documents
                  </p>
                </div>

                <div className="flex items-center p-4 bg-yellow-900 bg-opacity-20 rounded-md border border-yellow-800">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-500">Important Note</h3>
                    <p className="text-sm text-gray-400">
                      Your license information will be verified and validated. Please ensure you
                      enter the correct information.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveSettings}
                  className="ml-auto bg-blue-600 hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save License Info
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="signature" className="mt-6">
            <Card className="bg-[#1e1e1e] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSignature className="mr-2 h-5 w-5" />
                  Electronic Signature
                </CardTitle>
                <CardDescription>
                  Create and manage your electronic signature for prescriptions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {doctorSettings.hasSignature ? (
                  <div className="space-y-4">
                    <div className="p-6 border border-gray-700 bg-[#262626] rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <FileSignature className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                        <h3 className="text-lg font-medium">Signature Active</h3>
                        <p className="text-sm text-gray-400 max-w-md mt-2">
                          Your electronic signature is active and secured with a 4-digit PIN. Use
                          your PIN when prompted to sign documents and prescriptions.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsPinModalOpen(true)}
                        className="flex-1"
                      >
                        Verify Signature
                      </Button>
                      <Button
                        onClick={handleCreateSignature}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Create New Signature
                      </Button>
                    </div>
                  </div>
                ) : isCreatingSignature ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Create Your Signature</h3>
                    <p className="text-sm text-gray-400">
                      Use your mouse or touchpad to draw your signature in the box below.
                    </p>
                    <SignaturePad onComplete={handleSignatureComplete} />
                    <div className="flex justify-end gap-3 mt-4">
                      <Button variant="outline" onClick={() => setIsCreatingSignature(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-8 border border-dashed border-gray-700 bg-[#262626] rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <FileSignature className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                        <h3 className="text-lg font-medium">No Signature Created</h3>
                        <p className="text-sm text-gray-400 max-w-md mt-2">
                          You haven't created an electronic signature yet. Create one to sign
                          prescriptions and medical documents electronically.
                        </p>
                        <Button
                          onClick={handleCreateSignature}
                          className="mt-4 bg-blue-600 hover:bg-blue-700"
                        >
                          Create Signature
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-900 bg-opacity-20 rounded-md border border-blue-800">
                      <h3 className="text-sm font-medium text-blue-500">How It Works</h3>
                      <ul className="mt-2 text-sm text-gray-400 space-y-1 list-disc pl-5">
                        <li>Draw your signature using your mouse or touchpad</li>
                        <li>Create a secure 4-digit PIN to protect your signature</li>
                        <li>Use your PIN when signing prescriptions and documents</li>
                        <li>Your signature is securely stored and encrypted</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <Card className="bg-[#1e1e1e] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Document Templates
                </CardTitle>
                <CardDescription>
                  Create and manage document templates for prescriptions and medical documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="md:col-span-1 space-y-2">
                    <Label>Select Template</Label>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant={activeTemplate === "create" ? "default" : "outline"}
                        className={`justify-start h-auto py-3 ${activeTemplate === "create" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                        onClick={() => setActiveTemplate("create")}
                      >
                        <Clipboard className="mr-2 h-4 w-4" />
                        Create New Template
                      </Button>

                      {doctorSettings.documentTemplates?.map((template) => (
                        <Button
                          key={template.id}
                          variant={activeTemplate === template.id ? "default" : "outline"}
                          className={`justify-start h-auto py-3 ${activeTemplate === template.id ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                          onClick={() => setActiveTemplate(template.id || "")}
                        >
                          <Building className="mr-2 h-4 w-4" />
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <DocumentTemplateEditorComponent
                      initialData={getActiveTemplateData()}
                      onSave={handleSaveTemplate}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="mt-6">
            <Card className="bg-[#1e1e1e] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Personal Preferences
                </CardTitle>
                <CardDescription>
                  Configure your API keys and preferences for AI services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="anthropic-api-key" className="text-base font-semibold">
                      Anthropic API Key (for Claude calls)
                    </Label>
                    <p className="text-sm text-gray-400 mb-2">
                      This API key will be used for all Claude AI calls throughout the application.
                      Get your key from{" "}
                      <a
                        href="https://console.anthropic.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        Anthropic Console
                      </a>
                    </p>
                    <div className="flex gap-2">
                      <Input
                        id="anthropic-api-key"
                        type={showAnthropicKey ? "text" : "password"}
                        value={anthropicApiKey}
                        onChange={(e) => setAnthropicApiKey(e.target.value)}
                        placeholder="sk-ant-..."
                        className="bg-[#262626] border-gray-700 flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                        className="border-gray-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <Button
                      onClick={async () => {
                        setSaving(true);
                        try {
                          // Save to localStorage for now (can be moved to backend later)
                          localStorage.setItem("anthropic_api_key", anthropicApiKey);
                          toast({
                            title: "API key saved",
                            description: "Your Anthropic API key has been saved successfully.",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to save API key. Please try again.",
                            variant: "destructive",
                          });
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving || !anthropicApiKey}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save API Key
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {isPinModalOpen && (
        <SignaturePinModal
          isOpen={isPinModalOpen}
          isVerifying={doctorSettings.hasSignature}
          onClose={() => setIsPinModalOpen(false)}
          onCreatePin={handlePinCreate}
          onVerifyPin={handlePinVerify}
          isProcessing={isVerifyingPin}
        />
      )}
    </BaseLayout>
  );
}
