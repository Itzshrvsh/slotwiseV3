import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient.js";
import './Faculty.css';

export default function Faculty() {
  const [department, setDepartment] = useState("");
  const [classDepartments, setClassDepartments] = useState([]);
  const [year, setYear] = useState("1");

  const [teacherFile, setTeacherFile] = useState(null);
  const [subjectFile, setSubjectFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchClassDepartments();
  }, []);

  const fetchClassDepartments = async () => {
    const { data, error } = await supabase.from("classes").select("department", { distinct: true });
    if (error) return console.error(error);
    setClassDepartments(data.map(d => d.department));
  };

  // ---------------- CSV Upload ----------------
  const uploadCSV = async (file, table, mapRow) => {
    if (!file) return setMessage(`⚠️ Select a ${table} CSV file first!`);
    const text = await file.text();
    const rows = text.split("\n").slice(1).map(line => mapRow(line.split(",").map(v => v.trim())));
    for (let row of rows) {
      const { error } = await supabase.from(table).insert([row]);
      if (error) console.log("Insert error:", row, error.message);
    }
    setMessage(`✅ ${table} uploaded successfully!`);
  };

  const handleUploadTeachers = () => uploadCSV(teacherFile, "staffs", values => ({
    full_name: values[1], designation: values[2], department: values[3], email: values[4]
  }));

  const handleUploadSubjects = () => uploadCSV(subjectFile, "subjects", values => ({
    year: values[0], subject_name: values[1], department: values[2]
  }));

  // ---------------- Helper ----------------
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // ---------------- Timetable Generation ----------------
  const generateTimetable = async () => {
    if (!department || !year) {
      alert("Select department and year first!");
      return;
    }

    const { data: subjects, error: subError } = await supabase
      .from("subjects").select("*").eq("department", department).eq("year", parseInt(year));
    const { data: teachers, error: teachError } = await supabase
      .from("staffs").select("*").eq("department", department);

    if (subError || !subjects?.length || teachError || !teachers?.length) {
      return alert("Subjects or teachers not found for this selection!");
    }

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const periods = 8;
    const sections = ["A","B"]; // Can expand later

    // Initialize timetable, teacher availability, and section queues
    const timetable = {};
    const lastSubjectSection = {};
    const sectionTeacherQueue = {};
    const subjectPools = {};
    sections.forEach(s => {
      timetable[s] = Array.from({ length: days.length }, () => ({ periods: Array(periods).fill(null) }));
      lastSubjectSection[s] = Array(periods).fill(null);
      sectionTeacherQueue[s] = shuffleArray([...teachers]);
      const totalSlots = days.length * periods;
      const slotsPerSubject = Math.ceil(totalSlots / subjects.length);
      let pool = subjects.flatMap(sub => Array(slotsPerSubject).fill(sub));
      subjectPools[s] = shuffleArray(pool);
    });

    // Track which teacher is busy for a specific period (dayIndex, periodIndex)
    const teacherAvailability = Array.from({ length: days.length }, () => Array.from({ length: periods }, () => new Set()));

    // Main assignment loop
    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      for (let periodIndex = 0; periodIndex < periods; periodIndex++) {
        for (const section of sections) {

          const lastSubject = periodIndex > 0 ? lastSubjectSection[section][periodIndex-1] : null;
          let assigned = false;

          for (let i = 0; i < subjectPools[section].length; i++) {
            const sub = subjectPools[section][i];
            if (sub.subject_name === lastSubject) continue;

            // Pick available teacher from section queue
            let teacherIndex = -1;
            let teacherAssigned = null;
            for (let j = 0; j < sectionTeacherQueue[section].length; j++) {
              const t = sectionTeacherQueue[section][j];
              if (!teacherAvailability[dayIndex][periodIndex].has(t.id)) {
                teacherAssigned = t;
                teacherIndex = j;
                break;
              }
            }

            if (teacherAssigned) {
              timetable[section][dayIndex].periods[periodIndex] = {
                subject_name: sub.subject_name,
                teacher_name: teacherAssigned.full_name
              };

              teacherAvailability[dayIndex][periodIndex].add(teacherAssigned.id);
              lastSubjectSection[section][periodIndex] = sub.subject_name;

              // Rotate teacher to end of queue
              sectionTeacherQueue[section].push(sectionTeacherQueue[section].splice(teacherIndex,1)[0]);

              // Remove subject from pool
              subjectPools[section].splice(i,1);
              assigned = true;
              break;
            }
          }

          if (!assigned) {
            timetable[section][dayIndex].periods[periodIndex] = {
              subject_name: "--- FREE ---",
              teacher_name: "Unassigned"
            };
          }
        }
      }
    }

    displayTimetable(timetable, days, periods, sections);
  };

  const displayTimetable = (timetable, days, periods, sections) => {
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
      <html>
      <head>
        <title>Generated Timetable (${department} - Year ${year})</title>
        <style>
          body{font-family:Arial;padding:20px;background:#f9f9f9;}
          table{border-collapse:collapse;width:100%;margin-bottom:30px;box-shadow:0 2px 8px rgba(0,0,0,0.1);}
          th,td{border:1px solid #ddd;padding:10px;text-align:center;}
          th{background:#007bff;color:white;}
          td{background:#fff;} td span{font-size:0.8em;color:#555;display:block;margin-top:4px;}
          h1,h2{color:#333;}
          .free-period{color:#999;font-style:italic;}
        </style>
      </head>
      <body>
        <h1>Generated Timetable</h1>
        <p><b>Department:</b> ${department} | <b>Year:</b> ${year}</p>
      </body>
      </html>
    `);

    const body = newWindow.document.body;
    sections.forEach(section => {
      const h2 = document.createElement("h2"); h2.innerText = `Section ${section}`;
      body.appendChild(h2);

      const table = document.createElement("table");
      const thead = document.createElement("thead");
      const trHead = document.createElement("tr");
      trHead.innerHTML = `<th>Day</th>` + [...Array(periods)].map((_,i)=>`<th>Period ${i+1}</th>`).join("");
      thead.appendChild(trHead); table.appendChild(thead);

      const tbody = document.createElement("tbody");
      days.forEach((day, dayIndex) => {
        const tr = document.createElement("tr");
        let rowHtml = `<td><b>${day}</b></td>`;
        timetable[section][dayIndex].periods.forEach(p => {
          if (p.subject_name !== "--- FREE ---") {
            rowHtml += `<td>${p.subject_name}<span>${p.teacher_name}</span></td>`;
          } else {
            rowHtml += `<td><span class="free-period">--- FREE ---</span></td>`;
          }
        });
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      body.appendChild(table);
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Faculty & Timetable Management</h2>

      <h3>Upload Teachers CSV</h3>
      <input type="file" accept=".csv" onChange={e => setTeacherFile(e.target.files[0])}/>
      <button onClick={handleUploadTeachers}>Upload Teachers</button>

      <h3>Upload Subjects CSV</h3>
      <input type="file" accept=".csv" onChange={e => setSubjectFile(e.target.files[0])}/>
      <button onClick={handleUploadSubjects}>Upload Subjects</button>

      <h3>Select Class</h3>
      <label>Department:</label>
      <select value={department} onChange={e => setDepartment(e.target.value)}>
        <option value="">-- Select Department --</option>
        {classDepartments.map((dept, idx) => <option key={idx} value={dept}>{dept}</option>)}
      </select>

      <label>Year:</label>
      <select value={year} onChange={e => setYear(e.target.value)}>
        {[1,2,3,4].map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      <button onClick={generateTimetable}>Generate Conflict-Free Timetable</button>
      {message && <p style={{color:"green"}}>{message}</p>}
    </div>
  );
}
