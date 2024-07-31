import React, { useState } from "react";
import styles from "../styles/Recommendation.module.css";
import Navbar from "./Navbar";
import axios from "../axiosConfig";
import { API_ENDPOINTS } from "../apiConfig";

const Recommendation = ({ isLoggedIn, user, handleLogout }) => {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.chatbot, {
        message: input,
        chat_history: chatHistory,
      });

      setChatHistory(response.data.chat_history);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["recommendation-page"]}>
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      <main>
        <div className={styles["recommendation-content"]}>
          <h1>AI Truck Recommendation</h1>
          <p className={styles.subtitle}>
            Get personalized recommendations for your truck!
          </p>
          <div className={styles["chat-container"]}>
            <div className={styles["chat-messages"]}>
              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`${styles.message} ${styles[message.role]}`}
                >
                  {message.content}
                </div>
              ))}
              {isLoading && (
                <div className={`${styles.message} ${styles.assistant}`}>
                  Thinking...
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit} className={styles["chat-input-form"]}>
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about your truck..."
                className={styles["chat-input"]}
              />
              <button
                type="submit"
                className={styles["chat-submit"]}
                disabled={isLoading}
              >
                Send
              </button>
            </form>
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

export default Recommendation;
