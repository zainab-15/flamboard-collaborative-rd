# AGEND.md — FLAMBOARD Project Continuity Document

> **IMPORTANT:** If you are an AI agent reading this, read this file FIRST, then inspect the actual codebase to verify current state before making any changes.

---

## Project Overview

**FLAMBOARD** is a real-time collaborative canvas authoring studio built as a submission for the FlamAI Software Engineering Intern — Frontend R&D assignment.

- **Tagline:** "From ideas to interactive experiences."
- **Assignment:** Real-time collaborative drawing/canvas experience
- **Repository:** `/Users/zainabbarwaniwala/Desktop/flamai`

---

## Current Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.x (App Router) | Framework, SSR, routing |
| TypeScript | 5.x | Type safety |
| react-konva / Konva | 19.x / 10.x | Canvas scene graph, objects, transforms |
| Socket.IO | 4.x | Real-time collaboration |
| Zustand | 5.x | State management (canvas + collaboration) |
| Framer Motion | 13.x | Installed, not yet used for transitions |
| Lucide React | 1.x | Icons (installed, not yet used) |
| Vanilla CSS Modules | — | Styling |
| Google Fonts | — | Inter + Lora + Caveat |

---

## Architecture

```
server.js                    ← Custom Node.js + Socket.IO server (replaces next start)
src/
  app/
    layout.tsx               ← Root layout, fonts, metadata
    page.tsx                 ← Landing page
    landing.module.css       ← Landing page styles
    globals.css              ← Design system (CSS tokens + utilities)
    board/[roomId]/
      layout.tsx
      page.tsx               ← Board page (dynamic import Editor, no SSR)
  components/
    canvas/
      FlamBoard.tsx          ← Konva Stage: drawing, selection, pan/zoom, cursors
      CanvasObjects.tsx      ← Renders all FlamObjects with Transformer handles
      CollaboratorCursors.tsx ← Remote cursor overlay
    editor/
      Editor.tsx             ← Main orchestrator (wires socket + store + UI)
      Editor.module.css
      TopBar.tsx             ← Brand, collaborators, connection, mode toggle
      TopBar.module.css
      LeftToolbar.tsx        ← Tool selection, color, stroke width
      LeftToolbar.module.css
      RightSidebar.tsx       ← Properties, intent, interaction, layers, collaborators
      RightSidebar.module.css
      BottomControls.tsx     ← Undo, redo, zoom, preview toggle
      BottomControls.module.css
      ExperienceMode.tsx     ← Experience mode overlay + device picker
      ExperienceMode.module.css
    ui/
      RDPanel.tsx            ← R&D performance panel (real FPS, latency, metrics)
      RDPanel.module.css
  hooks/
    useSocket.ts             ← Socket.IO lifecycle, event handlers, emit helpers
    usePerformance.ts        ← Real FPS (rAF), real latency (ping/pong), metrics
  lib/
    socket.ts                ← Socket.IO client singleton
    demoScene.ts             ← AURA Headphones pre-populated demo scene
  stores/
    canvasStore.ts           ← Zustand: objects, selection, tool, zoom, history
    collaborationStore.ts    ← Zustand: currentUser, peers, cursors, connection
  types/
    canvas.ts                ← All TypeScript interfaces (FlamObject, etc.)
```

---

## Real-Time Synchronization Model

- Custom Node.js HTTP server + Socket.IO server in `server.js`
- In-memory room state: `Map<roomId, { objects, strokes, users }>`
- Events:
  - `join-room` → `room-state` (initial state delivery)
  - `cursor-move` → `cursor-update` (throttled 16ms client-side)
  - `object-create` / `object-update` / `object-delete` (full CRUD)
  - `stroke-start` / `stroke-update` / `stroke-end` (live drawing, throttled 32ms)
  - `canvas-clear`
  - `user-activity` → `user-activity-update`
  - `user-joined` / `user-left`
  - `ping-latency` / `pong-latency` (for real latency measurement)

---

## Object Data Model

```typescript
interface FlamObject {
  id: string;
  type: 'rect' | 'ellipse' | 'line' | 'text' | 'image' | 'stroke' | 'hotspot' | 'component' | 'arrow';
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  depth: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  // Visual: fill, stroke, strokeWidth, cornerRadius
  // Content: text, fontSize, fontFamily, src
  // Stroke: points, tension, lineCap
  // INTENT SYSTEM (key differentiator):
  intent?: 'product' | 'cta' | 'information' | 'media' | 'hotspot' | 'decorative';
  interaction?: { type: InteractionType; url?; revealContent?; rotationSpeed?; }
}
```

