'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Rect,
  Ellipse,
  Line,
  Text,
  Circle,
  Group,
  Transformer,
  Arrow,
  Layer,
} from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { FlamObject, ToolType, AppMode } from '@/types/canvas';

interface CanvasObjectsProps {
  objects: FlamObject[];
  selectedIds: string[];
  mode: AppMode;
  activeTool: ToolType;
  editingTextId?: string | null;
  onSelect: (id: string, multi: boolean) => void;
  onUpdate: (id: string, changes: Partial<FlamObject>) => void;
  onUpdateEnd: (id: string, changes: Partial<FlamObject>) => void;
  onStartTextEdit?: (obj: FlamObject) => void;
}

// ── Single object shape ───────────────────────────────────────────────────────

function FlamObjectShape({
  obj,
  isSelected,
  mode,
  activeTool,
  editingTextId,
  nodeRef,
  onSelect,
  onUpdate,
  onUpdateEnd,
  onStartTextEdit,
}: {
  obj: FlamObject;
  isSelected: boolean;
  mode: AppMode;
  activeTool: ToolType;
  editingTextId?: string | null;
  nodeRef?: React.RefObject<Konva.Node>;
  onSelect: (id: string, multi: boolean) => void;
  onUpdate: (id: string, changes: Partial<FlamObject>) => void;
  onUpdateEnd: (id: string, changes: Partial<FlamObject>) => void;
  onStartTextEdit?: (obj: FlamObject) => void;
}) {
  const internalRef = useRef<Konva.Node>(null);
  const ref = (nodeRef ?? internalRef) as React.RefObject<Konva.Node>;
  const [hovered, setHovered] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [rotationOffset, setRotationOffset] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode !== 'experience' || !isRotating || obj.interaction?.type !== 'rotate') {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    const speed = obj.interaction?.rotationSpeed ?? 1.5;
    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setRotationOffset((prev) => (prev + speed * 60 * dt) % 360);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [mode, isRotating, obj.interaction]);

  useEffect(() => {
    if (mode !== 'experience') {
      setIsRotating(false);
      setRotationOffset(0);
      setRevealed(false);
    }
  }, [mode]);

  const draggable = mode === 'edit' && activeTool === 'select' && !obj.locked;

  const commonProps = {
    opacity: obj.opacity ?? 1,
    visible: obj.visible !== false,
    rotation: (obj.rotation ?? 0) + (isDragging ? 2 : 0) + rotationOffset,
    draggable,
    onDragStart: () => setIsDragging(true),
    onDragMove: (e: KonvaEventObject<DragEvent>) => {
      onUpdate(obj.id, { position: { x: e.target.x(), y: e.target.y() } });
    },
    onDragEnd: (e: KonvaEventObject<DragEvent>) => {
      setIsDragging(false);
      onUpdateEnd(obj.id, { position: { x: e.target.x(), y: e.target.y() } });
    },
    onClick: (e: KonvaEventObject<MouseEvent>) => {
      if (mode === 'experience') {
        handleExperienceInteraction();
        return;
      }
      onSelect(obj.id, e.evt.shiftKey || e.evt.metaKey);
    },
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  const handleExperienceInteraction = () => {
    if (!obj.interaction) return;
    if (obj.interaction.type === 'reveal') {
      setRevealed((r) => !r);
    } else if (obj.interaction.type === 'rotate') {
      setIsRotating((r) => !r);
    } else if (obj.interaction.type === 'openLink' && obj.interaction.url) {
      window.open(obj.interaction.url, '_blank');
    }
  };

  const liftShadow =
    isDragging
      ? { shadowColor: 'rgba(26,15,8,0.28)', shadowBlur: 22, shadowOffsetY: 8, shadowEnabled: true }
      : hovered && mode === 'edit' && activeTool === 'select'
      ? { shadowColor: 'rgba(26,15,8,0.18)', shadowBlur: 14, shadowOffsetY: 3, shadowEnabled: true }
      : { shadowEnabled: false };

  const selectionStroke = isSelected ? '#C77B5A' : undefined;
  const selectionStrokeWidth = isSelected ? 2 : undefined;

  switch (obj.type) {
    case 'rect':
      return (
        <Rect
          ref={ref as React.RefObject<Konva.Rect>}
          x={obj.position.x}
          y={obj.position.y}
          width={obj.size.width}
          height={obj.size.height}
          fill={obj.fill}
          stroke={selectionStroke ?? obj.stroke}
          strokeWidth={selectionStrokeWidth ?? obj.strokeWidth ?? 0}
          cornerRadius={obj.cornerRadius ?? 0}
          {...commonProps}
          {...liftShadow}
        />
      );

    case 'ellipse':
      return (
        <Ellipse
          ref={ref as React.RefObject<Konva.Ellipse>}
          x={obj.position.x + obj.size.width / 2}
          y={obj.position.y + obj.size.height / 2}
          radiusX={obj.size.width / 2}
          radiusY={obj.size.height / 2}
          fill={obj.fill}
          stroke={selectionStroke ?? obj.stroke}
          strokeWidth={selectionStrokeWidth ?? obj.strokeWidth ?? 0}
          {...commonProps}
          {...liftShadow}
        />
      );

    case 'text':
      return (
        <Text
          ref={ref as React.RefObject<Konva.Text>}
          x={obj.position.x}
          y={obj.position.y}
          width={obj.size.width}
          height={obj.size.height}
          text={obj.text ?? ''}
          fontSize={obj.fontSize ?? 16}
          fontFamily={obj.fontFamily ?? 'Inter, sans-serif'}
          fontStyle={obj.fontStyle ?? 'normal'}
          align={obj.align ?? 'left'}
          fill={obj.fill ?? '#1A0F08'}
          {...commonProps}
          opacity={editingTextId === obj.id ? 0 : (obj.opacity ?? 1)}
          onDblClick={(e) => {
            if (mode !== 'edit') return;
            e.cancelBubble = true;
            if (onStartTextEdit) {
              onStartTextEdit(obj);
            }
          }}
        />
      );

    case 'stroke':
      return (
        <Line
          ref={ref as React.RefObject<Konva.Line>}
          points={obj.points ?? []}
          stroke={obj.stroke ?? '#1A0F08'}
          strokeWidth={obj.strokeWidth ?? 3}
          lineCap={obj.lineCap ?? 'round'}
          lineJoin={obj.lineJoin ?? 'round'}
          tension={obj.tension ?? 0.4}
          globalCompositeOperation="source-over"
          {...commonProps}
        />
      );

    case 'line':
      return (
        <Line
          ref={ref as React.RefObject<Konva.Line>}
          points={obj.points ?? [0, 0, 100, 0]}
          stroke={selectionStroke ?? obj.stroke ?? '#1A0F08'}
          strokeWidth={obj.strokeWidth ?? 2}
          lineCap="round"
          {...commonProps}
        />
      );

    case 'arrow':
      return (
        <Arrow
          ref={ref as React.RefObject<Konva.Arrow>}
          points={obj.points ?? [0, 0, 100, 0]}
          stroke={selectionStroke ?? obj.stroke ?? '#1A0F08'}
          strokeWidth={obj.strokeWidth ?? 2}
          fill={obj.fill ?? obj.stroke ?? '#1A0F08'}
          pointerLength={12}
          pointerWidth={10}
          {...commonProps}
        />
      );

    case 'hotspot':
      return (
        <Group x={obj.position.x} y={obj.position.y} {...commonProps}>
          <Circle
            x={18}
            y={18}
            radius={18}
            fill={obj.fill ?? '#C77B5A'}
            stroke={isSelected ? '#A85C3A' : 'transparent'}
            strokeWidth={2}
            shadowColor={hovered ? 'rgba(199,123,90,0.4)' : 'transparent'}
            shadowBlur={hovered ? 12 : 0}
            shadowEnabled={hovered}
          />
          <Text
            x={0}
            y={9}
            width={36}
            text={obj.text ?? 'i'}
            fontSize={16}
            fontFamily="Inter, sans-serif"
            fontStyle="bold"
            align="center"
            fill="#FFFFFF"
            listening={false}
          />
          {revealed && mode === 'experience' && obj.interaction?.revealContent && (
            <Group x={40} y={-10}>
              <Rect
                width={220}
                height={80}
                fill="#FAF6F0"
                cornerRadius={8}
                shadowColor="rgba(26,15,8,0.18)"
                shadowBlur={14}
                shadowOffsetY={4}
                shadowEnabled
                stroke="#E8D5C0"
                strokeWidth={1}
              />
              <Text
                x={12}
                y={12}
                width={196}
                text={obj.interaction.revealContent}
                fontSize={12}
                fontFamily="Inter, sans-serif"
                fill="#5C3D2E"
                wrap="word"
              />
            </Group>
          )}
        </Group>
      );

    default:
      return null;
  }
}

