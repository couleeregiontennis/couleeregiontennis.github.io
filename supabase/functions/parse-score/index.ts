import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

console.log('Hello from Functions! (DeepSeek Version)');

// CORS headers must be present on every response so the browser can read it
// when the frontend calls this function from GitHub Pages / the deployed app.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const MAX_TRANSCRIPT_LENGTH = 500;

const DEEPSEEK_API_URL = Deno.env.get('DEEPSEEK_API_URL') || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = Deno.env.get('DEEPSEEK_MODEL') || 'deepseek-v4-flash';

serve(async (req) => {
  // Respond to browser preflight requests before the rest of the handler.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed. Use POST.' }, 405);
  }

  let transcript: unknown;
  try {
    const body = await req.json();
    transcript = body.transcript;
  } catch {
    return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
  }

  if (!transcript) {
    return jsonResponse({ error: 'Missing transcript in request body' }, 400);
  }

  const normalizedTranscript = typeof transcript === 'string' ? transcript.trim() : '';
  if (!normalizedTranscript) {
    return jsonResponse({ error: 'Transcript must be a non-empty string' }, 400);
  }

  if (normalizedTranscript.length > MAX_TRANSCRIPT_LENGTH) {
    return jsonResponse({ error: `Transcript too long (max ${MAX_TRANSCRIPT_LENGTH} characters)` }, 400);
  }

  const apiKey = Deno.env.get('DEEPSEEK_API_KEY_SCORE_PARSING');

  if (!apiKey) {
    return jsonResponse({ error: 'DEEPSEEK_API_KEY_SCORE_PARSING not set in environment variables' }, 500);
  }

  const systemPrompt = `You are a tennis score parsing assistant. Your task is to extract information from a user's spoken transcript of a tennis match score.
  The output should be a JSON object with the following structure:
  {
    "lineNumber": number, // Optional, defaults to 1 if not specified, but try to infer from "line one", "line two" etc.
    "matchType": "singles" | "doubles", // Optional, defaults to "doubles" if not specified. Try to infer.
    "homeSet1": number,
    "awaySet1": number,
    "homeSet2": number,
    "awaySet2": number,
    "homeSet3": number | null, // Only if a third set (tie-break) is played
    "awaySet3": number | null, // Only if a third set (tie-break) is played
    "notes": string // Any additional relevant information
  }

  The score should represent the games won in each set. A match tie-break (third set) is typically played to 10 points, win by 2.
  If a score is invalid (e.g., "7-6" in a standard set when no tie-break was mentioned), try to interpret it reasonably or return null for that set.
  If a set score is not clearly mentioned, return null for its home and away values.
  If player names are mentioned, you can ignore them as they will be handled separately.

  Example transcripts and expected JSON output:
  - "Line one doubles, home team won six four, six two"
    { "lineNumber": 1, "matchType": "doubles", "homeSet1": 6, "awaySet1": 4, "homeSet2": 6, "awaySet2": 2, "homeSet3": null, "awaySet3": null, "notes": "" }
  - "Singles, first set six zero home, second set seven five home"
    { "lineNumber": 1, "matchType": "singles", "homeSet1": 6, "awaySet1": 0, "homeSet2": 7, "awaySet2": 5, "homeSet3": null, "awaySet3": null, "notes": "" }
  - "Line three, home lost to away in three sets, five seven, six one, and a ten eight tiebreak"
    { "lineNumber": 3, "matchType": "doubles", "homeSet1": 5, "awaySet1": 7, "homeSet2": 6, "awaySet2": 1, "homeSet3": 8, "awaySet3": 10, "notes": "" }
  - "Home won six four, seven six, and a ten seven tie break"
    { "lineNumber": 1, "matchType": "doubles", "homeSet1": 6, "awaySet1": 4, "homeSet2": 7, "awaySet2": 6, "homeSet3": 10, "awaySet3": 7, "notes": "" }
  - "Home won the first set 6-3. Away won the second set 7-5. No third set."
    { "lineNumber": 1, "matchType": "doubles", "homeSet1": 6, "awaySet1": 3, "homeSet2": 5, "awaySet2": 7, "homeSet3": null, "awaySet3": null, "notes": "No third set." }
  - "Home won the match in two sets, score six two, six one. Players were John Doe and Jane Smith for home and Bob White and Alice Green for away."
    { "lineNumber": 1, "matchType": "doubles", "homeSet1": 6, "awaySet1": 2, "homeSet2": 6, "awaySet2": 1, "homeSet3": null, "awaySet3": null, "notes": "Players were John Doe and Jane Smith for home and Bob White and Alice Green for away." }
  - "Away team defaults for line two. Score not applicable."
    { "lineNumber": 2, "matchType": "doubles", "homeSet1": null, "awaySet1": null, "homeSet2": null, "awaySet2": null, "homeSet3": null, "awaySet3": null, "notes": "Away team defaults for line two. Score not applicable." }
  - "Home one, Line one, first set 6-3, second set 6-2."
    { "lineNumber": 1, "matchType": "doubles", "homeSet1": 6, "awaySet1": 3, "homeSet2": 6, "awaySet2": 2, "homeSet3": null, "awaySet3": null, "notes": "" }
  - "We won six four, six two"
    { "lineNumber": 1, "matchType": "doubles", "homeSet1": 6, "awaySet1": 4, "homeSet2": 6, "awaySet2": 2, "homeSet3": null, "awaySet3": null, "notes": "" }
  - "I lost the first set six two, then won the second six four"
    { "lineNumber": 1, "matchType": "singles", "homeSet1": 2, "awaySet1": 6, "homeSet2": 6, "awaySet2": 4, "homeSet3": null, "awaySet3": null, "notes": "" }

  Always respond with ONLY the JSON object. Do not include any other text or explanation.`;

  try {
    const result = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Transcript: "${normalizedTranscript}"` },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!result.ok) {
      const errorText = await result.text();
      console.error('DeepSeek API error:', result.status, errorText);
      return jsonResponse({ error: 'DeepSeek API request failed', status: result.status, details: errorText }, 500);
    }

    const data = await result.json();
    const text = data.choices?.[0]?.message?.content || '';

    if (!text) {
      return jsonResponse({ error: 'Empty response from DeepSeek API' }, 500);
    }

    // Models sometimes wrap JSON in markdown code fences; strip them before parsing.
    const cleanText = text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Error parsing DeepSeek response as JSON:', parseError);
      return jsonResponse({ error: 'Invalid JSON response from AI', rawResponse: text }, 500);
    }

    return jsonResponse(parsedResponse, 200);
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    return jsonResponse(
      { error: 'Failed to process transcript with AI', details: error?.message || 'Unknown error' },
      500,
    );
  }
});
