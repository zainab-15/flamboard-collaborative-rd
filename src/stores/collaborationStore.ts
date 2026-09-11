import { create } from 'zustand';
import { CollaboratorUser, CursorPosition, UserActivity } from '@/types/canvas';

// Assign distinct warm colors to collaborators
const COLLAB_COLORS = [
  '#C77B5A', // terracotta
  '#8B6BAE', // mauve
  '#5A9B7A', // sage
  '#D4A853', // amber
  '#C45C8A', // rose
  '#4A89B0', // slate blue
  '#7B9E5A', // olive
  '#B05A5A', // dusty red
];

let colorIndex = 0;
export function getNextColor(): string {
  return COLLAB_COLORS[colorIndex++ % COLLAB_COLORS.length];
}

interface CollaborationStore {
  // Current user
  currentUser: CollaboratorUser | null;
  roomId: string | null;
  
  // Peers
  peers: CollaboratorUser[];
  cursors: Map<string, CursorPosition>;
  
  // Connection
  connected: boolean;
  connecting: boolean;
  reconnecting: boolean;
  
  // Actions
  setCurrentUser: (user: CollaboratorUser) => void;
  setRoomId: (id: string) => void;
  
  addPeer: (user: CollaboratorUser) => void;
  removePeer: (userId: string) => void;
  updatePeerActivity: (userId: string, activity: UserActivity) => void;
  setPeers: (users: CollaboratorUser[]) => void;
  
  updateCursor: (position: CursorPosition) => void;
  removeCursor: (userId: string) => void;
  
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
}

export const useCollaborationStore = create<CollaborationStore>((set) => ({
  currentUser: null,
  roomId: null,
  peers: [],
  cursors: new Map(),
  connected: false,
  connecting: false,
  reconnecting: false,

  setCurrentUser: (user) => set({ currentUser: user }),
  setRoomId: (id) => set({ roomId: id }),

  addPeer: (user) =>
    set((state) => ({
      peers: state.peers.some((p) => p.id === user.id)
        ? state.peers.map((p) => (p.id === user.id ? user : p))
        : [...state.peers, user],
    })),

  removePeer: (userId) =>
    set((state) => ({
      peers: state.peers.filter((p) => p.id !== userId),
    })),

  updatePeerActivity: (userId, activity) =>
    set((state) => ({
      peers: state.peers.map((p) =>
        p.id === userId ? { ...p, activity } : p
      ),
    })),

  setPeers: (users) => set({ peers: users }),

  updateCursor: (position) =>
    set((state) => {
      const next = new Map(state.cursors);
      next.set(position.userId, position);
      return { cursors: next };
    }),

  removeCursor: (userId) =>
    set((state) => {
      const next = new Map(state.cursors);
      next.delete(userId);
      return { cursors: next };
    }),

  setConnected: (connected) =>
    set({ connected, connecting: false, reconnecting: false }),
  setConnecting: (connecting) =>
    set({ connecting }),
  setReconnecting: (reconnecting) =>
    set((state) => ({
      reconnecting,
      connected: reconnecting ? false : state.connected,
    })),
}));
