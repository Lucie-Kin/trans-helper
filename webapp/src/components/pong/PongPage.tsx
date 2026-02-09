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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.location.href = "/home";
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);


  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
      <canvas ref={canvasRef} width={900} height={500} />
      <button onClick={() => (window.location.href = "/home")}>← Quitter le jeu</button>
    </div>
  );
}
