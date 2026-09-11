// ─── Core Object Model ────────────────────────────────────────────────────────

export type ObjectType =
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'text'
  | 'image'
  | 'stroke'
  | 'hotspot'
  | 'component'
  | 'arrow';

export type IntentType =
  | 'product'
  | 'cta'
  | 'information'
  | 'media'
  | 'hotspot'
  | 'decorative'
  | null;

export type InteractionType =
  | 'rotate'
  | 'reveal'
  | 'openLink'
  | 'expand'
  | 'playMedia'
  | 'custom';

export interface InteractionConfig {
  type: InteractionType;
  url?: string;
  revealContent?: string;
  rotationSpeed?: number;
  expandScale?: number;
  customScript?: string;
}

export interface FlamObject {
  id: string;
  type: ObjectType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  depth: number;
  opacity: number;
  locked: boolean;
  visible: boolean;

  // Visual
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  dash?: number[];

  // Content
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  align?: 'left' | 'center' | 'right';
  src?: string;

  // Stroke-specific
  points?: number[];
  tension?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'bevel' | 'round' | 'miter';
  finalized?: boolean;

  // Intent-based system
  intent?: IntentType;
  interaction?: InteractionConfig;

  // Collaboration
  lockedBy?: string;
  createdBy?: string;

  // Metadata
  name?: string;
  metadata?: Record<string, unknown>;

  // Demo
  demoAnnotation?: string;
}

// ─── User / Collaboration ────────────────────────────────────────────────────

export type UserActivity =
  | 'Idle'
  | 'Drawing'
  | 'Editing'
  | 'Selecting'
  | 'Adding text'
  | 'Moving'
  | 'Resizing';

export interface CollaboratorUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  socketId?: string;
  activity?: UserActivity;
}

export interface CursorPosition {
  userId: string;
  x: number;
  y: number;
  user: CollaboratorUser;
}

// ─── Canvas State ────────────────────────────────────────────────────────────

export type ToolType =
  | 'select'
  | 'draw'
  | 'text'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'image'
  | 'hotspot'
  | 'eraser';

export type AppMode = 'edit' | 'experience';
export type DevicePreview = 'desktop' | 'tablet' | 'mobile';

// ─── Room / Session ──────────────────────────────────────────────────────────

export interface RoomState {
  id: string;
  name: string;
  objects: FlamObject[];
  users: CollaboratorUser[];
  createdAt: number;
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  objects: FlamObject[];
  timestamp: number;
  description: string;
}

// ─── Performance ─────────────────────────────────────────────────────────────

export interface PerformanceMetrics {
  fps: number;
  latency: number;
  activeUsers: number;
  eventsPerSec: number;
  objectCount: number;
  syncStatus: 'synced' | 'syncing' | 'offline';
}
