import { useEffect, useRef, useState } from "react";
import { TUNING, resetTuning, TUNING_KEYS } from "../simulation/tuning";
import type { TuningValues } from "../simulation/tuning";

// ─── Types ────────────────────────────────────────────────────────────

interface DebugSnapshot {
  fps: number;
  tick: number;
  frontLine: Record<string, number>;
  unitCounts: Record<string, number>;
}

interface DebugPanelProps {
  /** Live snapshot data passed from game loop */
  snapshot?: DebugSnapshot;
}

// ─── Debug Panel ──────────────────────────────────────────────────────

/**
 * Runtime debug overlay for Army Royale.
 *
 * Toggle with backtick (`) key.
 *
 * Shows:
 *  - FPS counter
 *  - Front line positions per lane
 *  - Unit counts per side
 *  - Editable tuning values
 */
export function DebugPanel({ snapshot }: DebugPanelProps) {
  const [visible, setVisible] = useState(false);
  const [tuning, setTuning] = useState<TuningValues>({ ...TUNING });
  const [editKey, setEditKey] = useState<keyof TuningValues | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle with backtick
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "`" || e.key === "~") {
        setVisible((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (editKey && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editKey]);

  if (!visible) return null;

  function commitEdit(key: keyof TuningValues, raw: string) {
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      (TUNING as unknown as Record<string, number>)[key as string] = num;
      setTuning({ ...TUNING });
    }
    setEditKey(null);
  }

  function handleReset() {
    resetTuning();
    setTuning({ ...TUNING });
  }

  const fps = snapshot?.fps ?? 0;
  const tick = snapshot?.tick ?? 0;

  return (
    <div
      style={{
        position: "absolute",
        top: "48px",
        right: "8px",
        width: "300px",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "rgba(0,0,0,0.85)",
        color: "#00ff88",
        fontFamily: "monospace",
        fontSize: "11px",
        borderRadius: "6px",
        border: "1px solid rgba(0,255,136,0.3)",
        padding: "10px",
        zIndex: 200,
        pointerEvents: "auto",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "8px",
          paddingBottom: "6px",
          borderBottom: "1px solid rgba(0,255,136,0.2)",
        }}
      >
        <span style={{ fontWeight: "bold", fontSize: "12px" }}>
          DEBUG [` to hide]
        </span>
        <button
          onClick={handleReset}
          style={{
            background: "rgba(255,100,0,0.3)",
            color: "#ff8844",
            border: "1px solid rgba(255,100,0,0.4)",
            borderRadius: "3px",
            fontSize: "10px",
            cursor: "pointer",
            padding: "1px 6px",
            fontFamily: "monospace",
          }}
        >
          RESET
        </button>
      </div>

      {/* Live stats */}
      <Section label="LIVE">
        <Row label="FPS" value={fps.toFixed(1)} color="#88ffcc" />
        <Row label="Tick" value={String(tick)} color="#88ffcc" />
        {snapshot?.frontLine &&
          Object.entries(snapshot.frontLine).map(([lane, pos]) => (
            <Row
              key={lane}
              label={`FL ${lane}`}
              value={pos.toFixed(3)}
              color={pos > 0.7 ? "#ff8844" : "#88ffcc"}
            />
          ))}
        {snapshot?.unitCounts &&
          Object.entries(snapshot.unitCounts).map(([side, count]) => (
            <Row
              key={side}
              label={`Units ${side}`}
              value={String(count)}
              color="#88ffcc"
            />
          ))}
      </Section>

      {/* Tuning values */}
      <Section label="TUNING">
        {TUNING_KEYS.map((key) => {
          const isEditing = editKey === key;
          return (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1px 0",
                borderBottom: "1px solid rgba(0,255,136,0.05)",
              }}
            >
              <span style={{ color: "#66bbaa", flex: 1 }}>{key}</span>
              {isEditing ? (
                <input
                  ref={inputRef}
                  defaultValue={String(tuning[key])}
                  style={{
                    width: "80px",
                    background: "#002211",
                    color: "#00ff88",
                    border: "1px solid #00ff88",
                    borderRadius: "2px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    padding: "1px 4px",
                    textAlign: "right",
                  }}
                  onBlur={(e) => commitEdit(key, e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit(key, e.currentTarget.value);
                    if (e.key === "Escape") setEditKey(null);
                  }}
                />
              ) : (
                <span
                  onClick={() => setEditKey(key)}
                  style={{
                    color: "#00ff88",
                    cursor: "pointer",
                    padding: "1px 4px",
                    borderRadius: "2px",
                    background: "rgba(0,255,136,0.05)",
                    minWidth: "80px",
                    textAlign: "right",
                  }}
                >
                  {tuning[key]}
                </span>
              )}
            </div>
          );
        })}
      </Section>
    </div>
  );
}

// ─── Helper sub-components ─────────────────────────────────────────────

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div
        style={{
          color: "#aaffdd",
          fontSize: "10px",
          letterSpacing: "0.1em",
          marginBottom: "4px",
          opacity: 0.7,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  color = "#00ff88",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "1px 0",
      }}
    >
      <span style={{ color: "#66bbaa" }}>{label}</span>
      <span style={{ color }}>{value}</span>
    </div>
  );
}
