import { useState } from 'react';
import { RefreshCcw, Eye, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface MiddlePanelProps {
  patient: any;
  documentation: any;
  isLoading: boolean;
  onRegenerateDocumentation: () => void;
  onUpdateDocumentation: (id: number, updates: any) => void;
  onSendApprovedItems: () => void;
  isUpdating: boolean;
  isSending: boolean;
}

export default function MiddlePanel({
  patient,
  documentation,
  isLoading,
  onRegenerateDocumentation,
  onUpdateDocumentation,
  onSendApprovedItems,
  isUpdating,
  isSending
}: MiddlePanelProps) {
  const [approved, setApproved] = useState({
    hpi: false,
    soap: false,
    prescription: false,
    followUpQuestions: false
  });
  
  const handleApproval = (section: keyof typeof approved, value: boolean) => {
    setApproved(prev => ({ ...prev, [section]: value }));
  };
  
  const hasApprovedItems = Object.values(approved).some(val => val);

  return (
    <div className="w-full lg:w-2/4 bg-white rounded-lg shadow-sm mb-4 lg:mb-0 lg:mr-4 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">AI Suggestions</h2>
        <div className="flex space-x-2">
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-400 mr-1" />
            AI Ready
          </Badge>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        {/* Patient Info Summary */}
        <div className="bg-gray-50 rounded-md p-3 mb-4">
          <div className="flex justify-between items-start">
            <div>
              {isLoading || !patient ? (
                <>
                  <Skeleton className="h-5 w-40 mb-1" />
                  <Skeleton className="h-4 w-60" />
                </>
              ) : (
                <>
                  <h3 className="font-medium text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-500">
                    {patient.gender} • Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
            <Button variant="outline" size="icon" className="rounded-full bg-blue-500 text-white hover:bg-blue-600">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-32 w-full" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        ) : (
          <>
            {documentation ? (
              <>
                {/* HPI Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
                      History of Present Illness
                    </h3>
                    <div className="flex items-center">
                      <Checkbox 
                        id="hpi-approve" 
                        checked={approved.hpi}
                        onCheckedChange={(checked) => handleApproval('hpi', checked as boolean)}
                      />
                      <Label htmlFor="hpi-approve" className="ml-2 text-xs text-gray-700">
                        Approve
                      </Label>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-md p-3 text-sm text-gray-700">
                    <p>{documentation.hpi}</p>
                  </div>
                </div>
                
                {/* SOAP Notes Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
                      SOAP Notes
                    </h3>
                    <div className="flex items-center">
                      <Checkbox 
                        id="soap-approve" 
                        checked={approved.soap}
                        onCheckedChange={(checked) => handleApproval('soap', checked as boolean)}
                      />
                      <Label htmlFor="soap-approve" className="ml-2 text-xs text-gray-700">
                        Approve
                      </Label>
                    </div>
                  </div>
                  
                  {/* Subjective */}
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-1">Subjective</h4>
                    <div className="bg-white border border-gray-200 rounded-md p-3 text-sm text-gray-700">
                      <p>{documentation.subjective}</p>
                    </div>
                  </div>
                  
                  {/* Objective */}
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-1">Objective</h4>
                    <div className="bg-white border border-gray-200 rounded-md p-3 text-sm text-gray-700">
                      <p>{documentation.objective}</p>
                    </div>
                  </div>
                  
                  {/* Assessment */}
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-1">Assessment</h4>
                    <div className="bg-white border border-gray-200 rounded-md p-3 text-sm text-gray-700">
                      <p>{documentation.assessment}</p>
                    </div>
                  </div>
                  
                  {/* Plan */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-1">Plan</h4>
                    <div className="bg-white border border-gray-200 rounded-md p-3 text-sm text-gray-700">
                      <p>{documentation.plan}</p>
                    </div>
                  </div>
                </div>
                
                {/* Prescription Section */}
                {documentation.prescription && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
                        Prescription
                      </h3>
                      <div className="flex items-center">
                        <Checkbox 
                          id="rx-approve" 
                          checked={approved.prescription}
                          onCheckedChange={(checked) => handleApproval('prescription', checked as boolean)}
                        />
                        <Label htmlFor="rx-approve" className="ml-2 text-xs text-gray-700">
                          Approve
                        </Label>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-md p-3 text-sm">
                      <div className="flex justify-between pb-2 border-b border-gray-200">
                        <span className="font-medium">Medication</span>
                        <span className="font-medium">Dosage</span>
                      </div>
                      <div className="py-2 border-b border-gray-100 flex justify-between">
                        <span className="text-gray-700">{documentation.prescription.medication}</span>
                        <span className="text-gray-700">{documentation.prescription.dosage}</span>
                      </div>
                      <div className="py-2 border-b border-gray-100">
                        <span className="text-gray-700 block">
                          Instructions: {documentation.prescription.instructions}
                        </span>
                        <span className="text-gray-700 block mt-1">
                          Dispense: {documentation.prescription.dispense}
                        </span>
                        <span className="text-gray-700 block mt-1">
                          Refills: {documentation.prescription.refills}
                        </span>
                      </div>
                      <div className="pt-2 flex justify-end">
                        <Button variant="outline" size="sm" className="text-xs">
                          Edit
                        </Button>
                        <Button size="sm" className="ml-2 text-xs">
                          E-Prescribe
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Follow-up Questions */}
                {documentation.followUpQuestions && documentation.followUpQuestions.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
                        Suggested Follow-up Questions
                      </h3>
                      <div className="flex items-center">
                        <Checkbox 
                          id="questions-approve" 
                          checked={approved.followUpQuestions}
                          onCheckedChange={(checked) => handleApproval('followUpQuestions', checked as boolean)}
                        />
                        <Label htmlFor="questions-approve" className="ml-2 text-xs text-gray-700">
                          Approve
                        </Label>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-md p-3 text-sm">
                      <ul className="space-y-2">
                        {documentation.followUpQuestions.map((question: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-700">{question}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex justify-end">
                        <Button size="sm" className="text-xs">
                          Send All
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-gray-500 mb-4">No AI documentation generated yet.</p>
                <Button onClick={onRegenerateDocumentation}>
                  Generate Documentation
                </Button>
              </div>
            )}
          </>
        )}
      </ScrollArea>
      
      {/* Action buttons for the AI suggestions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={onRegenerateDocumentation}
            disabled={isLoading}
          >
            <RefreshCcw className="h-5 w-5 mr-2 text-gray-400" />
            Regenerate
          </Button>
          
          <Button
            onClick={onSendApprovedItems}
            disabled={!hasApprovedItems || isUpdating || isSending}
            className={cn(
              "bg-emerald-500 hover:bg-emerald-600",
              (!hasApprovedItems || isUpdating || isSending) && "opacity-50 cursor-not-allowed"
            )}
          >
            <Check className="h-5 w-5 mr-2" />
            {isUpdating || isSending ? 'Sending...' : 'Send Approved Items'}
          </Button>
        </div>
      </div>
    </div>
  );
}
