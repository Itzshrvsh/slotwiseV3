import React, { useEffect, useState } from "react";
import { supabase } from '../supabaseClient.js';
import jsPDF from "jspdf";
// import "./Timetable.css";

export default function TimetablePage({ selectedDept, year, section }) {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const { data: classesData } = await supabase
          .from("optimized_classes")
          .select("*")
          .eq("department", selectedDept);
        const { data: subjectsData } = await supabase
          .from("optimized_subjects")
          .select("*");
        const { data: facultyData } = await supabase
          .from("optimized_faculty")
          .select("*");

        const classes = classesData || [];
        const subjects = subjectsData || [];
        const faculty = facultyData || [];

        if (!classes.length || !subjects.length || !faculty.length) {
          setError("No data found. Import CSV first!");
          setLoading(false);
          return;
        }

        // generate skeleton timetable
        const skeleton = classes.map(cls => ({
          class_name: cls.class_name,
          periodsPerDay: 8,
          timetable: [
            { day: "Monday", slots: Array(8).fill({ subject: "-", faculty: "-", room: "-" }) },
            { day: "Tuesday", slots: Array(8).fill({ subject: "-", faculty: "-", room: "-" }) },
            { day: "Wednesday", slots: Array(8).fill({ subject: "-", faculty: "-", room: "-" }) },
            { day: "Thursday", slots: Array(8).fill({ subject: "-", faculty: "-", room: "-" }) },
            { day: "Friday", slots: Array(8).fill({ subject: "-", faculty: "-", room: "-" }) },
          ]
        }));

        setTimetable(skeleton);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch timetable.");
      } finally {
        setLoading(false);
      }
    };

    if (selectedDept) fetchData();
  }, [selectedDept, year, section]);

  const handleExportPDF = () => {
    if (!timetable.length) return;
    const doc = new jsPDF();
    timetable.forEach(cls => {
      doc.text(`Class: ${cls.class_name}`, 10, 10);
      let y = 20;
      cls.timetable.forEach(day => {
        day.slots.forEach(slot => {
          doc.text(`${day.day} | ${slot.subject} | ${slot.faculty} | ${slot.room}`, 10, y);
          y += 10;
        });
      });
      doc.addPage();
    });
    doc.save("timetable.pdf");
  };

  if (loading) return <p>Loading timetable...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!timetable.length) return <p>No timetable available.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Timetable - Dept: {selectedDept}</h2>
      {timetable.map((cls, idx) => (
        <div key={idx} style={{ marginBottom: "30px" }}>
          <h3>Class: {cls.class_name}</h3>
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Day</th>
                {[...Array(cls.periodsPerDay)].map((_, i) => (
                  <th key={i}>P{i+1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cls.timetable.map((day, i) => (
                <tr key={i}>
                  <td>{day.day}</td>
                  {day.slots.map((s, j) => (
                    <td key={j}>{s.subject}<br/>{s.faculty}<br/>{s.room}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <button onClick={handleExportPDF}>Export PDF</button>
    </div>
  );
}
