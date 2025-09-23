import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uxkkbykrkccmexzliihl.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4a2tieWtya2NjbWV4emxpaWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDc0MzcsImV4cCI6MjA3Mzk4MzQzN30.Dp6fxKbXZJjE2zQFu4YPXU9P3RaLwH0YQf9OzgW89Us";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
