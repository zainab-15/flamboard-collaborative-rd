'use client';

import { useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import styles from './Editor.module.css';
import TopBar from './TopBar';
import LeftToolbar from './LeftToolbar';
import RightSidebar from './RightSidebar';
import BottomControls from './BottomControls';
import RDPanel from '@/components/ui/RDPanel';
import { useSocket } from '@/hooks/useSocket';
import { useCanvasStore } from '@/stores/canvasStore';
import { createDemoScene } from '@/lib/demoScene';
import { FlamObject, UserActivity } from '@/types/canvas';
import ExperienceMode from './ExperienceMode';

const FlamBoard = dynamic(() => import('@/components/canvas/FlamBoard'), { ssr: false });

interface EditorProps {
  roomId: string;
  userName: string;
  loadDemo: boolean;
}

// Keyboard shortcut → tool map
const KEY_TOOL_MAP: Record<string, string> = {
  v: 'select',
  d: 'draw',
  t: 'text',
  r: 'rect',
  e: 'ellipse',
  l: 'line',
  a: 'arrow',
  h: 'hotspot',
  x: 'eraser',
};

export default function Editor({ roomId, userName, loadDemo }: EditorProps) {
  const {
    mode,
    addObject,
    pushHistory,
    undo,
    redo,
    setActiveTool,
    clearCanvas,
    applyBulkObjects,
  } = useCanvasStore();

  const demoLoaded = useRef(false);

  // Socket connection
  const {
    emitCursorMove,
    emitObjectCreate,
    emitObjectUpdate,
    emitObjectDelete,
    emitObjectsBulk,
    emitStrokeStart,
    emitStrokeUpdate,
    emitStrokeEnd,
    emitCanvasClear,
    emitUserActivity,
  } = useSocket({ roomId, userName });

  // Load demo scene for new boards
  useEffect(() => {
    if (loadDemo && !demoLoaded.current) {
      demoLoaded.current = true;
      const demo = createDemoScene();
      // Push each object individually so it's in the store
      applyBulkObjects(demo);
      // Sync to server so peers joining this room also see it
      emitObjectsBulk(demo);
      // Push initial history entry
      setTimeout(() => pushHistory('Load demo scene'), 100);
    }
  }, [loadDemo, applyBulkObjects, emitObjectsBulk, pushHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

      const tool = KEY_TOOL_MAP[e.key.toLowerCase()];
      if (tool) setActiveTool(tool as Parameters<typeof setActiveTool>[0]);

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveTool, undo, redo]);

  // Canvas event handlers — wire local store events to socket emits
  const handleObjectCreate = useCallback(
    (obj: FlamObject) => {
      emitObjectCreate(obj);
      pushHistory(`Create ${obj.type}`);
    },
    [emitObjectCreate, pushHistory]
  );

  const handleObjectUpdate = useCallback(
    (id: string, changes: Partial<FlamObject>) => {
      emitObjectUpdate(id, changes);
    },
    [emitObjectUpdate]
  );

  const handleObjectDelete = useCallback(
    (id: string) => {
      emitObjectDelete(id);
    },
    [emitObjectDelete]
  );

  const handleClearCanvas = useCallback(() => {
    clearCanvas();
    emitCanvasClear();
    pushHistory('Clear canvas');
  }, [clearCanvas, emitCanvasClear, pushHistory]);

  const handleHistoryPush = useCallback(
    (desc: string) => {
      pushHistory(desc);
    },
    [pushHistory]
  );

  const handleUndo = useCallback(() => {
    const objects = undo();
    if (objects !== null) {
      // Sync undo state to other users
      emitObjectUpdate('__undo__', { metadata: { undo: true } });
    }
  }, [undo, emitObjectUpdate]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  const handleActivityChange = useCallback(
    (activity: string) => {
      emitUserActivity(activity as UserActivity);
    },
    [emitUserActivity]
  );

  const boardName =
    roomId === 'aura-campaign'
      ? 'AURA Headphones Campaign'
      : roomId === 'brand-refresh'
      ? 'Brand Refresh — Q4'
      : roomId === 'onboarding-flow'
      ? 'Onboarding Flow Prototype'
      : `Board ${roomId}`;

  return (
    <div className={`${styles.editor} ${mode === 'experience' ? styles.experienceMode : ''}`}>
      {/* Top bar */}
      <TopBar roomId={roomId} boardName={boardName} />

      {/* Main layout */}
      <div className={styles.body}>
        {/* Left toolbar */}
        <LeftToolbar />

        {/* Canvas area */}
        <main className={styles.canvasArea} id="canvas-area">
          <FlamBoard
            onCursorMove={emitCursorMove}
            onObjectCreate={handleObjectCreate}
            onObjectUpdate={handleObjectUpdate}
            onObjectDelete={handleObjectDelete}
            onStrokeStart={emitStrokeStart}
            onStrokeUpdate={emitStrokeUpdate}
            onStrokeEnd={emitStrokeEnd}
            onActivityChange={handleActivityChange}
            onHistoryPush={handleHistoryPush}
          />

          {/* Experience mode overlay */}
          {mode === 'experience' && <ExperienceMode />}
        </main>

        {/* Right sidebar */}
        <RightSidebar
          onObjectUpdate={handleObjectUpdate}
          onClearCanvas={handleClearCanvas}
        />
      </div>

      {/* Bottom controls */}
      <BottomControls
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearCanvas={handleClearCanvas}
      />

      {/* R&D panel */}
      <RDPanel />
    </div>
  );
}
