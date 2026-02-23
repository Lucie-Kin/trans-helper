import { useEffect, useRef } from "react";
import { startPong } from "./main";
import { GameCardType } from "../share/sharedTypes";
import { useLanguage } from "../../language/LanguageContext";

export default function PongPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { translate } = useLanguage();

  const onExit = () => {
    window.location.href = "/home";
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = startPong(
      canvasRef.current,
      GameCardType.AI,
      "Me",
      "AI",
      undefined,
      (result) => {
        console.log("Game ended: ", result);
      },
      1000,
      1000,
	  translate
    );

    return () => {
      game?.cleanup();
    };
  }, [translate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape")
        onExit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
      <canvas ref={canvasRef} width={900} height={500} />
        <button onClick={() => (window.location.href = "/home")}>
          ← Quitter le jeu
        </button>
    </div>
  );
}