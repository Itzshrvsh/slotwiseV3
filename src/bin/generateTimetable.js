import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";
import { saveAs } from "file-saver"; // for CSV export
import jsPDF from "jspdf";

// Days and periods
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS_PER_DAY = 8;

export default function TimetableGenerator() {
  const [department, setDepartment] = useState("");
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [assignments, setAssignments] = useState([]); // {class_id, subject_id, teacher_id}
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch all data based on selected department
  useEffect(() => {
    const fetchData = async () => {
      if (!department) return;
      setLoading(true);
      try {
        const { data: cls } = await supabase
          .from("optimized_classes")
          .select("*")
          .eq("department", department);
        const { data: sub } = await supabase
          .from("optimized_subjects")
          .select("*")
          .eq("department", department);
        const { data: fac } = await supabase
          .from("optimized_faculty")
          .select("*")
          .eq("department", department);

        setClasses(cls || []);
        setSubjects(sub || []);
        setFaculty(fac || []);
      } catch (err) {
        console.error(err);
        setMessage("Failed to fetch data!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [department]);

  // Handle assignment changes
  const handleAssignmentChange = (clsId, subId, teacherId) => {
    const newAssignments = [...assignments];
    const index = newAssignments.findIndex(
      (a) => a.class_id === clsId && a.subject_id === subId
    );
    if (index >= 0) newAssignments[index].teacher_id = teacherId;
    else newAssignments.push({ class_id: clsId, subject_id: subId, teacher_id: teacherId });
    setAssignments(newAssignments);
  };

  // Generate timetable (simplified greedy + soft constraints)
  const generateTimetable = () => {
    const table = classes.map((cls) => ({
      class_name: cls.class_name,
      timetable: DAYS.map((day) => ({
        day,
        slots: Array(PERIODS_PER_DAY).fill({ subject: "-", faculty: "-", room: "-" }),
      })),
    }));

    // Basic conflict minimization & slot assignment
    assignments.forEach((a) => {
      const clsIndex = classes.findIndex((c) => c.id === a.class_id);
      const subject = subjects.find((s) => s.id === a.subject_id);
      const teacher = faculty.find((f) => f.id === a.teacher_id);

      // assign to first available slot (greedy)
      const clsTable = table[clsIndex];
      for (let day of clsTable.timetable) {
        for (let i = 0; i < PERIODS_PER_DAY; i++) {
          if (day.slots[i].subject === "-") {
            day.slots[i] = {
              subject: subject.subject_name,
              faculty: teacher.full_name,
              room: classes[clsIndex].room_number,
            };
            return;
          }
        }
      }
    });

    setTimetable(table);
  };

  // Export CSV
  const exportCSV = () => {
    if (!timetable.length) return;
    let csv = "Class,Day,Period,Subject,Teacher,Room\n";
    timetable.forEach((cls) => {
      cls.timetable.forEach((day) => {
        day.slots.forEach((slot, idx) => {
          csv += `${cls.class_name},${day.day},P${idx + 1},${slot.subject},${slot.faculty},${slot.room}\n`;
        });
      });
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "timetable.csv");
  };

  // Export PDF
  const exportPDF = () => {
    if (!timetable.length) return;
    const doc = new jsPDF();
    timetable.forEach((cls) => {
      doc.text(`Class: ${cls.class_name}`, 10, 10);
      let y = 20;
      cls.timetable.forEach((day) => {
        day.slots.forEach((slot, idx) => {
          doc.text(
            `${day.day} | P${idx + 1} | ${slot.subject} | ${slot.faculty} | ${slot.room}`,
            10,
            y
          );
          y += 10;
        });
      });
      doc.addPage();
    });
    doc.save("timetable.pdf");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>All-in-One Timetable Generator</h2>

      <label>Department:</label>
      <select value={department} onChange={(e) => setDepartment(e.target.value)}>
        <option value="">Select Dept</option>
        <option value="IT">IT</option>
        <option value="CSE">CSE</option>
        <option value="ECE">ECE</option>
      </select>

      <h3>Assignments (Class → Subject → Teacher)</h3>
      {classes.map((cls) => (
        <div key={cls.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
          <strong>{cls.class_name}</strong>
          {subjects.map((sub) => (
            <div key={sub.id} style={{ margin: "5px 0" }}>
              <span>{sub.subject_name}:</span>
              <select
                onChange={(e) => handleAssignmentChange(cls.id, sub.id, parseInt(e.target.value))}
                defaultValue=""
              >
                <option value="">Select Teacher</option>
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.full_name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ))}

      <button onClick={generateTimetable} style={{ marginTop: "10px" }}>
        Generate Timetable
      </button>

      {timetable.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3>Generated Timetable</h3>
          {timetable.map((cls, idx) => (
            <div key={idx} style={{ marginBottom: "20px" }}>
              <h4>{cls.class_name}</h4>
              <table border="1" cellPadding="5">
                <thead>
                  <tr>
                    <th>Day</th>
                    {[...Array(PERIODS_PER_DAY)].map((_, i) => (
                      <th key={i}>P{i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cls.timetable.map((day, i) => (
                    <tr key={i}>
                      <td>{day.day}</td>
                      {day.slots.map((s, j) => (
                        <td key={j}>
                          {s.subject}
                          <br />
                          {s.faculty}
                          <br />
                          {s.room}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <button onClick={exportCSV}>Export CSV</button>
          <button onClick={exportPDF} style={{ marginLeft: "10px" }}>
            Export PDF
          </button>
        </div>
      )}

      {loading && <p>Loading data...</p>}
      {message && <p>{message}</p>}
    </div>
  );
}
