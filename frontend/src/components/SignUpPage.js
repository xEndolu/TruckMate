import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axiosConfig";
import styles from "../styles/SignUpPage.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import PasswordRequirementsModal from "./PasswordRequirementsModal";
import { API_ENDPOINTS } from "../apiConfig";

const SignUpPage = ({ onLoginClick }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid()) {
      setIsModalOpen(true);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const response = await axios.post(
        API_ENDPOINTS.register,
        {
          username,
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 201) {
        setSuccess(response.data.message);
        setError("");
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        navigate("/confirmation");
      } else {
        setError("Sign-up failed. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        setError(
          error.response.data.message || "An error occurred. Please try again."
        );
      } else {
        console.error("Error message:", error.message);
        setError("An error occurred. Please try again.");
      }
      setSuccess("");
    }
  };

  const isPasswordValid = () => {
    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const numberRegex = /[0-9]/;
    const minLengthRegex = /.{8,}/;

    return (
      uppercaseRegex.test(password) &&
      lowercaseRegex.test(password) &&
      numberRegex.test(password) &&
      minLengthRegex.test(password)
    );
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="container">
      <div className={styles["signup-form"]}>
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          {error && (
            <p className={`${styles.message} ${styles.error}`}>{error}</p>
          )}
          {success && (
            <p className={`${styles.message} ${styles.success}`}>{success}</p>
          )}
          <div className={styles["user-box"]}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label>Username</label>
          </div>
          <div className={styles["user-box"]}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Email</label>
          </div>
          <div className={styles["user-box"]}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>Password</label>
            <span
              className={styles["toggle-password"]}
              onClick={toggleShowPassword}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <div className={styles["user-box"]}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <label>Confirm Password</label>
            <span
              className={styles["toggle-password"]}
              onClick={toggleShowConfirmPassword}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <button type="submit">Sign Up</button>
        </form>
        <div className={styles["login-link"]}>
          Already have an account?{" "}
          <button onClick={onLoginClick}>Sign in</button>
        </div>
      </div>
      <PasswordRequirementsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        password={password}
      />
    </div>
  );
};

export default SignUpPage;
