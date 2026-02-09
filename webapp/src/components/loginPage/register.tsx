import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../style/loginPage/loginpage.css";
//import { Link } from "react-router-dom";
import { IoMailOutline } from "react-icons/io5";
import { IoLockClosedOutline } from "react-icons/io5";
import { IoPersonOutline } from "react-icons/io5";


export default function inscriptionPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("https://localhost:8443/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          login,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration error");
        setLoading(false);
        return;
      }

      // Successful registration - redirect to login page
      navigate("/");
    } catch (err) {
      setError("Connection error");
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Transcendance</h1>
      <div className="container">
        <div className="wrapper">
          <section className="login">
            <h2>Inscription</h2>
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ color: "#ff4444", marginBottom: "1rem", fontSize: "0.9rem" }}>
                  {error}
                </div>
              )}

              <div className="inputbox">
                <IoPersonOutline size={20} />
             
                <input
                  type="text"
                  id="login"
                  placeholder=" "
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                />
                <label htmlFor="login">Login</label>
              </div>

              <div className="inputbox">

                <IoMailOutline size={20} />
              
                <input
                  type="email"
                  id="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label htmlFor="email">Email</label>
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
                  minLength={6}
                />
                <label htmlFor="password">Mot de passe</label>
              </div>

              <div className="login">
                <button type="submit" disabled={loading}>
                  {loading ? "Registering..." : "S'inscrire"}
                </button>
                <br></br> <br></br>
                <span>Déjà un compte ? </span>
                <Link to="/" className="switch-to-login">
                  Se connecter
                </Link>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}