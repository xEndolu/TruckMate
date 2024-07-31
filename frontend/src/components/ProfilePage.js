import React, { useState, useEffect } from "react";
import styles from "../styles/ProfilePage.module.css";
import Navbar from "./Navbar";
import defaultProfilePic from "../assets/images/default-profile-pic.png";
import axios from "axios";
import { API_ENDPOINTS } from "../apiConfig";

const ProfilePage = ({ user, handleLogout }) => {
  const [email, setEmail] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token"); // Retrieve the token from local storage
        const response = await axios.get(API_ENDPOINTS.userProfile, {
          headers: {
            Authorization: `Token ${token}`, // Include the token in the headers with the correct prefix
          },
        });
        setEmail(response.data.email);
        setRegistrationDate(response.data.registration_date);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className={styles["profile-page"]}>
      <Navbar isLoggedIn={true} handleLogout={handleLogout} />
      <main>
        <div className={styles["profile-content"]}>
          <h1>My Profile</h1>
          <div className={styles["profile-info"]}>
            <div className={styles["profile-pic"]}>
              <img src={defaultProfilePic} alt="Profile" />
            </div>
            <div className={styles["user-details"]}>
              <h2>{user}</h2>
              <p>Email: {email}</p>
              <p>Member since: {registrationDate}</p>
            </div>
          </div>
        </div>
      </main>
      <footer className={styles.footer}>
        <p>(046) 5389115 | +63917-6505578 | +63933-8250355</p>
        <p>R+M Auto and Truck Center - YOUR SAFE JOURNEY STARTS WITH US!</p>
        <p>&copy; 2024 TruckMate. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ProfilePage;
