import { useEffect } from "react";
import "../../style/game/tournamentNotification.css";
import { useLanguage } from "../../language/LanguageContext.tsx";

type Props = {
    playerAName: string;
    playerBName: string;
    onClose: () => void;
};

export default function TournamentNotification({ playerAName, playerBName, onClose }: Props) {
    const { translate } = useLanguage();

    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&#x2715;</button>
                <h3 className="notification-title">{translate("notification.nextMatch")}</h3>
                <div className="notification-versus">
                    <span className="notification-player">{playerAName}</span>
                    <span className="notification-vs">VS.</span>
                    <span className="notification-player">{playerBName}</span>
                </div>
            </div>
        </div>
    );
}
