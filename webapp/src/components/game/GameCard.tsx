import "../../style/game/gameCard.css";
import "../../style/game/particules.css";
import { GameCardType } from "../share/sharedTypes";
import { useLanguage } from "../../language/LanguageContext";

type Props = {
    type: GameCardType;
    playerName?: string;
    waiting?: boolean;
    disabled?: boolean;
    onClick: () => void;
};

export default function GameCard({
    type,
    playerName,
    waiting = false,
    disabled = false,
    onClick
}: Props) {

	const { translate } = useLanguage();

    const getIcon = () => {
        switch(type) {
            case "ai":
                return "🤖";
            case "random":
                return "🎲";
            case "invite":
                return "👥";
            default:
                return "🎮";
        }
    };

    const getTitle = () => {
        switch(type) {
            case "ai":
                return "VS IA";
            case "random":
                return translate("game.title");
            case "invite":
                return `Challenge ${playerName}`;
            default:
                return "Play";
        }
    };

    const getSubtitle = () => {
        switch(type) {
            case "ai":
                return translate("game.ai");
            case "random":
                return translate("game.random");
            case "invite":
                return playerName ? `Joue avec ${playerName}`: "Invite un ami";
            default:
                return "";
        }
    };

    const cardClass = `game-card ${type} ${waiting ? "waiting" : ""} ${disabled ? "disabled" : ""}`;

    return (
        <div className={cardClass} onClick={disabled || waiting ? undefined : onClick}>
            <div className="card-glow"/>
            <div className="card-border">
                <div className={`game-card-inner ${type}`}>
                    <div className="particles-glow" />
                    <div className="game-card-content">
                        <div className="game-card-icon">{getIcon()}</div>
                        {playerName && type === "invite" && (
                            <div className="game-card-player-name">{playerName}</div>
                        )}
                        <div className={`game-card-banner ${type}`}>
                            <div className="game-card-title">{getTitle()}</div>
                            <div className={`game-card-${waiting ? "waiting" : "subtitle"}`}>
                                {waiting ? "En attente de confirmation...": getSubtitle()}
                            </div>
                        </div>
                    </div>
                    <div className="game-card-fx">
                        <span className="spark s1"></span>
                        <span className="spark s2"></span>
                        <span className="spark s3"></span>
                    </div>
                </div>
                <div className="game-card-reflection"></div>
            </div>
        </div>
    );
}