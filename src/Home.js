import React, { useEffect, useState } from "react";
import { supabase } from './supabaseClient.js';
import { useNavigate } from "react-router-dom";
import './Home.css';
export default function Home() {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return navigate("/login");

      const userInfo = sessionData.session.user;
      setUser(userInfo);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, is_faculty, is_adminfaculty, is_student")
        .eq("id", userInfo.id)
        .single();

      if (profile) setRoles(profile);
    }

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleRoleNavigation = (path) => {
    navigate(path);
  };

  // Only admin access
  const isAdmin = roles.is_admin || roles.is_adminfaculty;

  return (
    <div className="home-container" style={{ padding: "20px", textAlign: "center" }}>
      <h2>Home Page</h2>
      {user && <p>Welcome, {user.email}</p>}

      {!isAdmin && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          You are not an admin.
        </p>
      )}

      {isAdmin && (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
          <button 
            onClick={handleLogout} 
            style={{ background: "#e74c3c", color: "#fff" }}
          >
            Logout
          </button>
          <button 
            onClick={() => handleRoleNavigation("/admin")} 
            style={{ background: "#3498db", color: "#fff" }}
          >
            Admin Dashboard
          </button>
          <button 
            onClick={() => handleRoleNavigation("/admin-faculty")} 
            style={{ background: "#2ecc71", color: "#fff" }}
          >
            Admin Faculty
          </button>
          <button 
            onClick={() => handleRoleNavigation("/faculty")} 
            style={{ background: "#c9cc2eff", color: "#fff" }}
          >
            Faculty
          </button>
        </div>
      )}
    </div>
  );
}
