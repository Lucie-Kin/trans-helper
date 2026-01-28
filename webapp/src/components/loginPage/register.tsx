import "../../style/loginPage/loginpage.css";
import { Link } from "react-router-dom";
import { IoMailOutline } from "react-icons/io5";
import { IoLockClosedOutline } from "react-icons/io5";
import { IoPersonOutline } from "react-icons/io5";


export default function inscriptionPage() {
  return (
    <div> <h1>Transcendance</h1>
    <div className="container">
      <div className="wrapper">
        <section className="login">
          <h2>Inscription</h2>
          <form>
            <div className="inputbox">
                <IoPersonOutline size={20} />
              <input type="text" id="text" placeholder=" " required/>
              <label htmlFor="text"> Nom</label>
            </div>
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
            <div className="login">
            <button> S'inscrire </button>
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