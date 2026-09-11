'use client';

import { useState } from 'react';
import styles from './ExperienceMode.module.css';
import { useCanvasStore } from '@/stores/canvasStore';

type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICE_CONFIG: Record<Device, { width: number; height: number; label: string; icon: string }> = {
  desktop: { width: 1280, height: 720, label: 'Desktop', icon: '▭' },
  tablet: { width: 768, height: 1024, label: 'Tablet', icon: '▯' },
  mobile: { width: 390, height: 844, label: 'Mobile', icon: '▮' },
};

export default function ExperienceMode() {
  const { setMode, devicePreview, setDevicePreview } = useCanvasStore();
  const device = DEVICE_CONFIG[devicePreview];

  return (
    <div className={styles.overlay}>
      {/* Experience mode header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.badge}>▶ EXPERIENCE MODE</span>
          <span className={styles.hint}>Interactive objects are now active</span>
        </div>

        {/* Device selector */}
        <div className={styles.deviceSelector} role="group" aria-label="Device preview">
          {(Object.keys(DEVICE_CONFIG) as Device[]).map((d) => (
            <button
              key={d}
              className={`${styles.deviceBtn} ${devicePreview === d ? styles.deviceBtnActive : ''}`}
              onClick={() => setDevicePreview(d)}
              id={`device-${d}`}
              aria-label={DEVICE_CONFIG[d].label}
              title={DEVICE_CONFIG[d].label}
            >
              {DEVICE_CONFIG[d].icon} {DEVICE_CONFIG[d].label}
            </button>
          ))}
        </div>

        <button
          className={styles.backBtn}
          onClick={() => setMode('edit')}
          id="experience-back-btn"
        >
          ← Back to Editor
        </button>
      </div>

      {/* Device frame overlay */}
      <div className={styles.viewportContainer}>
        <div className={`${styles.deviceBezel} ${styles[devicePreview]}`}>
          <div className={styles.bezelHeader}>
            {devicePreview === 'mobile' ? (
              <div className={styles.notch} />
            ) : devicePreview === 'tablet' ? (
              <div className={styles.cameraDot} />
            ) : (
              <div className={styles.desktopBar}>
                <div className={styles.windowDot} style={{ background: '#FF5F56' }} />
                <div className={styles.windowDot} style={{ background: '#FFBD2E' }} />
                <div className={styles.windowDot} style={{ background: '#27C93F' }} />
                <span className={styles.browserAddress}>flamboard.app · {device.label} Preview</span>
              </div>
            )}
          </div>
          <div className={styles.frameLabel}>
            {device.label} ({device.width} × {device.height}px)
          </div>
        </div>
      </div>

      {/* Device frame hint */}
      <div className={styles.deviceInfo}>
        <span>Interactive preview active · Click hotspots or rotate objects</span>
      </div>
    </div>
  );
}
