import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/ConfirmationPage.module.css";
import { API_ENDPOINTS } from "../apiConfig";

const ConfirmationPage = () => {
  const [otp, setOTP] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        API_ENDPOINTS.verifyOtp,
        {
          otp,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        navigate("/home");
      } else {
        setError("Invalid OTP. Please try again.");
        console.error("OTP verification failed:", response.data);
      }
    } catch (error) {
      console.error("Error during OTP verification:", error.response.data);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className={styles.confirmation_container}>
      <div className={styles.confirmation_box}>
        <h2>Email Confirmation</h2>
        <p>
          Thank you for signing up! A confirmation email has been sent to your
          email address. Please check your inbox and enter the OTP below to
          verify your account.
        </p>
        <form onSubmit={handleSubmit}>
          {error && <p className={styles.error_message}>{error}</p>}
          <div className={styles.otp_box}>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOTP(e.target.value)}
              required
            />
            <label>Enter OTP</label>
          </div>
          <button type="submit">Verify OTP</button>
        </form>
        <p>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ConfirmationPage;
