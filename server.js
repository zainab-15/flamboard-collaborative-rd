const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const host = '0.0.0.0';

const app = next({ dev, hostname: host, port });
const handle = app.getRequestHandler();

// ── In-memory room state ──────────────────────────────────────────────────────
// roomId -> { objects: Map<id, obj>, strokes: Map<id, stroke>, users: Map<socketId, user> }
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      objects: new Map(),
      strokes: new Map(),
      users: new Map(),
    });
  }
  return rooms.get(roomId);
}

// ── Demo scene seed (server-authoritative) ─────────────────────────────────
// Generates the AURA headphones demo for the "demo" room so any recruiter
// who opens /board/demo immediately sees the pre-populated canvas.
function buildDemoObjects() {
  // Minimal deterministic demo objects matching demoScene.ts logic
  // Using fixed IDs so they're stable across rejoins
  const prefix = 'demo-';
  return [
    { id: `${prefix}bg`, type: 'rect', name: 'Background Stage', position: { x: 80, y: 60 }, size: { width: 720, height: 480 }, rotation: 0, depth: 0, opacity: 1, locked: false, visible: true, fill: '#F5EDE3', stroke: '#E8D5C0', strokeWidth: 1, cornerRadius: 16, intent: 'decorative' },
    { id: `${prefix}glow`, type: 'ellipse', name: 'Ambient Glow', position: { x: 300, y: 160 }, size: { width: 260, height: 260 }, rotation: 0, depth: 1, opacity: 0.35, locked: false, visible: true, fill: '#E8A87C', strokeWidth: 0, intent: 'decorative' },
    { id: `${prefix}left-cup`, type: 'ellipse', name: 'Headphone Left Cup', position: { x: 335, y: 220 }, size: { width: 75, height: 95 }, rotation: -8, depth: 2, opacity: 1, locked: false, visible: true, fill: '#2C1810', stroke: '#4A3020', strokeWidth: 2, intent: 'product', interaction: { type: 'rotate', rotationSpeed: 1.5 } },
    { id: `${prefix}right-cup`, type: 'ellipse', name: 'Headphone Right Cup', position: { x: 465, y: 225 }, size: { width: 75, height: 95 }, rotation: 8, depth: 2, opacity: 1, locked: false, visible: true, fill: '#2C1810', stroke: '#4A3020', strokeWidth: 2, intent: 'product', interaction: { type: 'rotate', rotationSpeed: 1.5 } },
    { id: `${prefix}band`, type: 'rect', name: 'Headphone Band', position: { x: 355, y: 185 }, size: { width: 165, height: 55 }, rotation: 0, depth: 2, opacity: 1, locked: false, visible: true, fill: '#1A0F08', stroke: '#3A2010', strokeWidth: 2, cornerRadius: 35, intent: 'product' },
    { id: `${prefix}left-pad`, type: 'ellipse', name: 'Left Ear Pad', position: { x: 348, y: 235 }, size: { width: 50, height: 65 }, rotation: -8, depth: 3, opacity: 1, locked: false, visible: true, fill: '#3D2415', strokeWidth: 0, intent: 'decorative' },
    { id: `${prefix}right-pad`, type: 'ellipse', name: 'Right Ear Pad', position: { x: 476, y: 240 }, size: { width: 50, height: 65 }, rotation: 8, depth: 3, opacity: 1, locked: false, visible: true, fill: '#3D2415', strokeWidth: 0, intent: 'decorative' },
    { id: `${prefix}product-name`, type: 'text', name: 'Product Name', position: { x: 155, y: 385 }, size: { width: 300, height: 60 }, rotation: 0, depth: 4, opacity: 1, locked: false, visible: true, text: 'AURA', fontSize: 54, fontFamily: 'Lora, Georgia, serif', fontStyle: 'bold', fill: '#1A0F08', align: 'left', intent: 'information' },
    { id: `${prefix}tagline`, type: 'text', name: 'Tagline', position: { x: 155, y: 445 }, size: { width: 320, height: 30 }, rotation: 0, depth: 4, opacity: 1, locked: false, visible: true, text: 'Premium Sound. Wireless Freedom.', fontSize: 14, fontFamily: 'Inter, sans-serif', fill: '#6B4C35', align: 'left', intent: 'information' },
    { id: `${prefix}badge1-bg`, type: 'rect', name: 'Spec Badge 1', position: { x: 155, y: 490 }, size: { width: 110, height: 34 }, rotation: 0, depth: 4, opacity: 1, locked: false, visible: true, fill: '#2C1810', cornerRadius: 17, intent: 'information' },
    { id: `${prefix}badge1-txt`, type: 'text', name: 'Spec Text 1', position: { x: 155, y: 499 }, size: { width: 110, height: 20 }, rotation: 0, depth: 5, opacity: 1, locked: false, visible: true, text: '40hr Battery', fontSize: 12, fontFamily: 'Inter, sans-serif', fill: '#F5EDE3', align: 'center', intent: 'information' },
    { id: `${prefix}badge2-bg`, type: 'rect', name: 'Spec Badge 2', position: { x: 278, y: 490 }, size: { width: 110, height: 34 }, rotation: 0, depth: 4, opacity: 1, locked: false, visible: true, fill: '#2C1810', cornerRadius: 17, intent: 'information' },
    { id: `${prefix}badge2-txt`, type: 'text', name: 'Spec Text 2', position: { x: 278, y: 499 }, size: { width: 110, height: 20 }, rotation: 0, depth: 5, opacity: 1, locked: false, visible: true, text: 'ANC Pro', fontSize: 12, fontFamily: 'Inter, sans-serif', fill: '#F5EDE3', align: 'center', intent: 'information' },
    { id: `${prefix}cta-bg`, type: 'rect', name: 'CTA Button', position: { x: 530, y: 450 }, size: { width: 170, height: 50 }, rotation: 0, depth: 4, opacity: 1, locked: false, visible: true, fill: '#C77B5A', cornerRadius: 25, intent: 'cta', interaction: { type: 'openLink', url: '#' } },
    { id: `${prefix}cta-txt`, type: 'text', name: 'CTA Text', position: { x: 530, y: 462 }, size: { width: 170, height: 30 }, rotation: 0, depth: 5, opacity: 1, locked: false, visible: true, text: 'Explore →', fontSize: 16, fontFamily: 'Inter, sans-serif', fontStyle: 'bold', fill: '#FFFFFF', align: 'center', intent: 'cta' },
    { id: `${prefix}hotspot`, type: 'hotspot', name: 'Info Hotspot', position: { x: 600, y: 210 }, size: { width: 36, height: 36 }, rotation: 0, depth: 6, opacity: 1, locked: false, visible: true, fill: '#C77B5A', text: 'i', fontSize: 16, fontFamily: 'Inter, sans-serif', intent: 'hotspot', interaction: { type: 'reveal', revealContent: 'Crafted with premium 40mm drivers for studio-quality sound. Foldable design. 40hr battery.' } },
    { id: `${prefix}ann1`, type: 'text', name: 'Annotation 1', position: { x: 640, y: 155 }, size: { width: 160, height: 50 }, rotation: -3, depth: 7, opacity: 0.75, locked: false, visible: true, text: '← Make this interactive', fontSize: 13, fontFamily: 'Caveat, cursive', fill: '#9B6B4A', align: 'left', intent: 'decorative', demoAnnotation: 'true' },
    { id: `${prefix}ann2`, type: 'text', name: 'Annotation 2', position: { x: 90, y: 390 }, size: { width: 140, height: 40 }, rotation: 2, depth: 7, opacity: 0.65, locked: false, visible: true, text: 'maybe serif here?', fontSize: 12, fontFamily: 'Caveat, cursive', fill: '#9B6B4A', align: 'left', intent: 'decorative', demoAnnotation: 'true' },
    { id: `${prefix}ann3`, type: 'text', name: 'Annotation 3', position: { x: 490, y: 395 }, size: { width: 130, height: 40 }, rotation: -2, depth: 7, opacity: 0.65, locked: false, visible: true, text: 'CTA could be bolder', fontSize: 12, fontFamily: 'Caveat, cursive', fill: '#9B6B4A', align: 'left', intent: 'decorative', demoAnnotation: 'true' },
  ];
}

