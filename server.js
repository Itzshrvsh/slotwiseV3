import express from "express";
import { createClient } from "@supabase/supabase-js";
import { exec } from "child_process"; // for running Ollama CLI

const app = express();
const port = 5000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.get("/generate-timetable", async (req, res) => {
  const { department, className, section } = req.query;

  try {
    // 1. Fetch all required data
    const { data: students } = await supabase.from("students").select("*");
    const { data: subjects } = await supabase.from("subjects").select("*");
    const { data: classes } = await supabase.from("classes").select("*");
    const { data: faculty } = await supabase.from("faculty_submissions").select("*");

    // 2. Filter for selected dept/class/section
    const filteredStudents = students.filter(
      (s) => s.department === department && s.class === className && s.section === section
    );
    const filteredClasses = classes.filter(
      (c) => c.department === department && c.class === className && c.section === section
    );
    const filteredSubjects = subjects.filter((sub) => sub.department === department);
    const filteredFaculty = faculty.filter((f) => f.department === department);

    // 3. Prepare prompt for Ollama
    const prompt = `
You are an intelligent timetable optimizer. 
Generate a weekly timetable for Department: ${department}, Class: ${className}, Section: ${section}.
Use the following data:
- Students: ${JSON.stringify(filteredStudents, null, 2)}
- Subjects: ${JSON.stringify(filteredSubjects, null, 2)}
- Classes: ${JSON.stringify(filteredClasses, null, 2)}
- Faculty: ${JSON.stringify(filteredFaculty, null, 2)}

Constraints:
1. No faculty or classroom clashes.
2. Spread subjects evenly across week.
3. Follow subject frequency (per week).
4. Balance workload for faculty and students.

Output timetable in JSON format:
{
  "day": "Monday",
  "slots": [
    {"time": "9:00-10:00", "subject": "Math", "faculty": "Dr. A", "room": "C101"}
  ]
}
    `;

    // 4. Run Ollama LLaVA locally
    exec(`echo ${JSON.stringify(prompt)} | ollama run llava`, (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ error: stderr });
      }
      res.json({ timetable: stdout });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
