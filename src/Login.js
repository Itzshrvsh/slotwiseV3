// import React, { useState } from "react";
// import { supabase } from "./supabaseClient";
// import { useNavigate } from "react-router-dom";
// import "./AuthPage.css";
// export default function AuthPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [fullName, setFullName] = useState("");
//   const [error, setError] = useState(null);
//   const [isSignup, setIsSignup] = useState(false);
//   const navigate = useNavigate();

//   const handleSignup = async () => {
//     setError(null);

//     // 1. Create user in auth
//     const { data, error: signupError } = await supabase.auth.signUp({
//       email,
//       password,
//     });

//     if (signupError) {
//       setError(signupError.message);
//       return;
//     }

//     // 2. Insert into profiles table (default is_admin = false)
//     const userId = data?.user?.id;
//     if (userId) {
//       const { error: insertError } = await supabase.from("profiles").insert([
//         {
//           id: userId,
//           email,
//           full_name: fullName,
//           is_admin: false, // force normal user
//         },
//       ]);
//       if (insertError) {
//         setError(insertError.message);
//         return;
//       }
//     }

//     navigate("/home");
//   };

//   const handleLogin = async () => {
//     setError(null);

//     const { data, error: loginError } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (loginError) {
//       setError(loginError.message);
//       return;
//     }

//     // check user role
//     const userId = data?.user?.id;
//     if (userId) {
//       const { data: profile } = await supabase
//         .from("profiles")
//         .select("is_admin")
//         .eq("id", userId)
//         .single();

//       if (profile?.is_admin) {
//         navigate("/admin"); // you only promote people manually
//       } else {
//         navigate("/home");
//       }
//     }
//   };

//   return (
//     <div>
//       <h2>{isSignup ? "Sign Up" : "Login"}</h2>

//       {isSignup && (
//         <input
//           type="text"
//           placeholder="Full Name"
//           onChange={(e) => setFullName(e.target.value)}
//         />
//       )}

//       <input
//         type="email"
//         placeholder="Email"
//         onChange={(e) => setEmail(e.target.value)}
//       />
//       <input
//         type="password"
//         placeholder="Password"
//         onChange={(e) => setPassword(e.target.value)}
//       />

//       {isSignup ? (
//         <button onClick={handleSignup}>Sign Up</button>
//       ) : (
//         <button onClick={handleLogin}>Login</button>
//       )}

//       <p
//         style={{ cursor: "pointer", color: "blue" }}
//         onClick={() => setIsSignup(!isSignup)}
//       >
//         {isSignup
//           ? "Already have an account? Login"
//           : "Don’t have an account? Sign Up"}
//       </p>

//       {error && <p style={{ color: "red" }}>{error}</p>}
//       <div className="auth-container">
//       <div className="auth-box">
//         <h2>{isSignup ? "Sign Up" : "Login"}</h2>

//         {isSignup && (
//           <input
//             type="text"
//             placeholder="Full Name"
//             onChange={(e) => setFullName(e.target.value)}
//           />
//         )}

//         <input
//           type="email"
//           placeholder="Email"
//           onChange={(e) => setEmail(e.target.value)}
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           onChange={(e) => setPassword(e.target.value)}
//         />

//         {isSignup ? (
//           <button onClick={handleSignup}>Sign Up</button>
//         ) : (
//           <button onClick={handleLogin}>Login</button>
//         )}

//         <p onClick={() => setIsSignup(!isSignup)}>
//           {isSignup ? "Already have an account? Login" : "Don’t have an account? Sign Up"}
//         </p>

//         {error && <p className="error">{error}</p>}
//       </div>
//     </div>
//     </div>
    
//   );
// }
