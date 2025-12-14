import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hardcoded Rules Context (Single Source of Truth)
const RULES_CONTEXT = `
# La Crosse Team Tennis Association (LTTA) Summer Tennis League - 2024 Rules & Responsibilities

## League Coordinator
*   Role: Elected at pre-season meeting.
*   2026 Coordinator: Brett Meddaugh (Sally Ruud Resigned Aug 2024).
*   Oversight: Coulee Region Tennis Association (CRTA).
*   Play Site: Green Island Park (13 courts).
*   Schedule: Tue/Wed, May-Aug. 5:30 PM & 7:00 PM.

## Captain Responsibilities
*   Collect $25 fees by week 2.
*   Check lineups/subs before play.
*   Review scoresheets, total points, and sign after matches.
*   Ensure team representation at meetings.

## Team Member Responsibilities
*   Arrive 10 min early.
*   **Subs:** Find your own.
*   **Playing Up:** Can play 1 level up (e.g., #3 playing #2). No penalty.
*   **Interchangeable:** #4/#5 are interchangeable. #1/#2 are interchangeable (2024 exception).
*   **Playing Down:** Penalty: 4 pts to side playing down, 10 pts to opponent.
*   **Rostering:** One night only unless shortage. Dual players pay double fees.
*   **Etiquette:** No throwing racquets/smashing balls. Have fun.

## Match Play
*   **Start:** 5:30 PM & 7:00 PM. Warm-up 10 min. No "First Ball In".
*   **Forfeits:** Effective at 5:45/7:15 PM. Late arrival = 0 pts (match played for fun).
*   **Time Limit:** 5:30 matches must vacate by 7:00. Unfinished? 
    *   Leader gets 10 pts. Trailer gets 8 pts. Tied games? Both get 8 pts.
*   **Scoring:** No-Ad (15, 30, 40, Game). Deuce = 1 point, receiver choice.
*   **Format:** Best 2 of 3 sets.
    *   6-6 in set? 7-pt tiebreak.
    *   Split sets? 3rd set is a 7-pt tiebreak.
*   **Heat:** Index > 95°F? Start sets at 2-2 if agreed. Index > 104°F? Cancelled.

## Point System (Per Match)
*   10 pts: Winner.
*   8 pts: Loser in split set.
*   8 pts: Tied games in halted match.
*   6 pts: Loser in straight sets.
*   6 pts: Retiree in 3rd set (Opponent 10).
*   4 pts: Retiree in 2nd set (Opponent 10).
*   4 pts: Playing Down Penalty (Opponent 10).
*   2 pts: Retiree in 1st set (Opponent 10).
*   1 pt: Non-sanctioned player (Opponent 10).
*   0 pts: Forfeit/No-show.

## Roster Structure
*   7 players: #1, #2, #3, #3, #3, #3, #4, #5.
*   Doubles: #1+#2, #3+#3, #4+#5.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    if (!query) throw new Error('Query is required')

    const UMPIRE_GEMINI_API_KEY = Deno.env.get('UMPIRE_GEMINI_API_KEY')
    if (!UMPIRE_GEMINI_API_KEY) throw new Error('UMPIRE_GEMINI_API_KEY is not set')

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