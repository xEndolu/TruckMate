import React from "react";
import styles from "../styles/PasswordRequirementsModal.module.css";

const PasswordRequirementsModal = ({ isOpen, onClose, password }) => {
  if (!isOpen) return null;

  const requirements = [
    { text: "At least 8 characters long", met: password.length >= 8 },
    { text: "Contains uppercase letters", met: /[A-Z]/.test(password) },
    { text: "Contains lowercase letters", met: /[a-z]/.test(password) },
    { text: "Contains numbers", met: /[0-9]/.test(password) },
  ];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Password Requirements</h2>
        <ul>
          {requirements.map((req, index) => (
            <li key={index} className={req.met ? styles.valid : ""}>
              {req.text}
            </li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default PasswordRequirementsModal;