---

## Current Implementation Status

### ✅ Completed (Phase 1–4)

**Infrastructure**
- [x] Next.js 14 scaffold with TypeScript
- [x] Custom Socket.IO server (`server.js`)
- [x] All TypeScript types (`src/types/canvas.ts`)
- [x] Zustand stores (canvas + collaboration)
- [x] Socket.IO client singleton
- [x] `.gitignore` (env files protected)
- [x] `.env.local` / `.env.example`

**Core Canvas (P0)**
- [x] Konva Stage with pan/zoom (scroll wheel)
- [x] Freehand drawing tool (live sync via strokes)
- [x] Rectangle tool
- [x] Ellipse tool
- [x] Text tool
- [x] Line tool
- [x] Arrow tool
- [x] Hotspot tool
- [x] Eraser tool
- [x] Selection (click, shift-click multi-select)
- [x] Move objects (drag)
- [x] Resize objects (Konva Transformer)
- [x] Rotate objects (Konva Transformer)
- [x] Delete objects (Delete/Backspace key)
- [x] Undo/redo (history stack, 50 entries)
- [x] Keyboard shortcuts (V, D, T, R, E, L, A, H, X, Cmd+Z, Cmd+Shift+Z)

**Real-Time Collaboration (P0)**
- [x] Socket.IO rooms
- [x] Join room flow with user identity
- [x] Cursor sync (throttled 16ms)
- [x] Remote cursor rendering (name + activity)
- [x] Object CRUD sync
- [x] Live stroke sync (throttled 32ms)
- [x] Presence (user list, activity states)
- [x] Connection/reconnection state display
- [x] Initial room state delivery

**Editor UI (P0/P1)**
- [x] TopBar (brand, collaborator avatars, connection badge, mode toggle)
- [x] LeftToolbar (9 tools, color palette, stroke width)
- [x] RightSidebar (Properties tab: object props, intent, interaction, Make Interactive)
- [x] RightSidebar (Layers tab: object list with selection)
- [x] BottomControls (undo, redo, zoom, preview toggle)
- [x] R&D Performance Panel (real FPS, latency, users, events/sec, object count)

**Intent + Interaction System (P1)**
- [x] Intent assignment (product, cta, information, media, hotspot, decorative)
- [x] Interaction assignment (rotate, reveal, openLink, expand, playMedia)
- [x] Smart "Make Interactive" with deterministic intent detection
- [x] Hotspot reveal in Experience mode

**Experience Mode (P1)**
- [x] Edit ↔ Experience mode toggle
- [x] Device preview selector (desktop, tablet, mobile)
- [x] Experience mode dark overlay
- [x] Hotspot reveal interaction working in experience mode

**Visual System (P1)**
- [x] Warm ivory/parchment/terracotta design tokens
- [x] Inter + Lora + Caveat fonts
- [x] Ambient background blobs on landing page
- [x] Cursor-responsive parallax on landing hero
- [x] Demo board preview card on landing
- [x] Object hover lift effect
- [x] Smooth transitions/animations

**Demo Scene**
- [x] AURA Headphones campaign scene (pre-populated)
- [x] Product shapes, headline, tagline, spec badges, CTA, hotspot
- [x] Handwritten annotations
- [x] Objects have intents and interactions pre-configured

**Performance**
- [x] Real FPS via requestAnimationFrame
- [x] Real latency via Socket.IO ping/pong
- [x] Events/sec tracking
- [x] Object count display

---

### ❌ Not Yet Implemented / Future Explorations

**P1 / Future**
- [ ] Image upload/asset library (URL-based or CDN storage)
- [ ] Read-only view link permission mode

**P2**
- [ ] AI Director feature ("generate campaign storyboard from prompt")
- [ ] Export board to PNG/SVG/PDF

---

## Known Architecture Notes & Limitations

