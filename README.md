# FLAMBOARD

> **"From ideas to interactive experiences."**

A real-time collaborative canvas authoring studio — built as the FlamAI Software Engineering Intern (Frontend R&D) assignment submission.

---

## Overview

FLAMBOARD is not a whiteboard. It is an **interactive content authoring tool** that lives on a collaborative canvas.

Where traditional tools ask you to **draw and save**, FLAMBOARD asks you to:

```
Imagine → Collaborate → Create → Make Interactive → Experience
```

The central idea: every object on the canvas carries **intent** and **interaction** — not just pixels.

---

## Problem / Motivation

Collaborative canvas tools exist. But they stop at the canvas edge.

A product designer who wants to show how an object *behaves* — not just how it *looks* — has to leave the canvas, open a different tool, and rebuild.

FLAMBOARD eliminates that context switch: **design, collaborate, and experience interactive content in one environment.**

---

## Assignment

**Company:** FlamAI  
**Role:** Software Engineering Intern — Frontend R&D  
**Selected Challenge:** Real-time collaborative drawing/canvas experience

---

## Product Concept

The core FLAMBOARD model:

```
VISUAL OBJECT + INTENT + INTERACTION = INTERACTIVE CONTENT
```

Every object has:
- A **visual representation** (shape, text, image)
- An **intent** (what it *is*: product, CTA, hotspot, media)
- An **interaction** (what it *does*: rotate, reveal, open link, expand)

Objects authored in Edit mode become live interactive elements in **Experience mode**.

---

## Key Features

### ✅ Core Collaborative Canvas (P0)
- Real-time freehand drawing with stroke-level sync
- Rectangle, ellipse, line, arrow, text, hotspot tools
- Object selection, move, resize, rotate
- Multi-object selection with shared Transformer
- Inline text editing (double-click)
- Delete, undo, redo (50-entry history stack)
- Zoom and pan (scroll wheel + drag)
- Keyboard shortcuts (V, D, T, R, E, L, A, H, X, Cmd+Z)

### ✅ Real-Time Collaboration (P0)
- Socket.IO rooms — join by room ID
- Live cursor synchronization (throttled to 16ms)
- Live stroke synchronization (throttled to 32ms)
- Object CRUD sync across all users
- Presence: collaborator avatars, names, activity states
- Connection/reconnection status display

### ✅ Intent-Based Object Model (P1)
- Object intents: Product, CTA, Information, Media, Hotspot, Decorative
- Object interactions: Rotate, Reveal, Open Link, Expand, Play Media
- **Smart "Make Interactive"** — deterministic intent detection based on object type and content — no AI API required, no hallucination risk

### ✅ Experience Mode (P1)
- Edit ↔ Experience mode toggle
- Hotspot reveal interactions
- CTA link opening
- Device preview selector: Desktop / Tablet / Mobile
- Experience mode dark overlay with dimension display

### ✅ Visual Identity (P1)
- Warm ivory / parchment / terracotta color system
- Inter (UI) + Lora (editorial serif) + Caveat (handwritten annotations)
- Cursor-responsive parallax on landing hero
- Ambient background blobs with slow organic motion
- Object hover lift effect with shadow change

### ✅ R&D Performance Panel (P1)
- **Real FPS** via `requestAnimationFrame` frame counting
- **Real Socket.IO latency** via ping/pong round-trip (every 2 seconds)
- Events/sec, active users, object count, sync status
- Collapsible — non-intrusive for normal users

### ✅ Demo Scene
- Pre-populated AURA Headphones campaign
- Product shapes, headline, tagline, spec badges, CTA button, hotspot
- Handwritten annotations ("Make this interactive")
- All objects have pre-configured intents and interactions

---

## Novelty

Most canvas tools treat objects as **pixels**. FLAMBOARD treats them as **entities with meaning**.

The intent + interaction model is the differentiator:
1. You draw or place an object
2. You assign intent (what is this?)
3. You assign interaction (what does it do?)
4. You click "Preview Experience"
5. The canvas becomes a live interactive environment

This turns a whiteboard into a **lightweight no-code interactive content tool**.

---

## Real-Time Architecture

```
Browser Client A          Custom Node.js Server          Browser Client B
      │                   (server.js + Socket.IO)               │
      │── join-room ──────────────────────────────────────────────│
      │                    room-state (initial) ──────────────────│
      │── cursor-move ────────────────────────────────────────────│
      │                    cursor-update ─────────────────────────│
      │── stroke-start ───────────────────────────────────────────│
      │── stroke-update (32ms throttle) ──────────────────────────│
      │── stroke-end ─────────────────────────────────────────────│
      │── object-create/update/delete ────────────────────────────│
      │── canvas-clear ───────────────────────────────────────────│
      │── ping-latency ─── pong-latency ──────────────────────────│
```

**In-memory room state** (sufficient for demo; production would use Redis Pub/Sub).

**Throttling:** Cursor events at 16ms (≤60fps), stroke updates at 32ms. This keeps bandwidth proportional to canvas activity rather than spinning at maximum rate.

**Reconnection:** Socket.IO handles automatic reconnection with exponential backoff. On reconnect, the server re-delivers current room state.

---

## Interactive Object Model

```typescript
interface FlamObject {
  id: string;
  type: 'rect' | 'ellipse' | 'line' | 'arrow' | 'text' | 'stroke' | 'hotspot';
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  depth: number;           // z-ordering
  opacity: number;
  locked: boolean;
  visible: boolean;

  // Visual
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;

  // Content
  text?: string;
  fontSize?: number;
  fontFamily?: string;

  // INTENT SYSTEM — the differentiator
  intent?: 'product' | 'cta' | 'information' | 'media' | 'hotspot' | 'decorative';
  interaction?: {
    type: 'rotate' | 'reveal' | 'openLink' | 'expand' | 'playMedia';
    url?: string;
    revealContent?: string;
    rotationSpeed?: number;
  };
}
```

