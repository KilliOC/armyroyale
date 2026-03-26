import { Howl, Howler } from "howler";
import { getCardDefinition } from "../simulation/army";
import type { CardId } from "../simulation/types";
import type { GamePhase, MatchOutcome } from "../state/gameStore";

import marchingLoopLightUrl from "../assets/audio/generated/elevenlabs/marching_loop_light.mp3";
import marchingLoopHeavyUrl from "../assets/audio/generated/elevenlabs/marching_loop_heavy.mp3";
import clashHitSmallUrl from "../assets/audio/generated/elevenlabs/clash_hit_small.mp3";
import clashHitMediumUrl from "../assets/audio/generated/elevenlabs/clash_hit_medium.mp3";
import clashHitHeavyUrl from "../assets/audio/generated/elevenlabs/clash_hit_heavy.mp3";
import swordMetalImpactVariantUrl from "../assets/audio/generated/elevenlabs/sword_metal_impact_variant.mp3";
import shieldBluntImpactVariantUrl from "../assets/audio/generated/elevenlabs/shield_blunt_impact_variant.mp3";
import swarmLightAttackChatterUrl from "../assets/audio/generated/elevenlabs/swarm_light_attack_chatter.mp3";
import infantryHeavyMeleeHitUrl from "../assets/audio/generated/elevenlabs/infantry_heavy_melee_hit.mp3";
import cavalryChargeImpactUrl from "../assets/audio/generated/elevenlabs/cavalry_charge_impact.mp3";
import rangedVolleyReleaseUrl from "../assets/audio/generated/elevenlabs/ranged_volley_release.mp3";
import rangedImpactHitUrl from "../assets/audio/generated/elevenlabs/ranged_impact_hit.mp3";
import deathPoofLightUrl from "../assets/audio/generated/elevenlabs/death_poof_light.mp3";
import deathPoofMediumUrl from "../assets/audio/generated/elevenlabs/death_poof_medium.mp3";
import unitHitReactionTickUrl from "../assets/audio/generated/elevenlabs/unit_hit_reaction_tick.mp3";
import wallHitStoneImpactUrl from "../assets/audio/generated/elevenlabs/wall_hit_stone_impact.mp3";
import wallCrackUrl from "../assets/audio/generated/elevenlabs/wall_crack.mp3";
import gateBreakUrl from "../assets/audio/generated/elevenlabs/gate_break.mp3";
import rubbleFallUrl from "../assets/audio/generated/elevenlabs/rubble_fall.mp3";
import breachBoomPayoffImpactUrl from "../assets/audio/generated/elevenlabs/breach_boom_payoff_impact.mp3";
import deployDropUrl from "../assets/audio/generated/elevenlabs/deploy_drop.mp3";
import elixirReadyCardPlayableUrl from "../assets/audio/generated/elevenlabs/elixir_ready_card_playable.mp3";
import phaseStingerBattleUrl from "../assets/audio/generated/elevenlabs/phase_stinger_battle.mp3";
import phaseStingerSurgeUrl from "../assets/audio/generated/elevenlabs/phase_stinger_surge.mp3";
import phaseStingerSuddenDeathUrl from "../assets/audio/generated/elevenlabs/phase_stinger_sudden_death.mp3";
import victoryStingUrl from "../assets/audio/generated/elevenlabs/victory_sting.mp3";
import defeatStingUrl from "../assets/audio/generated/elevenlabs/defeat_sting.mp3";
import chestRewardSparkleUrl from "../assets/audio/generated/elevenlabs/chest_reward_sparkle.mp3";
import battlefieldWindAmbienceUrl from "../assets/audio/generated/elevenlabs/battlefield_wind_ambience.mp3";
import crowdDistantWarBedUrl from "../assets/audio/generated/elevenlabs/crowd_distant_war_bed.mp3";

