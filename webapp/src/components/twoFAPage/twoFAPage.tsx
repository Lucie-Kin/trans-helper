// components/twoFAPage/twoFAPage.tsx
/**

 * 
 * This component handles three modes:
 * 1. "setup" - 2FA activation (shows QR code for scanning)
 * 2. "disable" - 2FA deactivation (requires code for confirmation)
 * 3. "login" - 2FA verification on login (requires code after login via 42)
 * 
 * Mode is determined by URL parameters: ?setup or ?disable, otherwise "login" by default
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../style/twoFAPage/twoFAPage.css";

export default function TwoFAPage() {
  // Hook for programmatic navigation between pages
  const navigate = useNavigate();
  
  // Hook for getting URL parameters (e.g., ?setup, ?disable)
  const [searchParams] = useSearchParams();
  
  // State for storing user-entered 6-digit code
  const [code, setCode] = useState("");
  
  // State for displaying errors (e.g., "invalid code")
  const [error, setError] = useState<string | null>(null);
  
  // Loading state - shows if code is currently being sent to server
  const [loading, setLoading] = useState(false);
  
  // State for storing QR code (used only in "setup" mode)
  // QR code comes from server and is saved in sessionStorage
  const [qr, setQr] = useState<string | null>(null);
  
  // Access check state - while true, show loading screen
  // Needed to check if user has permission to be on this page
  const [checkingAccess, setCheckingAccess] = useState(true);
  
  /**
   * Determine page mode based on URL parameters:
   * - If ?setup parameter exists → "setup" mode (2FA activation)
   * - If ?disable parameter exists → "disable" mode (2FA deactivation)
   * - Otherwise → "login" mode (2FA verification on login)
   */
  const mode = searchParams.get("setup") ? "setup" : searchParams.get("disable") ? "disable" : "login";

  /**
   * useEffect - runs on component mount and when mode or navigate changes
   * 
   * Main task: check if user has permission to be on this page
   * in current mode. This is protection against direct URL access without necessary conditions.
   */
  useEffect(() => {
    /**
     * Async function to check page access
     * Checks different conditions depending on mode
     */
    const checkAccess = async () => {
      // ========== "SETUP" MODE (2FA Activation) ==========
      if (mode === "setup") {
        /**
         * In 2FA activation mode, we need to check:
         * 1. Is there a QR code in sessionStorage (should have been saved when navigating to this page)
         * 2. Is the correct mode saved in sessionStorage
         * 3. Is the user authorized (is there a valid session)
         */
        
        // Get QR code from browser's temporary storage
        // sessionStorage stores data only within current tab
        const storedQr = sessionStorage.getItem("2fa_qr");
        const storedMode = sessionStorage.getItem("2fa_mode");
        
        // If no QR code or mode doesn't match - user accessed this page directly via URL
        // This is not allowed, redirect to home page
        if (!storedQr || storedMode !== "setup") {
          navigate("/home");
          return;
        }
        
        /**
         * Additional check: ensure user is authorized
         * Send request to /auth/session with cookies (credentials: 'include')
         * Server will verify JWT token from cookies and return user data
         */
        try {
          const res = await fetch('https://localhost:8443/auth/session', {
            credentials: 'include', // Send cookies with request
          });
          
          // If request failed (401, 403, etc.) - user is not authorized
          if (!res.ok) {
            navigate("/home");
            return;
          }
        } catch (err) {
          // If network error occurred - also redirect to home
          navigate("/home");
          return;
        }
        
        // All checks passed - set QR code in component state
        setQr(storedQr);
      } 
      // ========== "DISABLE" MODE (2FA Deactivation) ==========
      else if (mode === "disable") {
        /**
         * In 2FA deactivation mode, we need to check:
         * 1. Is the correct mode saved in sessionStorage (should be "disable")
         * 2. Is the user authorized
         * 3. Is 2FA enabled for the user (can't deactivate what's not activated)
         */
        
        // Check that mode is saved correctly (protection against direct URL access)
        const storedMode = sessionStorage.getItem("2fa_mode");
        if (storedMode !== "disable") {
          navigate("/home");
          return;
        }
        
        /**
         * Check user status:
         * - Is user authorized
         * - Is 2FA enabled (if not enabled - why deactivate?)
         */
        try {
          const res = await fetch('https://localhost:8443/auth/session', {
            credentials: 'include',
          });
          
          if (res.ok) {
            const { user } = await res.json();
            
            // If user doesn't have 2FA enabled - they shouldn't be on this page
            if (!user.is2faEnabled) {
              navigate("/home");
              return;
            }
          } else {
            // User is not authorized
            navigate("/home");
            return;
          }
        } catch (err) {
          // Network error
          navigate("/home");
          return;
        }
      } 
      // ========== "LOGIN" MODE (2FA Verification on Login) ==========
      else {
        /**
         * In 2FA login mode, we need to check:
         * 1. Is the user authorized (is there a session)
         * 2. Is 2FA enabled for them (is2faEnabled === true)
         * 3. Hasn't they passed 2FA verification yet (twofaPassed === false)
         * 
         * If twofaPassed === true, user has already passed verification and shouldn't be here
         */
        try {
          const res = await fetch('https://localhost:8443/auth/session', {
            credentials: 'include',
          });
          
          if (res.ok) {
            const { user } = await res.json();
            
            /**
             * Conditions under which user should NOT be on this page:
             * 1. They don't have 2FA enabled (is2faEnabled === false)
             * 2. They already passed 2FA verification (twofaPassed === true)
             * 
             * In these cases, redirect to home page
             */
            if (!user.is2faEnabled || user.twofaPassed) {
              navigate("/home");
              return;
            }
          } else {
            // User is not authorized
            navigate("/home");
            return;
          }
        } catch (err) {
          // Network error
          navigate("/home");
          return;
        }
      }
      
      // All checks passed successfully - hide loading screen and show form
      setCheckingAccess(false);
    };

    // Call access check function on component mount
    checkAccess();
  }, [mode, navigate]); // Dependencies: restart effect when mode or navigate changes

  /**
   * Handler for form submission with 2FA code
   * Called when user clicks "Verify" or "Deactivate" button
   */
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default form behavior (page reload)
    e.preventDefault();
    
    // Clear previous errors and enable loading state
    setError(null);
    setLoading(true);

    try {
      /**
       * Select correct endpoint based on mode:
       * - "setup" and "login" → /auth/2fa/verify (code verification)
       * - "disable" → /auth/2fa/disable (2FA deactivation)
       */
      let endpoint = "https://localhost:8443/auth/2fa/verify";
      
      if (mode === "disable") {
        endpoint = "https://localhost:8443/auth/2fa/disable";
      }

      /**
       * Send POST request to server with user's code
       * credentials: "include" - send cookies (JWT token)
       */
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include", // Important: send cookies for authentication
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }), // Send 6-digit code
      });

      // If server returned error (invalid code, expired, etc.)
      if (!res.ok) {
        const data = await res.json();
        // Show error to user (e.g., "invalid code")
        setError(data.error || "Code invalide");
        // Clear code input field
        setCode("");
        // Disable loading state
        setLoading(false);
        return;
      }

      /**
       * Code verification successful!
       * Clear temporary data from sessionStorage:
       * - QR code (no longer needed)
       * - Mode (task completed)
       */
      sessionStorage.removeItem("2fa_qr");
      sessionStorage.removeItem("2fa_mode");

      // Redirect user to home page
      navigate("/home");
    } catch (err) {
      // If network error occurred (no internet, server unavailable, etc.)
      setError("Erreur de connexion");
      setLoading(false);
    }
  };

  /**
   * Helper function to get page title based on mode
   * Returns text in French for display to user
   */
  const getTitle = () => {
    if (mode === "setup") return "Activation de l'authentification à deux facteurs";
    if (mode === "disable") return "Désactivation de l'authentification à deux facteurs";
    return "Vérification en deux étapes";
  };

  /**
   * Helper function to get action description based on mode
   * Explains to user what they need to do
   */
  const getDescription = () => {
    if (mode === "setup") {
      return "Scannez le QR code avec votre application d'authentification, puis entrez le code à 6 chiffres";
    }
    if (mode === "disable") {
      return "Entrez le code à 6 chiffres généré par votre application d'authentification pour désactiver 2FA";
    }
    return "Entrez le code à 6 chiffres généré par votre application d'authentification";
  };

  /**
   * Helper function to get button text based on mode and loading state
   * Shows "Vérification..." or "Désactivation..." during loading
   */
  const getButtonText = () => {
    if (loading) {
      if (mode === "disable") return "Désactivation...";
      return "Vérification...";
    }
    if (mode === "disable") return "Désactiver";
    return "Vérifier";
  };

  /**
   * Handler for close button click (X in top right corner)
   * Clears temporary data and returns user to home page
   */
  const handleClose = () => {
    // Clear temporary data from sessionStorage
    sessionStorage.removeItem("2fa_qr");
    sessionStorage.removeItem("2fa_mode");
    // Return to home page
    navigate("/home");
  };

  /**
   * Conditional rendering: while access check is in progress, show loading screen
   * This prevents content flickering and shows user that something is happening
   */
  if (checkingAccess) {
    return (
      <div className="twofa-page">
        <div className="twofa-container">
          <p>Vérification de l'accès...</p>
        </div>
      </div>
    );
  }

  /**
   * Main component render - form for entering 2FA code
   */
  return (
    <div className="twofa-page">
      <div className="twofa-container">
        {/* Close button (X) in top right corner */}
        <button className="twofa-close-btn" onClick={handleClose} type="button">
          ✕
        </button>
        
        {/* Dynamic title based on mode */}
        <h2>{getTitle()}</h2>
        
        {/* Dynamic action description */}
        <p className="twofa-description">
          {getDescription()}
        </p>

        {/* 
          QR code is shown ONLY in "setup" mode (2FA activation)
          In "login" and "disable" modes, QR code is not needed as account is already configured
        */}
        {mode === "setup" && qr && (
          <img src={qr} className="twofa-qr" alt="QR Code 2FA" />
        )}

        {/* Form for entering 6-digit code */}
        <form onSubmit={handleSubmit} className="twofa-form">
          <input
            type="text"
            className="twofa-input"
            placeholder="000000"
            value={code}
            onChange={(e) => {
              /**
               * Input field change handler:
               * 1. Remove all non-digit characters (/\D/g - regex for "not a digit")
               * 2. Limit length to 6 characters (.slice(0, 6))
               * 3. Save value to state
               * 4. Clear errors on input (so user can correct)
               */
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(value);
              setError(null);
            }}
            maxLength={6} // Maximum length - 6 characters
            autoFocus // Automatically focus field on page load
            disabled={loading} // Block input during request
          />

          {/* Show error if it exists */}
          {error && <p className="twofa-error">{error}</p>}

          {/* 
            Form submit button
            disabled if:
            - Code is incomplete (less than 6 digits)
            - Loading is in progress (to prevent duplicate requests)
            
            "danger" class is added in "disable" mode for visual emphasis
            (deactivation is a dangerous action)
          */}
          <button
            type="submit"
            className={`twofa-button ${mode === "disable" ? "danger" : ""}`}
            disabled={code.length !== 6 || loading}
          >
            {getButtonText()}
          </button>
        </form>
      </div>
    </div>
  );
}

