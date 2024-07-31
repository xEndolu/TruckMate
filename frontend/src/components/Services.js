import { useNavigate } from "react-router-dom";
import React, { useRef } from "react";
import styles from "../styles/Services.module.css";
import Navbar from "./Navbar";
import assessmentIcon from "../assets/images/assessment_icon.png";
import recommendationIcon from "../assets/images/recommendation_icon.png";

const Services = ({ isLoggedIn, user, handleLogout }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleAssessment = (event) => {
    event.preventDefault();
    const imageFile = event.target.files[0];

    if (imageFile) {
      navigate("/assessment", { state: { imageFile } });
    } else {
      console.error("No file selected");
    }
  };

  const handleStartAssessment = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={styles.servicesPage}>
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      <main>
        <div className={styles.servicesContent}>
          <h1>Our Services</h1>
          <p className={styles.subtitle}>GET YOUR RIDE CHECK WITH US!</p>
          <div className={styles.servicesGrid}>
            <div className={styles.serviceItem}>
              <img src={assessmentIcon} alt="Assessment Icon" />
              <h2>Get Assessment</h2>
              <p className={styles.serviceDescription}>
                Comprehensive vehicle assessment to ensure your truck's optimal
                performance.
              </p>
              <button
                className={styles.ctaButton}
                onClick={handleStartAssessment}
              >
                Start Assessment
              </button>
              <input
                type="file"
                accept="image/*"
                onChange={handleAssessment}
                ref={fileInputRef}
                style={{ display: "none" }}
              />
            </div>
            <div className={styles.serviceItem}>
              <img src={recommendationIcon} alt="Recommendation Icon" />
              <h2>Get Recommendation</h2>
              <p className={styles.serviceDescription}>
                Personalized recommendations based on your truck's condition and
                your needs.
              </p>
              <button
                className={styles.ctaButton}
                onClick={() => navigate("/recommendation")}
              >
                Get Recommendation
              </button>
            </div>
          </div>
        </div>
      </main>
      <footer>
        <p>(046) 5389115 | +63917-6505578 | +63933-8250355</p>
        <p>R+M Auto and Truck Center - YOUR SAFE JOURNEY STARTS WITH US!</p>
        <p>&copy; 2024 TruckMate. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Services;
