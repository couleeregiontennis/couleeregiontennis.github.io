import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

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
    if (!UMPIRE_GEMINI_API_KEY) throw new Error('UMPIRE_GEMINI_API_KEY is not set')

    // Fetch the latest rules from the deployed website (Single Source of Truth)
    const rulesResponse = await fetch('https://couleeregiontennis.org/rules_context.md')
    if (!rulesResponse.ok) {
        throw new Error('Failed to fetch rules context')
    }
    const RULES_CONTEXT = await rulesResponse.text()

    const genAI = new GoogleGenerativeAI(UMPIRE_GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompt = `
      You are the official Umpire for the Coulee Region Tennis Association (LTTA).
      Answer the player's question strictly based on the provided rules context below.
      Be concise and friendly.
      If the answer is not in the context, say "I don't see a specific rule for that, please check with your captain or the coordinator."
      
      Context:
      ${RULES_CONTEXT}

      Question: ${query}
    `

    const result = await model.generateContent(prompt)
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