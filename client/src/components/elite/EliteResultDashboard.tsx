import React, { useState, useEffect } from 'react';
import { EliteCard } from './EliteCard';
import { EliteButton } from './EliteButton';
import {
    Wand2,
    Move,
    EyeOff,
    Eye,
    Maximize2,
    Minimize2,
    RefreshCw,
    Check,
    X,
    GripVertical,
    Copy,
    CheckCircle2,
    MessageSquare,
    Bot,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { EliteSpruceMessenger } from './EliteSpruceMessenger';
import { EliteAIChat } from './EliteAIChat';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface ReportSection {
    id: string;
    title: string;
    content: string;
    isVisible: boolean;
    isExpanded: boolean;
    usageCount?: number; // For learning system
}

interface EliteResultDashboardProps {
    initialSections?: ReportSection[];
    onRefineSection: (sectionId: string, instruction: string) => Promise<string>;
}

function SortableSection({
    section,
    onToggleVisibility,
    onToggleExpand,
    onRequestRefinement,
    onOpenSpruce, // New handler
    index
}: {
    section: ReportSection;
    onToggleVisibility: (id: string) => void;
    onToggleExpand: (id: string) => void;
    onRequestRefinement: (id: string, instruction: string) => void;
    onOpenSpruce: (content: string) => void; // New handler
    index: number; // For hotkey display
}) {
    const { toast } = useToast();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: section.id });

    const [isRefining, setIsRefining] = useState(false);
    const [refinementPrompt, setRefinementPrompt] = useState("");
    const [hasCopied, setHasCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(section.content);
        setHasCopied(true);
        toast({
            title: "Copied!",
            description: `${section.title} copied. System will prioritize this section.`,
            variant: "default",
            duration: 1500,
        });

        // Learning System: Update local count and notify parent to re-sort if needed (next load)
        const currentCounts = JSON.parse(localStorage.getItem('elite_dashboard_stats') || '{}');
        currentCounts[section.id] = (currentCounts[section.id] || 0) + 1;
        localStorage.setItem('elite_dashboard_stats', JSON.stringify(currentCounts));

        setTimeout(() => setHasCopied(false), 2000);
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.8 : 1,
        gridColumn: section.isExpanded ? 'span 3' : 'span 1', // Expand to full width if needed
        gridRow: section.isExpanded ? 'span 2' : 'span 1'
    };

    // Hotkey Listener for this specific card
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user pressed the number key corresponding to this card's index (1-9)
            // index is 0-based, so we check for index + 1
            if (e.key === (index + 1).toString() && !isRefining && !e.ctrlKey && !e.metaKey && !e.altKey) {
                handleCopy();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [index, section.content, isRefining]); // Re-bind if content changes

    if (!section.isVisible) return null;

    return (
        <div ref={setNodeRef} style={style} className="h-full">
            <EliteCard className={cn(
                "h-full flex flex-col transition-all duration-300",
                isDragging && "ring-2 ring-primary bg-black/80"
            )} hover={!isDragging}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded flex-shrink-0">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground truncate" title={section.title}>
                            <span className="inline-flex items-center justify-center w-5 h-5 mr-2 text-[10px] font-mono bg-white/10 rounded text-muted-foreground border border-white/5">
                                {index + 1}
                            </span>
                            {section.title}
                        </h3>
                        {section.usageCount && section.usageCount > 5 && (
                            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full flex-shrink-0 animate-pulse">
                                Hot
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all font-bold text-xs shadow-lg",
                                hasCopied
                                    ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-primary/25"
                            )}
                            title={`Copy Content (Press ${index + 1})`}
                        >
                            {hasCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {hasCopied ? "Copied" : "Copy"}
                        </button>

                        <button
                            onClick={() => onOpenSpruce(section.content)}
                            className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium text-muted-foreground"
                            title="Send via Spruce Health"
                        >
                            <MessageSquare className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => setIsRefining(!isRefining)}
                            className={cn(
                                "p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium",
                                isRefining ? "bg-primary/20 text-primary" : "hover:bg-white/10 text-muted-foreground"
                            )}
                            title="AI Refinement"
                        >
                            <Wand2 className="w-4 h-4" />
                            {isRefining && "Refine"}
                        </button>
                        <button
                            onClick={() => onToggleExpand(section.id)}
                            className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground"
                        >
                            {section.isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => onToggleVisibility(section.id)}
                            className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* AI Refinement Input Area */}
                {isRefining && (
                    <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-xl animate-in slide-in-from-top-2">
                        <textarea
                            value={refinementPrompt}
                            onChange={(e) => setRefinementPrompt(e.target.value)}
                            placeholder={`Tell AI how to change the ${section.title} section... (e.g., "Make it a bulleted list")`}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-primary"
                            rows={2}
                        />
                        <div className="flex justify-end gap-2">
                            <EliteButton
                                variant="ghost"
                                onClick={() => setIsRefining(false)}
                                className="h-8 px-3 text-xs"
                            >
                                Cancel
                            </EliteButton>
                            <EliteButton
                                variant="primary"
                                onClick={() => {
                                    onRequestRefinement(section.id, refinementPrompt);
                                    setIsRefining(false);
                                    setRefinementPrompt("");
                                }}
                                className="h-8 px-3 text-xs"
                            >
                                <Wand2 className="w-3 h-3 mr-2" /> Apply Changes
                            </EliteButton>
                        </div>
                    </div>
                )}

                {section.isExpanded ? (
                    <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed p-2 bg-black/20 rounded-lg border border-white/5 font-mono text-xs flex-1 overflow-auto max-h-[400px]">
                        {section.content}
                    </div>
                ) : (
                    <div className="text-muted-foreground text-xs line-clamp-4 leading-relaxed p-2 bg-black/10 rounded-lg border border-white/5 font-mono flex-1">
                        {section.content}
                    </div>
                )}
            </EliteCard>
        </div>
    );
}

