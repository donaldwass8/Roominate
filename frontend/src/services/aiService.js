// aiService.js
// Communicates with the Supabase Edge Function to get Gemini room recommendations.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Gets room recommendations from Gemini based on a user query.
 * 
 * @param {string} query - The user's event description (e.g. "50 person hackathon")
 * @returns {Promise<{ recommendations: Array<{room: string, building: string, capacity: number, reason: string}>, error?: string }>}
 */
export const getRoomRecommendations = async (query) => {
  if (!query) return { recommendations: [] };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('AI Service Error:', data);
      return { recommendations: [], error: data.error || 'Failed to get recommendations.' };
    }

    return { recommendations: data.recommendations || [] };
  } catch (err) {
    console.error('AI Network Error:', err);
    return { recommendations: [], error: 'Network error. Please try again later.' };
  }
};