// Seed the "demo" room with AURA scene immediately on server start
function seedDemoRoom() {
  const room = getRoom('demo');
  if (room.objects.size === 0) {
    const objects = buildDemoObjects();
    objects.forEach(obj => room.objects.set(obj.id, obj));
    console.log(`[DEMO] Seeded demo room with ${objects.length} objects`);
  }
}

// ── App ───────────────────────────────────────────────────────────────────────
app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // Instant health check for Render / load balancers
    if (req.url === '/healthz' || req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('OK');
      return;
    }

    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  // Seed demo room before accepting connections
  seedDemoRoom();

  io.on('connection', (socket) => {
    let currentRoomId = null;
    let currentUser = null;

    // ── JOIN ROOM ──────────────────────────────────────────────────
    socket.on('join-room', ({ roomId, user }) => {
      currentRoomId = roomId;
      currentUser = { ...user, socketId: socket.id };
      socket.join(roomId);

      const room = getRoom(roomId);
      room.users.set(socket.id, currentUser);

      // Send current room state to joining user
      socket.emit('room-state', {
        objects: Array.from(room.objects.values()),
        strokes: Array.from(room.strokes.values()),
        users: Array.from(room.users.values()).filter(u => u.socketId !== socket.id),
      });

      // Notify peers
      socket.to(roomId).emit('user-joined', { user: currentUser });

      const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 1;
      console.log(`[JOIN] ${user.name} → room:${roomId} (${roomSize} users)`);
    });

    // ── CURSOR ────────────────────────────────────────────────────
    socket.on('cursor-move', ({ x, y }) => {
      if (!currentRoomId || !currentUser) return;
      socket.to(currentRoomId).emit('cursor-update', {
        userId: currentUser.id, socketId: socket.id, x, y, user: currentUser,
      });
    });

    // ── OBJECTS ───────────────────────────────────────────────────
    socket.on('object-create', (object) => {
      if (!currentRoomId) return;
      const room = getRoom(currentRoomId);
      room.objects.set(object.id, object);
      socket.to(currentRoomId).emit('object-created', object);
    });

    socket.on('object-update', ({ id, changes }) => {
      if (!currentRoomId) return;
      const room = getRoom(currentRoomId);
      const existing = room.objects.get(id);
      if (existing) {
        const updated = { ...existing, ...changes };
        room.objects.set(id, updated);
        socket.to(currentRoomId).emit('object-updated', { id, changes });
      }
    });

    socket.on('object-delete', ({ id }) => {
      if (!currentRoomId) return;
      getRoom(currentRoomId).objects.delete(id);
      socket.to(currentRoomId).emit('object-deleted', { id });
    });

    socket.on('objects-bulk-update', (objects) => {
      if (!currentRoomId) return;
      const room = getRoom(currentRoomId);
      objects.forEach(obj => room.objects.set(obj.id, obj));
      socket.to(currentRoomId).emit('objects-bulk-updated', objects);
    });

    // ── STROKES ───────────────────────────────────────────────────
    socket.on('stroke-start', (stroke) => {
      if (!currentRoomId) return;
      getRoom(currentRoomId).strokes.set(stroke.id, stroke);
      socket.to(currentRoomId).emit('stroke-started', stroke);
    });

    socket.on('stroke-update', ({ id, points }) => {
      if (!currentRoomId) return;
      const stroke = getRoom(currentRoomId).strokes.get(id);
      if (stroke) {
        stroke.points = points;
        socket.to(currentRoomId).emit('stroke-updated', { id, points });
      }
    });

    socket.on('stroke-end', ({ id }) => {
      if (!currentRoomId) return;
      const room = getRoom(currentRoomId);
      const stroke = room.strokes.get(id);
      if (stroke) {
        room.objects.set(id, { ...stroke, finalized: true });
        room.strokes.delete(id);
        socket.to(currentRoomId).emit('stroke-ended', { id });
      }
    });

    // ── CANVAS CLEAR ──────────────────────────────────────────────
    socket.on('canvas-clear', () => {
      if (!currentRoomId) return;
      const room = getRoom(currentRoomId);
      room.objects.clear();
      room.strokes.clear();
      // Re-seed demo room after clear
      if (currentRoomId === 'demo') seedDemoRoom();
      io.to(currentRoomId).emit('canvas-cleared');
    });

    // ── ACTIVITY ──────────────────────────────────────────────────
    socket.on('user-activity', ({ activity }) => {
      if (!currentRoomId || !currentUser) return;
      const user = getRoom(currentRoomId).users.get(socket.id);
      if (user) {
        user.activity = activity;
        socket.to(currentRoomId).emit('user-activity-update', {
          userId: currentUser.id, activity,
        });
      }
    });

    // ── LATENCY PING ──────────────────────────────────────────────
    socket.on('ping-latency', (ts) => socket.emit('pong-latency', ts));

    // ── DISCONNECT ────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (!currentRoomId || !currentUser) return;
      getRoom(currentRoomId).users.delete(socket.id);
      io.to(currentRoomId).emit('user-left', {
        userId: currentUser.id, socketId: socket.id,
      });
      console.log(`[LEAVE] ${currentUser.name} ← room:${currentRoomId}`);
    });
  });

  httpServer.listen(port, host, () => {
    console.log(`\n🔥 FLAMBOARD listening on ${host}:${port}`);
    console.log(`   Socket.IO  ready`);
    console.log(`   Demo room  /board/demo\n`);
  });
});