type SoundId =
  | "marching_loop_light"
  | "marching_loop_heavy"
  | "clash_hit_small"
  | "clash_hit_medium"
  | "clash_hit_heavy"
  | "sword_metal_impact_variant"
  | "shield_blunt_impact_variant"
  | "swarm_light_attack_chatter"
  | "infantry_heavy_melee_hit"
  | "cavalry_charge_impact"
  | "ranged_volley_release"
  | "ranged_impact_hit"
  | "death_poof_light"
  | "death_poof_medium"
  | "unit_hit_reaction_tick"
  | "wall_hit_stone_impact"
  | "wall_crack"
  | "gate_break"
  | "rubble_fall"
  | "breach_boom_payoff_impact"
  | "deploy_drop"
  | "elixir_ready_card_playable"
  | "phase_stinger_battle"
  | "phase_stinger_surge"
  | "phase_stinger_sudden_death"
  | "victory_sting"
  | "defeat_sting"
  | "chest_reward_sparkle"
  | "battlefield_wind_ambience"
  | "crowd_distant_war_bed";

interface SoundDef {
  src: string;
  volume: number;
  loop?: boolean;
}

const SOUND_DEFS: Record<SoundId, SoundDef> = {
  marching_loop_light: { src: marchingLoopLightUrl, volume: 0.2, loop: true },
  marching_loop_heavy: { src: marchingLoopHeavyUrl, volume: 0.12, loop: true },
  clash_hit_small: { src: clashHitSmallUrl, volume: 0.46 },
  clash_hit_medium: { src: clashHitMediumUrl, volume: 0.3 },
  clash_hit_heavy: { src: clashHitHeavyUrl, volume: 0.38 },
  sword_metal_impact_variant: { src: swordMetalImpactVariantUrl, volume: 0.28 },
  shield_blunt_impact_variant: { src: shieldBluntImpactVariantUrl, volume: 0.34 },
  swarm_light_attack_chatter: { src: swarmLightAttackChatterUrl, volume: 0.26 },
  infantry_heavy_melee_hit: { src: infantryHeavyMeleeHitUrl, volume: 0.34 },
  cavalry_charge_impact: { src: cavalryChargeImpactUrl, volume: 0.38 },
  ranged_volley_release: { src: rangedVolleyReleaseUrl, volume: 0.34 },
  ranged_impact_hit: { src: rangedImpactHitUrl, volume: 0.34 },
  death_poof_light: { src: deathPoofLightUrl, volume: 0.18 },
  death_poof_medium: { src: deathPoofMediumUrl, volume: 0.3 },
  unit_hit_reaction_tick: { src: unitHitReactionTickUrl, volume: 0.2 },
  wall_hit_stone_impact: { src: wallHitStoneImpactUrl, volume: 0.46 },
  wall_crack: { src: wallCrackUrl, volume: 0.38 },
  gate_break: { src: gateBreakUrl, volume: 0.58 },
  rubble_fall: { src: rubbleFallUrl, volume: 0.48 },
  breach_boom_payoff_impact: { src: breachBoomPayoffImpactUrl, volume: 0.58 },
  deploy_drop: { src: deployDropUrl, volume: 0.32 },
  elixir_ready_card_playable: { src: elixirReadyCardPlayableUrl, volume: 0.26 },
  phase_stinger_battle: { src: phaseStingerBattleUrl, volume: 0.48 },
  phase_stinger_surge: { src: phaseStingerSurgeUrl, volume: 0.44 },
  phase_stinger_sudden_death: { src: phaseStingerSuddenDeathUrl, volume: 0.46 },
  victory_sting: { src: victoryStingUrl, volume: 0.5 },
  defeat_sting: { src: defeatStingUrl, volume: 0.52 },
  chest_reward_sparkle: { src: chestRewardSparkleUrl, volume: 0.34 },
  battlefield_wind_ambience: { src: battlefieldWindAmbienceUrl, volume: 0.18, loop: true },
  crowd_distant_war_bed: { src: crowdDistantWarBedUrl, volume: 0.1, loop: true },
};

const LOOP_IDS: SoundId[] = [
  "battlefield_wind_ambience",
  "crowd_distant_war_bed",
  "marching_loop_light",
  "marching_loop_heavy",
];

class AudioManager {
  private sounds = new Map<SoundId, Howl>();
  private loopPlayback = new Map<SoundId, number>();
  private cooldowns = new Map<string, number>();
  private hasUnlocked = false;

