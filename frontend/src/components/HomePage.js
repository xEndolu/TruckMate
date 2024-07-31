import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/HomePage.module.css";
import backgroundImage from "../assets/images/truck_home.jpg";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
import useLogout from "./Logout";
import axios from "../axiosConfig";
import Navbar from "./Navbar";
import { API_ENDPOINTS } from "../apiConfig";

const HomePage = ({ isLoggedIn, setIsLoggedIn, user, setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const handleLogout = useLogout();
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsLogin((prevState) => !prevState);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      axios
        .get(API_ENDPOINTS.user, {
          headers: { Authorization: `Token ${token}` },
        })
        .then((response) => {
          setUser({
            username: response.data.username,
            isAdmin:
              response.data.is_superuser ||
              response.data.is_staff ||
              response.data.user_type === 2,
          });
          if (
            response.data.is_superuser ||
            response.data.is_staff ||
            response.data.user_type === 2
          ) {
            navigate("/admin");
          }
        })
        .catch((error) => {
          console.log("Error fetching user data:", error);
          localStorage.removeItem("token");
          setIsLoggedIn(false);
        });
    }
  }, [setIsLoggedIn, setUser, navigate]);

  const handleGetAssessment = () => {
    navigate("/services");
  };

  return (
    <div
      className={`${styles.home_page} ${isLoggedIn ? styles.logged_in : ""}`}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      <main
        className={`${styles.main_content} ${
          isLoggedIn ? styles.logged_in_main : styles.guest_main
        }`}
      >
        {isLoggedIn ? (
          <>
            <div className={`${styles.content} ${styles.logged_in_content}`}>
              <h2>Welcome, {user.username}!</h2>
              <p>Start your safe journey with us.</p>
              <button
                className={styles.cta_button}
                onClick={handleGetAssessment}
              >
                Get Truck Assessment
              </button>
            </div>
            <div className={styles.feature_content}>
              <h2>Why Choose TruckMate?</h2>
              <ul>
                <li>Expert truck damage assessment</li>
                <li>Quick and accurate results</li>
                <li>Personalized recommendations</li>
                <li>24/7 customer support</li>
              </ul>
              <p>
                Our advanced AI-powered system ensures that you get the most
                accurate assessment for your truck. Don't wait, get started
                today!
              </p>
            </div>
          </>
        ) : (
          <>
            <div className={styles.content}>
              <h1>HIRE AN ULTIMATE TRUCKMATE</h1>
              <p>YOUR SAFE JOURNEY STARTS WITH US!</p>
            </div>
            <div
              className={`${styles.auth_box} ${
                isLogin ? styles.show_login : styles.show_signup
              }`}
            >
              <div className={`${styles.form_container} ${styles.login}`}>
                <LoginPage
                  onSignupClick={toggleForm}
                  setUser={setUser}
                  setIsLoggedIn={setIsLoggedIn}
                />
              </div>
              <div className={`${styles.form_container} ${styles.signup}`}>
                <SignUpPage onLoginClick={toggleForm} />
              </div>
            </div>
          </>
        )}
      </main>
      <footer>
        <p>(046) 5389115 | +63917-6505578 | +63933-8250355</p>
        <p>&copy; 2024 TruckMate. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;
