import { useEffect, useRef } from "react";
import "../../style/game/gameArea.css";
import { startPong } from "../pong/main";
import type { MatchResult } from "../pong/main";
import { GameCardType } from "../share/sharedTypes";

type Props = {
    gameCardType: GameCardType;
    player1Name?: string;
    player2Name?: string; 
    invitePlayerId?: number;
    onExit: () => void;
    onGameEnd?: (result: MatchResult) => void;
};

export default function GameArea({
    gameCardType,
    player1Name = "Player 1",
    player2Name = "Player 2",
    invitePlayerId,
    onExit,
    onGameEnd,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const game = startPong(canvas, gameCardType, player1Name, player2Name, invitePlayerId, onGameEnd);
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
