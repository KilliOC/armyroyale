// Army Royale — Canvas 2D — v3 Visual Upgrade
// Gnome-style characters, lush battlefield, castles, massive clashes

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const W = 1280, H = 720;
canvas.width = W; canvas.height = H;

// ─── LAYOUT ───
const BLUE_WALL_X = 90;
const RED_WALL_X = 1190;
const FIELD_LEFT = 150;
const FIELD_RIGHT = 1130;
const MATCH_TIME = 150;

const LANES = [
  { id: 'top', y: 250, label: 'Upper' },
  { id: 'mid', y: 385, label: 'Center' },
  { id: 'bot', y: 520, label: 'Lower' },
];

// ─── CARDS ───
const CARDS = [
  { id: 'swords', name: 'Swords', cost: 3, hp: 8, speed: 56, count: 20, damage: 7,
    range: 22, radius: 8, role: 'melee',
    blueBody: '#4488dd', blueHat: '#2266bb', redBody: '#dd4444', redHat: '#bb2222', skin: '#ffddbb' },
  { id: 'archers', name: 'Archers', cost: 3, hp: 5, speed: 48, count: 12, damage: 10,
    range: 120, radius: 7, role: 'ranged',
    blueBody: '#44bb77', blueHat: '#228855', redBody: '#cc5533', redHat: '#aa3311', skin: '#ffe0cc' },
  { id: 'brutes', name: 'Brutes', cost: 4, hp: 20, speed: 36, count: 8, damage: 22,
    range: 28, radius: 11, role: 'breaker',
    blueBody: '#dd9933', blueHat: '#bb7711', redBody: '#cc3333', redHat: '#991111', skin: '#ffd8aa' },
  { id: 'gnomes', name: 'Gnomes', cost: 2, hp: 4, speed: 82, count: 18, damage: 5,
    range: 18, radius: 6, role: 'rush',
    blueBody: '#cc55bb', blueHat: '#aa3399', redBody: '#ee5555', redHat: '#cc2222', skin: '#ffe8dd' },
];
function getCard(id) { return CARDS.find(c => c.id === id) || CARDS[0]; }

// ─── STATE ───
const state = {
  phase: 'battle',
  time: MATCH_TIME,
  elixir: 5, maxElixir: 10, elixirRate: 0.78,
  blueHP: 100, redHP: 100,
  hand: ['swords', 'archers', 'brutes', 'gnomes', 'swords'],
  selectedCard: 'swords',
  blueUnits: [], redUnits: [],
  projectiles: [], impacts: [], dustClouds: [], starBursts: [], beams: [],
  winner: null, uidCounter: 1, aiTimer: 1.8,
  statusText: 'Select a card, tap a lane',
};

// ─── SPAWN ───
function spawnFormation(team, laneId, cardId) {
  const lane = LANES.find(l => l.id === laneId);
  const card = getCard(cardId);
  if (!lane || !card) return;
  const list = team === 'blue' ? state.blueUnits : state.redUnits;
  const baseX = team === 'blue'
    ? FIELD_LEFT + 20 + Math.random() * 80
    : FIELD_RIGHT - 20 - Math.random() * 80;
  const cols = Math.ceil(Math.sqrt(card.count));
  const rows = Math.ceil(card.count / cols);
  const dir = team === 'blue' ? 1 : -1;
  for (let i = 0; i < card.count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    list.push({
      id: state.uidCounter++,
      team, laneId, cardId,
      x: baseX + col * 13 * dir + (Math.random() - 0.5) * 7,
      y: lane.y + (row - (rows - 1) * 0.5) * 15 + (Math.random() - 0.5) * 7,
      hp: card.hp, maxHp: card.hp,
      speed: card.speed * dir * (0.9 + Math.random() * 0.2),
      damage: card.damage, range: card.range, radius: card.radius, role: card.role,
      bob: Math.random() * Math.PI * 2,
      atkCD: Math.random() * 0.3, hitFlash: 0, atkFlash: 0,
      bodyColor: team === 'blue' ? card.blueBody : card.redBody,
      hatColor: team === 'blue' ? card.blueHat : card.redHat,
      skinColor: card.skin,
    });
  }
}

// ─── DEPLOY ───
function deployBlue(laneId) {
  if (state.phase === 'result') return;
  const card = getCard(state.selectedCard);
  if (state.elixir < card.cost) { state.statusText = 'NOT ENOUGH ELIXIR'; return; }
  state.elixir -= card.cost;
  spawnFormation('blue', laneId, card.id);
  const active = state.hand.slice(0, 4);
  const idx = active.indexOf(state.selectedCard);
  const next = state.hand[4] || active[0];
  if (idx !== -1) { active.splice(idx, 1); active.push(next); }
  state.hand = [...active, state.selectedCard];
  state.selectedCard = active[Math.min(idx, active.length - 1)] || active[0];
  state.statusText = `${card.name.toUpperCase()} → ${laneId.toUpperCase()}`;
  rebuildCardTray();
}

