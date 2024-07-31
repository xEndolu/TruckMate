import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/Assessment.module.css";

const Assessment = () => {
  const [assessmentData, setAssessmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!location.state || !location.state.imageFile) {
        setError("No image file provided");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("image", location.state.imageFile);

      try {
        const response = await axios.post("/assess_damage/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        console.log("Backend response:", response.data);
        setAssessmentData(response.data);
      } catch (e) {
        console.error("Error fetching assessment:", e);
        if (e.response) {
          setError(
            `Server error: ${e.response.status} - ${
              e.response.data.message || e.response.statusText
            }`
          );
        } else if (e.request) {
          setError(
            "No response received from server. Please check your internet connection."
          );
        } else {
          setError(`Error: ${e.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [location.state]);

  const formatChatbotResponse = (text) => {
    if (!text) return null;
    const sections = text.split("\n\n");

    return sections.map((section, index) => {
      if (
        section.startsWith("Overall Assessment:") ||
        section.startsWith("Explanation:")
      ) {
        return (
          <p key={index} className={styles.overall}>
            {section}
          </p>
        );
      }

      const [title, ...content] = section.split("\n");
      return (
        <div key={index} className={styles.damageSection}>
          <h3>{title}</h3>
          <ul>
            {content.map((item, itemIndex) => (
              <li key={itemIndex}>{item.replace("- ", "")}</li>
            ))}
          </ul>
        </div>
      );
    });
  };

  const ScoreScales = () => (
    <div className={styles.scoreScales}>
      <div className={styles.scaleItem}>
        <h3>Severity Score Scale</h3>
        <ul>
          <li>1-3: Minor damage</li>
          <li>4-6: Moderate damage</li>
          <li>7-8: Significant damage</li>
          <li>9-10: Critical damage</li>
        </ul>
      </div>
      <div className={styles.scaleItem}>
        <h3>Priority Score Scale</h3>
        <ul>
          <li>0-3: Low priority</li>
          <li>3-7: Medium priority</li>
          <li>7-10: High priority</li>
        </ul>
      </div>
    </div>
  );

  const formatPriorityExplanation = (explanation) => {
    const [firstPart, lastPart] = explanation.split("This score indicates");
    const formattedFirstPart = firstPart
      .replace(/: - /g, ":\n- ")
      .replace(/ - /g, "\n- ");
    return `${formattedFirstPart}\n\nThis score indicates${lastPart}`;
  };

  if (loading) return <div className={styles.loadingContainer}>Loading...</div>;
  if (error) return <div className={styles.errorContainer}>Error: {error}</div>;
  if (!assessmentData)
    return (
      <div className={styles.errorContainer}>No assessment data available</div>
    );

  return (
    <div className={styles.assessmentPage}>
      <h1 className={styles.pageTitle}>Damage Assessment</h1>
      <div className={styles.contentContainer}>
        <div className={styles.leftColumn}>
          <div className={styles.imageContainer}>
            {assessmentData && assessmentData.image && (
              <img
                src={`data:image/jpeg;base64,${assessmentData.image}`}
                alt="Assessed Damage"
                className={styles.assessmentImage}
              />
            )}
          </div>
          <div className={styles.scoreScales}>
            <ScoreScales />
          </div>
          <div className={styles.priorityExplanation}>
            <h2>Priority Score Explanation:</h2>
            <p>
              {formatPriorityExplanation(assessmentData?.priority_explanation)}
            </p>
          </div>
        </div>
        <div className={styles.rightColumn}>
          <div className={styles.detectedDamages}>
            <h2>Detected Damages:</h2>
            <ul>
              {assessmentData?.damages.map((damage, index) => (
                <li key={index}>
                  {damage.area} (Confidence: {damage.confidence})
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.chatbotResponse}>
            <h2>Chatbot Assessment</h2>
            <div className={styles.responseContent}>
              {formatChatbotResponse(assessmentData?.assessment)}
            </div>
          </div>
          <div className={styles.assessmentSummary}>
            <h2>Assessment Summary:</h2>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Severity Score:</span>
              <span className={styles.summaryValue}>
                {assessmentData?.severity_score}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>
                Estimated Repair Cost:
              </span>
              <span className={styles.summaryValue}>
                {assessmentData?.estimated_repair_cost}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Urgency Level:</span>
              <span className={styles.summaryValue}>
                {assessmentData?.urgency_level}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Priority Score:</span>
              <span className={styles.summaryValue}>
                {assessmentData?.priority_score}
              </span>
            </div>
          </div>
        </div>
      </div>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        Back to Services
      </button>
    </div>
  );
};

export default Assessment;
