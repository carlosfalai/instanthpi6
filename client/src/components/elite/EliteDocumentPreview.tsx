import React, { useState } from 'react';
import { EliteCard } from './EliteCard';
import { EliteButton } from './EliteButton';
import { X, Send, FileText, PenTool, CheckCircle2, Download, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface EliteDocumentPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    documentTitle: string;
    documentContent: string;
    patientName: string;
}

export function EliteDocumentPreview({ isOpen, onClose, documentTitle, documentContent, patientName }: EliteDocumentPreviewProps) {
    const [isSigned, setIsSigned] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    if (!isOpen) return null;

    const handleSignAndSend = async () => {
        setIsSending(true);

        // Mock sequence: Sign -> Generate PDF -> Send
        setTimeout(() => {
            setIsSigned(true);
            // Simulate API call to Spruce
            setTimeout(() => {
                setIsSending(false);
                toast({
                    title: "Sent via Spruce",
                    description: `Reference: ${documentTitle} sent to ${patientName}.`,
                });
                onClose();
            }, 1000);
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
            <EliteCard className="w-full max-w-2xl flex flex-col overflow-hidden border-primary/20 shadow-2xl shadow-primary/20 aspect-[8.5/11] max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">{documentTitle}</h2>
                            <p className="text-xs text-muted-foreground">{patientName} • {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Document Preview (Mock PDF Look) */}
                <div className="flex-1 overflow-y-auto p-8 bg-white text-black font-serif text-sm leading-relaxed shadow-inner">
                    <div className="max-w-[80%] mx-auto">
                        <div className="text-center border-b-2 border-black pb-4 mb-6">
                            <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">Medical Document</h1>
                            <p className="text-xs uppercase tracking-widest">InstantConsult Elite Medical Group</p>
                        </div>

                        <div className="whitespace-pre-wrap min-h-[400px]">
                            {documentContent}
                        </div>

                        <div className="mt-12 pt-8 border-t border-black flex justify-between items-end">
                            <div>
                                <p className="font-bold">Dr. Carlos Faviel Font</p>
                                <p className="text-xs">License: 123456</p>
                            </div>
                            <div className="flex flex-col items-center">
                                {isSigned ? (
                                    <div className="text-blue-900 font-script text-2xl rotate-[-5deg] animate-in zoom-in duration-300">
                                        Carlos Faviel Font
                                    </div>
                                ) : (
                                    <div className="h-12 w-48 border-b border-dashed border-gray-400 mb-1" />
                                )}
                                <p className="text-xs uppercase tracking-widest">Signature</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-white/10 bg-black/40 flex justify-between items-center">
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors">
                            <Printer className="w-5 h-5" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors">
                            <Download className="w-5 h-5" />
                        </button>
                    </div>

                    <EliteButton
                        variant="primary"
                        size="lg"
                        className="pl-6 pr-8 text-base shadow-lg shadow-primary/20"
                        onClick={handleSignAndSend}
                        disabled={isSending}
                    >
                        {isSending ? (
                            <>Sending...</>
                        ) : (
                            <>
                                <PenTool className="w-5 h-5 mr-2" />
                                <span className="opacity-50 mx-1">|</span>
                                <Send className="w-5 h-5 mr-2" />
                                Sign & Send to Patient
                            </>
                        )}
                    </EliteButton>
                </div>
            </EliteCard>
        </div>
    );
}