function aiDeploy() {
  const c = ['swords', 'archers', 'brutes', 'gnomes'];
  const l = ['top', 'mid', 'bot'];
  spawnFormation('red', l[Math.floor(Math.random() * 3)], c[Math.floor(Math.random() * 4)]);
}

// ─── VFX SPAWN ───
function addImpact(x, y, big) {
  const sz = big ? 20 + Math.random() * 14 : 12 + Math.random() * 10;
  state.impacts.push({ x, y, life: 0.38, size: sz });
  for (let i = 0; i < 2; i++)
    state.dustClouds.push({ x: x + (Math.random()-0.5)*18, y: y + Math.random()*8, life: 0.55, size: 14 + Math.random() * 18 });
  if (Math.random() < 0.6)
    state.starBursts.push({ x: x + (Math.random()-0.5)*12, y: y - 6 + (Math.random()-0.5)*10, life: 0.32, size: 8 + Math.random() * 10 });
}

function addBeam(x, y) {
  state.beams.push({ x, y, life: 0.5, maxLife: 0.5 });
}

function fireProjectile(from, to) {
  state.projectiles.push({
    x: from.x, y: from.y - 8,
    tx: to.x, ty: to.y - 6,
    life: 0.4, maxLife: 0.4,
    color: from.team === 'blue' ? '#ffe866' : '#ff9966',
  });
}

// ─── COMBAT ───
function findClosestEnemy(unit, enemies) {
  let best = null, bestDist = Infinity;
  for (const e of enemies) {
    if (e.laneId !== unit.laneId) continue;
    const d = Math.hypot(e.x - unit.x, e.y - unit.y);
    if (d < bestDist) { bestDist = d; best = e; }
  }
  return { enemy: best, dist: bestDist };
}

function updateUnits(dt) {
  state.projectiles.forEach(p => p.life -= dt);
  state.projectiles = state.projectiles.filter(p => p.life > 0);
  state.impacts.forEach(i => i.life -= dt);
  state.impacts = state.impacts.filter(i => i.life > 0);
  state.dustClouds.forEach(d => d.life -= dt);
  state.dustClouds = state.dustClouds.filter(d => d.life > 0);
  state.starBursts.forEach(s => s.life -= dt);
  state.starBursts = state.starBursts.filter(s => s.life > 0);
  state.beams.forEach(b => b.life -= dt);
  state.beams = state.beams.filter(b => b.life > 0);

  const all = [...state.blueUnits, ...state.redUnits];
  for (const u of all) {
    u.hitFlash = Math.max(0, u.hitFlash - dt * 3);
    u.atkFlash = Math.max(0, u.atkFlash - dt * 4);
    u.atkCD = Math.max(0, u.atkCD - dt);
    const enemies = u.team === 'blue' ? state.redUnits : state.blueUnits;
    const { enemy, dist } = findClosestEnemy(u, enemies);
    if (enemy && dist <= u.range) {
      if (u.atkCD <= 0) {
        const dps = u.role === 'breaker' ? 5.0 : u.role === 'ranged' ? 4.2 : u.role === 'rush' ? 6.0 : 5.5;
        enemy.hp -= u.damage * dt * dps;
        enemy.hitFlash = 1; u.atkFlash = 1;
        u.atkCD = u.role === 'ranged' ? 0.65 : u.role === 'breaker' ? 0.75 : 0.38;
        if (u.role === 'ranged') fireProjectile(u, enemy);
        addImpact((u.x + enemy.x) * 0.5, (u.y + enemy.y) * 0.5, u.role === 'breaker');
        // Occasionally spawn a beam at intense clash points
        if (Math.random() < 0.02) addBeam((u.x + enemy.x) * 0.5, (u.y + enemy.y) * 0.5);
      }
    } else if (enemy) {
      const step = Math.min(dist, Math.abs(u.speed * dt));
      u.x += ((enemy.x - u.x) / Math.max(1, dist)) * step;
      u.y += ((enemy.y - u.y) / Math.max(1, dist)) * step * 0.14;
    } else {
      u.x += u.speed * dt;
    }
    if (!enemy) {
      if (u.team === 'blue' && u.x >= RED_WALL_X - 35) {
        state.redHP -= u.damage * dt * (u.role === 'breaker' ? 6 : 3);
        u.atkFlash = 1;
        if (Math.random() < 0.05) addImpact(RED_WALL_X - 20, u.y, true);
      }
      if (u.team === 'red' && u.x <= BLUE_WALL_X + 35) {
        state.blueHP -= u.damage * dt * (u.role === 'breaker' ? 5.5 : 2.8);
        u.atkFlash = 1;
        if (Math.random() < 0.05) addImpact(BLUE_WALL_X + 20, u.y, true);
      }
    }
  }
  state.blueUnits = state.blueUnits.filter(u => u.hp > 0 && u.x > -40 && u.x < W + 40);
  state.redUnits = state.redUnits.filter(u => u.hp > 0 && u.x > -40 && u.x < W + 40);
  state.blueHP = Math.max(0, state.blueHP);
  state.redHP = Math.max(0, state.redHP);
}

