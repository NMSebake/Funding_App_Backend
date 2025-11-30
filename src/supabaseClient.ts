import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://utqmyooiwtwelcfpbbcj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cW15b29pd3R3ZWxjZnBiYmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNDk0OTEsImV4cCI6MjA3OTgyNTQ5MX0.C-TchHbp6ack40qNTxq3C5wrJqHtnsYOsVACanyCYgI"
);
