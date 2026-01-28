import "../../style/loginPage/loginpage.css";
import { Link } from "react-router-dom";
import Login from './login/Login'
import { IoMailOutline } from "react-icons/io5";
import { IoLockClosedOutline } from "react-icons/io5";


export default function loginPage() {
  return (
    <div> <h1>Transcendance</h1>
    <div className="container">
      <div className="wrapper">
        <section className="login">
          <h2>Connexion</h2>
            <Login/> <br></br>
          <form>
            <div className="inputbox">
                <IoMailOutline size={20} />
              <input type="email" id="email" placeholder=" " required/>
              <label htmlFor="email"> Email</label>
            </div>
            <div className="inputbox">
                <IoLockClosedOutline size={20} />
              <input type="password" id="password" placeholder=" " required  />
              <label htmlFor="password"> Mot de passe</label>
            </div>
            <br></br>

            <button type="submit">Connexion</button>
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