  constructor() {
    Howler.autoUnlock = true;
    Howler.autoSuspend = false;
    Howler.volume(0.9);
  }

  unlock(): void {
    if (this.hasUnlocked) return;
    this.hasUnlocked = true;
    void Howler.ctx?.resume?.();
  }

  private getHowl(id: SoundId): Howl {
    const existing = this.sounds.get(id);
    if (existing) return existing;

    const def = SOUND_DEFS[id];
    const howl = new Howl({
      src: [def.src],
      volume: def.volume,
      loop: def.loop ?? false,
      preload: true,
    });
    this.sounds.set(id, howl);
    return howl;
  }

  private isCoolingDown(key: string, cooldownMs: number): boolean {
    const now = performance.now();
    const readyAt = this.cooldowns.get(key) ?? 0;
    if (now < readyAt) return true;
    this.cooldowns.set(key, now + cooldownMs);
    return false;
  }

  play(id: SoundId, opts?: { volume?: number; rate?: number; cooldownKey?: string; cooldownMs?: number }): void {
    if (opts?.cooldownKey && this.isCoolingDown(opts.cooldownKey, opts.cooldownMs ?? 0)) {
      return;
    }

    const howl = this.getHowl(id);
    const playbackId = howl.play();
    if (typeof opts?.volume === "number") {
      howl.volume(opts.volume, playbackId);
    }
    if (typeof opts?.rate === "number") {
      howl.rate(opts.rate, playbackId);
    }
  }

  private setLoopVolume(id: SoundId, targetVolume: number): void {
    const howl = this.getHowl(id);
    let playbackId = this.loopPlayback.get(id);

    if (targetVolume <= 0.001) {
      if (playbackId !== undefined) {
        const currentVolume = howl.volume();
        howl.fade(currentVolume, 0, 250, playbackId);
        window.setTimeout(() => {
          const current = this.loopPlayback.get(id);
          if (current !== undefined) {
            howl.stop(current);
            this.loopPlayback.delete(id);
          }
        }, 280);
      }
      return;
    }

    if (playbackId === undefined) {
      const started = howl.play();
      if (typeof started !== "number") return;
      playbackId = started;
      this.loopPlayback.set(id, playbackId);
      howl.volume(0, playbackId);
    }

    const currentVolume = howl.volume();
    howl.fade(currentVolume, targetVolume, 250, playbackId);
  }

  updateBattleLoops(phase: GamePhase, totalUnits: number): void {
    if (phase === "deploying") {
      this.setLoopVolume("battlefield_wind_ambience", 0.18);
      this.setLoopVolume("crowd_distant_war_bed", 0.08);
      this.setLoopVolume("marching_loop_light", 0);
      this.setLoopVolume("marching_loop_heavy", 0);
      return;
    }

    if (phase === "battle") {
      const normalized = Math.min(1, totalUnits / 60);
      const heavyNormalized = Math.min(1, Math.max(0, totalUnits - 22) / 48);
      this.setLoopVolume("battlefield_wind_ambience", 0.2);
      this.setLoopVolume("crowd_distant_war_bed", 0.1 + normalized * 0.04);
      this.setLoopVolume("marching_loop_light", totalUnits > 8 ? 0.06 + normalized * 0.14 : 0);
      this.setLoopVolume("marching_loop_heavy", totalUnits > 24 ? 0.04 + heavyNormalized * 0.12 : 0);
      return;
    }

    for (const id of LOOP_IDS) {
      this.setLoopVolume(id, 0);
    }
  }

  playDeploy(cardId: CardId): void {
    this.play("deploy_drop", { cooldownKey: "deploy_drop", cooldownMs: 75 });
    const card = getCardDefinition(cardId);
    if (!card) return;

    if (card.id === ("barrage" as CardId) || card.category === "ranged") {
      window.setTimeout(() => this.play("ranged_volley_release", { cooldownKey: "ranged_release", cooldownMs: 200 }), 40);
    }
  }

  playCardPlayableCue(): void {
    this.play("elixir_ready_card_playable", {
      cooldownKey: "card_playable",
      cooldownMs: 1200,
    });
  }

