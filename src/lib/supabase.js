import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ueusymlsintmhrmvtxmt.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldXN5bWxzaW50bWhybXZ0eG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDA2MjYsImV4cCI6MjA4OTYxNjYyNn0.1JldrUNiWaWTT25DnJcumbH_TXXj9fk13ceGP5_mZNs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);