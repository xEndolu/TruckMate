import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import styles from "../styles/AdminPage.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminPage = ({ handleLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getPriorityCategory = useCallback((score) => {
    if (score < 3) return "low";
    if (score < 7) return "medium";
    return "high";
  }, []);

  const applyFiltersAndSort = useCallback(() => {
    if (!dashboardData) return;

    let filtered = dashboardData.assessments.filter((assessment) => {
      if (
        priorityFilter !== "all" &&
        getPriorityCategory(assessment.priority_score) !== priorityFilter
      )
        return false;
      if (
        urgencyFilter !== "all" &&
        (assessment.urgency_level === null ||
          assessment.urgency_level.toLowerCase() !== urgencyFilter)
      )
        return false;
      if (dateFilter !== "all") {
        const assessmentDate = new Date(assessment.assessment_date);
        const today = new Date();
        if (
          dateFilter === "week" &&
          today - assessmentDate > 7 * 24 * 60 * 60 * 1000
        )
          return false;
        if (
          dateFilter === "month" &&
          today - assessmentDate > 30 * 24 * 60 * 60 * 1000
        )
          return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.assessment_date) - new Date(b.assessment_date)
          : new Date(b.assessment_date) - new Date(a.assessment_date);
      } else if (sortBy === "priority") {
        return sortOrder === "asc"
          ? a.priority_score - b.priority_score
          : b.priority_score - a.priority_score;
      }
      return 0;
    });

    setFilteredAssessments(filtered);
  }, [
    dashboardData,
    priorityFilter,
    urgencyFilter,
    dateFilter,
    sortBy,
    sortOrder,
    getPriorityCategory,
  ]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin-dashboard/", {
        headers: { Authorization: `Token ${token}` },
      });
      setDashboardData(response.data);
      setFilteredAssessments(response.data.assessments);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to fetch dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  const onLogout = () => {
    handleLogout();
    navigate("/", { replace: true });
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!dashboardData) {
    return <div className={styles.noData}>No dashboard data available</div>;
  }

  const renderAssessmentTable = () => (
    <table className={styles.assessmentTable}>
      <thead>
        <tr>
          <th>Truck ID</th>
          <th>Date</th>
          <th>Severity Score</th>
          <th>Estimated Cost</th>
          <th>Urgency Level</th>
          <th>Priority Score</th>
        </tr>
      </thead>
      <tbody>
        {filteredAssessments.map((assessment) => (
          <tr key={assessment.id}>
            <td>{assessment.truck_id}</td>
            <td>{new Date(assessment.assessment_date).toLocaleDateString()}</td>
            <td>{assessment.severity_score?.toFixed(2) || "N/A"}</td>
            <td>₱{parseFloat(assessment.estimated_repair_cost).toFixed(2)}</td>
            <td>
              {assessment.urgency_level?.charAt(0).toUpperCase() +
                assessment.urgency_level?.slice(1) || "N/A"}
            </td>
            <td>{assessment.priority_score?.toFixed(2) || "N/A"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const priorityChartData = {
    labels: ["Low", "Medium", "High"],
    datasets: [
      {
        label: "Number of Assessments",
        data: [
          filteredAssessments.filter(
            (a) => getPriorityCategory(a.priority_score) === "low"
          ).length,
          filteredAssessments.filter(
            (a) => getPriorityCategory(a.priority_score) === "medium"
          ).length,
          filteredAssessments.filter(
            (a) => getPriorityCategory(a.priority_score) === "high"
          ).length,
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(255, 99, 132, 0.6)",
        ],
      },
    ],
  };

  return (
    <div className={styles.adminPage}>
      <h1>Truck Assessment Admin Dashboard</h1>
      <button className={styles.logoutButton} onClick={onLogout}>
        Logout
      </button>
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <h2>Total Assessments</h2>
          <p>{dashboardData.total_assessments}</p>
        </div>
        <div className={styles.summaryItem}>
          <h2>High Priority Assessments</h2>
          <p>{dashboardData.high_priority_assessments}</p>
        </div>
      </div>

      <div className={styles.filters}>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
        >
          <option value="all">All Urgencies</option>
          <option value="low">Low Urgency</option>
          <option value="medium">Medium Urgency</option>
          <option value="high">High Urgency</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="all">All Dates</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">Sort by Date</option>
          <option value="priority">Sort by Priority</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          {sortOrder === "asc" ? "↑" : "↓"}
        </button>
      </div>

      <div className={styles.chart}>
        <Bar
          data={priorityChartData}
          options={{
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Assessment Priority Distribution",
              },
            },
          }}
        />
      </div>

      {renderAssessmentTable()}
    </div>
  );
};

export default AdminPage;
