'use client';

import styles from './LeftToolbar.module.css';
import { useCanvasStore } from '@/stores/canvasStore';
import { ToolType } from '@/types/canvas';

interface Tool {
  id: ToolType;
  label: string;
  icon: string;
  shortcut?: string;
}

const TOOLS: Tool[] = [
  { id: 'select', label: 'Select', icon: '↖', shortcut: 'V' },
  { id: 'draw', label: 'Draw', icon: '✏', shortcut: 'D' },
  { id: 'text', label: 'Text', icon: 'T', shortcut: 'T' },
  { id: 'rect', label: 'Rectangle', icon: '▭', shortcut: 'R' },
  { id: 'ellipse', label: 'Ellipse', icon: '○', shortcut: 'E' },
  { id: 'line', label: 'Line', icon: '╱', shortcut: 'L' },
  { id: 'arrow', label: 'Arrow', icon: '→', shortcut: 'A' },
  { id: 'hotspot', label: 'Hotspot', icon: '⊕', shortcut: 'H' },
  { id: 'eraser', label: 'Eraser', icon: '⌦', shortcut: 'X' },
];

const DRAW_COLORS = [
  '#1A0F08', '#5C3D2E', '#C77B5A', '#E8A87C',
  '#5A9B7A', '#4A89B0', '#8B6BAE', '#D4A853',
  '#FFFFFF', '#F2EAE0',
];

const DRAW_WIDTHS = [
  { value: 1, label: 'XS' },
  { value: 2, label: 'S' },
  { value: 3, label: 'M' },
  { value: 5, label: 'L' },
  { value: 8, label: 'XL' },
];

export default function LeftToolbar() {
  const { activeTool, setActiveTool, drawColor, setDrawColor, drawWidth, setDrawWidth, mode } =
    useCanvasStore();

  if (mode === 'experience') return null;

  return (
    <aside className={styles.toolbar} aria-label="Drawing tools">
      <nav className={styles.tools}>
        {TOOLS.map((tool) => (
          <div key={tool.id} className={styles.tooltipWrap}>
            <button
              id={`tool-${tool.id}`}
              className={`${styles.toolBtn} ${activeTool === tool.id ? styles.toolBtnActive : ''}`}
              onClick={() => setActiveTool(tool.id)}
              aria-label={tool.label}
              aria-pressed={activeTool === tool.id}
            >
              <span className={styles.toolIcon}>{tool.icon}</span>
            </button>
            <div className={styles.tooltip}>
              {tool.label}
              {tool.shortcut && <kbd className={styles.kbd}>{tool.shortcut}</kbd>}
            </div>
          </div>
        ))}
      </nav>

      <div className={styles.divider} />

      {/* Color swatches */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Color</div>
        <div className={styles.colorGrid}>
          {DRAW_COLORS.map((color) => (
            <button
              key={color}
              className={`${styles.colorSwatch} ${drawColor === color ? styles.colorSwatchActive : ''}`}
              style={{ background: color }}
              onClick={() => setDrawColor(color)}
              aria-label={`Color ${color}`}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Stroke width */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Width</div>
        <div className={styles.widthRow}>
          {DRAW_WIDTHS.map((w) => (
            <button
              key={w.value}
              className={`${styles.widthBtn} ${drawWidth === w.value ? styles.widthBtnActive : ''}`}
              onClick={() => setDrawWidth(w.value)}
              aria-label={`Stroke width ${w.label}`}
            >
              <span
                style={{
                  display: 'block',
                  width: '16px',
                  height: `${Math.min(w.value, 6)}px`,
                  background: 'currentColor',
                  borderRadius: '99px',
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* AI Enhance teaser */}
      <div className={styles.divider} />
      <div className={styles.aiHint}>
        <span className={styles.aiStar}>✦</span>
        <span>Select an object to make it interactive</span>
      </div>
    </aside>
  );
}