// ── Main CanvasObjects with multi-select Transformer ─────────────────────────

export default function CanvasObjects({
  objects,
  selectedIds,
  mode,
  activeTool,
  editingTextId,
  onSelect,
  onUpdate,
  onUpdateEnd,
  onStartTextEdit,
}: CanvasObjectsProps) {
  const trRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef<Map<string, React.RefObject<Konva.Node>>>(new Map());

  // Ensure each object has a stable ref
  objects.forEach((obj) => {
    if (!nodeRefs.current.has(obj.id)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nodeRefs.current.set(obj.id, { current: null } as any);
    }
  });

  // Attach Transformer to selected nodes
  useEffect(() => {
    if (!trRef.current) return;
    const tr = trRef.current;

    const transformableTypes = new Set(['rect', 'ellipse', 'text', 'hotspot', 'component']);
    const nodes = selectedIds
      .filter((id) => {
        const obj = objects.find((o) => o.id === id);
        return obj && transformableTypes.has(obj.type) && !obj.locked && id !== editingTextId;
      })
      .map((id) => nodeRefs.current.get(id)?.current)
      .filter((n): n is Konva.Node => n !== null && n !== undefined);

    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, objects, editingTextId]);

  const handleTransformEnd = useCallback(() => {
    if (!trRef.current) return;
    trRef.current.nodes().forEach((node) => {
      const id = objects.find((o) => {
        const ref = nodeRefs.current.get(o.id);
        return ref?.current === node;
      })?.id;
      if (!id) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);

      const obj = objects.find((o) => o.id === id);
      if (!obj) return;

      // For ellipses, position is center-based in Konva
      let newPosition = { x: node.x(), y: node.y() };
      let newSize = {
        width: Math.max(5, (obj.type === 'ellipse' ? node.width() : node.width()) * scaleX),
        height: Math.max(5, (obj.type === 'ellipse' ? node.height() : node.height()) * scaleY),
      };

      if (obj.type === 'ellipse') {
        // Konva ellipse: x/y is center, we store top-left in position
        newPosition = {
          x: node.x() - newSize.width / 2,
          y: node.y() - newSize.height / 2,
        };
      }

      onUpdateEnd(id, {
        position: newPosition,
        size: newSize,
        rotation: node.rotation(),
      });
    });
  }, [objects, onUpdateEnd]);

  const sorted = [...objects].sort((a, b) => a.depth - b.depth);

  const showTransformer =
    mode === 'edit' &&
    selectedIds.length > 0 &&
    activeTool === 'select' &&
    !selectedIds.includes(editingTextId ?? '');

  return (
    <>
      {sorted.map((obj) => (
        <FlamObjectShape
          key={obj.id}
          obj={obj}
          isSelected={selectedIds.includes(obj.id)}
          mode={mode}
          activeTool={activeTool}
          editingTextId={editingTextId}
          nodeRef={nodeRefs.current.get(obj.id)}
          onSelect={onSelect}
          onUpdate={onUpdate}
          onUpdateEnd={onUpdateEnd}
          onStartTextEdit={onStartTextEdit}
        />
      ))}

      {showTransformer && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
          }
          onTransformEnd={handleTransformEnd}
          keepRatio={false}
          enabledAnchors={[
            'top-left', 'top-center', 'top-right',
            'middle-left', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right',
          ]}
          borderStroke="#C77B5A"
          borderStrokeWidth={1.5}
          anchorStroke="#C77B5A"
          anchorFill="#FAF6F0"
          anchorSize={8}
          rotateEnabled
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
        />
      )}
    </>
  );
}
