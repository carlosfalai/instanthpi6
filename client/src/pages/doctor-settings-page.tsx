import { useState, useEffect } from "react";
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
  Building
} from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import SignaturePad from "@/components/doctor/SignaturePad";
import SignaturePinModal from "@/components/doctor/SignaturePinModal";
import DocumentTemplateEditor, { DocumentTemplate } from "@/components/doctor/DocumentTemplateEditor";

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

  const [doctorSettings, setDoctorSettings] = useState<DoctorSettings>({
    id: 1,
    name: "Dr. John Doe",
    licenseNumber: "",
    email: "john.doe@example.com",
    phoneNumber: "555-123-4567",
    specialty: "Family Medicine",
    hasSignature: false,
    documentTemplates: []
  });

  useEffect(() => {
    // Simulate loading doctor settings data
    setTimeout(() => {
      setLoading(false);
      
      // Simulate existing template data
      setDoctorSettings(prev => ({
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
            footerColor: "#0f766e"
          }
        ]
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
      signatureId: Date.now().toString()
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
      
      setDoctorSettings(prev => ({
        ...prev,
        documentTemplates: [...(prev.documentTemplates || []), newTemplate]
      }));
      
      setActiveTemplate(newTemplate.id);
    } else {
      // Updating existing template
      setDoctorSettings(prev => ({
        ...prev,
        documentTemplates: prev.documentTemplates?.map(t => 
          t.id === activeTemplate ? { ...template, id: t.id } : t
        )
      }));
    }
  };

  const getActiveTemplateData = () => {
    if (activeTemplate === "create") {
      return undefined;
    }
    return doctorSettings.documentTemplates?.find(t => t.id === activeTemplate);
  };

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
          <TabsList className="grid grid-cols-4 w-full max-w-md bg-[#262626]">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="license">License</TabsTrigger>
            <TabsTrigger value="signature">Signature</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-6">
            <Card className="bg-[#1e1e1e] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Doctor Profile
                </CardTitle>
                <CardDescription>
                  Your personal and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={doctorSettings.name}
                      onChange={(e) => setDoctorSettings({...doctorSettings, name: e.target.value})}
                      className="bg-[#262626] border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={doctorSettings.email}
                      onChange={(e) => setDoctorSettings({...doctorSettings, email: e.target.value})}
                      className="bg-[#262626] border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={doctorSettings.phoneNumber}
                      onChange={(e) => setDoctorSettings({...doctorSettings, phoneNumber: e.target.value})}
                      className="bg-[#262626] border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input
                      id="specialty"
                      value={doctorSettings.specialty}
                      onChange={(e) => setDoctorSettings({...doctorSettings, specialty: e.target.value})}
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
                <CardDescription>
                  Your professional license and certifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="license">Medical License Number</Label>
                  <Input
                    id="license"
                    value={doctorSettings.licenseNumber}
                    onChange={(e) => setDoctorSettings({...doctorSettings, licenseNumber: e.target.value})}
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
                      Your license information will be verified and validated. Please ensure you enter the correct information.
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
                          Your electronic signature is active and secured with a 4-digit PIN.
                          Use your PIN when prompted to sign documents and prescriptions.
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
                      <Button 
                        variant="outline"
                        onClick={() => setIsCreatingSignature(false)}
                      >
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
                          You haven't created an electronic signature yet. Create one to sign prescriptions and medical documents electronically.
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
                        className={`justify-start h-auto py-3 ${activeTemplate === "create" ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        onClick={() => setActiveTemplate("create")}
                      >
                        <Clipboard className="mr-2 h-4 w-4" />
                        Create New Template
                      </Button>
                      
                      {doctorSettings.documentTemplates?.map((template) => (
                        <Button
                          key={template.id}
                          variant={activeTemplate === template.id ? "default" : "outline"}
                          className={`justify-start h-auto py-3 ${activeTemplate === template.id ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                          onClick={() => setActiveTemplate(template.id)}
                        >
                          <Building className="mr-2 h-4 w-4" />
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="md:col-span-3">
                    <DocumentTemplateEditor
                      templateId={activeTemplate === "create" ? undefined : activeTemplate}
                      initialData={getActiveTemplateData()}
                      onSave={handleSaveTemplate}
                    />
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