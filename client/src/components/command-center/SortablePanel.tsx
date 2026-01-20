import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Panel } from "react-resizable-panels";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PanelId } from "@/hooks/usePanelLayout";

interface SortablePanelProps {
  id: PanelId;
  name: string;
  size: number;
  minSize: number;
  maxSize: number;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  isLast?: boolean;
}

export function SortablePanel({
  id,
  name,
  size,
  minSize,
  maxSize,
  icon,
  badge,
  subtitle,
  headerActions,
  children,
  className,
  isLast = false,
}: SortablePanelProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <Panel
      id={id}
      defaultSize={size}
      minSize={minSize}
      maxSize={maxSize}
      className={cn(
        "flex flex-col overflow-hidden",
        !isLast && "border-r border-[#1a1a1a]",
        isDragging && "opacity-50",
        isOver && "bg-[#d4af37]/5",
        className
      )}
    >
      <div ref={setNodeRef} style={style} className="flex flex-col h-full">
        {/* Panel Header with Drag Handle */}
        <div className="p-2 border-b border-[#1a1a1a] flex items-start gap-1">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className={cn(
              "flex-shrink-0 p-0.5 rounded cursor-grab active:cursor-grabbing",
              "hover:bg-[#222] transition-colors",
              "focus:outline-none focus:ring-1 focus:ring-[#d4af37]/50",
              isDragging && "cursor-grabbing"
            )}
            title="Drag to reorder"
          >
            <GripVertical className="h-3 w-3 text-[#555] hover:text-[#888]" />
          </button>

          {/* Header Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest flex items-center gap-1">
              {icon}
              <span className="truncate">{name}</span>
              {badge}
            </h2>
            {subtitle && <p className="text-[8px] text-[#555] mt-0.5">{subtitle}</p>}
          </div>

          {/* Header Actions */}
          {headerActions && <div className="flex-shrink-0">{headerActions}</div>}
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
      </div>
    </Panel>
  );
}

// Drag overlay component for better visual feedback
interface DragOverlayPanelProps {
  name: string;
  icon?: React.ReactNode;
}

export function DragOverlayPanel({ name, icon }: DragOverlayPanelProps) {
  return (
    <div className="bg-[#111] border border-[#d4af37] rounded-lg shadow-2xl p-3 min-w-[150px]">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-[#d4af37]" />
        {icon}
        <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider">
          {name}
        </span>
      </div>
    </div>
  );
}

// Simple panel header component for non-draggable scenarios
interface PanelHeaderProps {
  name: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  dragHandleProps?: {
    attributes: Record<string, unknown>;
    listeners: Record<string, unknown>;
  };
  isDragging?: boolean;
}

export function PanelHeader({
  name,
  icon,
  badge,
  subtitle,
  actions,
  dragHandleProps,
  isDragging,
}: PanelHeaderProps) {
  return (
    <div className="p-2 border-b border-[#1a1a1a] flex items-start gap-1">
      {dragHandleProps && (
        <button
          {...dragHandleProps.attributes}
          {...(dragHandleProps.listeners as React.ButtonHTMLAttributes<HTMLButtonElement>)}
          className={cn(
            "flex-shrink-0 p-0.5 rounded cursor-grab active:cursor-grabbing",
            "hover:bg-[#222] transition-colors",
            "focus:outline-none focus:ring-1 focus:ring-[#d4af37]/50",
            isDragging && "cursor-grabbing"
          )}
          title="Drag to reorder"
        >
          <GripVertical className="h-3 w-3 text-[#555] hover:text-[#888]" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest flex items-center gap-1">
          {icon}
          <span className="truncate">{name}</span>
          {badge}
        </h2>
        {subtitle && <p className="text-[8px] text-[#555] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  );
}
