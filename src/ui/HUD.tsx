import { useGameStore } from "../state/gameStore";
import type { MatchPhase } from "../state/gameStore";
import type { WallState } from "../simulation/types";

// ─── Sub-components ───────────────────────────────────────────────────

function WallHpBars({ wallState }: { wallState: WallState }) {
  const segments = [
    { key: "upper" as const, label: "UPPER" },
    { key: "gate" as const, label: "GATE" },
    { key: "lower" as const, label: "LOWER" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: 120,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: 1,
          marginBottom: 2,
        }}
      >
        WALL HP
      </div>
      {segments.map(({ key, label }) => {
        const seg = wallState.segments[key];
        const ratio = seg.hp / seg.maxHp;
        const barColor = seg.breached
          ? "#555"
          : ratio > 0.5
          ? "#44cc66"
          : ratio > 0.25
          ? "#ffaa22"
          : "#ff4444";
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 9, color: "#aaa", width: 36, textAlign: "right" }}>
              {label}
            </div>
            <div
              style={{
                flex: 1,
                height: 8,
                background: "rgba(255,255,255,0.1)",
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div
                style={{
                  width: `${Math.max(0, ratio * 100)}%`,
                  height: "100%",
                  background: barColor,
                  transition: "width 0.3s ease, background 0.3s",
                }}
              />
            </div>
            <div style={{ fontSize: 9, color: "#aaa", width: 28, textAlign: "left" }}>
              {seg.breached ? "✗" : Math.ceil(seg.hp)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ElixirBar({ elixir, max = 10 }: { elixir: number; max?: number }) {
  const pips = Array.from({ length: max }, (_, i) => i);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: 1,
        }}
      >
        ELIXIR
      </div>
      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        {pips.map((i) => {
          const filled = elixir >= i + 1;
          const partial = !filled && elixir > i;
          const fillPct = partial ? (elixir - i) * 100 : filled ? 100 : 0;
          return (
            <div
              key={i}
              style={{
                width: 16,
                height: 14,
                borderRadius: 3,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(204,136,255,0.3)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: `${fillPct}%`,
                  background: "linear-gradient(180deg, #dd99ff, #9944cc)",
                  transition: "height 0.1s",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "#cc88ff", fontWeight: "bold" }}>
        {elixir.toFixed(1)}
      </div>
    </div>
  );
}

const MATCH_PHASE_LABELS: Record<NonNullable<MatchPhase>, string> = {
  battle: "BATTLE",
  surge: "SURGE",
  suddendeath: "SUDDEN DEATH",
};

const MATCH_PHASE_COLOR: Record<NonNullable<MatchPhase>, string> = {
  battle: "#ffffff",
  surge: "#ff9922",
  suddendeath: "#ff3333",
};

const MATCH_PHASE_GLOW: Record<NonNullable<MatchPhase>, string> = {
  battle: "none",
  surge: "0 0 10px #ff9922",
  suddendeath: "0 0 14px #ff3333",
};

function MatchTimer({ timeMs, matchPhase }: { timeMs: number; matchPhase: MatchPhase | null }) {
  const totalSec = Math.ceil(timeMs / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const display = `${minutes}:${String(seconds).padStart(2, "0")}`;

  const color = matchPhase ? MATCH_PHASE_COLOR[matchPhase] : "#ffffff";
  const glow = matchPhase ? MATCH_PHASE_GLOW[matchPhase] : "none";
  const label = matchPhase ? MATCH_PHASE_LABELS[matchPhase] : "BATTLE";

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 10,
          color,
          letterSpacing: 2,
          opacity: 0.8,
          textShadow: glow,
          marginBottom: 2,
          transition: "color 0.5s",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color,
          textShadow: glow,
          fontFamily: "monospace",
          letterSpacing: 2,
          transition: "color 0.5s, text-shadow 0.5s",
          minWidth: 60,
        }}
      >
        {display}
      </div>
    </div>
  );
}

function DeployTimer({ timeMs }: { timeMs: number }) {
  const totalSec = Math.ceil(timeMs / 1000);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>
        DEPLOY
      </div>
      <div style={{ fontSize: 18, fontWeight: "bold", color: "#88ccff", fontFamily: "monospace" }}>
        {totalSec}s
      </div>
    </div>
  );
}

// ─── HUD root ─────────────────────────────────────────────────────────

export function HUD() {
  const phase = useGameStore((s) => s.phase);
  const matchPhase = useGameStore((s) => s.matchPhase);
  const hudVisible = useGameStore((s) => s.hudVisible);
  const elixir = useGameStore((s) => s.elixir);
  const wallState = useGameStore((s) => s.wallState);
  const matchTimeMs = useGameStore((s) => s.matchTimeMs);
  const deployTimeMs = useGameStore((s) => s.deployTimeMs);

  if (!hudVisible) return null;

  const showWall = (phase === "deploying" || phase === "battle") && wallState;
  const showTimer = phase === "battle";
  const showDeploy = phase === "deploying";
  const showElixir = phase === "deploying" || phase === "battle";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        color: "#fff",
        fontFamily: "monospace",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: "10px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)",
          gap: 16,
        }}
      >
        {/* Left: title */}
        <span style={{ fontSize: 13, letterSpacing: 2, opacity: 0.8 }}>ARMY ROYALE</span>

        {/* Center: timer */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          {showTimer && <MatchTimer timeMs={matchTimeMs} matchPhase={matchPhase} />}
          {showDeploy && <DeployTimer timeMs={deployTimeMs} />}
          {phase === "lobby" && (
            <span style={{ fontSize: 14, opacity: 0.6, letterSpacing: 2 }}>LOBBY</span>
          )}
          {phase === "results" && (
            <span style={{ fontSize: 14, opacity: 0.6, letterSpacing: 2 }}>RESULTS</span>
          )}
        </div>

        {/* Right: phase label */}
        <span style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1 }}>
          {phase === "battle" && matchPhase
            ? matchPhase.toUpperCase()
            : phase.toUpperCase()}
        </span>
      </div>

      {/* Wall HP panel — right side */}
      {showWall && (
        <div
          style={{
            position: "absolute",
            top: 52,
            right: 12,
            background: "rgba(0,0,0,0.55)",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "8px 12px",
          }}
        >
          <WallHpBars wallState={wallState} />
        </div>
      )}

      {/* Elixir bar — centered, above card hand */}
      {showElixir && (
        <div
          style={{
            position: "absolute",
            bottom: 130,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.5)",
            borderRadius: 6,
            border: "1px solid rgba(204,136,255,0.2)",
            padding: "6px 16px",
          }}
        >
          <ElixirBar elixir={elixir} />
        </div>
      )}
    </div>
  );
}
