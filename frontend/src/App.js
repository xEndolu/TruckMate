import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import HomePage from "./components/HomePage";
import AboutUs from "./components/AboutUs";
import Services from "./components/Services";
import ProfilePage from "./components/ProfilePage";
import Recommendation from "./components/Recommendation";
import ConfirmationPage from "./components/ConfirmationPage";
import Assessment from "./components/Assessment";
import AdminPage from "./components/AdminPage";
import useLogout from "./components/Logout";
import { API_ENDPOINTS } from "./apiConfig";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ username: "", isAdmin: false });
  const [isLoading, setIsLoading] = useState(true);
  const handleLogout = useLogout();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      console.log("Token:", token);
      if (token) {
        try {
          const response = await axios.get(API_ENDPOINTS.user, {
            headers: { Authorization: `Token ${token}` },
          });
          console.log("User data:", response.data);
          const isAdmin =
            response.data.is_superuser ||
            response.data.is_staff ||
            response.data.user_type === 2;
          setUser({
            username: response.data.username,
            isAdmin: isAdmin,
          });
          setIsLoggedIn(true);
          console.log("Is admin:", isAdmin);
        } catch (error) {
          console.error("Error fetching user data:", error);
          localStorage.removeItem("token");
          setIsLoggedIn(false);
          setUser({ username: "", isAdmin: false });
        }
      } else {
        setIsLoggedIn(false);
        setUser({ username: "", isAdmin: false });
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, []);

  console.log("Render - isLoggedIn:", isLoggedIn, "isAdmin:", user.isAdmin);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? (
              user.isAdmin ? (
                <Navigate replace to="/admin" />
              ) : (
                <Navigate replace to="/home" />
              )
            ) : (
              <Navigate replace to="/home" />
            )
          }
        />
        <Route
          path="/home"
          element={
            <HomePage
              isLoggedIn={isLoggedIn}
              setIsLoggedIn={setIsLoggedIn}
              user={user}
              setUser={setUser}
            />
          }
        />
        <Route
          path="/about"
          element={
            <AboutUs
              isLoggedIn={isLoggedIn}
              user={user.username}
              handleLogout={handleLogout}
            />
          }
        />
        <Route
          path="/services"
          element={
            <Services
              isLoggedIn={isLoggedIn}
              user={user.username}
              handleLogout={handleLogout}
            />
          }
        />
        <Route
          path="/recommendation"
          element={
            <Recommendation
              isLoggedIn={isLoggedIn}
              user={user.username}
              handleLogout={handleLogout}
            />
          }
        />
        {isLoggedIn && (
          <Route
            path="/profile"
            element={
              <ProfilePage user={user.username} handleLogout={handleLogout} />
            }
          />
        )}
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route
          path="/admin"
          element={
            isLoggedIn && user.isAdmin ? (
              <AdminPage handleLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/"
          element={
            isLoggedIn ? (
              user.isAdmin ? (
                <Navigate replace to="/admin" />
              ) : (
                <Navigate replace to="/home" />
              )
            ) : (
              <HomePage
                isLoggedIn={isLoggedIn}
                setIsLoggedIn={setIsLoggedIn}
                user={user}
                setUser={setUser}
              />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
