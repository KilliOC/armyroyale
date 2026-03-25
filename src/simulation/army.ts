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

/** Creates army with supply=100, 4-card hand (one of each card), deck with extra cards, empty units[] */
export function createArmy(side: PlayerSide): Army {
  const hand: CardId[] = [
    makeCardId("infantry"),
    makeCardId("archer"),
    makeCardId("cavalry"),
    makeCardId("siege_ram"),
  ];

  const deck: CardId[] = [
    makeCardId("infantry"),
    makeCardId("infantry"),
    makeCardId("archer"),
    makeCardId("archer"),
    makeCardId("cavalry"),
    makeCardId("siege_ram"),
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