---

## UI/UX Philosophy

**Warm editorial design** — not a generic SaaS dashboard.

Color palette: ivory (`#FAF6F0`), parchment (`#EDE0CE`), espresso (`#1A0F08`), terracotta (`#C77B5A`).

Typography hierarchy:
- **Inter** — UI controls, labels, body text
- **Lora** — editorial headings, product names
- **Caveat** — handwritten canvas annotations only

Motion principles:
- Ambient background: 20–30 second cycles, very low amplitude
- Cursor parallax: 1–4px movement, smooth 150ms easing
- Object hover: subtle lift via shadow change, no scale jump
- UI transitions: 120–350ms, `cubic-bezier(0.16, 1, 0.3, 1)`
- `prefers-reduced-motion` respected — all animations disabled

**Depth hierarchy:**
```
Background (ambient blobs) → Canvas → Objects → Cursors → UI panels
```

---

## Performance Considerations

| Concern | Approach |
|---|---|
| Canvas rendering | Konva scene graph batches draw calls; no manual Canvas API management |
| Cursor sync | Throttled to 16ms client-side; server rebroadcasts only |
| Stroke sync | Throttled to 32ms; stroke converted to permanent object on `stroke-end` |
| Object count | Linear rendering; acceptable to ~500 objects without virtualization |
| FPS measurement | Real `requestAnimationFrame` loop — no fake values |
| Latency measurement | Real Socket.IO ping/pong every 2 seconds |
| Memory | Event listeners, timers, and RAF loops cleaned up on unmount |

**Undo/redo:** Local-only (correct). Full collaborative undo requires CRDT, which is out of scope for this assignment and would add significant complexity without improving the demo.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | Framework, SSR for landing page, dynamic imports for canvas |
| **TypeScript 5** | Typed object model, store, events |
| **Konva.js + react-konva** | Canvas scene graph, hit-testing, transforms |
| **Socket.IO 4** | Real-time collaboration (rooms, reconnection, events) |
| **Zustand 5** | Canvas + collaboration state (zero boilerplate) |
| **Vanilla CSS + CSS Modules** | Complete design control, warm editorial aesthetic |
| **Google Fonts** | Inter + Lora + Caveat |

---

## Architecture

```
flamai/
├── server.js              # Custom Socket.IO + Next.js server
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── page.tsx       # Landing page
│   │   └── board/[roomId] # Editor page (dynamic, no SSR)
│   ├── components/
│   │   ├── canvas/        # FlamBoard, CanvasObjects, CollaboratorCursors
│   │   ├── editor/        # Editor, TopBar, LeftToolbar, RightSidebar, BottomControls
│   │   └── ui/            # RDPanel
│   ├── hooks/             # useSocket, usePerformance
│   ├── lib/               # socket.ts (singleton), demoScene.ts
│   ├── stores/            # canvasStore, collaborationStore (Zustand)
│   └── types/             # canvas.ts (all interfaces)
```

---

## Running Locally

```bash
git clone <repo>
cd flamai
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**To test real-time collaboration:** Open two browser windows/tabs to the same board URL.

**To see the demo scene:** Click "+ Create New Experience" on the landing page.

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SOCKET_URL=    # Empty = connect to same origin (correct for local dev)
```

For deployment, set `NEXT_PUBLIC_SOCKET_URL` to your server URL if Socket.IO and Next.js are on different domains.

---

## Deployment

⚠️ **Vercel is NOT suitable** — serverless functions don't support persistent WebSocket connections.

**Recommended:** Railway, Render, or Fly.io

```bash
# Production
npm run build
NODE_ENV=production node server.js
```

Set `PORT` environment variable for the target platform.

---

## Engineering Tradeoffs

| Decision | Tradeoff |
|---|---|
| Konva over raw Canvas | +250KB bundle, saves ~3 days of hit-testing/transform work |
| Socket.IO over raw WebSockets | +60KB, provides rooms, reconnection, namespace support |
| In-memory room state | Lost on server restart; would use Redis in production |
| Local-only undo | Correct for simplicity; collaborative undo requires CRDT |
| Deterministic "Make Interactive" | No AI risk, 100% reliable; less "magic" |
| CSS Modules over Tailwind | Full design control; no utility-class interference |

---

## Known Limitations

1. **Undo is local-only** — other collaborators don't see your undo operations
2. **No image upload** — image objects not yet implemented (P1 incomplete)
3. **Room state lost on server restart** — in-memory only; acceptable for demo
4. **Canvas pan** — requires no object selected; space+drag not yet implemented
5. **Experience mode rotate** — interaction assigned but animation not yet wired
6. **No auth** — any user can join any room by URL; by design for a demo

---

## Future Improvements

- Redis Pub/Sub for persistent room state and horizontal scaling
- CRDT (e.g., Yjs) for proper collaborative undo
- Image upload with signed URLs
- Stroke eraser (not just object delete)
- Lock/unlock objects collaboratively
- Share link with read-only mode
- Export to image/PDF
- More interaction types (Lottie animations, video)
- AI Director: "Create a product ad for X" → structured scene

---

## Screenshots

> Open the app locally to see the full experience.

```
Landing page → Create Experience → AURA Demo Scene →
Select object → Make Interactive → Preview Experience
```

---

## Live Demo

_Deploy to Railway/Render and update this section._

---

*Built by Zainab Barwaniwala for the FlamAI Frontend R&D internship assignment.*
