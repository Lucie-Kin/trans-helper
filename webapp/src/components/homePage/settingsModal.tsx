import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/chat/profileModal.css";
import { useLanguage, type Language } from "../../language/LanguageContext.tsx";

type User = {
  id: number;
  login: string;
  email: string;
  image?: string;
  displayName?: string;
  is2faEnabled: boolean;
};

export default function SettingsModal({
  user,
  onClose,
  refreshUser,
}: {
  user: User;
  onClose: () => void;
  refreshUser: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || user.login || "");
  const [savingName, setSavingName] = useState(false);
  const { translate } = useLanguage();

  // Update displayName when user.displayName changes
  useEffect(() => {
    setDisplayName(user.displayName || user.login || "");
  }, [user.displayName, user.login]);

  // Enable 2FA

  const enable2FA = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("https://localhost:8443/auth/2fa/setup", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'activation");
        setLoading(false);
        return;
      }

      // Save QR code to sessionStorage and redirect to 2FA page
      sessionStorage.setItem("2fa_qr", data.qr);
      sessionStorage.setItem("2fa_mode", "setup");
      onClose(); // Close modal window
      navigate("/2fa?setup=true");
    } catch (err) {
      setError("Erreur de connexion");
      setLoading(false);
    }
  };

  // Disable 2FA - redirect to 2FA page
  const disable2FA = () => {
    sessionStorage.setItem("2fa_mode", "disable");
    onClose(); // Close modal window
    navigate("/2fa?disable=true");
  };


  // avatar by default
  const setDefaultAvatar = async (imageUrl: string) => {
    setError(null);
    setUploading(true);

    try {
      const res = await fetch("https://localhost:8443/auth/avatar/default", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }), // imageUrl = "/auth/avatars/default1.png"
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erreur lors du changement d'avatar");
        return;
      }

      await refreshUser();
    } catch {
      setError("Erreur de connexion");
    } finally {
      setUploading(false);
    }
  };

  // default avatar upload
  const uploadAvatar = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("https://localhost:8443/auth/avatar", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erreur lors du téléchargement");
        return;
      }

      await refreshUser();
    } catch {
      setError("Erreur de connexion");
    } finally {
      setUploading(false);
    }
  };


  // display name function
  const saveDisplayName = async () => {
    setError(null);

    if (displayName.length < 3 || displayName.length > 20) {
      setError("Le nom doit contenir entre 3 et 20 caractères");
      return;
    }

    setSavingName(true);

    try {
      const res = await fetch("https://localhost:8443/auth/profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "display_name_taken") {
          setError("Ce nom est déjà pris");
        } else if (data.error === "invalid_characters") {
          setError("Seuls les lettres, chiffres et _ sont autorisés");
        } else {
          setError(data.error || "Impossible de mettre à jour le nom");
        }
        setSavingName(false);
        return;
      }
      // replacing window.location.reload();
      // do not refresh whole page, only the info == dynamic data
      await refreshUser();
      setSavingName(false);
    } catch (err) {
      setError("Erreur de connexion");
      setSavingName(false);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{translate("settings.title")}</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        {/* ===== AVATAR SECTION ===== */}
        <div className="avatar-section">
          <img
            src={user.image || "../../../avatar.png"}
            className="current-avatar"
            alt="Avatar actuel"
          />

          <div className="avatar-choices">
            <img
              src="/avatars/default1.png"
              className="avatar-choice"
              onClick={() => setDefaultAvatar("/avatars/default1.png")}
              alt="Avatar par défaut 1"
            />

            <img
              src="/avatars/default2.png"
              className="avatar-choice"
              onClick={() => setDefaultAvatar("/avatars/default2.png")}
              alt="Avatar par défaut 2"
            />

            <label className="avatar-choice upload">
              +
              <input
                type="file"
                accept="image/png,image/jpeg"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAvatar(f);
                }}
                disabled={uploading}
              />

            </label>
          </div>
        </div>

        {/* ===== DISPLAY NAME ===== */}
        <div className="display-name-section">
          <label>{translate("settings.subtitle")} ({translate("settings.current")}: {user.displayName || user.login})</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
            placeholder={displayName ? "" : "Nom d'affichage (3-20 caractères)"}
            disabled={savingName || uploading}
          />
          <button
            className={`settings-btn register`}
            onClick={saveDisplayName}
            disabled={savingName || uploading || displayName.length < 3}
          >
            {savingName ? translate("settings.registering") : translate("settings.register")}
          </button>
        </div>

        {/* ===== ENABLE 2FA ===== */}
        {!user.is2faEnabled && (
          <button
            className={`settings-btn active2fa`}
            onClick={enable2FA}
            disabled={loading || uploading}
          >
            {loading ? translate("settings.loading") : translate("settings.twofa")}
          </button>
        )}

        {/* ===== DISABLE 2FA ===== */}
        {user.is2faEnabled && (
          <button
            className="settings-btn danger"
            onClick={disable2FA}
            disabled={uploading}
          >
            Désactiver 2FA
          </button>
        )}

        {error && <p className="error-text">{error}</p>}

      </div>
    </div>
  );
}
