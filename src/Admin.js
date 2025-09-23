import React, { useEffect, useState } from "react";
import { supabase } from './supabaseClient.js';
import { useNavigate } from "react-router-dom";
import "./Admin.css";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch role
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        alert("You do not have access to Admin Dashboard!");
        navigate("/home");
        return;
      }

      setAuthorized(true);

      // Fetch all users
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) {
        console.log(error);
      } else {
        setUsers(data);
      }
      setLoading(false);
    };

    checkAccess();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!authorized) return null; // wait for auth check

  return (
    <div className="admin-container">
      <div className="admin-box">
        <h2>Admin Dashboard</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Full Name</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.full_name}</td>
                  <td>{user.is_admin ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