function updateGame(dt) {
  if (state.phase === 'result') return;
  state.elixir = Math.min(state.maxElixir, state.elixir + dt * state.elixirRate);
  state.time = Math.max(0, state.time - dt);
  state.aiTimer -= dt;
  if (state.aiTimer <= 0) { aiDeploy(); state.aiTimer = 1.2 + Math.random() * 1.0; }
  updateUnits(dt);
  if (state.redHP <= 0 || state.blueHP <= 0 || state.time <= 0) {
    state.phase = 'result';
    if (state.redHP < state.blueHP) { state.winner = 'blue'; state.statusText = '⚔️ BREACH! BLUE WINS! ⚔️'; }
    else if (state.blueHP < state.redHP) { state.winner = 'red'; state.statusText = '💀 RED WINS! 💀'; }
    else { state.winner = 'draw'; state.statusText = 'DRAW — TIME UP'; }
  }
}

// ═══════════════════════════════════════════
// ─── RENDERING ───
// ═══════════════════════════════════════════

// Precomputed grass pattern
let grassPattern = null;
function createGrassPattern() {
  const pc = document.createElement('canvas');
  pc.width = 64; pc.height = 64;
  const pctx = pc.getContext('2d');
  pctx.fillStyle = '#6ab838';
  pctx.fillRect(0, 0, 64, 64);
  // Grass blades
  for (let i = 0; i < 40; i++) {
    const gx = Math.random() * 64;
    const gy = Math.random() * 64;
    pctx.strokeStyle = Math.random() > 0.5 ? '#78c840' : '#5ca830';
    pctx.lineWidth = 1;
    pctx.beginPath();
    pctx.moveTo(gx, gy);
    pctx.lineTo(gx + (Math.random()-0.5)*4, gy - 3 - Math.random()*4);
    pctx.stroke();
  }
  grassPattern = ctx.createPattern(pc, 'repeat');
}

function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, 170);
  g.addColorStop(0, '#78bbff');
  g.addColorStop(0.5, '#b8ddff');
  g.addColorStop(0.85, '#d8f0ff');
  g.addColorStop(1, '#90d060');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 170);

  // Distant hills
  ctx.fillStyle = '#88c848';
  ctx.beginPath();
  ctx.moveTo(0, 170);
  for (let x = 0; x <= W; x += 40) {
    ctx.lineTo(x, 160 + Math.sin(x * 0.008) * 12 + Math.sin(x * 0.023) * 6);
  }
  ctx.lineTo(W, 170);
  ctx.closePath();
  ctx.fill();
}

function drawGround() {
  if (!grassPattern) createGrassPattern();
  ctx.fillStyle = grassPattern;
  ctx.fillRect(0, 155, W, H - 155);

  // Darker grass strips for depth
  for (let y = 170; y < H; y += 48) {
    ctx.fillStyle = 'rgba(0,40,0,0.05)';
    ctx.fillRect(0, y, W, 24);
  }

  // Lane highlights
  for (const lane of LANES) {
    const lg = ctx.createLinearGradient(FIELD_LEFT, lane.y - 38, FIELD_LEFT, lane.y + 38);
    lg.addColorStop(0, 'rgba(80,140,50,0.2)');
    lg.addColorStop(0.5, 'rgba(80,140,50,0.35)');
    lg.addColorStop(1, 'rgba(80,140,50,0.2)');
    ctx.fillStyle = lg;
    ctx.fillRect(FIELD_LEFT - 10, lane.y - 38, FIELD_RIGHT - FIELD_LEFT + 20, 76);
  }

  // Center river/divider
  ctx.fillStyle = 'rgba(100,180,255,0.12)';
  ctx.fillRect(635, 155, 10, H - 155);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(639, 155, 2, H - 155);
}

