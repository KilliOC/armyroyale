// Army Royale — shared world constants
export const FIELD_WIDTH = 60;
export const FIELD_DEPTH = 40;
export const LANE_SPACING = 12;
export const LANE_COUNT = 3;
export const BLUE_WALL_X = -28;
export const RED_WALL_X = 28;
export const FIELD_LEFT = -22;
export const FIELD_RIGHT = 22;

export const LANES = [
  { id: 'top', z: LANE_SPACING, label: 'Upper' },
  { id: 'mid', z: 0, label: 'Center' },
  { id: 'bot', z: -LANE_SPACING, label: 'Lower' },
];

export const MATCH_TIME = 150;
export const MAX_ELIXIR = 10;
export const ELIXIR_RATE = 0.78;
export const START_ELIXIR = 5;

export const CARDS = [
  { id: 'monkey', name: 'Monkey', cost: 3, hp: 10, speed: 7, count: 20, damage: 8,
    range: 3, role: 'melee', emoji: '🐒',
    glb: 'monkey_brawler',
    blueBody: [0.85, 0.55, 0.25], blueHat: [0.7, 0.4, 0.15],
    redBody: [0.85, 0.25, 0.2], redHat: [0.7, 0.15, 0.1],
    skin: [1.0, 0.85, 0.65] },
  { id: 'hamster', name: 'Hamster', cost: 3, hp: 6, speed: 6, count: 14, damage: 12,
    range: 14, role: 'ranged', emoji: '🐹',
    glb: 'hamster_bomber',
    blueBody: [0.82, 0.68, 0.35], blueHat: [0.65, 0.5, 0.2],
    redBody: [0.82, 0.35, 0.25], redHat: [0.65, 0.2, 0.12],
    skin: [1.0, 0.9, 0.78] },
  { id: 'frog', name: 'Frog', cost: 4, hp: 24, speed: 4.5, count: 8, damage: 25,
    range: 3.5, role: 'breaker', emoji: '🐸',
    glb: 'frog_tank',
    blueBody: [0.2, 0.75, 0.3], blueHat: [0.1, 0.55, 0.18],
    redBody: [0.75, 0.2, 0.2], redHat: [0.55, 0.1, 0.1],
    skin: [0.85, 0.95, 0.4] },
  { id: 'duckling', name: 'Duckling', cost: 2, hp: 5, speed: 10, count: 24, damage: 5,
    range: 2.5, role: 'rush', emoji: '🦆',
    glb: 'duckling_swarm',
    blueBody: [1.0, 0.88, 0.2], blueHat: [0.9, 0.7, 0.1],
    redBody: [0.95, 0.35, 0.2], redHat: [0.8, 0.2, 0.1],
    skin: [1.0, 0.95, 0.5] },
];

export function getCard(id) { return CARDS.find(c => c.id === id) || CARDS[0]; }

// Camera — 3/4 isometric (35-45° angle like Clash Royale)
// Camera adapts to portrait vs landscape
const isPortrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
export const CAMERA_POSITION = isPortrait ? { x: 0, y: 48, z: 42 } : { x: 0, y: 32, z: 30 };
export const CAMERA_PITCH = isPortrait ? -0.72 : -0.65;
export const CAMERA_YAW = 0;
export const CAMERA_FOV = isPortrait ? 1.1 : 0.82;

// Lighting
export const LIGHTING = {
  sunDirection: { x: -0.4, y: -0.8, z: 0.35 },
  illuminance: 2.2,
  sunColor: { x: 1.0, y: 0.97, z: 0.92 },
  ambientIntensity: 1.4,
  skyCubemapName: 'sky_13_cubemap_2k',
  postProcess: {
    bloom_intensity: 0.08,
    bloom_size: 0.5,
    bloom_threshold: 1.1,
    exposure: 0.5,
    vignette_strength: 0.04,
    vignette_threshold: 0.3,
    vignette_color: { x: 0, y: 0, z: 0, w: 1 },
    brightness: 0.03,
    contrast: 0.05,
    saturation: 0.12,
    highlights: 0.0,
    shadows: 0.0,
    tint: { x: 1.0, y: 1.0, z: 1.0 },
    tint_strength: 0.0,
  },
};
