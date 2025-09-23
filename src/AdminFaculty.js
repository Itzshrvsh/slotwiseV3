import React, { useEffect, useState } from "react";
import { supabase } from './supabaseClient.js';
import { useNavigate } from "react-router-dom";
import "./AdminFaculty.css";
export default function AdminFaculty() {
  const [stats, setStats] = useState({});
  const [duplicates, setDuplicates] = useState([]);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccessAndFetch = async () => {
      // Check session
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) {
        navigate("/login");
        return;
      }

      // Check role
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_adminfaculty")
        .eq("id", user.id)
        .single();

      if (!profile?.is_adminfaculty) {
        alert("You do not have access to Admin Faculty Dashboard!");
        navigate("/home");
        return;
      }

      setAuthorized(true);

      // Fetch stats
      const tables = ["students", "staffs", "classes", "subjects"];
      let tempStats = {};
      let tempDuplicates = [];

      for (let table of tables) {
        const { data } = await supabase.from(table).select("*");
        const safeData = data || []; // fallback if null
        tempStats[table] = safeData.length;

        // check duplicates
        const seen = new Set();
        const dupes = safeData.filter((item) => {
          const val =
            table === "students"
              ? item.roll_number
              : table === "staffs"
              ? item.email
              : table === "classes"
              ? item.class_name
              : item.subject_name;

          if (seen.has(val)) return true;
          seen.add(val);
          return false;
        });

        if (dupes.length > 0) tempDuplicates.push({ table, dupes });
      }

      setStats(tempStats);
      setDuplicates(tempDuplicates);
    };

    checkAccessAndFetch();
  }, [navigate]);

  if (!authorized) return <p>Checking authorization...</p>; // wait for auth/role check

  return (
    <div>
      <h2>Admin Faculty Dashboard</h2>

      <h3>Records Count</h3>
      <ul>
        {Object.keys(stats).map((table) => (
          <li key={table}>
            {table}: {stats[table]}
          </li>
        ))}
      </ul>

      <h3>Duplicates</h3>
      {duplicates.length === 0 ? (
        <p>No duplicates found.</p>
      ) : (
        duplicates.map((dup) => (
          <div key={dup.table}>
            <h4>{dup.table}</h4>
            <ul>
              {dup.dupes.map((d) => (
                <li key={d.id}>
                  {d.name || d.roll_number || d.email || d.class_name || d.subject_name || "Unknown"}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
