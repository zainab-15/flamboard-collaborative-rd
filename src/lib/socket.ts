'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();

    // Determine target URL:
    // In production on Render (or any public domain), always connect to same-origin (window.location.origin).
    // Never allow a localhost URL to be used when running on a public hostname.
    let url: string | undefined = undefined;

    if (typeof window !== 'undefined') {
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (envUrl && envUrl.length > 0) {
        // If an explicit envUrl is provided, only allow it if it's not pointing to localhost on a remote domain
        if (isLocalHost || !envUrl.includes('localhost')) {
          url = envUrl;
        } else {
          url = window.location.origin;
        }
      } else {
        url = window.location.origin;
      }
    } else {
      url = envUrl || undefined;
    }

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
