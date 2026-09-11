import { create } from 'zustand';
import { FlamObject, ToolType, AppMode, DevicePreview, HistoryEntry } from '@/types/canvas';

const MAX_HISTORY = 50;

interface CanvasStore {
  // Objects
  objects: FlamObject[];
  selectedIds: string[];
  
  // Tool
  activeTool: ToolType;
  drawColor: string;
  drawWidth: number;
  
  // Mode
  mode: AppMode;
  devicePreview: DevicePreview;
  
  // Zoom / Pan
  stageScale: number;
  stagePosition: { x: number; y: number };
  
  // History
  history: HistoryEntry[];
  historyIndex: number;
  
  // UI
  showRDPanel: boolean;
  showLayers: boolean;
  
  // Actions
  setObjects: (objects: FlamObject[]) => void;
  addObject: (object: FlamObject) => void;
  updateObject: (id: string, changes: Partial<FlamObject>) => void;
  deleteObject: (id: string) => void;
  deleteObjects: (ids: string[]) => void;
  clearCanvas: () => void;
  
  setSelectedIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  clearSelection: () => void;
  
  setActiveTool: (tool: ToolType) => void;
  setDrawColor: (color: string) => void;
  setDrawWidth: (width: number) => void;
  
  setMode: (mode: AppMode) => void;
  setDevicePreview: (device: DevicePreview) => void;
  
  setStageScale: (scale: number) => void;
  setStagePosition: (pos: { x: number; y: number }) => void;
  
  pushHistory: (description: string) => void;
  undo: () => FlamObject[] | null;
  redo: () => FlamObject[] | null;
  
  toggleRDPanel: () => void;
  toggleLayers: () => void;
  
  // Remote sync (apply remote changes without adding to local history)
  applyRemoteCreate: (object: FlamObject) => void;
  applyRemoteUpdate: (id: string, changes: Partial<FlamObject>) => void;
  applyRemoteDelete: (id: string) => void;
  applyRemoteClear: () => void;
  applyBulkObjects: (objects: FlamObject[]) => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  objects: [],
  selectedIds: [],
  activeTool: 'select',
  drawColor: '#5C3D2E',
  drawWidth: 3,
  mode: 'edit',
  devicePreview: 'desktop',
  stageScale: 1,
  stagePosition: { x: 0, y: 0 },
  history: [],
  historyIndex: -1,
  showRDPanel: false,
  showLayers: true,

  setObjects: (objects) => set({ objects }),

  addObject: (object) => {
    set((state) => ({ objects: [...state.objects, object] }));
  },

  updateObject: (id, changes) => {
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...changes } : obj
      ),
    }));
  },

  deleteObject: (id) => {
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    }));
  },

  deleteObjects: (ids) => {
    const idSet = new Set(ids);
    set((state) => ({
      objects: state.objects.filter((obj) => !idSet.has(obj.id)),
      selectedIds: state.selectedIds.filter((sid) => !idSet.has(sid)),
    }));
  },

  clearCanvas: () => {
    set({ objects: [], selectedIds: [] });
  },

  setSelectedIds: (ids) => set({ selectedIds: ids }),
  addToSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds
        : [...state.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),

  setActiveTool: (tool) => set({ activeTool: tool }),
  setDrawColor: (color) => set({ drawColor: color }),
  setDrawWidth: (width) => set({ drawWidth: width }),

  setMode: (mode) => set({ mode }),
  setDevicePreview: (devicePreview) => set({ devicePreview }),

  setStageScale: (stageScale) => set({ stageScale }),
  setStagePosition: (stagePosition) => set({ stagePosition }),

  pushHistory: (description) => {
    const { objects, history, historyIndex } = get();
    const newEntry: HistoryEntry = {
      objects: JSON.parse(JSON.stringify(objects)),
      timestamp: Date.now(),
      description,
    };
    // Trim redo stack
    const trimmed = history.slice(0, historyIndex + 1);
    const newHistory = [...trimmed, newEntry].slice(-MAX_HISTORY);
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return null;
    const newIndex = historyIndex - 1;
    const entry = history[newIndex];
    set({ historyIndex: newIndex, objects: JSON.parse(JSON.stringify(entry.objects)) });
    return entry.objects;
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return null;
    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
    set({ historyIndex: newIndex, objects: JSON.parse(JSON.stringify(entry.objects)) });
    return entry.objects;
  },

  toggleRDPanel: () => set((state) => ({ showRDPanel: !state.showRDPanel })),
  toggleLayers: () => set((state) => ({ showLayers: !state.showLayers })),

  // Remote — no history push
  applyRemoteCreate: (object) => {
    set((state) => ({
      objects: state.objects.some((o) => o.id === object.id)
        ? state.objects
        : [...state.objects, object],
    }));
  },

  applyRemoteUpdate: (id, changes) => {
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...changes } : obj
      ),
    }));
  },

  applyRemoteDelete: (id) => {
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
    }));
  },

  applyRemoteClear: () => {
    set({ objects: [] });
  },

  applyBulkObjects: (objects) => {
    set({ objects });
  },
}));
