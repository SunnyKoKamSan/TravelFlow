import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';

interface ItineraryItem {
  dayIndex: number;
  time: string;
  location: string;
  note: string;
  category?: string;
}

interface TripPlannerResponse {
  itinerary: ItineraryItem[];
  highlights: string[];
  tips: string[];
}

export class AITripPlannerService {
  private genAI: GoogleGenerativeAI | null = null;

  // constructor() {
  //   if (config.GEMINI_API_KEY) {
  //     this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  //   }
  // }

  /**
   * Enhanced prompt for detailed trip planning
   */
  private buildEnhancedPrompt(
    destination: string,
    days: number,
    interests?: string[]
  ): string {
    const interestText = interests && interests.length > 0
      ? `User interests: ${interests.join(', ')}.`
      : '';

    return `You are an expert travel advisor with deep knowledge of world destinations, local culture, famous attractions, renowned restaurants, and local events.

Generate a DETAILED ${days}-day trip planning for ${destination}.

${interestText}

IMPORTANT: Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "itinerary": [
    {
      "dayIndex": 0,
      "time": "09:00",
      "location": "Specific Famous Attraction Name",
      "note": "Detailed description including history, why it's famous, what to expect, best time to visit",
      "category": "attraction|restaurant|event|experience"
    }
  ],
  "highlights": ["Key attraction 1", "Key attraction 2", "Famous restaurant/event"],
  "tips": ["Local tip 1", "Local tip 2", "Cultural insight"]
}

Requirements:
1. SPECIFIC locations and attractions: Use EXACT famous names (e.g., "Taj Mahal" not "Historical Building")
2. FAMOUS RESTAURANTS: Include at least 1-2 renowned restaurants per day with cuisine type
3. LOCAL EVENTS: Research and include any famous events, festivals, or night markets happening in this season
4. DETAILED NOTES: For each activity, provide:
   - Why it's famous/worth visiting
   - Approximate duration
   - Typical costs
   - Best time to visit
   - Any reservations needed
5. Mix attractions (70%), restaurants (20%), shopping/experience (10%)
6. Include practical information like transport between locations
7. Consider weather, opening hours, and realistic travel times
8. Add at least 3 hidden gems or lesser-known but excellent spots
9. Ensure cultural sensitivity and local customs are respected
10. The locations must be well-distributed throughout the day to avoid backtracking
11. Planning should not be repeated throughout the itinerary

FOCUS ON: Famous attractions, Michelin-recommended or highly-rated restaurants, Local festivals/events, Cultural experiences

Return ONLY valid JSON, nothing else.`;
  }

  async generateDetailedItinerary(
    destination: string,
    days: number,
    interests?: string[]
  ): Promise<TripPlannerResponse> {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = this.buildEnhancedPrompt(destination, days, interests);

      console.log('🤖 Calling Google Gemini AI for itinerary generation...');

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ Received response from Gemini');
      console.log('Response text (first 500 chars):', text.substring(0, 500));

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in response. Full response:', text);
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        itinerary: parsed.itinerary || [],
        highlights: parsed.highlights || [],
        tips: parsed.tips || [],
      };
    } catch (error) {
      console.error('Error generating itinerary:', error);
      throw error;
    }
  }

  /**
   * Get specific recommendations based on user input
   */
  async getLocationRecommendations(
    location: string,
    activityType: 'restaurants' | 'attractions' | 'events' | 'general'
  ): Promise<string[]> {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    const prompts = {
      restaurants: `List 5 of the most famous, highly-rated, and must-visit restaurants in ${location}. Include cuisine type and why they're renowned. Return as a simple numbered list.`,
      attractions: `List 5 of the most famous and iconic attractions in ${location} with brief descriptions of what makes them special. Return as a simple numbered list.`,
      events: `List major events, festivals, and special happenings in ${location} throughout the year. Include seasons and why they're notable. Return as a simple numbered list.`,
      general: `Provide 5 insider tips and recommendations for visiting ${location}, including hidden gems, best neighborhoods, and local experiences. Return as a simple numbered list.`,
    };

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompts[activityType]);
      const response = await result.response;
      const text = response.text();
      return text.split('\n').filter((line: string) => line.trim().length > 0);
    } catch (error) {
      console.error(`Error getting ${activityType} recommendations:`, error);
      throw error;
    }
  }

  /**
   * Refine itinerary based on user feedback
   */
  async refineItinerary(
    currentItinerary: ItineraryItem[],
    destination: string,
    userFeedback: string,
    days: number
  ): Promise<TripPlannerResponse> {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    const currentPlan = JSON.stringify(currentItinerary, null, 2);

    const refinementPrompt = `You are an expert travel advisor. Given the current itinerary and user feedback, refine the trip plan for ${destination}.

Current Itinerary:
${currentPlan}

User Feedback/Request: "${userFeedback}"

Generate an updated ${days}-day trip plan incorporating the user's feedback.

Return ONLY a valid JSON object with structure:
{
  "itinerary": [
    {
      "dayIndex": 0,
      "time": "HH:MM",
      "location": "Specific Location Name",
      "note": "Detailed description",
      "category": "attraction|restaurant|event|experience"
    }
  ],
  "highlights": ["Key highlights"],
  "tips": ["Updated tips based on feedback"]
}

Ensure the refined plan:
1. Addresses the user's specific request
2. Maintains the best parts of the original itinerary
3. Includes specific, famous locations and restaurants
4. Provides detailed information as requested
5. Respects the ${days}-day timeframe

Return ONLY valid JSON, nothing else.`;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(refinementPrompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in refinement response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error refining itinerary:', error);
      throw error;
    }
  }
}

export default new AITripPlannerService();
