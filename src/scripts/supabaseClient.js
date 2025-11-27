import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mzheoplkuuzsegpetukq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16aGVvcGxrdXV6c2VncGV0dWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NDc2MzksImV4cCI6MjA2NjUyMzYzOX0.5zh2Q9UqTbPxPEGDyNuZsLFMQ5KeIeOB3t2wPS-cGaE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);