import { useState } from 'react';
import { Paperclip, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface LeftPanelProps {
  onSendMessage: (message: string, messageType: string) => void;
  isSending: boolean;
}

export default function LeftPanel({ onSendMessage, isSending }: LeftPanelProps) {
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState('General Response');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageContent.trim()) {
      onSendMessage(messageContent, messageType);
      setMessageContent('');
    }
  };
  
  return (
    <div className="w-full lg:w-1/4 bg-white rounded-lg shadow-sm mb-4 lg:mb-0 lg:mr-4 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-medium text-gray-900">Manual Input</h2>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {/* Form for manual message input */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="messageType" className="block text-sm font-medium text-gray-700 mb-1">
              Message Type
            </Label>
            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger id="messageType" className="w-full">
                <SelectValue placeholder="Select message type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General Response">General Response</SelectItem>
                <SelectItem value="Prescription">Prescription</SelectItem>
                <SelectItem value="Lab Results">Lab Results</SelectItem>
                <SelectItem value="Follow-up Instructions">Follow-up Instructions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mb-4">
            <Label htmlFor="messageContent" className="block text-sm font-medium text-gray-700 mb-1">
              Message Content
            </Label>
            <Textarea
              id="messageContent"
              rows={6}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Type your message here..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
            />
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="text-xs"
            >
              <Paperclip className="h-4 w-4 mr-1" />
              Attach
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="text-xs"
            >
              <Mic className="h-4 w-4 mr-1" />
              Voice
            </Button>
          </div>
          
          <div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSending || !messageContent.trim()}
            >
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
        
        {/* Voice Commands Section */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Voice Commands</h3>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-500 mr-2">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </span>
              "Generate prescription for amoxicillin"
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-500 mr-2">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </span>
              "Schedule follow-up in two weeks"
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-500 mr-2">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </span>
              "Summarize patient history"
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
