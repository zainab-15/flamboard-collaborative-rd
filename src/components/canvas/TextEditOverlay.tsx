'use client';

import { useState, useRef, useEffect } from 'react';

export interface EditingTextState {
  id: string;
  isNew: boolean;
  initialText: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontStyle?: string;
  fill: string;
  align?: string;
  rotation?: number;
  width?: number;
  height?: number;
}

interface TextEditOverlayProps {
  editingText: EditingTextState;
  stageScale: number;
  stagePosition: { x: number; y: number };
  onCommit: (text: string) => void;
  onCancel: () => void;
}

export default function TextEditOverlay({
  editingText,
  stageScale,
  stagePosition,
  onCommit,
  onCancel,
}: TextEditOverlayProps) {
  const [value, setValue] = useState(editingText.initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.focus();
      if (editingText.initialText) {
        el.select();
      }
    }
  }, [editingText.initialText]);

  // Screen coordinates accounting for stage pan and zoom
  const left = stagePosition.x + editingText.x * stageScale;
  const top = stagePosition.y + editingText.y * stageScale;
  const fontSize = (editingText.fontSize || 18) * stageScale;
  const rotation = editingText.rotation || 0;

  // Auto-resize textarea to fit text
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(fontSize * 1.35, el.scrollHeight)}px`;
      el.style.width = 'auto';
      el.style.width = `${Math.max(120, el.scrollWidth + 12)}px`;
    }
  }, [value, fontSize]);

  const handleFinish = (commit: boolean) => {
    if (committedRef.current) return;
    committedRef.current = true;
    if (commit) {
      onCommit(value);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation(); // prevent canvas shortcut capture
    if (e.key === 'Escape') {
      e.preventDefault();
      handleFinish(false);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFinish(true);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => handleFinish(true)}
      placeholder="Type text…"
      id="canvas-text-editor"
      aria-label="Edit canvas text"
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        fontSize: `${fontSize}px`,
        fontFamily: editingText.fontFamily || 'Inter, sans-serif',
        fontWeight: editingText.fontStyle === 'bold' ? 'bold' : 'normal',
        fontStyle: editingText.fontStyle === 'italic' ? 'italic' : 'normal',
        color: editingText.fill || '#1A0F08',
        textAlign: (editingText.align as React.CSSProperties['textAlign']) || 'left',
        lineHeight: 1.25,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'left top',
        background: 'rgba(250, 246, 240, 0.96)',
        border: '1.5px solid #C77B5A',
        borderRadius: '4px',
        padding: '3px 6px',
        margin: 0,
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        minWidth: `${Math.max(120, (editingText.width || 80) * stageScale)}px`,
        minHeight: `${Math.max(fontSize * 1.35, 30)}px`,
        boxShadow: '0 4px 14px rgba(26, 15, 8, 0.16)',
        zIndex: 500,
      }}
    />
  );
}
