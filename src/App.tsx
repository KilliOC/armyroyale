import { useEffect, useRef } from "react";
import { initRenderer, disposeRenderer } from "./rendering/renderer";
import { HUD } from "./ui/HUD";

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    initRenderer(canvas);
    return () => disposeRenderer();
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      <HUD />
    </>
  );
}
