import React, { useState } from "react";
import { supabase } from './supabaseClient.js';
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState(null);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    setError(null);
  
    // signup using Supabase auth
    const { error: signupError, data: signupData } = await supabase.auth.signUp({ email, password });
    if (signupError) return setError(signupError.message);
  
    // fetch user id after signup
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setError("Could not get user info after signup");
  
    const roleFlags = {
      is_admin: role === "admin",
      is_faculty: role === "faculty",
      is_adminfaculty: role === "adminfaculty",
      is_student: role === "student"
    };
  
    if (role === "student") {
      // auto-insert students
      const { error: insertError } = await supabase.from("profiles").insert([{
        id: user.id,
        email,
        full_name: fullName,
        ...roleFlags
      }]);
  
      if (insertError) return setError(insertError.message);
  
      navigate("/home");
    } else {
      // insert into pending_users for approval
      const { error: pendingError } = await supabase.from("pending_users").insert([{
        id: user.id,
        email,
        full_name: fullName,
        role
      }]);
  
      if (pendingError) return setError(pendingError.message);
  
      setError("Your account is pending approval by an admin.");
    }
  };
  

  const handleLogin = async () => {
    setError(null);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) return setError(loginError.message);

    navigate("/home"); // roles will be fetched in Home.js
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isSignup ? "Sign Up" : "Login"}</h2>

        {isSignup && (
          <>
            <input type="text" placeholder="Full Name" onChange={e => setFullName(e.target.value)} />
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="adminfaculty">Admin Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </>
        )}

        <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />

        <button onClick={isSignup ? handleSignup : handleLogin}>
          {isSignup ? "Sign Up" : "Login"}
        </button>

        <p onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? "Already have an account? Login" : "Don’t have an account? Sign Up"}
        </p>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
