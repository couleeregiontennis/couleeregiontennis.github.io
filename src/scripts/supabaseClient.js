import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfig = {
    url: supabaseUrl,
    anonKeyPresent: Boolean(supabaseAnonKey),
};

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[supabaseClient] Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY', {
        urlPresent: Boolean(supabaseUrl),
        anonKeyPresent: Boolean(supabaseAnonKey),
    });
}

// Prevent crash if env vars are missing (for CI/Test environments)
// The App component will handle showing a friendly error message.
const safeUrl = supabaseUrl || 'https://example.supabase.co';
const safeKey = supabaseAnonKey || 'dummy-key';

export const supabase = createClient(safeUrl, safeKey);
