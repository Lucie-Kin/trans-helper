// webapp/src/pong/PongPage.tsx
import { useEffect, useRef } from "react";

import { startPong } from "./main";

export default function PongPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // startPong retourne une fonction de cleanup (
    const stop = startPong(canvasRef.current);

    return () => {
      if (typeof stop === "function") stop();
    };
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
      <canvas ref={canvasRef} width={900} height={500} />
    </div>
  );
}