function drawCastle(cx, side) {
  const isBlue = side === 'blue';
  const w1 = isBlue ? '#3060a8' : '#a83030';
  const w2 = isBlue ? '#4878c8' : '#c84848';
  const w3 = isBlue ? '#2048780' : '#801818';
  const wD = isBlue ? '#204878' : '#801818';
  const roof = isBlue ? '#5090e0' : '#e05050';
  const door = isBlue ? '#183058' : '#581818';

  // Main wall
  const wallW = 90, wallH = 430;
  ctx.fillStyle = w1;
  ctx.fillRect(cx - wallW/2, 155, wallW, wallH);
  // Highlight
  ctx.fillStyle = w2;
  ctx.fillRect(cx - wallW/2, 155, 14, wallH);
  // Shadow
  ctx.fillStyle = wD;
  ctx.fillRect(cx + wallW/2 - 14, 155, 14, wallH);

  // Stone texture lines
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let y = 170; y < 580; y += 18) {
    ctx.beginPath();
    ctx.moveTo(cx - wallW/2, y);
    ctx.lineTo(cx + wallW/2, y);
    ctx.stroke();
  }
  for (let x = cx - wallW/2 + 15; x < cx + wallW/2; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, 155);
    ctx.lineTo(x, 585);
    ctx.stroke();
  }

  // Battlements
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = w2;
    ctx.fillRect(cx - wallW/2 - 4 + i * 18, 142, 13, 18);
  }

  // Towers with conical roofs
  for (const ty of [195, 480]) {
    for (const side of [-1, 1]) {
      const tx = cx + side * 38;
      // Tower body
      ctx.fillStyle = w1;
      ctx.beginPath();
      ctx.arc(tx, ty, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = w2;
      ctx.beginPath();
      ctx.arc(tx - 4, ty, 22, 0, Math.PI * 2);
      ctx.fill();
      // Tower battlements
      for (let b = 0; b < 6; b++) {
        const a = (b / 6) * Math.PI * 2;
        ctx.fillStyle = w2;
        ctx.fillRect(tx + Math.cos(a) * 20 - 3, ty + Math.sin(a) * 20 - 3, 6, 6);
      }
      // Roof
      ctx.fillStyle = roof;
      ctx.beginPath();
      ctx.moveTo(tx - 26, ty - 12);
      ctx.lineTo(tx, ty - 48);
      ctx.lineTo(tx + 26, ty - 12);
      ctx.closePath();
      ctx.fill();
      // Roof highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(tx - 10, ty - 18);
      ctx.lineTo(tx - 2, ty - 44);
      ctx.lineTo(tx + 4, ty - 18);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Gate for each lane
  for (const lane of LANES) {
    ctx.fillStyle = door;
    const gw = 30, gh = 42;
    ctx.fillRect(cx - gw/2, lane.y - gh/2, gw, gh);
    // Arch
    ctx.beginPath();
    ctx.arc(cx, lane.y - gh/2, gw/2, Math.PI, 0);
    ctx.fillStyle = wD;
    ctx.fill();
    // Iron bars
    ctx.strokeStyle = 'rgba(100,100,100,0.4)';
    ctx.lineWidth = 1.5;
    for (let bx = cx - gw/2 + 5; bx < cx + gw/2; bx += 6) {
      ctx.beginPath();
      ctx.moveTo(bx, lane.y - gh/2 + 4);
      ctx.lineTo(bx, lane.y + gh/2);
      ctx.stroke();
    }
    // Damage glow
    const hp = isBlue ? state.blueHP : state.redHP;
    if (hp < 60) {
      ctx.fillStyle = `rgba(255, ${Math.floor(hp * 3)}, 0, ${0.35 * (1 - hp/60)})`;
      ctx.fillRect(cx - gw/2, lane.y - gh/2, gw, gh);
    }
  }

  // Banner/flag
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, 142);
  ctx.lineTo(cx, 95);
  ctx.stroke();
  ctx.fillStyle = isBlue ? '#4488dd' : '#dd4444';
  const fd = isBlue ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(cx, 95);
  ctx.lineTo(cx + fd * 24, 104);
  ctx.lineTo(cx, 113);
  ctx.closePath();
  ctx.fill();
  // Crown icon on flag
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(cx + fd * 6, 104);
  ctx.lineTo(cx + fd * 8, 99);
  ctx.lineTo(cx + fd * 12, 103);
  ctx.lineTo(cx + fd * 16, 98);
  ctx.lineTo(cx + fd * 18, 104);
  ctx.lineTo(cx + fd * 18, 108);
  ctx.lineTo(cx + fd * 6, 108);
  ctx.closePath();
  ctx.fill();
}

function drawTree(x, y, s) {
  // Trunk
  ctx.fillStyle = '#6a4a28';
  ctx.fillRect(x - 4*s, y + 2, 8*s, 28*s);
  // Canopy — layered for volume
  const greens = ['#3a7820', '#4a9028', '#58a830', '#48a028'];
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = greens[i];
    const ox = (i === 0 ? -8 : i === 1 ? 6 : i === 2 ? -2 : 3) * s;
    const oy = (i === 0 ? -4 : i === 1 ? -8 : i === 2 ? -14 : -2) * s;
    const r = (18 - i * 2) * s;
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.arc(x - 4*s, y - 10*s, 10*s, 0, Math.PI * 2);
  ctx.fill();
}

function drawBush(x, y) {
  ctx.fillStyle = '#4a8828';
  ctx.beginPath();
  ctx.ellipse(x, y, 30, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#58a030';
  ctx.beginPath();
  ctx.ellipse(x - 8, y - 4, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#68b838';
  ctx.beginPath();
  ctx.ellipse(x + 6, y - 2, 14, 9, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnvironment() {
  // Trees
  const trees = [
    [130, 130, 1.1], [280, 122, 0.85], [420, 138, 0.7],
    [860, 128, 0.8], [1020, 122, 0.95], [1160, 135, 1.0],
    [60, 620, 1.15], [200, 645, 0.75], [1080, 635, 0.9], [1220, 620, 1.05],
  ];
  for (const [x, y, s] of trees) drawTree(x, y, s);
  // Bushes
  const bushes = [[340, 178], [930, 182], [380, 578], [900, 575], [640, 162], [640, 598]];
  for (const [x, y] of bushes) drawBush(x, y);
}

// ═══════════════════════════════════════════
// ─── GNOME RENDERING ───
// ═══════════════════════════════════════════
function drawGnome(u, now) {
  const bob = Math.sin(now * 0.009 + u.bob) * 2.5;
  const x = u.x;
  const y = u.y + bob;
  const r = u.radius;
  const facing = u.team === 'blue' ? 1 : -1;
  const inCombat = u.atkFlash > 0.1;
  const isHit = u.hitFlash > 0.3;

  // Ground shadow
  ctx.fillStyle = 'rgba(20,40,10,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y + r + 3, r * 1.0, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Body ──
  ctx.fillStyle = isHit ? '#fff' : u.bodyColor;
  ctx.beginPath();
  ctx.ellipse(x, y + 1, r * 0.8, r * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body shading
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 3, r * 0.6, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belt
  ctx.fillStyle = '#4a2a10';
  ctx.fillRect(x - r * 0.65, y + r * 0.25, r * 1.3, 2.5);
  // Belt buckle
  ctx.fillStyle = '#c8a040';
  ctx.fillRect(x - 2, y + r * 0.2, 4, 3.5);

  // ── Arms ──
  ctx.fillStyle = u.bodyColor;
  // Left arm
  ctx.beginPath();
  ctx.ellipse(x - r * 0.7, y + 1, r * 0.25, r * 0.5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Right arm (weapon arm)
  ctx.beginPath();
  ctx.ellipse(x + r * 0.7, y + 1, r * 0.25, r * 0.5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // ── Head ──
  ctx.fillStyle = u.skinColor;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.55, r * 0.52, 0, Math.PI * 2);
  ctx.fill();
  // Cheeks
  ctx.fillStyle = 'rgba(255,150,120,0.25)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.4, r * 0.15, 0, Math.PI * 2);
  ctx.arc(x + r * 0.3, y - r * 0.4, r * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.18 + facing * 1, y - r * 0.6, 2.5, 2.8, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.18 + facing * 1, y - r * 0.6, 2.5, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(x - r * 0.14 + facing * 2, y - r * 0.58, 1.4, 0, Math.PI * 2);
  ctx.arc(x + r * 0.22 + facing * 2, y - r * 0.58, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.strokeStyle = inCombat ? '#c44' : '#a06040';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (inCombat) {
    ctx.arc(x + facing * 1, y - r * 0.35, 2.5, 0, Math.PI);
  } else {
    ctx.arc(x + facing * 1, y - r * 0.38, 2, 0.2, Math.PI - 0.2);
  }
  ctx.stroke();

  // Beard for brutes/gnomes
  if (u.role === 'breaker') {
    ctx.fillStyle = '#c0a070';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.35, y - r * 0.25);
    ctx.quadraticCurveTo(x, y + r * 0.3, x + r * 0.35, y - r * 0.25);
    ctx.closePath();
    ctx.fill();
  } else if (u.role === 'rush') {
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.25, y - r * 0.2);
    ctx.quadraticCurveTo(x, y + r * 0.15, x + r * 0.25, y - r * 0.2);
    ctx.closePath();
    ctx.fill();
  }

  // ── Pointy Hat ──
  const hatLean = facing * r * 0.2;
  ctx.fillStyle = u.hatColor;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.58, y - r * 0.78);
  ctx.quadraticCurveTo(x + hatLean * 0.5, y - r * 1.5, x + hatLean, y - r * 2.2);
  ctx.lineTo(x + r * 0.58, y - r * 0.78);
  ctx.closePath();
  ctx.fill();
  // Hat highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.2, y - r * 0.85);
  ctx.quadraticCurveTo(x + hatLean * 0.3, y - r * 1.4, x + hatLean * 0.6, y - r * 2.0);
  ctx.lineTo(x + r * 0.1, y - r * 0.85);
  ctx.closePath();
  ctx.fill();
  // Hat brim
  ctx.fillStyle = u.hatColor;
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.8, r * 0.65, r * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Weapon ──
  ctx.save();
  ctx.translate(x + facing * r * 0.85, y - 2);
  const swing = inCombat ? facing * -0.8 : 0;
  if (u.role === 'melee') {
    ctx.rotate(facing * -0.3 + swing);
    // Sword blade
    ctx.fillStyle = '#d0d8e8';
    ctx.fillRect(-1.5, -16, 3, 16);
    ctx.fillStyle = '#e8eef8';
    ctx.fillRect(-0.5, -14, 1, 12);
    // Guard
    ctx.fillStyle = '#8a6a30';
    ctx.fillRect(-4, -2, 8, 3);
    // Pommel
    ctx.fillStyle = '#aa8844';
    ctx.beginPath();
    ctx.arc(0, 2, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (u.role === 'ranged') {
    // Bow
    ctx.strokeStyle = '#7a4a18';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(facing * 3, -2, 9, -Math.PI/2, Math.PI/2, facing < 0);
    ctx.stroke();
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(facing * 3, -11);
    ctx.lineTo(facing * (3 + (inCombat ? -5 : 0)), -2);
    ctx.lineTo(facing * 3, 7);
    ctx.stroke();
  } else if (u.role === 'breaker') {
    ctx.rotate(facing * -0.2 + swing * 1.2);
    // Hammer handle
    ctx.fillStyle = '#8a6a40';
    ctx.fillRect(-2, -20, 4, 20);
    // Hammer head
    ctx.fillStyle = '#888';
    ctx.fillRect(-6, -24, 12, 8);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(-5, -23, 10, 3);
  } else {
    ctx.rotate(facing * -0.4 + swing);
    // Axe handle
    ctx.fillStyle = '#8a6a40';
    ctx.fillRect(-1.5, -13, 3, 13);
    // Axe head
    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.moveTo(-1.5, -13);
    ctx.lineTo(-7, -9);
    ctx.lineTo(-1.5, -5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ── HP bar ──
  if (u.hp < u.maxHp) {
    const bw = r * 2.2, bh = 2.5;
    const hpR = Math.max(0, u.hp / u.maxHp);
    const by = y - r * 2.4;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x - bw/2 - 0.5, by - 0.5, bw + 1, bh + 1);
    ctx.fillStyle = hpR > 0.5 ? '#44ee44' : hpR > 0.25 ? '#eebb33' : '#ee3333';
    ctx.fillRect(x - bw/2, by, bw * hpR, bh);
  }
}

// ─── VFX RENDERING ───
function drawDustCloud(d) {
  const t = d.life / 0.55;
  const r = d.size * (1.3 - t * 0.5);
  ctx.fillStyle = `rgba(190, 170, 140, ${0.3 * t})`;
  ctx.beginPath();
  ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawImpact(imp) {
  const t = imp.life / 0.38;
  const r = imp.size * (1 - t * 0.15);
  // Dust puffs
  ctx.fillStyle = `rgba(210, 190, 150, ${0.35 * t})`;
  for (let i = 0; i < 4; i++) {
    const ox = (i - 1.5) * r * 0.35;
    const oy = ((i % 2) - 0.5) * r * 0.2;
    ctx.beginPath();
    ctx.arc(imp.x + ox, imp.y + oy, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  // Orange fire burst
  ctx.fillStyle = `rgba(255, 170, 30, ${0.55 * t})`;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    const rr = i % 2 === 0 ? r * 0.42 : r * 0.14;
    const px = imp.x + Math.cos(a) * rr;
    const py = imp.y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawStarBurst(s) {
  const t = s.life / 0.32;
  ctx.fillStyle = `rgba(255, 210, 50, ${0.75 * t})`;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10;
    const rr = i % 2 === 0 ? s.size : s.size * 0.3;
    const px = s.x + Math.cos(a) * rr;
    const py = s.y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  // Inner glow
  ctx.fillStyle = `rgba(255, 255, 200, ${0.5 * t})`;
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.size * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeam(b) {
  const t = b.life / b.maxLife;
  const w = 6 + t * 4;
  const grad = ctx.createLinearGradient(b.x, b.y - 200, b.x, b.y + 20);
  grad.addColorStop(0, `rgba(200, 220, 255, 0)`);
  grad.addColorStop(0.4, `rgba(180, 210, 255, ${0.3 * t})`);
  grad.addColorStop(1, `rgba(255, 255, 255, ${0.5 * t})`);
  ctx.fillStyle = grad;
  ctx.fillRect(b.x - w/2, b.y - 200, w, 220);
  // Base glow
  ctx.fillStyle = `rgba(200, 230, 255, ${0.4 * t})`;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 14, 0, Math.PI * 2);
  ctx.fill();
}

function drawProjectile(p) {
  const t = 1 - p.life / p.maxLife;
  const x = p.x + (p.tx - p.x) * t;
  const y = p.y + (p.ty - p.y) * t - Math.sin(t * Math.PI) * 20;
  // Glow
  ctx.fillStyle = 'rgba(255,255,200,0.3)';
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  // Core
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(x, y, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawFrontlines() {
  for (const lane of LANES) {
    const bf = state.blueUnits.filter(u => u.laneId === lane.id);
    const rf = state.redUnits.filter(u => u.laneId === lane.id);
    if (bf.length === 0 && rf.length === 0) continue;
    const bMax = bf.reduce((m, u) => Math.max(m, u.x), FIELD_LEFT);
    const rMin = rf.reduce((m, u) => Math.min(m, u.x), FIELD_RIGHT);
    if (bMax > FIELD_LEFT + 30 && rMin < FIELD_RIGHT - 30) {
      const cx = (bMax + rMin) * 0.5;
      // Clash zone glow
      const grad = ctx.createRadialGradient(cx, lane.y, 5, cx, lane.y, 60);
      grad.addColorStop(0, 'rgba(255, 200, 80, 0.2)');
      grad.addColorStop(1, 'rgba(255, 200, 80, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, lane.y, 60, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ─── MAIN RENDER ───
function render(now) {
  ctx.clearRect(0, 0, W, H);
  drawSky();
  drawGround();
  drawEnvironment();
  drawCastle(BLUE_WALL_X, 'blue');
  drawCastle(RED_WALL_X, 'red');
  drawFrontlines();

  // Beams behind units
  for (const b of state.beams) drawBeam(b);
  // Dust behind
  for (const d of state.dustClouds) drawDustCloud(d);

  // All units sorted by Y
  const all = [...state.blueUnits, ...state.redUnits].sort((a, b) => a.y - b.y);
  for (const u of all) drawGnome(u, now);

  // VFX on top
  for (const p of state.projectiles) drawProjectile(p);
  for (const i of state.impacts) drawImpact(i);
  for (const s of state.starBursts) drawStarBurst(s);
}

// ═══════════════════════════════════════════
// ─── HUD ───
// ═══════════════════════════════════════════
const timerEl = document.getElementById('match-timer');
const blueHpEl = document.getElementById('blue-hp');
const redHpEl = document.getElementById('red-hp');
const phaseEl = document.getElementById('phase-label');
const statusEl = document.getElementById('status-text');
const elixirValEl = document.getElementById('elixir-value');
const elixirBarEl = document.getElementById('elixir-bar');
const cardTrayEl = document.getElementById('card-tray');
const nextCardBoxEl = document.getElementById('next-card-box');

function formatTime(s) {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = String(Math.ceil(Math.max(0, s) % 60)).padStart(2, '0');
  return `${m}:${sec}`;
}

function updateHUD() {
  timerEl.textContent = formatTime(state.time);
  blueHpEl.textContent = Math.max(0, Math.round(state.blueHP));
  redHpEl.textContent = Math.max(0, Math.round(state.redHP));
  phaseEl.textContent = state.phase === 'result' ? 'RESULT' : '';
  statusEl.textContent = state.statusText;
  elixirValEl.textContent = Math.floor(state.elixir);
  elixirBarEl.style.width = `${(state.elixir / state.maxElixir) * 100}%`;
}

// ─── CARD PORTRAITS ───
function drawCardPortrait(cvs, card, team) {
  const c = cvs.getContext('2d');
  cvs.width = 48; cvs.height = 44;
  const cx = 24, cy = 26;
  const r = 9;

  // Background
  c.fillStyle = team === 'blue' ? 'rgba(70,130,220,0.15)' : 'rgba(220,70,70,0.15)';
  c.fillRect(0, 0, 48, 44);

  // Body
  c.fillStyle = team === 'blue' ? card.blueBody : card.redBody;
  c.beginPath();
  c.ellipse(cx, cy + 3, r * 0.8, r, 0, 0, Math.PI * 2);
  c.fill();
  // Head
  c.fillStyle = card.skin;
  c.beginPath();
  c.arc(cx, cy - r * 0.45, r * 0.55, 0, Math.PI * 2);
  c.fill();
  // Eyes
  c.fillStyle = '#222';
  c.beginPath();
  c.arc(cx - 2.5, cy - r * 0.5, 1.3, 0, Math.PI * 2);
  c.arc(cx + 2.5, cy - r * 0.5, 1.3, 0, Math.PI * 2);
  c.fill();
  // Hat
  c.fillStyle = team === 'blue' ? card.blueHat : card.redHat;
  c.beginPath();
  c.moveTo(cx - r * 0.55, cy - r * 0.7);
  c.lineTo(cx + r * 0.1, cy - r * 2.1);
  c.lineTo(cx + r * 0.55, cy - r * 0.7);
  c.closePath();
  c.fill();
  // Weapon hint
  c.fillStyle = '#c8c8c8';
  if (card.role === 'melee') { c.fillRect(cx + r - 1, cy - 5, 2, 10); }
  else if (card.role === 'breaker') { c.fillRect(cx + r - 1, cy - 7, 3, 12); c.fillRect(cx + r - 3, cy - 9, 7, 4); }
  else if (card.role === 'ranged') {
    c.strokeStyle = '#8a5a20'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(cx + r + 1, cy, 5, -Math.PI/2, Math.PI/2); c.stroke();
  }
}

function rebuildCardTray() {
  cardTrayEl.innerHTML = '';
  const active = state.hand.slice(0, 4);
  active.forEach(cardId => {
    const card = getCard(cardId);
    const div = document.createElement('div');
    div.className = 'card' + (cardId === state.selectedCard ? ' selected' : '') + (card.cost > state.elixir + 0.01 ? ' dim' : '');
    div.innerHTML = `
      <div class="card-cost">${card.cost}</div>
      <div class="card-portrait"><canvas></canvas></div>
      <div class="card-name">${card.name}</div>
      <div class="card-count">×${card.count}</div>
    `;
    drawCardPortrait(div.querySelector('canvas'), card, 'blue');
    div.addEventListener('click', () => {
      if (state.phase === 'result') return;
      state.selectedCard = cardId;
      state.statusText = `${card.name.toUpperCase()} selected — tap a lane`;
      rebuildCardTray();
    });
    cardTrayEl.appendChild(div);
  });
  const nextCard = getCard(state.hand[4] || active[0]);
  const ncvs = document.createElement('canvas');
  drawCardPortrait(ncvs, nextCard, 'blue');
  nextCardBoxEl.innerHTML = '';
  nextCardBoxEl.appendChild(ncvs);
}

// ─── INPUT ───
document.querySelectorAll('.deploy-btn').forEach(btn => {
  btn.addEventListener('click', () => deployBlue(btn.dataset.lane));
  btn.addEventListener('touchstart', e => { e.preventDefault(); btn.classList.add('active'); });
  btn.addEventListener('touchend', () => { btn.classList.remove('active'); deployBlue(btn.dataset.lane); });
});

// ─── INIT ───
// Start with armies on both sides for dramatic opening
spawnFormation('red', 'top', 'swords');
spawnFormation('red', 'mid', 'swords');
spawnFormation('red', 'bot', 'brutes');
spawnFormation('red', 'mid', 'archers');
spawnFormation('red', 'top', 'gnomes');
spawnFormation('blue', 'top', 'swords');
spawnFormation('blue', 'mid', 'swords');
spawnFormation('blue', 'bot', 'brutes');
spawnFormation('blue', 'mid', 'archers');
spawnFormation('blue', 'bot', 'gnomes');

rebuildCardTray();
updateHUD();

let lastTime = performance.now();
function gameLoop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  updateGame(dt);
  render(now);
  updateHUD();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
