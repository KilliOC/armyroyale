import { useGameStore } from "../state/gameStore";
import { getCardDefinition } from "../simulation/army";
import type { CardId, Lane } from "../simulation/types";
import type { DeployEvent } from "./DeploymentInput";

interface Props {
  onDeploy: (event: DeployEvent) => void;
}

const DEPLOY_ZONE_MAX_X = 0.55;
const CARD_HAND_MIN_Y = 0.82;

function getDeployLane(normY: number): Lane {
  if (normY < 0.333) return "upper";
  if (normY < 0.666) return "center";
  return "lower";
}

export function CardHand({ onDeploy }: Props) {
  const hand = useGameStore((s) => s.hand);
  const nextCard = useGameStore((s) => s.nextCard);
  const elixir = useGameStore((s) => s.elixir);
  const dragState = useGameStore((s) => s.dragState);
  const setDragState = useGameStore((s) => s.setDragState);

  const visibleCards = hand.slice(0, 4);

  function startDrag(cardId: CardId, screenX: number, screenY: number) {
    const card = getCardDefinition(cardId);
    if (!card || card.cost > elixir) return;
    setDragState({ cardId, screenX, screenY });
  }

  function endDrag(screenX: number, screenY: number) {
    if (!dragState) return;
    const { cardId } = dragState;
    setDragState(null);
    const normX = screenX / window.innerWidth;
    const normY = screenY / window.innerHeight;
    if (normX <= DEPLOY_ZONE_MAX_X && normY < CARD_HAND_MIN_Y) {
      onDeploy({
        cardId,
        lane: getDeployLane(normY),
        position: { x: Math.round(normX * 170), y: 0 },
      });
    }
  }

  function handleMouseDown(e: React.MouseEvent, cardId: CardId) {
    e.preventDefault();
    startDrag(cardId, e.clientX, e.clientY);
  }

  function handleTouchStart(e: React.TouchEvent, cardId: CardId) {
    e.preventDefault(); // Prevent synthetic mouse events on touch devices
    const touch = e.touches[0];
    startDrag(cardId, touch.clientX, touch.clientY);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!dragState) return;
    const touch = e.touches[0];
    setDragState({ ...dragState, screenX: touch.clientX, screenY: touch.clientY });
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const touch = e.changedTouches[0];
    endDrag(touch.clientX, touch.clientY);
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        pointerEvents: "auto",
        userSelect: "none",
        zIndex: 60,
      }}
    >
      {/* Elixir display */}
      <div
        style={{
          color: "#cc88ff",
          fontFamily: "monospace",
          fontSize: 14,
          fontWeight: "bold",
          letterSpacing: 2,
        }}
      >
        ELIXIR: {elixir.toFixed(1)}
      </div>

      {/* Card row */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        {visibleCards.map((cardId, _idx) => {
          const card = getCardDefinition(cardId);
          const affordable = card ? card.cost <= elixir : false;
          const isDragging = dragState?.cardId === cardId;

          return (
            <div
              key={`${cardId as string}-${_idx}`}
              onMouseDown={(e) => handleMouseDown(e, cardId)}
              onTouchStart={(e) => handleTouchStart(e, cardId)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                width: 72,
                height: 96,
                backgroundColor: "#223355",
                border: "2px solid rgba(255,255,255,0.3)",
                borderRadius: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                cursor: affordable ? "grab" : "not-allowed",
                opacity: isDragging ? 0.25 : affordable ? 1 : 0.4,
                color: "#fff",
                fontFamily: "monospace",
                fontSize: 11,
                padding: 4,
                boxSizing: "border-box",
                transition: "opacity 0.1s",
              }}
            >
              {card ? (
                <>
                  <div
                    style={{
                      fontSize: 10,
                      textAlign: "center",
                      fontWeight: "bold",
                      lineHeight: 1.2,
                    }}
                  >
                    {card.name.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      color: "#cc88ff",
                      fontWeight: "bold",
                    }}
                  >
                    {card.cost}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 10, opacity: 0.5 }}>???</div>
              )}
            </div>
          );
        })}

        {/* Next card preview */}
        {nextCard && (
          <div
            style={{
              width: 56,
              height: 72,
              backgroundColor: "#111a22",
              border: "2px dashed rgba(255,255,255,0.2)",
              borderRadius: 6,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              opacity: 0.6,
              color: "#aaa",
              fontFamily: "monospace",
              fontSize: 9,
              padding: 4,
              boxSizing: "border-box",
            }}
          >
            {(() => {
              const card = getCardDefinition(nextCard);
              return card ? (
                <>
                  <div style={{ fontSize: 8, textAlign: "center" }}>NEXT</div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {card.name.toUpperCase()}
                  </div>
                  <div style={{ color: "#cc88ff" }}>{card.cost}</div>
                </>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Floating ghost card follows finger/cursor during drag */}
      {dragState && hand.includes(dragState.cardId) && (() => {
        const card = getCardDefinition(dragState.cardId);
        if (!card) return null;
        return (
          <div
            style={{
              position: "fixed",
              left: dragState.screenX - 36,
              top: dragState.screenY - 52,
              width: 72,
              height: 96,
              backgroundColor: "#223355cc",
              border: "2px solid rgba(100,180,255,0.85)",
              borderRadius: 6,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              color: "#fff",
              fontFamily: "monospace",
              fontSize: 11,
              padding: 4,
              boxSizing: "border-box",
              pointerEvents: "none",
              zIndex: 200,
              opacity: 0.92,
              boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                textAlign: "center",
                fontWeight: "bold",
                lineHeight: 1.2,
              }}
            >
              {card.name.toUpperCase()}
            </div>
            <div style={{ fontSize: 18, color: "#cc88ff", fontWeight: "bold" }}>
              {card.cost}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
