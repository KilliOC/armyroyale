import { useEffect, useRef } from "react";
import { audio } from "../audio";
import { useGameStore } from "../state/gameStore";

// ─── Result Screen ────────────────────────────────────────────────────

/**
 * End-of-match overlay.
 *
 * Shows when phase === "results".
 *  - Breach victory: attacker broke through the wall
 *  - Time-up: compare wall damage to determine winner
 *  - Draw: wall damage equal
 *
 * Integrates with gameStore for phase and outcome data.
 */
export function ResultScreen() {
  const phase = useGameStore((s) => s.phase);
  const outcome = useGameStore((s) => s.outcome);
  const setPhase = useGameStore((s) => s.setPhase);
  const lastPlayedRef = useRef<string | null>(null);

  useEffect(() => {
    if (phase !== "results" || !outcome) {
      lastPlayedRef.current = null;
      return;
    }
    const signature = `${outcome.reason}:${outcome.winner ?? "draw"}`;
    if (lastPlayedRef.current === signature) return;
    lastPlayedRef.current = signature;
    audio.playResult(outcome);
    const timeoutId = window.setTimeout(() => audio.playChestReward(), 450);
    return () => window.clearTimeout(timeoutId);
  }, [outcome, phase]);

  if (phase !== "results") return null;

  const winner = outcome?.winner ?? null;
  const reason = outcome?.reason ?? "unknown";
  const stats = outcome?.stats;

  const title =
    winner === "attacker"
      ? "VICTORY"
      : winner === "defender"
        ? "DEFEAT"
        : "DRAW";

  const titleColor =
    winner === "attacker"
      ? "#ffe066"
      : winner === "defender"
        ? "#ff6666"
        : "#aaaaaa";

  const subtitle =
    reason === "breach"
      ? "The wall has been breached!"
      : reason === "timeout"
        ? "Time's up — wall damage compared"
        : "Match concluded";

  function handleReplay() {
    setPhase("lobby");
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.72))",
        color: "#fff",
        fontFamily: "monospace",
        zIndex: 100,
        pointerEvents: "auto",
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: "clamp(48px, 10vw, 96px)",
          fontWeight: "bold",
          color: titleColor,
          textShadow: `0 0 40px ${titleColor}88`,
          letterSpacing: "0.15em",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: "18px",
          color: "#cccccc",
          marginBottom: "32px",
        }}
      >
        {subtitle}
      </div>

      {/* Stats panel */}
      {stats && (
        <div
          style={{
            display: "flex",
            gap: "48px",
            marginBottom: "40px",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            padding: "20px 40px",
            fontSize: "14px",
          }}
        >
          <StatColumn label="YOUR ARMY" data={stats.attacker} color="#4488ff" />
          <div
            style={{
              width: "1px",
              background: "rgba(255,255,255,0.2)",
            }}
          />
          <StatColumn label="ENEMY ARMY" data={stats.defender} color="#ff4444" />
        </div>
      )}

      {/* Wall damage bar (time-up only) */}
      {reason === "timeout" && stats && (
        <WallDamageBar
          attackerWallDamage={stats.attacker.damageDealt}
          defenderWallDamage={stats.defender.damageDealt}
        />
      )}

      {/* Reward chest placeholder */}
      <div
        style={{
          marginBottom: "32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            background: "linear-gradient(135deg, #c8960c 0%, #ffe566 50%, #a07008 100%)",
            borderRadius: "8px",
            border: "2px solid #ffd700",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            boxShadow: "0 0 20px rgba(255,215,0,0.4)",
          }}
        >
          {/* Chest icon using unicode */}
          &#x1F4E6;
        </div>
        <span style={{ fontSize: "12px", color: "#aaa" }}>Reward Chest</span>
        <span style={{ fontSize: "11px", color: "#666" }}>(coming soon)</span>
      </div>

      {/* Replay button */}
      <button
        onClick={handleReplay}
        style={{
          padding: "14px 48px",
          fontSize: "16px",
          fontFamily: "monospace",
          fontWeight: "bold",
          letterSpacing: "0.1em",
          background: "linear-gradient(135deg, #2255aa, #4488ff)",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(68,136,255,0.4)",
          transition: "transform 0.1s, box-shadow 0.1s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        PLAY AGAIN
      </button>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

interface SideStats {
  unitsDeployed: number;
  unitsLost: number;
  damageDealt: number;
  wallSegmentsDestroyed: number;
}

function StatColumn({
  label,
  data,
  color,
}: {
  label: string;
  data: SideStats;
  color: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "160px" }}>
      <div style={{ color, fontWeight: "bold", marginBottom: "4px" }}>{label}</div>
      <StatRow label="Units deployed" value={data.unitsDeployed} />
      <StatRow label="Units lost" value={data.unitsLost} />
      <StatRow label="Damage dealt" value={Math.round(data.damageDealt)} />
      <StatRow label="Wall sections" value={data.wallSegmentsDestroyed} />
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "24px",
        color: "#ddd",
      }}
    >
      <span style={{ color: "#999" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function WallDamageBar({
  attackerWallDamage,
  defenderWallDamage,
}: {
  attackerWallDamage: number;
  defenderWallDamage: number;
}) {
  const total = attackerWallDamage + defenderWallDamage || 1;
  const attackerPct = Math.round((attackerWallDamage / total) * 100);

  return (
    <div
      style={{
        marginBottom: "28px",
        width: "320px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div style={{ fontSize: "12px", color: "#888", textAlign: "center" }}>
        WALL DAMAGE COMPARISON
      </div>
      <div
        style={{
          display: "flex",
          height: "16px",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            width: `${attackerPct}%`,
            background: "#4488ff",
            transition: "width 0.5s ease",
          }}
        />
        <div
          style={{
            flex: 1,
            background: "#ff4444",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "#aaa",
        }}
      >
        <span style={{ color: "#4488ff" }}>
          You: {Math.round(attackerWallDamage)}
        </span>
        <span style={{ color: "#ff4444" }}>
          Enemy: {Math.round(defenderWallDamage)}
        </span>
      </div>
    </div>
  );
}
