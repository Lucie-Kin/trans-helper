import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../style/loginPage/loginpage.css";
//import { Link } from "react-router-dom";
import Login from './login/Login'
import { IoMailOutline } from "react-icons/io5";
import { IoLockClosedOutline } from "react-icons/io5";

export default function loginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("https://localhost:8443/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          login,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login error");
        setLoading(false);
        return;
      }

      // Successful login - check if 2FA is needed
      if (data.user?.is2faEnabled && !data.user?.twofaPassed) {
        navigate("/2fa");
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError("Connection error");
      setLoading(false);
    }
  };

  return (
    <div> <h1>Transcendance</h1>
    <div className="container">
      <div className="wrapper">
        <section className="login">
          <h2>Connexion</h2>
            <Login/> <br></br>
            
            <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ color: "#ff4444", marginBottom: "1rem", fontSize: "0.9rem" }}>
                {error}
              </div>
            )}

            <div className="inputbox">
                <IoMailOutline size={20} />
                <input 
                type="text" 
                id="login" 
                placeholder=" " 
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
              />
              <label htmlFor="login">Login or Email</label>
            </div>
            <div className="inputbox">
                <IoLockClosedOutline size={20} />
                <input 
                type="password" 
                id="password" 
                placeholder=" " 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label htmlFor="password">Mot de passe</label>
            </div>
            <br></br>

            <button type="submit" disabled={loading}>
              {loading ? "Connexion..." : "Connexion"}
            </button>
            <div className="register">
            <br></br>
              <span>Pas de compte ? </span>
               <Link to="/register" className="switch-to-register">
                S'inscrire
               </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
    </div>
  );
}
