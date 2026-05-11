// Army Royale — deterministic simulation v2
import { LANES, CARDS, getCard, MAX_ELIXIR, MATCH_TIME,
  FIELD_LEFT, FIELD_RIGHT, BLUE_WALL_X, RED_WALL_X } from './shared_world.js';

const ELIXIR_RATE = 0.7;
const ELIXIR_RATE_OT = 1.4; // 2x in overtime
const START_ELIXIR = 7;
const SPEED_SCALE = 0.35;
const OVERTIME_START = 60;

export interface UnitState {
  id: number;
  team: string;
  laneId: string;
  cardId: string;
  x: number;
  z: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  range: number;
  role: string;
  bob: number;
  atkCD: number;
  hitFlash: number;
  atkFlash: number;
  spawnTime: number;
  alive: boolean;
}

export interface ProjectileState {
  sx: number; sz: number; sy: number;
  tx: number; tz: number; ty: number;
  life: number; maxLife: number;
  team: string;
  _vfxSpawned?: boolean;
}

export interface ImpactState {
  x: number; z: number; y: number;
  life: number;
  big: boolean;
  team?: string;
  role?: string;
  _vfxSpawned?: boolean;
  _shakeApplied?: boolean;
}

export interface DeadUnit {
  x: number; z: number; y: number;
  timer: number;
  id: number;
}

export interface MatchState {
  phase: string;
  time: number;
  elixir: number;
  maxElixir: number;
  elixirRate: number;
  blueHP: number;
  redHP: number;
  hand: string[];
  selectedCard: string;
  blueUnits: UnitState[];
  redUnits: UnitState[];
  projectiles: ProjectileState[];
  impacts: ImpactState[];
  deadUnits: DeadUnit[];
  winner: string | null;
  uid: number;
  aiTimer: number;
  aiElixir: number;
  statusText: string;
  isOvertime?: boolean;
}

export function createMatchState(): MatchState {
  return {
    phase: 'battle',
    time: MATCH_TIME,
    elixir: START_ELIXIR,
    maxElixir: MAX_ELIXIR,
    elixirRate: ELIXIR_RATE,
    blueHP: 100,
    redHP: 100,
    hand: ['monkey', 'hamster', 'frog', 'duckling', 'monkey'],
    selectedCard: 'monkey',
    blueUnits: [],
    redUnits: [],
    projectiles: [],
    impacts: [],
    deadUnits: [],
    winner: null,
    uid: 1,
    aiTimer: 2.5,
    aiElixir: START_ELIXIR,
    statusText: 'Drag a card onto the battlefield',
  };
}

export function spawnFormationAt(state: MatchState, team: string, cardId: string, worldX: number, worldZ: number): void {
  const card = getCard(cardId);
  if (!card) return;
  const list = team === 'blue' ? state.blueUnits : state.redUnits;
  const unitCount = team === 'red' ? Math.ceil(card.count * 0.85) : card.count;
  const cols = Math.ceil(Math.sqrt(unitCount));
  const rows = Math.ceil(unitCount / cols);
  const clampedX = team === 'blue'
    ? Math.min(Math.max(worldX, BLUE_WALL_X + 4), 0)
    : Math.min(Math.max(worldX, 0), RED_WALL_X - 4);
  const clampedZ = Math.min(Math.max(worldZ, -18), 18);
  for (let i = 0; i < unitCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    list.push({
      id: state.uid++,
      team, laneId: worldZ > 6 ? 'top' : worldZ < -6 ? 'bot' : 'mid', cardId,
      x: clampedX + (col - (cols-1)*0.5) * 0.9 + (Math.random() - 0.5) * 0.2,
      z: clampedZ + (row - (rows-1)*0.5) * 0.9 + (Math.random() - 0.5) * 0.2,
      y: 0,
      hp: card.hp, maxHp: card.hp,
      speed: card.speed * SPEED_SCALE,
      damage: card.damage, range: card.range, role: card.role,
      bob: Math.random() * Math.PI * 2,
      atkCD: 0.5 + Math.random() * 0.3,
      hitFlash: 0, atkFlash: 0,
      spawnTime: 0.4,
      alive: true,
    });
  }
  void rows; // suppress unused warning
}

