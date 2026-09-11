'use client';

import styles from './BottomControls.module.css';
import { useCanvasStore } from '@/stores/canvasStore';

interface BottomControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  onClearCanvas: () => void;
}

export default function BottomControls({ onUndo, onRedo }: BottomControlsProps) {
  const {
    stageScale,
    setStageScale,
    setStagePosition,
    mode,
    setMode,
    historyIndex,
    history,
  } = useCanvasStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const zoomPercent = Math.round(stageScale * 100);

  const zoomIn = () => setStageScale(Math.min(8, stageScale * 1.2));
  const zoomOut = () => setStageScale(Math.max(0.1, stageScale / 1.2));
  const resetZoom = () => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  };

  return (
    <div className={styles.controls}>
      {/* Left — undo/redo */}
      <div className={styles.group}>
        <button
          className={styles.btn}
          onClick={onUndo}
          disabled={!canUndo}
          id="undo-btn"
          aria-label="Undo"
          title="Undo"
        >
          ↩
        </button>
        <button
          className={styles.btn}
          onClick={onRedo}
          disabled={!canRedo}
          id="redo-btn"
          aria-label="Redo"
          title="Redo"
        >
          ↪
        </button>
      </div>

      {/* Center — zoom */}
      <div className={styles.group}>
        <button
          className={styles.btn}
          onClick={zoomOut}
          id="zoom-out-btn"
          aria-label="Zoom out"
          title="Zoom out"
        >
          −
        </button>
        <button
          className={`${styles.btn} ${styles.zoomLabel}`}
          onClick={resetZoom}
          id="zoom-reset-btn"
          aria-label="Reset zoom"
          title="Reset zoom to 100%"
        >
          {zoomPercent}%
        </button>
        <button
          className={styles.btn}
          onClick={zoomIn}
          id="zoom-in-btn"
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </button>
      </div>

      {/* Right — experience mode */}
      {mode === 'edit' ? (
        <button
          className={`${styles.btn} ${styles.previewBtn}`}
          onClick={() => setMode('experience')}
          id="preview-experience-btn"
          aria-label="Preview Experience"
        >
          ▶ Preview Experience
        </button>
      ) : (
        <button
          className={`${styles.btn} ${styles.backBtn}`}
          onClick={() => setMode('edit')}
          id="back-to-editor-btn"
          aria-label="Back to editor"
        >
          ← Back to Editor
        </button>
      )}
    </div>
  );
}
