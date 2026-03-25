import { useEffect, useRef, useState } from "react";
import { initRenderer, disposeRenderer } from "./rendering/renderer";
import { initOrchestrator, disposeOrchestrator, handlePlayerDeploy, startMatch, getDebugSnapshot } from "./game/orchestrator";
import { useGameStore } from "./state/gameStore";
import { HUD } from "./ui/HUD";
import { CardHand } from "./ui/CardHand";
import { DeploymentInput } from "./ui/DeploymentInput";
import { ResultScreen } from "./ui/ResultScreen";
import { DebugPanel } from "./ui/DebugPanel";

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const [debugSnapshot, setDebugSnapshot] = useState<ReturnType<typeof getDebugSnapshot>>(null);

  // Update debug snapshot periodically
  useEffect(() => {
    const id = setInterval(() => {
      setDebugSnapshot(getDebugSnapshot());
    }, 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    initRenderer(canvas);
    initOrchestrator();
    return () => {
      disposeOrchestrator();
      disposeRenderer();
    };
  }, []);

  // Restart match when transitioning from results → lobby
  useEffect(() => {
    if (phase === "lobby") {
      // Reset store active card on phase change
      useGameStore.getState().setActiveCard(null);
    }
  }, [phase]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />

      {/* Always-visible HUD overlay */}
      <HUD />

      {/* Lobby: big BATTLE! button */}
      {phase === "lobby" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <button
            onClick={() => startMatch()}
            style={{
              pointerEvents: "auto",
              padding: "20px 72px",
              fontSize: "28px",
              fontFamily: "monospace",
              fontWeight: "bold",
              letterSpacing: "0.15em",
              background: "linear-gradient(135deg, #cc3300, #ff6622)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow: "0 6px 32px rgba(200,60,0,0.6)",
              transition: "transform 0.1s, box-shadow 0.1s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }}
          >
            BATTLE!
          </button>
        </div>
      )}

      {/* Deployment + battle: card hand and deployment zones */}
      {(phase === "deploying" || phase === "battle") && (
        <>
          <DeploymentInput onDeploy={handlePlayerDeploy} />
          <CardHand />
        </>
      )}

      {/* Results overlay */}
      <ResultScreen />

      {/* Debug panel (backtick toggle) */}
      <DebugPanel snapshot={debugSnapshot ?? undefined} />
    </>
  );
}
