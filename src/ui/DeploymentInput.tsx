import { useState } from "react";
import { useGameStore } from "../state/gameStore";
import type { CardId, Lane, Vec2 } from "../simulation/types";

export interface DeployEvent {
  cardId: CardId;
  lane: Lane;
  position: Vec2; // tile position: x = 0-170, y = 0
}

interface Props {
  onDeploy?: (event: DeployEvent) => void;
}

function getLaneFromY(clientY: number, containerHeight: number): Lane {
  const ratio = clientY / containerHeight;
  if (ratio < 0.333) return "upper";
  if (ratio < 0.666) return "center";
  return "lower";
}

function getXFromClientX(clientX: number, containerWidth: number): number {
  const ratio = clientX / containerWidth;
  return Math.round(ratio * 170);
}

export function DeploymentInput({ onDeploy }: Props) {
  const activeCardId = useGameStore((s) => s.activeCardId);
  const setActiveCard = useGameStore((s) => s.setActiveCard);
  const [isDragOver, setIsDragOver] = useState(false);

  const isActive = activeCardId !== null || isDragOver;

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!activeCardId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const relX = e.clientX - rect.left;
    const lane = getLaneFromY(relY, rect.height);
    const x = getXFromClientX(relX, rect.width);
    onDeploy?.({ cardId: activeCardId, lane, position: { x, y: 0 } });
    setActiveCard(null);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const rawId = e.dataTransfer.getData("cardId");
    if (!rawId) return;
    const cardId = rawId as unknown as CardId;
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const relX = e.clientX - rect.left;
    const lane = getLaneFromY(relY, rect.height);
    const x = getXFromClientX(relX, rect.width);
    onDeploy?.({ cardId, lane, position: { x, y: 0 } });
    setActiveCard(null);
  }

  const laneLabels: { lane: Lane; label: string }[] = [
    { lane: "upper", label: "UPPER" },
    { lane: "center", label: "CENTER" },
    { lane: "lower", label: "LOWER" },
  ];

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: isActive ? "auto" : "none",
        display: "flex",
        flexDirection: "column",
        cursor: activeCardId ? "crosshair" : "default",
      }}
    >
      {isActive &&
        laneLabels.map(({ lane, label }) => (
          <div
            key={lane}
            style={{
              flex: 1,
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              pointerEvents: "none",
            }}
          >
            {/* Left half — FRONT deployment */}
            <div
              style={{
                flex: 1,
                backgroundColor: "rgba(255,180,60,0.07)",
                borderRight: "1px dashed rgba(255,180,60,0.3)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <span style={{
                color: "rgba(255,180,60,0.7)",
                fontFamily: "monospace",
                fontSize: 10,
                letterSpacing: 2,
              }}>
                FRONT
              </span>
              <span style={{
                color: "rgba(255,255,255,0.3)",
                fontFamily: "monospace",
                fontSize: 9,
                letterSpacing: 1,
              }}>
                {label}
              </span>
            </div>
            {/* Right half — RESERVE deployment */}
            <div
              style={{
                flex: 1,
                backgroundColor: "rgba(100,180,255,0.05)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <span style={{
                color: "rgba(100,180,255,0.6)",
                fontFamily: "monospace",
                fontSize: 10,
                letterSpacing: 2,
              }}>
                RESERVE
              </span>
              <span style={{
                color: "rgba(255,255,255,0.3)",
                fontFamily: "monospace",
                fontSize: 9,
                letterSpacing: 1,
              }}>
                {label}
              </span>
            </div>
          </div>
        ))}
    </div>
  );
}
