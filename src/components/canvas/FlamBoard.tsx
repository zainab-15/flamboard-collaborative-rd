'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Ellipse, Line, Text, Group, Circle, RegularPolygon } from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { FlamObject, ToolType } from '@/types/canvas';
import { v4 as uuidv4 } from 'uuid';
import CollaboratorCursors from './CollaboratorCursors';
import CanvasObjects from './CanvasObjects';
import TextEditOverlay, { EditingTextState } from './TextEditOverlay';

interface FlamBoardProps {
  onCursorMove: (x: number, y: number) => void;
  onObjectCreate: (obj: FlamObject) => void;
  onObjectUpdate: (id: string, changes: Partial<FlamObject>) => void;
  onObjectDelete: (id: string) => void;
  onStrokeStart: (stroke: FlamObject) => void;
  onStrokeUpdate: (id: string, points: number[]) => void;
  onStrokeEnd: (id: string) => void;
  onActivityChange: (activity: string) => void;
  onHistoryPush: (desc: string) => void;
}

const STAGE_WIDTH = typeof window !== 'undefined' ? window.innerWidth : 1400;
const STAGE_HEIGHT = typeof window !== 'undefined' ? window.innerHeight - 56 : 900; // minus topbar

export default function FlamBoard({
  onCursorMove,
  onObjectCreate,
  onObjectUpdate,
  onObjectDelete,
  onStrokeStart,
  onStrokeUpdate,
  onStrokeEnd,
  onActivityChange,
  onHistoryPush,
}: FlamBoardProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const isDrawing = useRef(false);
  const currentStrokeId = useRef<string | null>(null);
  const currentStrokePoints = useRef<number[]>([]);
  const lastCursorEmit = useRef(0);

  // Store
  const {
    objects,
    selectedIds,
    activeTool,
    drawColor,
    drawWidth,
    mode,
    stageScale,
    stagePosition,
    setSelectedIds,
    clearSelection,
    addObject,
    updateObject,
    deleteObject,
    setActiveTool,
    setStageScale,
    setStagePosition,
  } = useCanvasStore();

  const { cursors, currentUser } = useCollaborationStore();

  // Stage dimensions (responsive)
  const [dimensions, setDimensions] = useState({ width: STAGE_WIDTH, height: STAGE_HEIGHT });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [editingText, setEditingText] = useState<EditingTextState | null>(null);

  const handleTextCommit = useCallback(
    (newText: string) => {
      if (!editingText) return;
      const trimmed = newText.trim();
      const id = editingText.id;
      const isNew = editingText.isNew;

      if (!trimmed) {
        if (isNew) {
          deleteObject(id);
          onObjectDelete(id);
          clearSelection();
        } else {
          updateObject(id, { text: '' });
          onObjectUpdate(id, { text: '' });
        }
      } else {
        updateObject(id, { text: newText });
        onObjectUpdate(id, { text: newText });
        onHistoryPush(isNew ? 'Create text' : 'Edit text');
        if (isNew) {
          setActiveTool('select');
          setSelectedIds([id]);
        }
      }
      setEditingText(null);
    },
    [
      editingText,
      deleteObject,
      onObjectDelete,
      clearSelection,
      updateObject,
      onObjectUpdate,
      onHistoryPush,
      setActiveTool,
      setSelectedIds,
    ]
  );

  const handleTextCancel = useCallback(() => {
    if (!editingText) return;
    if (editingText.isNew) {
      deleteObject(editingText.id);
      onObjectDelete(editingText.id);
      clearSelection();
    }
    setEditingText(null);
  }, [editingText, deleteObject, onObjectDelete, clearSelection]);

  const handleStartTextEdit = useCallback(
    (obj: FlamObject) => {
      setSelectedIds([obj.id]);
      setEditingText({
        id: obj.id,
        isNew: false,
        initialText: obj.text || '',
        x: obj.position.x,
        y: obj.position.y,
        fontSize: obj.fontSize || 18,
        fontFamily: obj.fontFamily || 'Inter, sans-serif',
        fontStyle: obj.fontStyle,
        fill: obj.fill || '#1A0F08',
        align: obj.align,
        rotation: obj.rotation || 0,
        width: obj.size.width,
        height: obj.size.height,
      });
    },
    [setSelectedIds]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const updateSize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 56,
      });
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // ── Pointer position in canvas space ──
  const getCanvasPos = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = stageRef.current;
      if (!stage) return { x: 0, y: 0 };
      const pos = stage.getPointerPosition();
      if (!pos) return { x: 0, y: 0 };
      return {
        x: (pos.x - stagePosition.x) / stageScale,
        y: (pos.y - stagePosition.y) / stageScale,
      };
    },
    [stageScale, stagePosition]
  );

  // ── Cursor tracking ──
  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const now = Date.now();
      if (now - lastCursorEmit.current > 16) {
        lastCursorEmit.current = now;
        const stage = stageRef.current;
        if (stage) {
          const pos = stage.getPointerPosition();
          if (pos) onCursorMove(pos.x, pos.y);
        }
      }

      // Handle live drawing
      if (isDrawing.current && activeTool === 'draw' && currentStrokeId.current) {
        const pos = getCanvasPos(e);
        currentStrokePoints.current.push(pos.x, pos.y);
        updateObject(currentStrokeId.current, {
          points: [...currentStrokePoints.current],
        });
        onStrokeUpdate(currentStrokeId.current, [...currentStrokePoints.current]);
      }
    },
    [activeTool, getCanvasPos, onCursorMove, onStrokeUpdate, updateObject]
  );

  // ── Pointer down ──
  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (isSpacePressed || e.evt.button === 1) {
        return;
      }
      const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'canvas-bg';

      if (activeTool === 'select') {
        if (clickedOnEmpty) clearSelection();
        return;
      }

      if (activeTool === 'draw') {
        isDrawing.current = true;
        const pos = getCanvasPos(e);
        const id = uuidv4();
        currentStrokeId.current = id;
        currentStrokePoints.current = [pos.x, pos.y, pos.x + 0.1, pos.y + 0.1];

        const stroke: FlamObject = {
          id,
          type: 'stroke',
          position: { x: 0, y: 0 },
          size: { width: 0, height: 0 },
          rotation: 0,
          depth: objects.length,
          opacity: 1,
          locked: false,
          visible: true,
          points: [...currentStrokePoints.current],
          stroke: drawColor,
          strokeWidth: drawWidth,
          fill: undefined,
          lineCap: 'round',
          lineJoin: 'round',
          tension: 0.4,
          createdBy: currentUser?.id,
        };

        addObject(stroke);
        onStrokeStart(stroke);
        onActivityChange('Drawing');
        e.evt.preventDefault();
        return;
      }

      if (activeTool === 'eraser') {
        // Click on object to erase handled by object click
        return;
      }

      // Shape tools
      if (['rect', 'ellipse', 'text', 'hotspot', 'line', 'arrow'].includes(activeTool)) {
        const pos = getCanvasPos(e);
        let newObj: FlamObject | null = null;

        if (activeTool === 'rect') {
          newObj = {
            id: uuidv4(),
            type: 'rect',
            position: { x: pos.x - 60, y: pos.y - 40 },
            size: { width: 120, height: 80 },
            rotation: 0,
            depth: objects.length,
            opacity: 1,
            locked: false,
            visible: true,
            fill: '#F5EDE3',
            stroke: drawColor,
            strokeWidth: 1.5,
            cornerRadius: 6,
          };
        } else if (activeTool === 'ellipse') {
          newObj = {
            id: uuidv4(),
            type: 'ellipse',
            position: { x: pos.x - 60, y: pos.y - 40 },
            size: { width: 120, height: 80 },
            rotation: 0,
            depth: objects.length,
            opacity: 1,
            locked: false,
            visible: true,
            fill: '#F5EDE3',
            stroke: drawColor,
            strokeWidth: 1.5,
          };
        } else if (activeTool === 'text') {
          const textId = uuidv4();
          newObj = {
            id: textId,
            type: 'text',
            position: { x: pos.x, y: pos.y },
            size: { width: 140, height: 32 },
            rotation: 0,
            depth: objects.length,
            opacity: 1,
            locked: false,
            visible: true,
            text: '',
            fontSize: 18,
            fontFamily: 'Inter, sans-serif',
            fill: drawColor,
            align: 'left',
          };
          addObject(newObj);
          onObjectCreate(newObj);
          setSelectedIds([textId]);
          onActivityChange('Adding text');
          setEditingText({
            id: textId,
            isNew: true,
            initialText: '',
            x: pos.x,
            y: pos.y,
            fontSize: 18,
            fontFamily: 'Inter, sans-serif',
            fill: drawColor,
            align: 'left',
            rotation: 0,
            width: 140,
            height: 32,
          });
          return;
        } else if (activeTool === 'hotspot') {
          newObj = {
            id: uuidv4(),
            type: 'hotspot',
            position: { x: pos.x - 18, y: pos.y - 18 },
            size: { width: 36, height: 36 },
            rotation: 0,
            depth: objects.length,
            opacity: 1,
            locked: false,
            visible: true,
            fill: '#C77B5A',
            text: 'i',
            fontSize: 16,
            fontFamily: 'Inter, sans-serif',
            intent: 'hotspot',
            interaction: { type: 'reveal', revealContent: 'Add reveal content here' },
          };
        } else if (activeTool === 'line') {
          newObj = {
            id: uuidv4(),
            type: 'line',
            position: { x: 0, y: 0 },
            size: { width: 0, height: 0 },
            rotation: 0,
            depth: objects.length,
            opacity: 1,
            locked: false,
            visible: true,
            points: [pos.x, pos.y, pos.x + 100, pos.y],
            stroke: drawColor,
            strokeWidth: drawWidth,
            lineCap: 'round',
          };
        } else if (activeTool === 'arrow') {
          newObj = {
            id: uuidv4(),
            type: 'arrow',
            position: { x: 0, y: 0 },
            size: { width: 0, height: 0 },
            rotation: 0,
            depth: objects.length,
            opacity: 1,
            locked: false,
            visible: true,
            points: [pos.x, pos.y, pos.x + 100, pos.y],
            stroke: drawColor,
            strokeWidth: drawWidth,
            fill: drawColor,
          };
        }

        if (newObj) {
          addObject(newObj);
          onObjectCreate(newObj);
          setSelectedIds([newObj.id]);
          onHistoryPush(`Add ${activeTool}`);
          onActivityChange('Editing');
        }
      }
    },
    [
      activeTool,
      clearSelection,
      getCanvasPos,
      objects.length,
      drawColor,
      drawWidth,
      currentUser,
      addObject,
      onStrokeStart,
      onObjectCreate,
      setSelectedIds,
      onHistoryPush,
      onActivityChange,
      isSpacePressed,
    ]
  );

  // ── Pointer up ──
  const handleMouseUp = useCallback(() => {
    if (isDrawing.current && currentStrokeId.current) {
      isDrawing.current = false;
      const id = currentStrokeId.current;
      updateObject(id, { finalized: true });
      onStrokeEnd(id);
      onHistoryPush('Draw stroke');
      currentStrokeId.current = null;
      currentStrokePoints.current = [];
      onActivityChange('Idle');
    }
  }, [updateObject, onStrokeEnd, onHistoryPush, onActivityChange]);

  // ── Wheel zoom ──
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const scaleBy = 1.05;
      const oldScale = stageScale;
      const pointer = stage.getPointerPosition()!;
      const mousePointTo = {
        x: (pointer.x - stagePosition.x) / oldScale,
        y: (pointer.y - stagePosition.y) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = Math.min(8, Math.max(0.1, oldScale * (direction > 0 ? scaleBy : 1 / scaleBy)));
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setStageScale(newScale);
      setStagePosition(newPos);
    },
    [stageScale, stagePosition, setStageScale, setStagePosition]
  );

  // ── Delete key ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        selectedIds.forEach((id) => {
          deleteObject(id);
          onObjectDelete(id);
        });
        if (selectedIds.length > 0) {
          onHistoryPush('Delete objects');
          clearSelection();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIds, deleteObject, onObjectDelete, clearSelection, onHistoryPush]);

  const cursor = isSpacePressed
    ? 'grab'
    : activeTool === 'draw'
    ? 'crosshair'
    : activeTool === 'eraser'
    ? 'cell'
    : activeTool === 'text'
    ? 'text'
    : activeTool === 'select'
    ? 'default'
    : 'crosshair';

  return (
    <div
      style={{
        position: 'relative',
        width: dimensions.width,
        height: dimensions.height,
        overflow: 'hidden',
      }}
      id="flamboard-canvas-wrapper"
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        style={{ cursor, background: '#F7F0E8' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchMove={(e) => {
          const me = e as unknown as KonvaEventObject<MouseEvent>;
          handleMouseMove(me);
        }}
        onTouchEnd={handleMouseUp}
        onWheel={handleWheel}
        draggable={isSpacePressed || (activeTool === 'select' && selectedIds.length === 0)}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setStagePosition({ x: e.target.x(), y: e.target.y() });
          }
        }}
      >
        {/* Canvas background — dot grid & warm ambient atmosphere */}
        <Layer listening={false}>
          <Rect
            name="canvas-bg"
            x={-stagePosition.x / stageScale}
            y={-stagePosition.y / stageScale}
            width={dimensions.width / stageScale + 200}
            height={dimensions.height / stageScale + 200}
            fill="#F7F0E8"
            listening={false}
          />
          <Circle
            x={250}
            y={180}
            radius={260}
            fill="#EBDCC9"
            opacity={0.35}
            listening={false}
          />
          <Circle
            x={750}
            y={450}
            radius={320}
            fill="#F2DFD0"
            opacity={0.3}
            listening={false}
          />
          <Circle
            x={1150}
            y={220}
            radius={200}
            fill="#EAD5C5"
            opacity={0.25}
            listening={false}
          />
        </Layer>

        {/* Objects layer */}
        <Layer>
          <CanvasObjects
            objects={objects}
            selectedIds={selectedIds}
            mode={mode}
            activeTool={activeTool}
            editingTextId={editingText?.id}
            onStartTextEdit={handleStartTextEdit}
            onSelect={(id, multi) => {
              if (activeTool === 'eraser') {
                deleteObject(id);
                onObjectDelete(id);
                onHistoryPush('Erase object');
                return;
              }
              if (activeTool !== 'select') return;
              if (multi) {
                const next = selectedIds.includes(id)
                  ? selectedIds.filter((s) => s !== id)
                  : [...selectedIds, id];
                setSelectedIds(next);
              } else {
                setSelectedIds([id]);
              }
            }}
            onUpdate={(id, changes) => {
              updateObject(id, changes);
              onObjectUpdate(id, changes);
            }}
            onUpdateEnd={(id, changes) => {
              updateObject(id, changes);
              onObjectUpdate(id, changes);
              onHistoryPush('Move/resize object');
            }}
          />
        </Layer>

        {/* Collaborator cursors — always on top */}
        <Layer listening={false}>
          <CollaboratorCursors
            cursors={cursors}
            scale={stageScale}
            position={stagePosition}
          />
        </Layer>
      </Stage>

      {/* HTML Text Editing Overlay */}
      {editingText && (
        <TextEditOverlay
          editingText={editingText}
          stageScale={stageScale}
          stagePosition={stagePosition}
          onCommit={handleTextCommit}
          onCancel={handleTextCancel}
        />
      )}
    </div>
  );
}
