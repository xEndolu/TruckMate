import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/LoginPage.module.css";
import axios from "../axiosConfig";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { API_ENDPOINTS } from "../apiConfig";

const LoginPage = ({ onSignupClick, setUser, setIsLoggedIn }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Attempting login...");
      const loginResponse = await axios.post(API_ENDPOINTS.login, {
        username,
        password,
      });
      const token = loginResponse.data.token;
      console.log("Login successful, token received:", token);
      localStorage.setItem("token", token);

      console.log("Fetching user data...");
      const userResponse = await axios.get(API_ENDPOINTS.user, {
        headers: { Authorization: `Token ${token}` },
      });

      console.log("Complete server response:", userResponse);
      const userData = userResponse.data;
      console.log("Complete user data received:", userData);

      const isAdmin =
        userData.is_superuser || userData.is_staff || userData.user_type === 2;
      console.log("Is admin:", isAdmin);

      setUser({
        username: userData.username,
        isAdmin: isAdmin,
      });
      setIsLoggedIn(true);

      if (isAdmin) {
        console.log("Redirecting to admin page");
        navigate("/admin");
      } else {
        console.log("Redirecting to home page");
        navigate("/home");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid username or password.");
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.login_box}>
      <h2>Login</h2>
      {error && <p className={`${styles.message} ${styles.error}`}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className={styles.user_box}>
          <input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <label>Username</label>
        </div>
        <div className={`${styles.user_box} ${styles.password_group}`}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label>Password</label>
          <button
            type="button"
            className={styles.toggle_password}
            onClick={toggleShowPassword}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        <button type="submit">Sign In</button>
      </form>
      <div className={styles.signup_link}>
        Don't have an account? <button onClick={onSignupClick}>Sign up</button>
      </div>
    </div>
  );
};

export default LoginPage;