export function EliteResultDashboard({
    initialSections = [
        { id: 'patient-msg', title: 'Patient Message', content: 'Bonjour...', isVisible: true, isExpanded: false },
        { id: 'soap', title: 'SOAP Note', content: 'S: ...', isVisible: true, isExpanded: false },
        { id: 'referrals', title: 'Referrals', content: 'Dr. X...', isVisible: true, isExpanded: false },
        { id: 'rx', title: 'Prescriptions', content: 'Amox...', isVisible: true, isExpanded: false },
        { id: 'labs', title: 'Lab Req', content: 'CBC...', isVisible: true, isExpanded: false },
        { id: 'imaging', title: 'Imaging', content: 'X-Ray...', isVisible: true, isExpanded: false },
        { id: 'note', title: 'Work Note', content: 'Off work...', isVisible: true, isExpanded: false },
        { id: 'edu', title: 'Education', content: 'Rest...', isVisible: true, isExpanded: false },
        { id: 'followup', title: 'Follow Up', content: 'In 2 days...', isVisible: true, isExpanded: false },
    ],
    onRefineSection
}: EliteResultDashboardProps) {
    // 1. Load Learning Data & Sort
    const [sections, setSections] = useState<ReportSection[]>(() => {
        const stats = JSON.parse(localStorage.getItem('elite_dashboard_stats') || '{}');
        const sorted = [...initialSections].map(s => ({
            ...s,
            usageCount: stats[s.id] || 0
        })).sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        return sorted;
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSections((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const toggleVisibility = (id: string) => {
        setSections(sections.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s));
    };

    const toggleExpand = (id: string) => {
        setSections(sections.map(s => s.id === id ? { ...s, isExpanded: !s.isExpanded } : s));
    };

    const handleRequestRefinement = async (id: string, instruction: string) => {
        // Optimistic update or loading state could go here
        const newContent = await onRefineSection(id, instruction);
        setSections(sections.map(s => s.id === id ? { ...s, content: newContent } : s));
    };

    // Hidden sections management
    const hiddenSections = sections.filter(s => !s.isVisible);

    const [spruceOpen, setSpruceOpen] = useState(false);
    const [spruceDraft, setSpruceDraft] = useState("");
    const [aiChatOpen, setAiChatOpen] = useState(false);

    const handleOpenSpruce = (content: string) => {
        setSpruceDraft(content);
        setSpruceOpen(true);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden relative">
            <EliteSpruceMessenger
                isOpen={spruceOpen}
                onClose={() => setSpruceOpen(false)}
                initialDraft={spruceDraft}
            />

            <EliteAIChat
                isOpen={aiChatOpen}
                onClose={() => setAiChatOpen(false)}
                currentSections={sections}
                onUpdateSections={setSections}
            />

            {/* AI Co-pilot Floating Button */}
            {!aiChatOpen && (
                <button
                    onClick={() => setAiChatOpen(true)}
                    className="absolute bottom-6 right-6 z-40 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all font-bold animate-in slide-in-from-bottom duration-500"
                >
                    <Bot className="w-5 h-5" />
                    <span className="hidden md:inline">Ask AI Co-pilot</span>
                </button>
            )}

            <div className="max-w-4xl mx-auto p-6 space-y-6 flex-1 overflow-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-foreground tracking-tight mb-2">Clinical Report</h2>
                        <p className="text-muted-foreground">Drag to reorder sections. Use the wand to refine utilizing Haiku 4.5.</p>
                    </div>

                    {hiddenSections.length > 0 && (
                        <div className="flex gap-2">
                            {hiddenSections.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => toggleVisibility(s.id)}
                                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors flex items-center gap-1"
                                >
                                    <EyeOff className="w-3 h-3" />
                                    Show {s.title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sections.map(s => s.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sections.map((section, index) => (
                                <SortableSection
                                    key={section.id}
                                    index={index}
                                    section={section}
                                    onToggleVisibility={toggleVisibility}
                                    onToggleExpand={toggleExpand}
                                    onRequestRefinement={handleRequestRefinement}
                                    onOpenSpruce={handleOpenSpruce}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}
