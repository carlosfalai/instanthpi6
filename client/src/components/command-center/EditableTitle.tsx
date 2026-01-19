import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface EditableTitleProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  inputClassName?: string;
  minLength?: number;
  maxLength?: number;
}

export function EditableTitle({
  value,
  onChange,
  className = "",
  inputClassName = "",
  minLength = 1,
  maxLength = 30,
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    saveAndExit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveAndExit();
    } else if (e.key === "Escape") {
      // Cancel edit, restore original value
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const saveAndExit = () => {
    const trimmed = editValue.trim();
    if (trimmed.length >= minLength && trimmed !== value) {
      onChange(trimmed);
    } else {
      // Restore original value if invalid
      setEditValue(value);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value.slice(0, maxLength))}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "bg-[#0a0908] border border-[#d4af37]/50 rounded px-1 py-0",
          "text-[10px] font-bold text-[#d4af37] uppercase tracking-widest",
          "focus:outline-none focus:ring-1 focus:ring-[#d4af37]",
          "w-full min-w-[60px] max-w-[150px]",
          inputClassName
        )}
        style={{ height: "16px" }}
      />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className={cn(
        "cursor-text select-none truncate",
        "hover:text-[#e6c75a] transition-colors",
        "border-b border-transparent hover:border-dashed hover:border-[#d4af37]/30",
        className
      )}
      title="Double-click to rename"
    >
      {value}
    </span>
  );
}

export default EditableTitle;
