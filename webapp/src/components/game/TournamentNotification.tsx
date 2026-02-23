import { useEffect } from "react";
import "../../style/game/tournamentNotification.css";
import { useLanguage } from "../../language/LanguageContext";

type Props = {
    playerAName: string;
    playerBName: string;
    onClose: () => void;
};

export default function tournamentNotification({ playerAName, playerBName, onClose }: Props) {
    const { translate } = useLanguage();

    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>
                <h3 className="notification-title">{translate("tournament.notification")}</h3>
                <div className="notification-versus">
                    <span className="notification-player">{playerAName}</span>
                    <span className="notification-vs"> VS </span>
                    <span className="notification-player">{playerBName}</span>
                </div>
            </div>
        </div>
    );
}