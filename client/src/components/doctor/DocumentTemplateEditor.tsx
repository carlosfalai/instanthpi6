import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Save, Eye, Trash2, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentTemplateEditorProps {
  templateId?: string;
  initialData?: DocumentTemplate;
  onSave: (template: DocumentTemplate) => void;
}

export interface DocumentTemplate {
  id?: string;
  name: string;
  logoUrl?: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicFax: string;
  clinicEmail: string;
  footerText: string;
  headerColor: string;
  footerColor: string;
}

const DocumentTemplateEditor: React.FC<DocumentTemplateEditorProps> = ({
  templateId,
  initialData,
  onSave,
}) => {
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
  const [logoPreview, setLogoPreview] = useState<string | undefined>(
    initialData?.logoUrl
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
      if (!file.type.startsWith('image/')) {
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
        setLogoPreview(e.target?.result as string);
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
      let logoUrl = template.logoUrl;
      
      if (logoFile) {
        // Simulating logo upload - in a real app, this would be an API call
        logoUrl = logoPreview;
      }
      
      const templateToSave: DocumentTemplate = {
        ...template,
        logoUrl,
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
              <p>Medication Name: <span className="font-semibold">Amoxicillin 500mg</span></p>
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
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveLogo}
                  >
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
                  <p className="text-gray-500 text-sm text-center">
                    No logo uploaded
                  </p>
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
};

export default DocumentTemplateEditor;