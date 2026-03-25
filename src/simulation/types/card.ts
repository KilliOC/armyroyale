import type { UnitStats } from "./army";
import type { Lane } from "./common";

// ─── Card identity ───────────────────────────────────────────────────

/**
 * Branded string so card IDs can't be confused with entity IDs.
 * Example values: "infantry", "archer", "cavalry", "siege_ram"
 */
export type CardId = string & { readonly __cardBrand: unique symbol };

// ─── Card rarity / category ──────────────────────────────────────────

export type CardRarity = "common" | "uncommon" | "rare" | "epic";
export type CardCategory = "infantry" | "ranged" | "cavalry" | "siege" | "support";

// ─── Card definition (immutable template) ────────────────────────────

/**
 * Describes what a card *is*. Runtime units are spawned from these
 * templates with instance-level mutable state (see Unit).
 */
export interface CardDefinition {
  id: CardId;
  name: string;
  description: string;
  category: CardCategory;
  rarity: CardRarity;

  /** Supply cost to deploy */
  cost: number;

  /** How many units a single card play spawns */
  spawnCount: number;

  /** Base stats applied to each spawned unit */
  baseStats: UnitStats;

  /** Lanes this card is allowed to be played in (empty = any) */
  allowedLanes: Lane[];

  /** Cooldown in ms before the same card can be played again */
  cooldownMs: number;
}
