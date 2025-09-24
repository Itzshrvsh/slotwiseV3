import React, { useEffect, useState } from "react";
import { supabase } from './supabaseClient.js';
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) return navigate("/login");

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        alert("You do not have access to Admin Dashboard!");
        return navigate("/home");
      }

      setAuthorized(true);

      const { data: allUsers } = await supabase.from("profiles").select("*");
      setUsers(allUsers || []);

      const { data: pendingData } = await supabase
        .from("pending_users")
        .select("*")
        .eq("approved", false);
      setPendingUsers(pendingData || []);

      setLoading(false);
    };

    checkAccess();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const approveUser = async (user) => {
    const { error: insertError } = await supabase.from("profiles").insert([{
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_admin: user.role === "admin",
      is_faculty: user.role === "faculty",
      is_adminfaculty: user.role === "adminfaculty",
      is_student: false
    }]);

    if (insertError) return alert("Error approving user: " + insertError.message);

    await supabase.from("pending_users").update({ approved: true }).eq('id', user.id);

    setPendingUsers(prev => prev.filter(u => u.id !== user.id));
    setUsers(prev => [...prev, {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_admin: user.role === "admin",
      is_faculty: user.role === "faculty",
      is_adminfaculty: user.role === "adminfaculty",
      is_student: false
    }]);
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <div className="w-full max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-cyan-400">Admin Dashboard</h2>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
          >
            Logout
          </button>
        </div>

        {loading ? (
          <p className="text-gray-300">Loading users...</p>
        ) : (
          <>
            {/* Approved Users */}
            <h3 className="text-xl font-semibold text-yellow-400 mb-2">Approved Users</h3>
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-700 text-left text-gray-100">
                  <tr>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Full Name</th>
                    <th className="px-4 py-2">Admin</th>
                    <th className="px-4 py-2">Faculty</th>
                    <th className="px-4 py-2">AdminFaculty</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.full_name}</td>
                      <td className="px-4 py-2">{user.is_admin ? "Yes" : "No"}</td>
                      <td className="px-4 py-2">{user.is_faculty ? "Yes" : "No"}</td>
                      <td className="px-4 py-2">{user.is_adminfaculty ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pending Users */}
            <h3 className="text-xl font-semibold text-pink-400 mb-2">Pending Users</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-700 text-left text-gray-100">
                  <tr>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Full Name</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Approve</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(user => (
                    <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.full_name}</td>
                      <td className="px-4 py-2">{user.role}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => approveUser(user)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
