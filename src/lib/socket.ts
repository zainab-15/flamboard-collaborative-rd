'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
    // Resolve target URL:
    // 1. Explicit env var if set (e.g. deployed separate backend)
    // 2. In browser: window.location.origin (e.g. "http://localhost:3000")
    // 3. Fallback to undefined for socket.io default resolution
    // CRITICAL: NEVER pass an empty string '' to io()! In socket.io-client,
    // passing '' causes the internal parser to construct 'http://:80',
    // which fails to connect and leaves the client stuck in "Disconnected".
    const url = envUrl || (typeof window !== 'undefined' ? window.location.origin : undefined);

    socket = io(url as string | undefined, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
