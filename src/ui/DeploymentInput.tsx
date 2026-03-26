import { useGameStore } from "../state/gameStore";
import { getCardDefinition } from "../simulation/army";
import type { CardId, Lane, Vec2 } from "../simulation/types";

export interface DeployEvent {
  cardId: CardId;
  lane: Lane;
  position: Vec2; // tile position: x = 0-170, y = 0
}

interface Props {
  onDeploy: (event: DeployEvent) => void;
}

const DEPLOY_ZONE_MAX_X = 0.55; // left 55% is player deploy territory
const CARD_HAND_MIN_Y = 0.82;   // Y above 82% is battlefield (below is card hand)

const CATEGORY_COLORS: Record<string, string> = {
  infantry: "#44dd44",
  ranged:   "#4488ff",
  cavalry:  "#ffcc00",
  siege:    "#ff6622",
  support:  "#cc44ff",
};

function getLane(normY: number): Lane {
  if (normY < 0.333) return "upper";
  if (normY < 0.666) return "center";
  return "lower";
}

export function DeploymentInput({ onDeploy }: Props) {
  const dragState = useGameStore((s) => s.dragState);
  const setDragState = useGameStore((s) => s.setDragState);

  // Only render while a card is being dragged
  if (!dragState) return null;

  // Capture non-null reference for use in closures (TypeScript narrowing)
  const ds = dragState;

  const normX = ds.screenX / window.innerWidth;
  const normY = ds.screenY / window.innerHeight;
  const isInDeployZone = normX <= DEPLOY_ZONE_MAX_X && normY < CARD_HAND_MIN_Y;
  const currentLane = getLane(normY);

  const card = getCardDefinition(ds.cardId);
  const ghostColor = card ? (CATEGORY_COLORS[card.category] ?? "#ffffff") : "#ffffff";

  function handleMouseMove(e: React.MouseEvent) {
    setDragState({ cardId: ds.cardId, screenX: e.clientX, screenY: e.clientY });
  }

  function handleMouseUp(e: React.MouseEvent) {
    const { cardId } = ds;
    setDragState(null);
    const nx = e.clientX / window.innerWidth;
    const ny = e.clientY / window.innerHeight;
    if (nx <= DEPLOY_ZONE_MAX_X && ny < CARD_HAND_MIN_Y) {
      onDeploy({ cardId, lane: getLane(ny), position: { x: Math.round(nx * 170), y: 0 } });
    }
  }

  const laneZones = [
    { key: "upper",  top: "0%",     height: "33.33%" },
    { key: "center", top: "33.33%", height: "33.34%" },
    { key: "lower",  top: "66.67%", height: "33.33%" },
  ] as const;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "auto",
        cursor: isInDeployZone ? "crosshair" : "no-drop",
        zIndex: 50,
      }}
    >
      {/* Player deploy zone: left 55% — blue tint */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "55%",
          height: "100%",
          backgroundColor: "rgba(60,120,255,0.10)",
          borderRight: "2px solid rgba(60,120,255,0.50)",
          pointerEvents: "none",
        }}
      />

      {/* Enemy territory: right 45% — red tint */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "45%",
          height: "100%",
          backgroundColor: "rgba(255,50,50,0.07)",
          pointerEvents: "none",
        }}
      />

      {/* Lane dividers (full width) */}
      {["33.33%", "66.67%"].map((y) => (
        <div
          key={y}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: y,
            height: 1,
            backgroundColor: "rgba(255,255,255,0.12)",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Active lane highlight in deploy zone */}
      {isInDeployZone &&
        laneZones.map(({ key, top, height }) =>
          key === currentLane ? (
            <div
              key={key}
              style={{
                position: "absolute",
                left: 0,
                top,
                width: "55%",
                height,
                backgroundColor: `${ghostColor}1a`,
                borderBottom: key !== "lower" ? `1px solid ${ghostColor}30` : undefined,
                pointerEvents: "none",
              }}
            />
          ) : null
        )}

      {/* Ghost circle at finger/cursor position */}
      {isInDeployZone && (
        <div
          style={{
            position: "absolute",
            left: ds.screenX - 50,
            top: ds.screenY - 50,
            width: 100,
            height: 100,
            borderRadius: "50%",
            backgroundColor: `${ghostColor}22`,
            border: `2px solid ${ghostColor}99`,
            boxShadow: `0 0 18px ${ghostColor}55`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* "ENEMY ZONE" label when cursor is on right side */}
      {!isInDeployZone && normX > DEPLOY_ZONE_MAX_X && normY < CARD_HAND_MIN_Y && (
        <div
          style={{
            position: "absolute",
            left: ds.screenX - 44,
            top: ds.screenY - 18,
            color: "rgba(255,80,80,0.85)",
            fontFamily: "monospace",
            fontSize: 11,
            fontWeight: "bold",
            letterSpacing: 2,
            pointerEvents: "none",
            textShadow: "0 1px 4px #000",
            whiteSpace: "nowrap",
          }}
        >
          ENEMY ZONE
        </div>
      )}
    </div>
  );
}
