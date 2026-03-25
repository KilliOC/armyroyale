import { useGameStore } from "../state/gameStore";

export function HUD() {
  const phase = useGameStore((s) => s.phase);
  const hudVisible = useGameStore((s) => s.hudVisible);

  if (!hudVisible) return null;

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
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "14px",
          background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)",
        }}
      >
        <span>ARMY ROYALE</span>
        <span>Phase: {phase.toUpperCase()}</span>
      </div>
    </div>
  );
}
