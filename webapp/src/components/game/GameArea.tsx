import { useEffect, useRef } from "react";
import "../../style/game/gameArea.css";
import { startPong } from "../pong/main";
import { GameCardType } from "../share/sharedTypes";

type Props = {
    gameCardType: GameCardType;
    invitePlayerId?: number;
    onExit: () => void;
};

export default function GameArea({ gameCardType, invitePlayerId, onExit }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const game = startPong(canvas, gameCardType, invitePlayerId);
        if (!game) return;

        const onBlur = () => game.setPaused(true);
        const onFocus = () => game.setPaused(false);

        const onVisibilityChange = () => {
            if (document.hidden)
                game.setPaused(true);
            else
                game.setPaused(false);
        };

        window.addEventListener("blur", onBlur);
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            game?.cleanup();
            window.removeEventListener("blur", onBlur);
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, []);
    return (
        <div className="game-area">
            <div className="game-viewport">
                <canvas
                    ref={canvasRef}
                    className="pong-canvas"
                />
            </div>
            {/* <button className="game-exit-btn"
                onClick={() => {
                    const el = document.querySelector(".game-area");
                    el?.requestFullscreen();
                }}
            >
                Fullscreen
            </button> */}
            <button className="game-exit-btn" onClick={onExit}>
                Quitter la partie
            </button>
        </div>
    );
}
