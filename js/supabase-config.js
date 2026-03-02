// ============================================
// Stream Haven V2 - Supabase Configuration
// ============================================
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://hhtfioisxpmwjzmvgqad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhodGZpb2lzeHBtd2p6bXZncWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NDAyMTQsImV4cCI6MjA4ODAxNjIxNH0.Kfj-DP4VkxMV-RfnwR0OUVrD6am9JcLSF9WEYLWaRu0';

// Initialize Supabase client
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global state
window.currentUser = null;
window.currentAccount = null;
window.userAccounts = [];
window.userSettings = null;
