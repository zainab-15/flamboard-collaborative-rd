'use client';

import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { PerformanceMetrics } from '@/types/canvas';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCollaborationStore } from '@/stores/collaborationStore';

export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    latency: 0,
    activeUsers: 0,
    eventsPerSec: 0,
    objectCount: 0,
    syncStatus: 'offline',
  });

  const frameRef = useRef(0);
  const lastFrameTime = useRef(performance.now());
  const frameCount = useRef(0);
  const eventCount = useRef(0);
  const eventWindowRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const latencyRef = useRef(0);

  useEffect(() => {
    // ── FPS measurement ──
    const measureFPS = () => {
      const now = performance.now();
      frameCount.current++;
      frameRef.current++;

      if (now - lastFrameTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (now - lastFrameTime.current));
        frameCount.current = 0;
        lastFrameTime.current = now;

        // Events per second (rolling 1-second window)
        const windowStart = now - 1000;
        eventWindowRef.current = eventWindowRef.current.filter((t) => t > windowStart);
        const eventsPerSec = eventWindowRef.current.length;

        const objects = useCanvasStore.getState().objects;
        const peers = useCollaborationStore.getState().peers;
        const connected = useCollaborationStore.getState().connected;

        setMetrics({
          fps,
          latency: latencyRef.current,
          activeUsers: peers.length + 1,
          eventsPerSec,
          objectCount: objects.length,
          syncStatus: connected ? 'synced' : 'offline',
        });
      }

      rafRef.current = requestAnimationFrame(measureFPS);
    };

    rafRef.current = requestAnimationFrame(measureFPS);

    // ── Ping / latency measurement ──
    const socket = getSocket();

    const startPing = () => {
      pingIntervalRef.current = setInterval(() => {
        const t = Date.now();
        socket.emit('ping-latency', t);
      }, 2000);
    };

    socket.on('pong-latency', (t: number) => {
      latencyRef.current = Date.now() - t;
    });

    socket.on('connect', startPing);
    if (socket.connected) startPing();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      socket.off('pong-latency');
      socket.off('connect', startPing);
    };
  }, []);

  // Track events
  const recordEvent = () => {
    eventWindowRef.current.push(performance.now());
  };

  return { metrics, recordEvent };
}
