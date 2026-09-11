'use client';

import { useState } from 'react';
import styles from './RDPanel.module.css';
import { usePerformance } from '@/hooks/usePerformance';
import { useCanvasStore } from '@/stores/canvasStore';

export default function RDPanel() {
  const [localOpen, setLocalOpen] = useState(false);
  const { metrics } = usePerformance();
  const { showRDPanel, toggleRDPanel } = useCanvasStore();

  const isOpen = showRDPanel || localOpen;

  const handleToggle = () => {
    setLocalOpen((prev) => !prev);
    toggleRDPanel();
  };

  const fpsColor = metrics.fps >= 55 ? '#5A9B7A' : metrics.fps >= 30 ? '#D4A853' : '#C05050';
  const latencyColor = metrics.latency < 50 ? '#5A9B7A' : metrics.latency < 150 ? '#D4A853' : '#C05050';

  return (
    <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}>
      <button
        className={styles.toggle}
        onClick={handleToggle}
        id="rd-panel-toggle"
        aria-label="Toggle R&D telemetry panel"
        aria-expanded={isOpen}
        title={isOpen ? 'Collapse telemetry panel' : 'Click to inspect live FPS, socket latency & event counts'}
      >
        <span className={styles.toggleIcon}>{isOpen ? '▾' : '▸'}</span>
        <span className={styles.toggleLabel}>R&D</span>
        <span
          className={styles.fpsIndicator}
          style={{ color: fpsColor }}
        >
          {metrics.fps}fps
        </span>
      </button>

      {isOpen && (
        <div className={styles.content} role="status" aria-live="polite">
          <div className={styles.title}>LIVE SYSTEM</div>

          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>FPS</span>
            <span className={styles.metricValue} style={{ color: fpsColor }}>
              {metrics.fps}
            </span>
          </div>

          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>SYNC</span>
            <span className={styles.metricValue} style={{ color: latencyColor }}>
              {metrics.latency > 0 ? `${metrics.latency}ms` : '—'}
            </span>
          </div>

          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>USERS</span>
            <span className={styles.metricValue}>{metrics.activeUsers}</span>
          </div>

          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>EVENTS/S</span>
            <span className={styles.metricValue}>{metrics.eventsPerSec}</span>
          </div>

          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>OBJECTS</span>
            <span className={styles.metricValue}>{metrics.objectCount}</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>STATUS</span>
            <span
              className={styles.statusBadge}
              style={{
                background:
                  metrics.syncStatus === 'synced'
                    ? 'rgba(90,155,122,0.15)'
                    : metrics.syncStatus === 'syncing'
                    ? 'rgba(212,168,83,0.15)'
                    : 'rgba(192,80,80,0.15)',
                color:
                  metrics.syncStatus === 'synced'
                    ? '#3A7A5A'
                    : metrics.syncStatus === 'syncing'
                    ? '#8A6A20'
                    : '#A04040',
              }}
            >
              {metrics.syncStatus}
            </span>
          </div>

          <p className={styles.note}>Real metrics via rAF + ping/pong</p>
        </div>
      )}
    </div>
  );
}
