import { useEffect } from "react";
import { useGameStore } from "../state/gameStore";

const KEYFRAMES = `
  @keyframes announceDefault {
    0%   { opacity: 0; transform: scale(0.85); }
    20%  { opacity: 1; transform: scale(1.04); }
    70%  { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.96); }
  }
  @keyframes announceBattle {
    0%   { opacity: 0; transform: scale(0.5); }
    25%  { opacity: 1; transform: scale(1.18); }
    45%  { opacity: 1; transform: scale(1); }
    75%  { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.08); }
  }
  @keyframes announcePulse {
    0%   { opacity: 0; transform: scale(0.9); }
    18%  { opacity: 1; transform: scale(1.1); }
    36%  { opacity: 1; transform: scale(0.96); }
    54%  { opacity: 1; transform: scale(1.06); }
    72%  { opacity: 1; transform: scale(1); }
    100% { opacity: 0; }
  }
  @keyframes announceShake {
    0%   { opacity: 0; transform: translateX(0); }
    10%  { opacity: 1; transform: translateX(-10px); }
    20%  { transform: translateX(10px); }
    30%  { transform: translateX(-10px); }
    40%  { transform: translateX(10px); }
    52%  { transform: translateX(-5px); }
    62%  { transform: translateX(5px); }
    72%  { transform: translateX(0); }
    88%  { opacity: 1; }
    100% { opacity: 0; }
  }
`;

function getStyle(announcement: string): { color: string; animationName: string } {
  if (announcement.includes("BATTLE!")) {
    return { color: "#ffd700", animationName: "announceBattle" };
  }
  if (announcement.includes("SURGE")) {
    return { color: "#ff8800", animationName: "announcePulse" };
  }
  if (announcement.includes("SUDDEN")) {
    return { color: "#ff3333", animationName: "announceShake" };
  }
  return { color: "#ffffff", animationName: "announceDefault" };
}

export function PhaseAnnouncement() {
  const announcement = useGameStore((s) => s.announcement);

  useEffect(() => {
    const styleId = "phase-announcement-keyframes";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  if (!announcement) return null;

  const { color, animationName } = getStyle(announcement);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 150,
      }}
    >
      {/* key forces remount → restarts animation on each new announcement */}
      <div
        key={announcement}
        style={{
          fontSize: 52,
          fontFamily: "monospace",
          fontWeight: "bold",
          color,
          textShadow: `0 0 30px ${color}88, 0 2px 10px #000`,
          letterSpacing: "0.08em",
          textAlign: "center",
          animation: `${animationName} 1.5s ease-in-out forwards`,
          whiteSpace: "nowrap",
        }}
      >
        {announcement}
      </div>
    </div>
  );
}
