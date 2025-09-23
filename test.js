import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uxkkbykrkccmexzliihl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4a2tieWtya2NjbWV4emxpaWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDc0MzcsImV4cCI6MjA3Mzk4MzQzN30.Dp6fxKbXZJjE2zQFu4YPXU9P3RaLwH0YQf9OzgW89Us";
const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllTablesAndColumns() {
  const { data, error } = await supabase.rpc("get_tables_and_columns");

  if (error) {
    console.error("Error fetching tables:", error);
  } else {
    console.table(data);
  }
}

getAllTablesAndColumns();


