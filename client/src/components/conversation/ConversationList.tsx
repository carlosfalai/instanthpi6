import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ChevronDown, ChevronUp, MessageSquare, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isFromPatient: boolean;
  isRead: boolean;
}

interface Conversation {
  patientId: number;
  patientName: string;
  initials: string;
  avatarUrl: string | null;
  avatarColor: string;
  lastMessage: Message;
  hasUnread: boolean;
  isActive: boolean;
}

type SortOption = "newest" | "oldest";
type FilterOption = "all" | "unread";

interface ConversationListProps {
  conversations: Conversation[];
  selectedPatientId: number | null;
  onSelectConversation: (patientId: number) => void;
  showRestore?: boolean;
  onRestoreConversation?: (patientId: number) => void;
  darkMode?: boolean;
}

export default function ConversationList({
  conversations,
  selectedPatientId,
  onSelectConversation,
  showRestore = false,
  onRestoreConversation,
  darkMode = true,
}: ConversationListProps) {
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Memoize sorted and filtered conversations to avoid recalculation on every render
  const sortedAndFilteredConversations = useMemo(() => {
    return [...conversations]
      .filter((conversation) => {
        if (filterOption === "unread") {
          return conversation.hasUnread;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.lastMessage.timestamp).getTime();
        const timeB = new Date(b.lastMessage.timestamp).getTime();
        return sortOption === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [conversations, filterOption, sortOption]);

  // Memoize checkbox toggle handler
  const handleCheckboxChange = useCallback((patientId: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        newSet.add(patientId);
      }
      return newSet;
    });
  }, []);

  // Memoize select/deselect all handler
  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === sortedAndFilteredConversations.length) {
        return new Set();
      }
      return new Set(sortedAndFilteredConversations.map((c) => c.patientId));
    });
  }, [sortedAndFilteredConversations]);

  // Memoize toggle selection mode handler
  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      if (prev) {
        setSelectedIds(new Set());
      }
      return !prev;
    });
  }, []);

  const bgColor = darkMode ? "bg-[#1a1a1a]" : "bg-white";
  const textColor = darkMode ? "text-white" : "text-gray-900";
  const secondaryTextColor = darkMode ? "text-gray-400" : "text-gray-500";
  const borderColor = darkMode ? "border-gray-800" : "border-gray-200";
  const hoverColor = darkMode ? "hover:bg-[#2a2a2a]" : "hover:bg-gray-100";
  const selectedBgColor = darkMode ? "bg-[#263745]" : "bg-blue-50";
  const selectedHoverColor = darkMode ? "hover:bg-[#304050]" : "hover:bg-blue-100";
  const dropdownBgColor = darkMode ? "bg-[#1a1a1a]" : "bg-white";
  const menuItemHoverColor = darkMode ? "hover:bg-[#2a2a2a]" : "hover:bg-gray-100";

  if (sortedAndFilteredConversations.length === 0) {
    return (
      <div
        className={`h-full flex items-center justify-center ${secondaryTextColor} text-sm ${bgColor}`}
      >
        No conversations to display
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${bgColor}`}>
      <div className={`flex items-center px-3 py-2 border-b ${borderColor}`}>
        {selectMode ? (
          <>
            <Checkbox
              checked={
                selectedIds.size === sortedAndFilteredConversations.length &&
                sortedAndFilteredConversations.length > 0
              }
              onCheckedChange={handleSelectAll}
              className={`mr-2 ${darkMode ? "border-gray-600" : "border-gray-300"}`}
            />
            <span className={`text-sm ${textColor}`}>{selectedIds.size} selected</span>
            <Button
              variant="ghost"
              size="sm"
              className={`ml-auto ${textColor}`}
              onClick={toggleSelectMode}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <div className="relative flex-1" ref={dropdownRef}>
              <button
                className={`flex items-center gap-1 px-2 py-1 rounded ${textColor} text-sm`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {filterOption === "all" ? "All" : "Unread Only"},
                {sortOption === "newest" ? " Newest First " : " Oldest First "}
                <ChevronDown className="h-4 w-4" />
              </button>

              {isMenuOpen && (
                <div
                  className={`absolute top-full left-0 z-10 mt-1 w-40 rounded-md shadow-lg ${dropdownBgColor} border ${borderColor}`}
                >
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${filterOption === "all" ? "text-blue-400" : textColor} ${menuItemHoverColor}`}
                      onClick={() => {
                        setFilterOption("all");
                        setIsMenuOpen(false);
                      }}
                    >
                      All
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${filterOption === "unread" ? "text-blue-400" : textColor} ${menuItemHoverColor}`}
                      onClick={() => {
                        setFilterOption("unread");
                        setIsMenuOpen(false);
                      }}
                    >
                      Unread Only
                    </button>
                    <div className={`border-t ${borderColor} my-1`}></div>
                    <button
                      className={`flex items-center justify-between w-full text-left px-4 py-2 text-sm ${sortOption === "newest" ? "text-blue-400" : textColor} ${menuItemHoverColor}`}
                      onClick={() => {
                        setSortOption("newest");
                        setIsMenuOpen(false);
                      }}
                    >
                      <span>Newest First</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      className={`flex items-center justify-between w-full text-left px-4 py-2 text-sm ${sortOption === "oldest" ? "text-blue-400" : textColor} ${menuItemHoverColor}`}
                      onClick={() => {
                        setSortOption("oldest");
                        setIsMenuOpen(false);
                      }}
                    >
                      <span>Oldest First</span>
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className={`${textColor}`} onClick={toggleSelectMode}>
              <Checkbox className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-[1px]">
          {sortedAndFilteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.patientId}
              conversation={conversation}
              isSelected={selectedPatientId === conversation.patientId}
              darkMode={darkMode}
              selectMode={selectMode}
              isChecked={selectedIds.has(conversation.patientId)}
              onCheckboxChange={() => handleCheckboxChange(conversation.patientId)}
              onClick={() => {
                if (selectMode) {
                  handleCheckboxChange(conversation.patientId);
                } else {
                  onSelectConversation(conversation.patientId);
                }
              }}
              showRestore={showRestore}
              onRestore={
                onRestoreConversation
                  ? () => onRestoreConversation(conversation.patientId)
                  : undefined
              }
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  darkMode: boolean;
  selectMode: boolean;
  isChecked: boolean;
  onCheckboxChange: () => void;
  onClick: () => void;
  showRestore?: boolean;
  onRestore?: () => void;
}

const ConversationItem = memo(function ConversationItem({
  conversation,
  isSelected,
  darkMode,
  selectMode,
  isChecked,
  onCheckboxChange,
  onClick,
  showRestore,
  onRestore,
}: ConversationItemProps) {
  const textColor = darkMode ? "text-white" : "text-gray-900";
  const secondaryTextColor = darkMode ? "text-gray-400" : "text-gray-500";
  const borderColor = darkMode ? "border-gray-800" : "border-gray-200";
  const hoverColor = darkMode ? "hover:bg-[#2a2a2a]" : "hover:bg-gray-100";
  const selectedBgColor = darkMode ? "bg-[#263745]" : "bg-blue-50";
  const selectedHoverColor = darkMode ? "hover:bg-[#304050]" : "hover:bg-blue-100";

  return (
    <div
      className={`flex items-start p-3 cursor-pointer
        ${isSelected ? `${selectedBgColor} ${selectedHoverColor}` : hoverColor}
        ${conversation.hasUnread ? "border-l-4 border-blue-500 pl-2" : ""}
      `}
      onClick={onClick}
    >
      {selectMode && (
        <Checkbox
          checked={isChecked}
          onCheckedChange={(e) => {
            e.stopPropagation();
            onCheckboxChange();
          }}
          className={`mr-3 mt-2 ${darkMode ? "border-gray-600" : "border-gray-300"}`}
        />
      )}

      <div className={`relative flex-shrink-0 ${!selectMode ? "mr-3" : ""}`}>
        <Avatar
          className={`h-10 w-10`}
          style={{ backgroundColor: conversation.avatarColor || "#6987bf" }}
        >
          <AvatarImage src={conversation.avatarUrl || ""} />
          <AvatarFallback className="text-white font-medium">
            {conversation.initials ||
              conversation.patientName
                .split(" ")
                .map((n) => n[0])
                .join("") ||
              "U"}
          </AvatarFallback>
        </Avatar>
        {conversation.hasUnread && (
          <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <p className={`font-medium text-sm truncate ${textColor}`}>{conversation.patientName}</p>
          <p className={`text-xs ${secondaryTextColor}`}>
            {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <p
          className={`text-xs ${secondaryTextColor} truncate ${conversation.hasUnread ? "font-medium" : ""}`}
        >
          {conversation.lastMessage.isFromPatient ? "" : "You: "}
          {conversation.lastMessage.content}
        </p>

        {showRestore && onRestore && (
          <div className="mt-1">
            <Button
              variant="outline"
              size="sm"
              className={`h-6 text-xs ${darkMode ? "border-gray-700 text-gray-300" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onRestore();
              }}
            >
              Restore
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
