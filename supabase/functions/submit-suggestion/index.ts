import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Removed 'userId' from input to prevent ID spoofing.
    // Ideally user identity should be derived from the Auth header.
    const { content, captchaToken } = await req.json()

    // Enhanced Input Validation
    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid content format.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (content.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Suggestion must be at least 10 characters long.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (content.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Suggestion must not exceed 1000 characters.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 1. Verify CAPTCHA with Cloudflare Turnstile
    const TURNSTILE_SECRET_KEY = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (TURNSTILE_SECRET_KEY) {
        // Only verify if the key is set (allows for dev testing without it if needed)
        const ip = req.headers.get('cf-connecting-ip')
        
        const formData = new FormData();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', captchaToken);
        formData.append('remoteip', ip);

        const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const result = await fetch(url, {
            body: formData,
            method: 'POST',
        });

        const outcome = await result.json();
        if (!outcome.success) {
             return new Response(
                JSON.stringify({ error: 'CAPTCHA verification failed.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }
    }

    // 2. Initialize Supabase Client
    // We use the Service Role Key here so the function has full access to write to the DB
    // regardless of the user's auth state (since we want anonymous writes).
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Insert Suggestion
    const { data, error } = await supabase
      .from('suggestions')
      .insert([
        {
          content: content,
          user_id: null, // Always null for now (Anonymous)
          // You could hash the IP here if you wanted to store it
          // ip_hash: await crypto.subtle.digest(...) 
        },
      ])
      .select()

    if (error) {
        throw error
    }

    return new Response(
      JSON.stringify({ message: 'Suggestion submitted successfully!', data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