export function spawnFormation(state: MatchState, team: string, laneId: string, cardId: string): void {
  const lane = LANES.find(l => l.id === laneId);
  if (!lane) return;
  const baseX = team === 'blue'
    ? FIELD_LEFT + 3 + Math.random() * 5
    : FIELD_RIGHT - 3 - Math.random() * 5;
  spawnFormationAt(state, team, cardId, baseX, lane.z);
}

export function deployBlue(state: MatchState, laneOrX: string | number, worldZ?: number): boolean {
  if (state.phase === 'result') return false;
  const card = getCard(state.selectedCard);
  if (state.elixir < card.cost) { state.statusText = 'NOT ENOUGH ELIXIR'; return false; }
  state.elixir -= card.cost;
  if (typeof worldZ === 'number') {
    spawnFormationAt(state, 'blue', card.id, laneOrX as number, worldZ);
    state.statusText = `${card.name.toUpperCase()} DEPLOYED!`;
  } else {
    spawnFormation(state, 'blue', laneOrX as string, card.id);
    state.statusText = `${card.name.toUpperCase()} → ${(laneOrX as string).toUpperCase()}`;
  }
  const active = state.hand.slice(0, 4);
  const idx = active.indexOf(state.selectedCard);
  const next = state.hand[4] || active[0];
  if (idx !== -1) { active.splice(idx, 1); active.push(next); }
  state.hand = [...active, state.selectedCard];
  state.selectedCard = active[Math.min(idx, active.length - 1)] || active[0];
  return true;
}

function findClosestEnemy(unit: UnitState, enemies: UnitState[]): { enemy: UnitState | null; dist: number } {
  let best: UnitState | null = null, bestDist = Infinity;
  for (const e of enemies) {
    if (e.spawnTime > 0) continue;
    const d = Math.hypot(e.x - unit.x, e.z - unit.z);
    if (d < bestDist) { bestDist = d; best = e; }
  }
  return { enemy: best, dist: bestDist };
}

function aiTick(state: MatchState, dt: number): void {
  const aiRate = state.time <= OVERTIME_START ? ELIXIR_RATE_OT : ELIXIR_RATE;
  state.aiElixir = Math.min(MAX_ELIXIR, state.aiElixir + dt * aiRate);
  state.aiTimer -= dt;
  if (state.aiTimer > 0) return;

  const affordable = CARDS.filter(c => c.cost <= state.aiElixir);
  if (affordable.length === 0) { state.aiTimer = 1.0; return; }

  const card = affordable[Math.floor(Math.random() * affordable.length)];
  const lanes = ['top', 'mid', 'bot'];

  let bestLane = lanes[Math.floor(Math.random() * 3)];
  let maxBlue = 0;
  for (const lid of lanes) {
    const count = state.blueUnits.filter(u => u.laneId === lid).length;
    if (count > maxBlue) { maxBlue = count; bestLane = lid; }
  }
  const laneId = Math.random() < 0.5 ? bestLane : lanes[Math.floor(Math.random() * 3)];

  state.aiElixir -= card.cost;
  spawnFormation(state, 'red', laneId, card.id);
  state.aiTimer = 2.5 + Math.random() * 2.5;
}

