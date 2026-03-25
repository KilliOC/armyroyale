import type {
  AISnapshot,
  AIDecision,
  LaneSummary,
  Lane,
  DeployCommand,
  CardId,
} from "./types";
import { getCardDefinition } from "./army";

// ─── Constants ────────────────────────────────────────────────────────

/** Minimum ms between any AI deploy actions */
const BASE_DEPLOY_INTERVAL_MS = 3_000;

/** Jitter added to deploy interval so AI doesn't feel robotic */
const DEPLOY_JITTER_MS = 1_000;

/** Front line threshold below which AI considers that lane "under pressure" */
const PRESSURE_THRESHOLD = 0.55;

/** Front line threshold above which AI considers that lane "dominating" */
const DOMINATING_THRESHOLD = 0.45;

/** Wall HP ratio below which AI panics and reinforces that lane */
const WALL_PANIC_THRESHOLD = 0.25;

const LANES: Lane[] = ["upper", "center", "lower"];

// ─── Internal state ───────────────────────────────────────────────────

interface AIState {
  nextDeployMs: number;
  waveIndex: number;
}

// ─── Lane scoring ─────────────────────────────────────────────────────

/**
 * Score a lane from the AI (defender) perspective.
 * Higher score = more urgent to reinforce.
 */
function scoreLane(lane: Lane, snap: AISnapshot): number {
  const summary: LaneSummary = snap.laneSummaries[lane];
  const frontSeg = snap.frontLine[lane];
  const wallSeg = snap.wall[lane];

  let score = 0;

  // Attacker is pushing toward our wall (high position = bad for defender)
  score += frontSeg.position * 60;

  // Front line moving toward our wall (positive velocity = attacker advancing)
  score += frontSeg.velocity * 30;

  // More attackers in lane = more danger
  score += summary.enemyCount * 5;

  // Our units are dying = reinforce
  if (summary.friendlyCount > 0) {
    score += (1 - summary.friendlyHpRatio) * 20;
  } else {
    // No friendly units in lane = very urgent
    score += 35;
  }

  // Wall is damaged — extra urgency
  const wallHpRatio = wallSeg.hp / wallSeg.maxHp;
  if (wallHpRatio < WALL_PANIC_THRESHOLD) {
    score += 80;
  } else if (wallHpRatio < 0.5) {
    score += 30;
  }

  // Already breached — nothing we can do there
  if (wallSeg.breached) {
    score = 0;
  }

  return score;
}

/**
 * Pick which lane to deploy into based on current game state.
 */
function pickLane(snap: AISnapshot): Lane {
  let bestLane: Lane = "center";
  let bestScore = -Infinity;

  for (const lane of LANES) {
    const s = scoreLane(lane, snap);
    if (s > bestScore) {
      bestScore = s;
      bestLane = lane;
    }
  }

  return bestLane;
}

/**
 * Pick the best affordable card from hand for the current situation.
 * Returns null if nothing is affordable.
 */
function pickCard(snap: AISnapshot, lane: Lane): CardId | null {
  const affordable = snap.hand.filter((cardId) => {
    const def = getCardDefinition(cardId);
    if (!def) return false;
    if (def.cost > snap.supply) return false;
    // Respect lane restrictions
    if (def.allowedLanes.length > 0 && !def.allowedLanes.includes(lane)) {
      return false;
    }
    return true;
  });

  if (affordable.length === 0) return null;

  // Heuristic: prefer medium-cost cards; avoid burning expensive cards unless urgent
  const wallSeg = snap.wall[lane];
  const wallRatio = wallSeg.hp / wallSeg.maxHp;
  const frontPos = snap.frontLine[lane].position;
  const isPanic = wallRatio < WALL_PANIC_THRESHOLD || frontPos > 0.8;

  // Sort candidates by priority
  const scored = affordable.map((cardId) => {
    const def = getCardDefinition(cardId)!;
    let cardScore = 0;

    if (isPanic) {
      // In panic, play the highest DPS card we can afford
      const dps = (def.baseStats.attack * 1000) / def.baseStats.attackIntervalMs;
      cardScore = dps * def.spawnCount;
    } else {
      // Normally prefer mid-cost cards to preserve supply
      const midCost = 20;
      cardScore = 100 - Math.abs(def.cost - midCost);
    }

    return { cardId, cardScore };
  });

  scored.sort((a, b) => b.cardScore - a.cardScore);
  return scored[0].cardId;
}

// ─── AI Opponent class ────────────────────────────────────────────────

/**
 * Simple rule-based AI opponent (defender side).
 *
 * Design principles:
 *  - Deploys waves on a timer with jitter (feels less robotic)
 *  - Scores each lane by threat level (front line position, unit counts, wall HP)
 *  - Reinforces the highest-threat lane first
 *  - Falls back to center if no obvious threat
 *  - Simple enough for playtesting but shows intentional behaviour
 */
export class AIOpponent {
  private state: AIState;

  constructor() {
    this.state = {
      nextDeployMs: BASE_DEPLOY_INTERVAL_MS,
      waveIndex: 0,
    };
  }

  /**
   * Called every simulation tick.
   * Returns an AIDecision (may have zero deploys if not yet time).
   */
  tick(snap: AISnapshot): AIDecision {
    const deploys: DeployCommand[] = [];

    if (snap.hand.length === 0 || snap.supply <= 0) {
      return { deploys };
    }

    // Not time to deploy yet
    if (snap.elapsedMs < this.state.nextDeployMs) {
      return { deploys };
    }

    const focusLane = pickLane(snap);
    const cardId = pickCard(snap, focusLane);

    if (cardId) {
      deploys.push({
        side: snap.side,
        cardId,
        lane: focusLane,
        // No explicit position — let spawn zone logic handle it
      });

      // Schedule next wave with some jitter
      const jitter = (Math.random() - 0.5) * 2 * DEPLOY_JITTER_MS;
      this.state.nextDeployMs =
        snap.elapsedMs + BASE_DEPLOY_INTERVAL_MS + jitter;
      this.state.waveIndex++;

      // If a lane is completely dominating (front near attacker base), also
      // reinforce a second lane to prevent easy flanking
      if (this.state.waveIndex % 3 === 0) {
        const secondLane = LANES.find(
          (l) =>
            l !== focusLane &&
            snap.frontLine[l].position > PRESSURE_THRESHOLD,
        );
        if (secondLane) {
          const secondCard = pickCard(
            { ...snap, supply: snap.supply - (getCardDefinition(cardId)?.cost ?? 0) },
            secondLane,
          );
          if (secondCard) {
            deploys.push({
              side: snap.side,
              cardId: secondCard,
              lane: secondLane,
            });
          }
        }
      }
    }

    return { deploys, focusLane };
  }

  /** Reset AI state (call at match start) */
  reset(): void {
    this.state = {
      nextDeployMs: BASE_DEPLOY_INTERVAL_MS,
      waveIndex: 0,
    };
  }

  /** Whether a given lane is under pressure based on a snapshot */
  static isLaneUnderPressure(lane: Lane, snap: AISnapshot): boolean {
    return snap.frontLine[lane].position > PRESSURE_THRESHOLD;
  }

  /** Whether the AI is dominating a lane */
  static isLaneDominating(lane: Lane, snap: AISnapshot): boolean {
    return snap.frontLine[lane].position < DOMINATING_THRESHOLD;
  }
}
