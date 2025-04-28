import React from 'react';
import { MessageSquare, CheckCircle2, Clock, AlertCircle, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type ConversationStatus = 
  | 'initial' // Initial conversation, first contact
  | 'waiting_patient_info' // Waiting for patient to provide additional info (pharmacy, etc.)
  | 'treatment_proposed' // Doctor has proposed a treatment plan
  | 'waiting_clarification' // Waiting for patient to clarify something
  | 'plan_acknowledged' // Patient has acknowledged the plan
  | 'closed' // Conversation closed/resolved
  | 'unknown'; // Status can't be determined

interface ConversationStatusBarProps {
  status: ConversationStatus;
  statusDetail?: string; // Additional details about the status
  patientName: string;
}

export default function ConversationStatusBar({ 
  status = 'unknown', 
  statusDetail = '', 
  patientName = 'Patient'
}: ConversationStatusBarProps) {
  
  // Status configuration: icon, color, label
  const statusConfig = {
    initial: {
      icon: <MessageSquare className="h-4 w-4" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      label: 'Initial Conversation'
    },
    waiting_patient_info: {
      icon: <Clock className="h-4 w-4" />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-900/20',
      label: 'Waiting for Info'
    },
    treatment_proposed: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      label: 'Treatment Proposed'
    },
    waiting_clarification: {
      icon: <HelpCircle className="h-4 w-4" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      label: 'Clarification Needed'
    },
    plan_acknowledged: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      label: 'Plan Acknowledged'
    },
    closed: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: 'text-gray-400',
      bgColor: 'bg-gray-900/20',
      label: 'Closed'
    },
    unknown: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'text-gray-400',
      bgColor: 'bg-gray-900/20',
      label: 'Status Unknown'
    }
  };

  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <div className="w-full sticky top-0 z-10 bg-[#121212] border-b border-gray-800 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`flex items-center px-2 py-1 rounded-md ${config.bgColor} ${config.color} text-xs font-medium mr-2`}>
            {config.icon}
            <span className="ml-1.5">{config.label}</span>
          </div>
          
          {statusDetail && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-gray-400 text-xs truncate max-w-[250px] cursor-help">
                    {statusDetail}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[300px]">{statusDetail}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <div className="text-sm font-medium text-gray-300 truncate">
          {patientName}
        </div>
      </div>
    </div>
  );
}