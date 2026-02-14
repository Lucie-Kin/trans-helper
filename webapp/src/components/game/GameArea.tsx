import { useEffect, useRef } from "react";
import "../../style/game/gameArea.css";
import { startPong } from "../pong/main";
import type { MatchResult } from "../pong/main";
import { GameCardType } from "../share/sharedTypes";
import { useLanguage } from "../../language/LanguageContext.tsx";

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
	const { translate } = useLanguage();

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        let game: ReturnType<typeof startPong>;
        let cancelled = false;

        const init = async () => {
            await document.fonts.ready;
            if (cancelled) return;

            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;

            game = startPong(canvas, gameCardType, player1Name, player2Name, invitePlayerId, onGameEnd, 1000, 1000, translate);
        };

        const onBlur = () => game?.setPaused(true);
        const onFocus = () => game?.setPaused(false);
        const onVisibilityChange = () => {
            if (document.hidden)
                game?.setPaused(true);
            else
                game?.setPaused(false);

        };

        window.addEventListener("blur", onBlur);
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisibilityChange);

        init();

        return () => {
            cancelled = true;
            game?.cleanup();
            window.removeEventListener("blur", onBlur);
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
	}, [gameCardType, player1Name, player2Name, invitePlayerId, onGameEnd, translate]);
    return (
        <div className="game-area">
            <div className="game-viewport">
                <canvas
                    ref={canvasRef}
                    className="pong-canvas"
                />
            </div>
            <button className="game-exit-btn" onClick={onExit}>
                {translate("game.quit")}
            </button>
        </div>
    );
}