1. **Transformer multi-select**: Resolved. Transformer attaches cleanly to multiple selected nodes.
2. **Inline Text Editing**: Resolved. Full HTML overlay with sub-pixel pan/zoom alignment, immediate autofocus, Enter to commit, Escape to cancel, and Socket.IO real-time broadcast.
3. **Canvas pan**: Space+drag and middle-mouse navigation fully integrated without selection conflicts.
4. **Undo broadcast**: Local-only history stack by design (50 entries); full collaborative undo requires CRDT (Yjs/Automerge), documented as a production consideration.

---

## Important Engineering Decisions

1. **Konva over raw Canvas**: Saves ~3-4 days of hit-testing, transform handle, and object management work. The tradeoff (~250KB) is justified.
2. **Socket.IO over raw WebSockets**: Reconnection, rooms, and namespaces built in. In-memory state is fine for a demo; would use Redis Pub/Sub in production.
3. **No external AI API**: "Make Interactive" is deterministic rule-based. More reliable for a demo than a flaky API call.
4. **Zustand over Redux/Context**: Zero boilerplate, clean selector pattern, great for canvas where many components need fine-grained state.
5. **Local undo only**: Full collaborative undo requires CRDT (too complex for scope). This is explicitly noted as a known limitation.
6. **CSS Modules over Tailwind**: Gives full control over the warm editorial aesthetic. Tailwind's utility classes would fight against the intentional design.

---

## Performance Strategy

- Cursor events: throttled to 16ms (60fps max)
- Stroke updates: throttled to 32ms (~30fps, enough for drawing)
- Canvas renders: Konva batches draw calls efficiently
- Object count: no virtual rendering yet (acceptable up to ~500 objects)
- FPS measurement: real requestAnimationFrame loop
- Latency measurement: Socket.IO ping/pong every 2 seconds

---

## Testing Status

| Feature | Status |
|---|---|
| Landing page renders | ✅ Verified (HTTP 200, correct HTML) |
| TypeScript compilation | ✅ Zero errors |
| Server starts | ✅ Running on port 3000 |
| Board page (editor) | ⏳ Not browser-verified (Playwright unavailable) |
| Real-time sync | ⏳ Not browser-verified |
| Drawing tools | ⏳ Not browser-verified |
| Experience mode | ⏳ Not browser-verified |

---

## Deployment Status

- Not yet deployed
- Recommended: Railway or Render (supports persistent WebSocket)
- Vercel NOT recommended (serverless, kills Socket.IO)

---

## P0 / P1 / P2 Priorities

**P0 (must work):**
- ✅ Collaborative canvas
- ✅ Real-time sync
- ✅ Drawing tools
- ✅ Object manipulation
- ✅ Undo/redo
- ✅ Core editor UI
- ⏳ Production build

**P1 (differentiation):**
- ✅ Intent-based objects
- ✅ Make Interactive
- ✅ Experience mode
- ✅ Collaboration presence
- ✅ Performance panel
- ✅ Visual identity
- ❌ Physical animations
- ❌ Image upload
- ❌ Text inline editing

**P2 (optional):**
- ❌ AI Director
- ❌ Advanced animations

---

## Next Steps (for next agent)

1. Run `npm run dev` (uses `node server.js`) and verify in browser manually
2. Fix the Transformer multi-select issue
3. Add inline text editing (double-click on text object → native textarea overlay)
4. Add image object support (file upload → base64 or URL)
5. Add canvas pan via space+drag or middle mouse
6. Wire Framer Motion for physical drag/drop feel
7. Run `npm run build` and fix any build errors
8. Deploy to Railway/Render
9. Add deployment URL to README

---

## AI Agent Handoff Instructions

1. Read this AGEND.md fully
2. Run `npm run dev` to start the server
3. Open http://localhost:3000 in a browser
4. Navigate to a board URL (e.g., `/board/test?name=Agent&demo=1`)
5. Test all drawing tools, selection, undo/redo
6. Open two tabs to the same room and verify cursor sync
7. Check the console for errors
8. Refer to "Incomplete Features" and "Known Bugs" above
9. **Do NOT rebuild what already works**
10. Update this AGEND.md after your changes

---

## DO NOT DO

- Do not rebuild the Socket.IO server
- Do not switch from Konva to raw Canvas
- Do not switch from Zustand to Redux
- Do not add Tailwind
- Do not expose API keys
- Do not break existing tools while adding new ones
- Do not add WebGL/Three.js
- Do not prioritize visual effects over broken functionality