export function tickMatch(state: MatchState, dt: number): void {
  if (state.phase === 'result') return;
  const isOvertime = state.time <= OVERTIME_START && state.time > 0;
  const rate = isOvertime ? ELIXIR_RATE_OT : ELIXIR_RATE;
  state.elixir = Math.min(state.maxElixir, state.elixir + dt * rate);
  state.isOvertime = isOvertime;
  state.time = Math.max(0, state.time - dt);

  aiTick(state, dt);

  state.impacts = state.impacts.filter(i => { i.life -= dt; return i.life > 0; });
  state.projectiles = state.projectiles.filter(p => { p.life -= dt; return p.life > 0; });
  state.deadUnits = state.deadUnits.filter(d => { d.timer -= dt; return d.timer > 0; });

  const all = [...state.blueUnits, ...state.redUnits];
  for (const u of all) {
    if (u.spawnTime > 0) {
      u.spawnTime = Math.max(0, u.spawnTime - dt);
      continue;
    }

    u.hitFlash = Math.max(0, u.hitFlash - dt * 3);
    u.atkFlash = Math.max(0, u.atkFlash - dt * 4);
    u.atkCD = Math.max(0, u.atkCD - dt);

    const enemies = u.team === 'blue' ? state.redUnits : state.blueUnits;
    const { enemy, dist } = findClosestEnemy(u, enemies);

    if (enemy && dist <= u.range) {
      if (u.atkCD <= 0) {
        const hitDamage = u.damage * (u.role === 'breaker' ? 1.5 : u.role === 'ranged' ? 0.8 : 1.0);
        enemy.hp -= hitDamage;
        enemy.hitFlash = 1;
        u.atkFlash = 1;
        u.atkCD = u.role === 'ranged' ? 1.2 : u.role === 'breaker' ? 1.5 : u.role === 'rush' ? 0.6 : 0.8;
        state.impacts.push({
          x: (u.x + enemy.x) * 0.5,
          z: (u.z + enemy.z) * 0.5,
          y: 1.0,
          life: 0.4,
          big: u.role === 'breaker',
          team: u.team,
          role: u.role,
        });
        if (u.role === 'ranged') {
          state.projectiles.push({
            sx: u.x, sz: u.z, sy: 1.5,
            tx: enemy.x, tz: enemy.z, ty: 1.0,
            life: 0.5, maxLife: 0.5,
            team: u.team,
          });
        }
      }
    } else if (enemy) {
      const step = u.speed * dt;
      const dx = enemy.x - u.x;
      const dz = enemy.z - u.z;
      const d = Math.max(0.1, Math.hypot(dx, dz));
      u.x += (dx / d) * step;
      u.z += (dz / d) * step * 0.3;
    } else {
      const dir = u.team === 'blue' ? 1 : -1;
      u.x += dir * u.speed * dt;
    }

    if (u.team === 'blue' && u.x >= RED_WALL_X - 3) {
      if (u.atkCD <= 0) {
        state.redHP -= u.damage * 0.5 * (u.role === 'breaker' ? 2.0 : 1.0);
        u.atkFlash = 1;
        u.atkCD = 1.0;
        state.impacts.push({ x: RED_WALL_X - 1, z: u.z, y: 2, life: 0.4, big: true, team: 'blue', role: u.role });
      }
    }
    if (u.team === 'red' && u.x <= BLUE_WALL_X + 3) {
      if (u.atkCD <= 0) {
        state.blueHP -= u.damage * 0.5 * (u.role === 'breaker' ? 2.0 : 1.0);
        u.atkFlash = 1;
        u.atkCD = 1.0;
        state.impacts.push({ x: BLUE_WALL_X + 1, z: u.z, y: 2, life: 0.4, big: true, team: 'red', role: u.role });
      }
    }
  }

  for (const u of state.blueUnits) {
    if (u.hp <= 0) state.deadUnits.push({ x: u.x, z: u.z, y: 0, timer: 0.5, id: u.id });
  }
  for (const u of state.redUnits) {
    if (u.hp <= 0) state.deadUnits.push({ x: u.x, z: u.z, y: 0, timer: 0.5, id: u.id });
  }
  state.blueUnits = state.blueUnits.filter(u => u.hp > 0);
  state.redUnits = state.redUnits.filter(u => u.hp > 0);
  state.blueHP = Math.max(0, state.blueHP);
  state.redHP = Math.max(0, state.redHP);

  if (state.redHP <= 0 || state.blueHP <= 0 || state.time <= 0) {
    state.phase = 'result';
    if (state.redHP < state.blueHP) { state.winner = 'blue'; state.statusText = '⚔️ BREACH! BLUE WINS!'; }
    else if (state.blueHP < state.redHP) { state.winner = 'red'; state.statusText = '💀 RED WINS!'; }
    else { state.winner = 'draw'; state.statusText = 'DRAW — TIME UP'; }
  }
}
