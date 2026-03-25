import { useGameStore } from "../state/gameStore";
import { getCardDefinition } from "../simulation/army";
import type { CardId } from "../simulation/types";

export function CardHand() {
  const hand = useGameStore((s) => s.hand);
  const nextCard = useGameStore((s) => s.nextCard);
  const elixir = useGameStore((s) => s.elixir);
  const activeCardId = useGameStore((s) => s.activeCardId);
  const setActiveCard = useGameStore((s) => s.setActiveCard);

  const visibleCards = hand.slice(0, 4);

  function handleCardClick(cardId: CardId) {
    const card = getCardDefinition(cardId);
    if (!card) return;
    if (card.cost > elixir) return;
    // Toggle: if already active, clear it; otherwise set it
    setActiveCard(activeCardId === cardId ? null : cardId);
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, cardId: CardId) {
    const card = getCardDefinition(cardId);
    if (!card || card.cost > elixir) {
      e.preventDefault();
      return;
    }
    setActiveCard(cardId);
    e.dataTransfer.setData("cardId", cardId as string);
    e.dataTransfer.effectAllowed = "move";
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
          const isActive = activeCardId === cardId;

          return (
            <div
              key={`${cardId as string}-${_idx}`}
              draggable={affordable}
              onClick={() => handleCardClick(cardId)}
              onDragStart={(e) => handleDragStart(e, cardId)}
              style={{
                width: 72,
                height: 96,
                backgroundColor: isActive ? "#5566aa" : "#223355",
                border: isActive
                  ? "2px solid #aabbff"
                  : "2px solid rgba(255,255,255,0.3)",
                borderRadius: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                cursor: affordable ? "pointer" : "not-allowed",
                opacity: affordable ? 1 : 0.4,
                color: "#fff",
                fontFamily: "monospace",
                fontSize: 11,
                padding: 4,
                boxSizing: "border-box",
                transition: "border-color 0.15s, background-color 0.15s",
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
    </div>
  );
}
