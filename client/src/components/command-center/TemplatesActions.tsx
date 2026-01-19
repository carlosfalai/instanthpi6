import React from 'react';
import { FileText, Zap, Calendar, Pill, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  icon: React.ElementType;
  content: string;
  category: 'general' | 'appointment' | 'medication' | 'urgent' | 'followup';
}

const TEMPLATES: Template[] = [
  {
    id: 'confirm_appointment',
    name: 'Confirm Appointment',
    icon: Calendar,
    content: 'Your appointment is confirmed for [DATE] at [TIME]. Please arrive 15 minutes early. Reply to confirm or call to reschedule.',
    category: 'appointment',
  },
  {
    id: 'prescription_ready',
    name: 'Prescription Ready',
    icon: Pill,
    content: 'Your prescription is ready for pickup at [PHARMACY]. Please bring your ID. Contact us if you have questions about your medication.',
    category: 'medication',
  },
  {
    id: 'test_results',
    name: 'Test Results Available',
    icon: FileText,
    content: 'Your recent test results are now available. Please log into your patient portal to view them, or schedule a follow-up to discuss.',
    category: 'general',
  },
  {
    id: 'followup_reminder',
    name: 'Follow-up Reminder',
    icon: CheckCircle,
    content: 'This is a reminder for your follow-up visit. Please contact us to schedule at your earliest convenience.',
    category: 'followup',
  },
  {
    id: 'urgent_callback',
    name: 'Urgent: Please Call',
    icon: AlertTriangle,
    content: 'Please call our office at your earliest convenience regarding your recent visit. Our number is [PHONE].',
    category: 'urgent',
  },
  {
    id: 'general_response',
    name: 'General Response',
    icon: Zap,
    content: 'Thank you for reaching out. We have received your message and will respond within 24 hours during business hours.',
    category: 'general',
  },
];

interface TemplatesActionsProps {
  onSelectTemplate: (content: string) => void;
  patientName?: string;
}

export function TemplatesActions({
  onSelectTemplate,
  patientName,
}: TemplatesActionsProps) {
  const handleSelect = (template: Template) => {
    let content = template.content;
    if (patientName) {
      content = `Dear ${patientName},\n\n${content}\n\nBest regards,\nInstantHPI Team`;
    }
    onSelectTemplate(content);
  };

  const getCategoryColor = (category: Template['category']) => {
    switch (category) {
      case 'urgent': return 'text-destructive border-destructive/30';
      case 'appointment': return 'text-blue-500 border-blue-500/30';
      case 'medication': return 'text-green-500 border-green-500/30';
      case 'followup': return 'text-amber-500 border-amber-500/30';
      default: return 'text-muted-foreground border-border';
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Quick Templates
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Click to stage a message
        </p>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {TEMPLATES.map((template) => {
            const Icon = template.icon;
            return (
              <Card
                key={template.id}
                className={cn(
                  "cursor-pointer transition-all hover:bg-muted/50 hover:scale-[1.02]",
                  getCategoryColor(template.category)
                )}
                onClick={() => handleSelect(template)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium text-foreground">
                      {template.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.content}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <Button variant="outline" size="sm" className="w-full text-xs">
          <FileText className="h-3 w-3 mr-1" />
          Manage Templates
        </Button>
      </div>
    </div>
  );
}
