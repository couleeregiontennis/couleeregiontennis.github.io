import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { QdrantClient } from "https://esm.sh/@qdrant/js-client-rest@1.7.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    if (!query) throw new Error('Query is required')

    const UMPIRE_GEMINI_API_KEY = Deno.env.get('UMPIRE_GEMINI_API_KEY')
    const QDRANT_URL = Deno.env.get('QDRANT_URL')
    const QDRANT_API_KEY = Deno.env.get('QDRANT_API_KEY')

    if (!UMPIRE_GEMINI_API_KEY || !QDRANT_URL) {
      throw new Error('Configuration missing: UMPIRE_GEMINI_API_KEY or QDRANT_URL')
    }

    // 1. Generate Embedding (Using REST API v1beta)
    console.log("Generating embedding (REST)...");
    const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${UMPIRE_GEMINI_API_KEY}`;
    const embedResponse = await fetch(embedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text: query }] }
        })
    });

    if (!embedResponse.ok) {
        const errText = await embedResponse.text();
        throw new Error(`Embedding API failed: ${embedResponse.status} ${errText}`);
    }
    
    const embedData = await embedResponse.json();
    const vector = embedData.embedding.values;
    
    // 2. Search Qdrant
    console.log("Searching Qdrant...");
    const qdrant = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY })
    const searchResult = await qdrant.search('rules_context', {
      vector: vector,
      limit: 5, 
      score_threshold: 0.6
    })
    console.log("Qdrant search complete. Found matches:", searchResult.length);

    const context = searchResult.map(item => item.payload?.content).join('\n\n')

    // 3. Generate Answer (Using REST API v1beta)
    console.log("Generating answer with Gemini (REST)...");
    const chatUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${UMPIRE_GEMINI_API_KEY}`;
    
    const prompt = `
      You are the official Umpire for the Coulee Region Tennis Association (LTTA).
      Answer the player's question strictly based on the provided rules context below.
      The context may include local league rules and USTA "Friend at Court" snippets.
      Be concise and friendly.
      If the answer is not in the context, say "I don't see a specific rule for that, please check with your captain or the coordinator."
      
      Context:
      ${context || "No relevant rules found."} 

      Question: ${query}
    `;

    const chatResponse = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!chatResponse.ok) {
        const errText = await chatResponse.text();
        throw new Error(`Chat API failed: ${chatResponse.status} ${errText}`);
    }

    const chatData = await chatResponse.json();
    const responseText = chatData.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ answer: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})