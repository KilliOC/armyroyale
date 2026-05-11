// Army Royale — shared world constants

export const FIELD_WIDTH = 60;
export const FIELD_DEPTH = 40;
export const LANE_SPACING = 12;
export const LANE_COUNT = 3;
export const BLUE_WALL_X = -28;
export const RED_WALL_X = 28;
export const FIELD_LEFT = -22;
export const FIELD_RIGHT = 22;

export interface Lane {
  id: string;
  z: number;
  label: string;
}

export const LANES: Lane[] = [
  { id: 'top', z: LANE_SPACING, label: 'Upper' },
  { id: 'mid', z: 0, label: 'Center' },
  { id: 'bot', z: -LANE_SPACING, label: 'Lower' },
];

export const MATCH_TIME = 150;
export const MAX_ELIXIR = 10;
export const ELIXIR_RATE = 0.78;
export const START_ELIXIR = 5;

export interface CardDef {
  id: string;
  name: string;
  cost: number;
  hp: number;
  speed: number;
  count: number;
  damage: number;
  range: number;
  role: string;
  emoji: string;
  glb: string;
  blueBody: [number, number, number];
  blueHat: [number, number, number];
  redBody: [number, number, number];
  redHat: [number, number, number];
  skin: [number, number, number];
}

export const CARDS: CardDef[] = [
  { id: 'monkey', name: 'Monkey', cost: 3, hp: 12, speed: 6.5, count: 24, damage: 9,
    range: 3, role: 'melee', emoji: '🐒',
    glb: 'monkey_brawler',
    blueBody: [0.25, 0.50, 0.95], blueHat: [0.20, 0.40, 0.80],
    redBody: [0.95, 0.25, 0.20], redHat: [0.80, 0.15, 0.10],
    skin: [1.0, 0.85, 0.65] },
  { id: 'hamster', name: 'Hamster', cost: 3, hp: 5, speed: 5, count: 18, damage: 14,
    range: 16, role: 'ranged', emoji: '🐹',
    glb: 'hamster_bomber',
    blueBody: [0.30, 0.55, 0.90], blueHat: [0.22, 0.42, 0.75],
    redBody: [0.90, 0.30, 0.22], redHat: [0.75, 0.18, 0.12],
    skin: [1.0, 0.9, 0.78] },
  { id: 'frog', name: 'Frog', cost: 5, hp: 30, speed: 3.5, count: 8, damage: 20,
    range: 2.5, role: 'breaker', emoji: '🐸',
    glb: 'frog_tank',
    blueBody: [0.20, 0.45, 0.85], blueHat: [0.15, 0.35, 0.70],
    redBody: [0.85, 0.20, 0.18], redHat: [0.70, 0.12, 0.10],
    skin: [0.85, 0.95, 0.4] },
  { id: 'duckling', name: 'Duckling', cost: 2, hp: 4, speed: 11, count: 45, damage: 4,
    range: 2, role: 'rush', emoji: '🦆',
    glb: 'duckling_swarm',
    blueBody: [0.35, 0.60, 0.95], blueHat: [0.25, 0.48, 0.80],
    redBody: [0.95, 0.35, 0.25], redHat: [0.80, 0.22, 0.15],
    skin: [1.0, 0.95, 0.5] },
];

export function getCard(id: string): CardDef { return CARDS.find(c => c.id === id) || CARDS[0]; }

// Camera adapts to portrait vs landscape
const isPortrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
export const CAMERA_POSITION = isPortrait ? { x: 0, y: 30, z: 38 } : { x: 0, y: 22, z: 32 };
export const CAMERA_PITCH = isPortrait ? -0.65 : -0.62;
export const CAMERA_YAW = 0;
export const CAMERA_FOV = isPortrait ? 1.0 : 0.88;

export const LIGHTING = {
  sunDirection: { x: -0.4, y: -0.8, z: 0.35 },
  illuminance: 2.8,
  sunColor: { x: 1.0, y: 0.97, z: 0.92 },
  ambientIntensity: 1.6,
  skyCubemapName: 'sky_13_cubemap_2k',
  postProcess: {
    bloom_intensity: 0.25,
    bloom_size: 0.7,
    bloom_threshold: 0.85,
    exposure: 0.55,
    vignette_strength: 0.12,
    vignette_threshold: 0.3,
    vignette_color: { x: 0, y: 0, z: 0, w: 1 },
    brightness: 0.05,
    contrast: 0.08,
    saturation: 0.18,
    highlights: 0.0,
    shadows: 0.0,
    tint: { x: 1.0, y: 0.97, z: 0.92 },
    tint_strength: 0.15,
  },
};
