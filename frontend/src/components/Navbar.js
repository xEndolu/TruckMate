import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "../styles/Navbar.module.css";
import logoImage from "../assets/images/logo.png";

const Navbar = ({ isLoggedIn, handleLogout }) => {
  const location = useLocation();

  return (
    <header className={styles.navbar}>
      <div className={styles.logo}>
        <img src={logoImage} alt="Logo" />
      </div>
      <nav>
        <ul>
          <li className={location.pathname === "/home" ? styles.active : ""}>
            <Link to="/home">Home</Link>
          </li>
          <li className={location.pathname === "/about" ? styles.active : ""}>
            <Link to="/about">About Us</Link>
          </li>
          <li
            className={location.pathname === "/services" ? styles.active : ""}
          >
            <Link to="/services">Services</Link>
          </li>
          {isLoggedIn && (
            <>
              <li
                className={
                  location.pathname === "/profile" ? styles.active : ""
                }
              >
                <Link to="/profile">My Profile</Link>
              </li>
              <li>
                <button
                  className={styles["logout-button"]}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
