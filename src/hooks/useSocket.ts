'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCollaborationStore, getNextColor } from '@/stores/collaborationStore';
import { FlamObject, CollaboratorUser, UserActivity } from '@/types/canvas';
import { v4 as uuidv4 } from 'uuid';

// Throttle helper
function throttle<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let last = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  }) as T;
}

interface UseSocketOptions {
  roomId: string;
  userName: string;
}

export function useSocket({ roomId, userName }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const {
    applyRemoteCreate,
    applyRemoteUpdate,
    applyRemoteDelete,
    applyRemoteClear,
    applyBulkObjects,
  } = useCanvasStore();
  const {
    setCurrentUser,
    setRoomId,
    addPeer,
    removePeer,
    updatePeerActivity,
    setPeers,
    updateCursor,
    removeCursor,
    setConnected,
    setConnecting,
    setReconnecting,
  } = useCollaborationStore();

  // Pending live strokes from remote users
  const remoteStrokes = useRef<Map<string, FlamObject>>(new Map());

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // Maintain stable user across re-mounts/hot-reloads
    const existing = useCollaborationStore.getState().currentUser;
    const currentUser: CollaboratorUser = {
      id: existing && existing.name === userName ? existing.id : uuidv4(),
      name: userName,
      color: existing && existing.name === userName ? existing.color : getNextColor(),
    };
    setCurrentUser(currentUser);
    setRoomId(roomId);

    // ── Connection events ──
    const handleConnect = () => {
      setConnected(true);
      socket.emit('join-room', { roomId, user: currentUser });
    };

    const handleDisconnect = () => {
      setConnected(false);
      setReconnecting(true);
    };

    const handleConnectError = () => {
      setConnected(false);
      setReconnecting(true);
    };

    const handleReconnectAttempt = () => {
      setConnected(false);
      setReconnecting(true);
    };

    const handleReconnectFailed = () => {
      setConnected(false);
      setConnecting(false);
      setReconnecting(false);
    };

    const handleReconnect = () => {
      setConnected(true);
      socket.emit('join-room', { roomId, user: currentUser });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect_failed', handleReconnectFailed);
    socket.on('reconnect', handleReconnect);

    // ── Room state (initial) ──
    socket.on('room-state', ({ objects, users }: { objects: FlamObject[]; users: CollaboratorUser[] }) => {
      if (objects.length > 0) {
        applyBulkObjects(objects);
      }
      setPeers(users);
    });

    // ── Peer presence ──
    socket.on('user-joined', ({ user }: { user: CollaboratorUser }) => {
      addPeer(user);
    });

    socket.on('user-left', ({ userId }: { userId: string }) => {
      removePeer(userId);
      removeCursor(userId);
    });

    socket.on('user-activity-update', ({ userId, activity }: { userId: string; activity: UserActivity }) => {
      updatePeerActivity(userId, activity);
    });

    // ── Cursor ──
    socket.on('cursor-update', (data) => {
      updateCursor(data);
    });

    // ── Object events ──
    socket.on('object-created', (object: FlamObject) => {
      applyRemoteCreate(object);
    });

    socket.on('object-updated', ({ id, changes }: { id: string; changes: Partial<FlamObject> }) => {
      applyRemoteUpdate(id, changes);
    });

    socket.on('object-deleted', ({ id }: { id: string }) => {
      applyRemoteDelete(id);
    });

    socket.on('objects-bulk-updated', (objects: FlamObject[]) => {
      objects.forEach((obj) => applyRemoteUpdate(obj.id, obj));
    });

    // ── Stroke events ──
    socket.on('stroke-started', (stroke: FlamObject) => {
      remoteStrokes.current.set(stroke.id, stroke);
      applyRemoteCreate(stroke);
    });

    socket.on('stroke-updated', ({ id, points }: { id: string; points: number[] }) => {
      const stroke = remoteStrokes.current.get(id);
      if (stroke) {
        stroke.points = points;
        applyRemoteUpdate(id, { points });
      }
    });

    socket.on('stroke-ended', ({ id }: { id: string }) => {
      remoteStrokes.current.delete(id);
      // Mark as finalized
      applyRemoteUpdate(id, { finalized: true });
    });

    // ── Canvas clear ──
    socket.on('canvas-cleared', () => {
      applyRemoteClear();
    });

    // If socket already connected (singleton reuse / fast re-mount)
    if (socket.connected) {
      setConnected(true);
      socket.emit('join-room', { roomId, user: currentUser });
    } else {
      setConnecting(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect_failed', handleReconnectFailed);
      socket.off('reconnect', handleReconnect);
      socket.off('room-state');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('user-activity-update');
      socket.off('cursor-update');
      socket.off('object-created');
      socket.off('object-updated');
      socket.off('object-deleted');
      socket.off('objects-bulk-updated');
      socket.off('stroke-started');
      socket.off('stroke-updated');
      socket.off('stroke-ended');
      socket.off('canvas-cleared');
    };
  }, [roomId, userName]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Emit helpers (throttled) ──
  const emitCursorMove = useCallback(
    throttle((x: number, y: number) => {
      socketRef.current?.emit('cursor-move', { x, y });
    }, 16),
    []
  );

  const emitObjectCreate = useCallback((object: FlamObject) => {
    socketRef.current?.emit('object-create', object);
  }, []);

  const emitObjectUpdate = useCallback((id: string, changes: Partial<FlamObject>) => {
    socketRef.current?.emit('object-update', { id, changes });
  }, []);

  const emitObjectDelete = useCallback((id: string) => {
    socketRef.current?.emit('object-delete', { id });
  }, []);

  const emitStrokeStart = useCallback((stroke: FlamObject) => {
    socketRef.current?.emit('stroke-start', stroke);
  }, []);

  const emitStrokeUpdate = useCallback(
    throttle((id: string, points: number[]) => {
      socketRef.current?.emit('stroke-update', { id, points });
    }, 32),
    []
  );

  const emitStrokeEnd = useCallback((id: string) => {
    socketRef.current?.emit('stroke-end', { id });
  }, []);

  const emitCanvasClear = useCallback(() => {
    socketRef.current?.emit('canvas-clear');
  }, []);

  const emitUserActivity = useCallback((activity: UserActivity) => {
    socketRef.current?.emit('user-activity', { activity });
  }, []);

  const emitObjectsBulk = useCallback((objects: FlamObject[]) => {
    socketRef.current?.emit('objects-bulk-update', objects);
  }, []);

  return {
    socket: socketRef.current,
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
  };
}
