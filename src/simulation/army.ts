import type {
  Army,
  Unit,
  CardId,
  CardDefinition,
  PlayerSide,
  Lane,
  EntityId,
  Vec2,
} from "./types";

// Helper to cast branded types safely
function makeCardId(s: string): CardId {
  return s as unknown as CardId;
}
function makeEntityId(s: string): EntityId {
  return s as unknown as EntityId;
}

let _unitCounter = 0;
function nextUnitId(): EntityId {
  return makeEntityId(`unit_${++_unitCounter}_${Date.now()}`);
}

const CARD_CATALOG: Record<string, CardDefinition> = {
  // ── Legacy cards (kept for backward compatibility) ──────────────────
  infantry: {
    id: makeCardId("infantry"),
    name: "Infantry",
    description: "Sturdy foot soldiers that advance steadily in any lane.",
    category: "infantry",
    rarity: "common",
    cost: 15,
    spawnCount: 6,
    baseStats: {
      maxHp: 80,
      attack: 10,
      defense: 8,
      moveSpeed: 3,
      attackIntervalMs: 1000,
      range: 1,
    },
    allowedLanes: [],
    cooldownMs: 2000,
  },
  archer: {
    id: makeCardId("archer"),
    name: "Archer",
    description: "Ranged units that attack from a safe distance.",
    category: "ranged",
    rarity: "common",
    cost: 20,
    spawnCount: 4,
    baseStats: {
      maxHp: 50,
      attack: 15,
      defense: 4,
      moveSpeed: 2.5,
      attackIntervalMs: 1500,
      range: 5,
    },
    allowedLanes: [],
    cooldownMs: 2500,
  },
  cavalry: {
    id: makeCardId("cavalry"),
    name: "Cavalry",
    description: "Fast-moving mounted units that charge into enemy lines.",
    category: "cavalry",
    rarity: "uncommon",
    cost: 30,
    spawnCount: 3,
    baseStats: {
      maxHp: 120,
      attack: 20,
      defense: 10,
      moveSpeed: 6,
      attackIntervalMs: 1200,
      range: 1,
    },
    allowedLanes: [],
    cooldownMs: 3000,
  },
  siege_ram: {
    id: makeCardId("siege_ram"),
    name: "Siege Ram",
    description: "A massive battering ram that can only advance through the center lane.",
    category: "siege",
    rarity: "rare",
    cost: 40,
    spawnCount: 1,
    baseStats: {
      maxHp: 300,
      attack: 40,
      defense: 20,
      moveSpeed: 1,
      attackIntervalMs: 3000,
      range: 1,
    },
    allowedLanes: ["center"],
    cooldownMs: 5000,
  },

  // ── Designed cards ───────────────────────────────────────────────────

  /**
   * Swarm — cheap horde card.
   * Many weak units overwhelm through numbers; individually fragile so
   * their HP-ratio contribution (push force) remains low. Fast enough to
   * reach the front quickly, useful as pressure or distraction.
   */
  swarm: {
    id: makeCardId("swarm"),
    name: "Swarm",
    description:
      "A cheap wave of frenzied fighters. Individually weak but overwhelming in numbers.",
    category: "infantry",
    rarity: "common",
    cost: 8,
    spawnCount: 12,
    baseStats: {
      maxHp: 28,
      attack: 4,
      defense: 1,
      moveSpeed: 4.5,
      attackIntervalMs: 700,
      range: 1,
    },
    allowedLanes: [],
    cooldownMs: 1500,
  },

  /**
   * Infantry Regiment — balanced anchor card.
   * Medium cost, solid HP pool and defense make them reliable pushers.
   * Contributes meaningful push force thanks to high aggregate HP.
   */
  infantry_regiment: {
    id: makeCardId("infantry_regiment"),
    name: "Infantry Regiment",
    description:
      "A disciplined regiment of heavy infantry. Steady advance, strong push.",
    category: "infantry",
    rarity: "common",
    cost: 18,
    spawnCount: 8,
    baseStats: {
      maxHp: 95,
      attack: 12,
      defense: 10,
      moveSpeed: 2.5,
      attackIntervalMs: 1000,
      range: 1,
    },
    allowedLanes: [],
    cooldownMs: 2200,
  },

  /**
   * Cavalry Charge — expensive, high-impact shock card.
   * Fast movement ensures early front-line engagement. High HP and
   * attack generate strong push force. Flanking bonus applied by
   * movement.ts: cavalry can shift to an adjacent lane after deploy.
   */
  cavalry_charge: {
    id: makeCardId("cavalry_charge"),
    name: "Cavalry Charge",
    description:
      "Mounted knights built for impact. Fast, powerful, and capable of flanking to adjacent lanes.",
    category: "cavalry",
    rarity: "rare",
    cost: 35,
    spawnCount: 4,
    baseStats: {
      maxHp: 160,
      attack: 32,
      defense: 8,
      moveSpeed: 8,
      attackIntervalMs: 900,
      range: 1,
    },
    allowedLanes: [],
    cooldownMs: 4000,
  },

  /**
   * Barrage — ranged artillery card.
   * Attacks from distance (range 8) so units never reach the front line
   * and contribute no push force. Deals high sustained damage but is
   * fragile if enemies close in. Ideal for weakening clashes from behind.
   */
  barrage: {
    id: makeCardId("barrage"),
    name: "Barrage",
    description:
      "A volley of ranged fire that damages enemies from a distance. Contributes no push force.",
    category: "ranged",
    rarity: "uncommon",
    cost: 25,
    spawnCount: 5,
    baseStats: {
      maxHp: 38,
      attack: 22,
      defense: 2,
      moveSpeed: 2,
      attackIntervalMs: 2000,
      range: 8,
    },
    allowedLanes: [],
    cooldownMs: 3000,
  },
};

export function getCardDefinition(cardId: CardId): CardDefinition | undefined {
  return CARD_CATALOG[cardId as string];
}

export function getCardCatalog(): Record<string, CardDefinition> {
  return CARD_CATALOG;
}

/** Creates units from card config at given position; returns [] if card not found */
export function spawnWave(
  cardId: CardId,
  side: PlayerSide,
  lane: Lane,
  position: Vec2,
): Unit[] {
  const card = getCardDefinition(cardId);
  if (!card) return [];

  const units: Unit[] = [];
  for (let i = 0; i < card.spawnCount; i++) {
    const unit: Unit = {
      id: nextUnitId(),
      cardId,
      side,
      lane,
      position: { x: position.x, y: position.y },
      hp: card.baseStats.maxHp,
      stats: { ...card.baseStats },
      status: "moving",
      targetId: null,
      deployedAtMs: 0,
    };
    units.push(unit);
  }
  return units;
}

/** Creates army with supply=100, 4-card hand (one designed card each), deck with extras, empty units[] */
export function createArmy(side: PlayerSide): Army {
  const hand: CardId[] = [
    makeCardId("swarm"),
    makeCardId("infantry_regiment"),
    makeCardId("cavalry_charge"),
    makeCardId("barrage"),
  ];

  const deck: CardId[] = [
    makeCardId("swarm"),
    makeCardId("swarm"),
    makeCardId("infantry_regiment"),
    makeCardId("infantry_regiment"),
    makeCardId("cavalry_charge"),
    makeCardId("barrage"),
  ];

  return {
    side,
    supply: 100,
    hand,
    deck,
    units: [],
  };
}

/** Returns new army with units appended */
export function addUnitsToArmy(army: Army, units: Unit[]): Army {
  return {
    ...army,
    units: [...army.units, ...units],
  };
}
