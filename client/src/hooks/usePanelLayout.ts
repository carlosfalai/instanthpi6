import { useState, useEffect, useCallback } from "react";
import { saveToLocalStorage, loadFromLocalStorage } from "@/utils/localStorage";
import { arrayMove } from "@dnd-kit/sortable";

// Panel configuration types
export type PanelId = "inbox" | "history" | "queue" | "ai" | "templates";

export interface PanelConfig {
  id: PanelId;
  name: string;
  defaultSize: number;
  minSize: number;
  maxSize: number;
}

export interface PanelLayoutState {
  order: PanelId[];
  names: Record<PanelId, string>;
  sizes: Record<PanelId, number>;
  collapsed: PanelId[];
}

// Storage key for persistence
const STORAGE_KEY = "instanthpi_panel_layout";

// Default panel configurations
export const DEFAULT_PANEL_CONFIGS: Record<PanelId, PanelConfig> = {
  inbox: {
    id: "inbox",
    name: "Spruce Inbox",
    defaultSize: 15,
    minSize: 10,
    maxSize: 25,
  },
  history: {
    id: "history",
    name: "Conversation",
    defaultSize: 20,
    minSize: 15,
    maxSize: 35,
  },
  queue: {
    id: "queue",
    name: "Staging Queue",
    defaultSize: 15,
    minSize: 10,
    maxSize: 25,
  },
  ai: {
    id: "ai",
    name: "Claude Chat",
    defaultSize: 25,
    minSize: 15,
    maxSize: 40,
  },
  templates: {
    id: "templates",
    name: "Templates",
    defaultSize: 25,
    minSize: 15,
    maxSize: 40,
  },
};

// Default panel order
const DEFAULT_ORDER: PanelId[] = ["inbox", "history", "queue", "ai", "templates"];

// Default names
const DEFAULT_NAMES: Record<PanelId, string> = {
  inbox: "Spruce Inbox",
  history: "Conversation",
  queue: "Staging Queue",
  ai: "Claude Chat",
  templates: "Templates",
};

// Default sizes
const DEFAULT_SIZES: Record<PanelId, number> = {
  inbox: 15,
  history: 20,
  queue: 15,
  ai: 25,
  templates: 25,
};

function getDefaultState(): PanelLayoutState {
  return {
    order: [...DEFAULT_ORDER],
    names: { ...DEFAULT_NAMES },
    sizes: { ...DEFAULT_SIZES },
    collapsed: [],
  };
}

export function usePanelLayout() {
  const [state, setState] = useState<PanelLayoutState>(getDefaultState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadFromLocalStorage<PanelLayoutState>(STORAGE_KEY);
    if (saved) {
      // Validate saved state has all required panels
      const hasAllPanels = DEFAULT_ORDER.every((id) => saved.order?.includes(id));
      if (hasAllPanels && saved.order?.length === DEFAULT_ORDER.length) {
        setState({
          order: saved.order,
          names: { ...DEFAULT_NAMES, ...saved.names },
          sizes: { ...DEFAULT_SIZES, ...saved.sizes },
          collapsed: saved.collapsed || [],
        });
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage on change (after initial load)
  useEffect(() => {
    if (isInitialized) {
      saveToLocalStorage(STORAGE_KEY, state);
    }
  }, [state, isInitialized]);

  // Reorder panels after drag end
  const reorderPanels = useCallback((activeId: PanelId, overId: PanelId) => {
    setState((prev) => {
      const oldIndex = prev.order.indexOf(activeId);
      const newIndex = prev.order.indexOf(overId);

      if (oldIndex === -1 || newIndex === -1) return prev;

      return {
        ...prev,
        order: arrayMove(prev.order, oldIndex, newIndex),
      };
    });
  }, []);

  // Update panel name
  const updatePanelName = useCallback((panelId: PanelId, name: string) => {
    setState((prev) => ({
      ...prev,
      names: {
        ...prev.names,
        [panelId]: name,
      },
    }));
  }, []);

  // Update panel size
  const updatePanelSize = useCallback((panelId: PanelId, size: number) => {
    setState((prev) => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [panelId]: size,
      },
    }));
  }, []);

  // Update all panel sizes at once (from PanelGroup onLayout)
  const updateAllSizes = useCallback((sizes: number[]) => {
    setState((prev) => {
      const newSizes = { ...prev.sizes };
      prev.order.forEach((panelId, index) => {
        if (sizes[index] !== undefined) {
          newSizes[panelId] = sizes[index];
        }
      });
      return {
        ...prev,
        sizes: newSizes,
      };
    });
  }, []);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    setState(getDefaultState());
  }, []);

  // Toggle panel collapse/expand
  const togglePanelCollapse = useCallback((panelId: PanelId) => {
    setState((prev) => {
      const isCollapsed = prev.collapsed.includes(panelId);
      return {
        ...prev,
        collapsed: isCollapsed
          ? prev.collapsed.filter((id) => id !== panelId)
          : [...prev.collapsed, panelId],
      };
    });
  }, []);

  // Check if panel is collapsed
  const isPanelCollapsed = useCallback(
    (panelId: PanelId) => {
      return state.collapsed.includes(panelId);
    },
    [state.collapsed]
  );

  // Get ordered panels with their configs
  const getOrderedPanels = useCallback(() => {
    return state.order.map((id) => ({
      ...DEFAULT_PANEL_CONFIGS[id],
      name: state.names[id],
      size: state.sizes[id],
    }));
  }, [state]);

  // Get panel config by ID
  const getPanelConfig = useCallback(
    (panelId: PanelId) => {
      return {
        ...DEFAULT_PANEL_CONFIGS[panelId],
        name: state.names[panelId],
        size: state.sizes[panelId],
      };
    },
    [state]
  );

  return {
    // State
    panelOrder: state.order,
    panelNames: state.names,
    panelSizes: state.sizes,
    collapsedPanels: state.collapsed,
    isInitialized,

    // Actions
    reorderPanels,
    updatePanelName,
    updatePanelSize,
    updateAllSizes,
    resetLayout,
    togglePanelCollapse,

    // Helpers
    getOrderedPanels,
    getPanelConfig,
    isPanelCollapsed,
  };
}

export type UsePanelLayoutReturn = ReturnType<typeof usePanelLayout>;
