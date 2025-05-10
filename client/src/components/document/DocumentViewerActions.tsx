import { useState } from 'react';
import { 
  Mail, 
  FileText, 
  Printer, 
  Phone, // Using Phone instead of Fax (not available in lucide-react)
  DownloadCloud, 
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export interface DocumentViewerActionsProps {
  documentId: string;
  documentType: string;
  patientId: number;
  documentName: string;
  documentUrl: string;
  showFaxButton?: boolean;
  faxNumber?: string;
  hasPatientEmail?: boolean;
  className?: string;
}

export default function DocumentViewerActions({
  documentId,
  documentType,
  patientId,
  documentName,
  documentUrl,
  showFaxButton = false,
  faxNumber,
  hasPatientEmail = false,
  className = '',
}: DocumentViewerActionsProps) {
  const { toast } = useToast();
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingFax, setIsSendingFax] = useState(false);
  
  // Handle email PDF to patient
  const handleEmailPdf = async () => {
    if (!hasPatientEmail) {
      toast({
        title: 'Patient email not available',
        description: 'This patient does not have an email address on file.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSendingEmail(true);
    
    try {
      const response = await apiRequest('POST', '/api/documents/email', {
        patientId,
        documentId,
        documentType,
        documentName
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Document emailed',
          description: 'The document has been emailed to the patient successfully.',
        });
      } else {
        toast({
          title: 'Email failed',
          description: result.message || 'Failed to email document to patient.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error emailing document:', error);
      toast({
        title: 'Email failed',
        description: 'There was an error emailing the document to the patient.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };
  
  // Handle eFax to pharmacy or other provider
  const handleFax = async () => {
    if (!showFaxButton || !faxNumber) {
      toast({
        title: 'Fax number not available',
        description: 'No fax number is available for this document.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSendingFax(true);
    
    try {
      const response = await apiRequest('POST', '/api/documents/fax', {
        patientId,
        documentId,
        documentType,
        documentName,
        faxNumber
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Document faxed',
          description: `The document has been faxed to ${faxNumber} successfully.`,
        });
      } else {
        toast({
          title: 'Fax failed',
          description: result.message || 'Failed to fax document.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error faxing document:', error);
      toast({
        title: 'Fax failed',
        description: 'There was an error faxing the document.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingFax(false);
    }
  };
  
  // Handle document print
  const handlePrint = () => {
    window.open(documentUrl, '_blank');
  };
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* View/Download PDF button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="border-[#444] hover:bg-[#252525] flex items-center"
      >
        <FileText className="mr-2 h-4 w-4" />
        View PDF
      </Button>
      
      {/* Email PDF button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleEmailPdf}
        disabled={isSendingEmail || !hasPatientEmail}
        className={`border-[#444] ${
          hasPatientEmail 
            ? 'hover:bg-blue-900/20 hover:text-blue-400 hover:border-blue-800' 
            : 'opacity-50 cursor-not-allowed'
        } flex items-center`}
      >
        {isSendingEmail ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="mr-2 h-4 w-4" />
        )}
        Email PDF
      </Button>
      
      {/* Fax button - only shown if showFaxButton is true */}
      {showFaxButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleFax}
          disabled={isSendingFax || !faxNumber}
          className={`border-[#444] ${
            faxNumber 
              ? 'hover:bg-purple-900/20 hover:text-purple-400 hover:border-purple-800' 
              : 'opacity-50 cursor-not-allowed'
          } flex items-center`}
        >
          {isSendingFax ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Phone className="mr-2 h-4 w-4" />
          )}
          eFax
        </Button>
      )}
    </div>
  );
}