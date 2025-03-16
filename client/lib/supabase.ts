import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for interacting with your database
const supabaseUrl = "https://iwmtjxzsvanwzghiybmt.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bXRqeHpzdmFud3pnaGl5Ym10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNjc4NDQsImV4cCI6MjA1NTc0Mzg0NH0.7tHapC46QgSDYQXr7ypepfaXwcSVxRf5K2CDYlflH94"

export const supabase = createClient(supabaseUrl, supabaseKey)