  playAnnouncement(text: string): void {
    if (text.includes("BATTLE!")) {
      this.play("phase_stinger_battle", { cooldownKey: "phase_battle", cooldownMs: 1200 });
      return;
    }
    if (text.includes("SURGE")) {
      this.play("phase_stinger_surge", { cooldownKey: "phase_surge", cooldownMs: 1200 });
      return;
    }
    if (text.includes("SUDDEN")) {
      this.play("phase_stinger_sudden_death", { cooldownKey: "phase_sudden", cooldownMs: 1200 });
    }
  }

  playCombat(attackerCardId: CardId | null, damage: number, killed: boolean): void {
    const card = attackerCardId ? getCardDefinition(attackerCardId) : null;
    const category = card?.category;
    const cardName = attackerCardId ? String(attackerCardId) : "";

    if (category === "ranged") {
      this.play("ranged_impact_hit", { cooldownKey: "ranged_impact", cooldownMs: 90 });
    } else if (category === "cavalry" || cardName === "cavalry_charge") {
      this.play("cavalry_charge_impact", { cooldownKey: "cavalry_impact", cooldownMs: 220 });
    } else if (cardName === "swarm") {
      this.play("swarm_light_attack_chatter", { cooldownKey: "swarm_impact", cooldownMs: 120 });
    } else if (cardName === "infantry_regiment") {
      this.play("infantry_heavy_melee_hit", { cooldownKey: "infantry_heavy", cooldownMs: 140 });
    } else if (damage >= 18) {
      this.play("clash_hit_heavy", { cooldownKey: "clash_heavy", cooldownMs: 90 });
    } else if (damage >= 9) {
      this.play("clash_hit_medium", { cooldownKey: "clash_medium", cooldownMs: 65 });
    } else {
      this.play("clash_hit_small", { cooldownKey: "clash_small", cooldownMs: 50 });
    }

    if (Math.random() < 0.18) {
      this.play(Math.random() < 0.5 ? "sword_metal_impact_variant" : "shield_blunt_impact_variant", {
        cooldownKey: "impact_variant",
        cooldownMs: 110,
      });
    }

    if (killed) {
      this.play(damage > 14 ? "death_poof_medium" : "death_poof_light", {
        cooldownKey: "death_poof",
        cooldownMs: 65,
      });
    } else if (Math.random() < 0.25) {
      this.play("unit_hit_reaction_tick", {
        cooldownKey: "unit_hit_tick",
        cooldownMs: 80,
      });
    }
  }

  playWallDamage(hpRatio: number): void {
    this.play("wall_hit_stone_impact", { cooldownKey: "wall_hit", cooldownMs: 260 });
    if (hpRatio < 0.55) {
      this.play("wall_crack", { cooldownKey: "wall_crack", cooldownMs: 550 });
    }
  }

  playBreach(): void {
    this.play("gate_break", { cooldownKey: "breach_gate", cooldownMs: 1500 });
    window.setTimeout(() => this.play("breach_boom_payoff_impact", { cooldownKey: "breach_boom", cooldownMs: 1500 }), 90);
    window.setTimeout(() => this.play("rubble_fall", { cooldownKey: "breach_rubble", cooldownMs: 1500 }), 220);
  }

  playResult(outcome: MatchOutcome | null): void {
    if (!outcome) return;
    if (outcome.winner === "attacker") {
      this.play("victory_sting", { cooldownKey: "result", cooldownMs: 1800 });
    } else if (outcome.winner === "defender") {
      this.play("defeat_sting", { cooldownKey: "result", cooldownMs: 1800 });
    }
  }

  playChestReward(): void {
    this.play("chest_reward_sparkle", { cooldownKey: "chest_reward", cooldownMs: 1200 });
  }

  dispose(): void {
    for (const [id, playbackId] of this.loopPlayback) {
      const howl = this.sounds.get(id);
      howl?.stop(playbackId);
    }
    this.loopPlayback.clear();
    for (const howl of this.sounds.values()) {
      howl.unload();
    }
    this.sounds.clear();
  }
}

export const audio = new AudioManager();
