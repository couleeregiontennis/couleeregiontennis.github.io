import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"
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

    // Initialize Clients
    const genAI = new GoogleGenerativeAI(UMPIRE_GEMINI_API_KEY)
    const qdrant = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY })

    // 1. Generate Embedding for the user's question
    // We use the same model as the indexing script (embedding-001)
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" })
    const embeddingResult = await embeddingModel.embedContent(query)
    const vector = embeddingResult.embedding.values

    // 2. Search Qdrant for relevant rules
    // Note: QDRANT_URL must be accessible from the internet if this function is deployed.
    // If QDRANT_URL is 192.168.1.88, this will FAIL on Supabase Cloud.
    const searchResult = await qdrant.search('rules_context', {
      vector: vector,
      limit: 5, // Get top 5 relevant chunks
      score_threshold: 0.6
    })

    const context = searchResult.map(item => item.payload?.content).join('\n\n')

    // 3. Generate Answer
    const chatModel = genAI.getGenerativeModel({ model: "gemini-1.0-pro" })
    const prompt = `
      You are the official Umpire for the Coulee Region Tennis Association (LTTA).
      Answer the player's question strictly based on the provided rules context below.
      The context may include local league rules and USTA "Friend at Court" snippets.
      Be concise and friendly.
      If the answer is not in the context, say "I don't see a specific rule for that, please check with your captain or the coordinator."
      
      Context:
      ${context || "No relevant rules found."} 

      Question: ${query}
    `

    const result = await chatModel.generateContent(prompt)
    const responseText = result.response.text()

    return new Response(
      JSON.stringify({ answer: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
