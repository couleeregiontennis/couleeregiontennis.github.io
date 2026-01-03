import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.14.0';

console.log('Hello from Functions! (Google SDK Version)');

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  const { transcript } = await req.json();

  if (!transcript) {
    return new Response(JSON.stringify({ error: 'Missing transcript in request body' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  const normalizedTranscript = typeof transcript === 'string' ? transcript.trim() : '';
  if (!normalizedTranscript) {
    return new Response(JSON.stringify({ error: 'Transcript must be a non-empty string' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  if (normalizedTranscript.length > 500) {
    return new Response(JSON.stringify({ error: 'Transcript too long (max 500 characters)' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY_SCORE_PARSING');

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY_SCORE_PARSING not set in environment variables' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  // Using gemini-2.5-flash-lite for maximum cost efficiency as requested
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = `You are a tennis score parsing assistant. Your task is to extract information from a user's spoken transcript of a tennis match score.
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

  Always respond with ONLY the JSON object. Do not include any other text or explanation.

  Transcript: "${transcript}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Attempt to parse the text as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing Gemini response as JSON:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON response from AI', rawResponse: text }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return new Response(JSON.stringify({ error: 'Failed to process transcript with AI', details: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});