import { useQuery } from '@tanstack/react-query';

interface TimeSlot {
  description: string;
  placeName: string;
  photoUrl?: string;
}

interface DayPlan {
  day: number;
  date: string;
  morning: TimeSlot;
  afternoon: TimeSlot;
  evening: TimeSlot;
  imageUrl: string;
  locationName: string;
}

interface HotelRecommendation {
  name: string;
  description: string;
  location: string;
  estimatedPrice: string;
}

interface DailyWeather {
  date: string;
  condition: string;
  icon: 'sun' | 'cloud' | 'rain' | 'partly-cloudy';
  tempHigh: number;
  tempLow: number;
  summary: string;
}

interface PackingListCategories {
  essentials: string[];
  clothing: string[];
  extras: string[];
}

export interface TripData {
  itinerary: DayPlan[];
  hotels: HotelRecommendation[];
  packingList: PackingListCategories;
  weather: DailyWeather[];
}

interface GenerateTripParams {
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  travelStyles: string;
}

export function useGenerateTrip(params: GenerateTripParams, enabled: boolean = true) {
  const query = useQuery<TripData>({
    queryKey: ['trip', params],
    queryFn: async () => {
      console.log('Generating trip with params:', params);

      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const styles = params.travelStyles.split(',').join(', ');

      const formatDateForWeather = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        });
      };

      const prompt = `Create a trip plan for ${params.destination} (${days} days, ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${params.budget} budget, ${styles} style).

Return ONLY valid JSON:
{
  "itinerary": [{
    "day": 1,
    "date": "Monday, April 3",
    "morning": {"description": "Visit...", "placeName": "Specific Place Name"},
    "afternoon": {"description": "Explore...", "placeName": "Specific Place Name"},
    "evening": {"description": "Dine at...", "placeName": "Specific Place Name"},
    "imageUrl": "placeholder",
    "locationName": "Main Area"
  }],
  "hotels": [{"name": "Hotel", "description": "Why recommended", "location": "Area", "estimatedPrice": "$XX-YY/night"}],
  "packingList": {
    "essentials": ["Passport", "Phone charger", "Medications"],
    "clothing": ["Light jacket", "Comfortable shoes"],
    "extras": ["Camera", "Travel adapter"]
  },
  "weather": [{
    "date": "Mon, Apr 3",
    "condition": "Sunny",
    "icon": "sun",
    "tempHigh": 75,
    "tempLow": 65,
    "summary": "Clear skies, perfect for sightseeing."
  }]
}

Rules:
- ${days} days itinerary
- 3 hotels for ${params.budget} budget (Low=$50-100, Mid=$100-200, High=$200-400, Luxe=$400+)
- Packing list organized into essentials (4-5 items), clothing (4-5 items), extras (3-4 items)
- REAL placeName that exists on Google Maps in ${params.destination}
- Match ${styles} style
- Images will be fetched separately
- Format dates: "Weekday, Month Day"
- Weather: Provide ${days} daily weather entries for ${params.destination} from ${formatDateForWeather(startDate)} to ${formatDateForWeather(endDate)}. Each entry should have:
  * date (short format: "Mon, Apr 3")
  * condition ("Sunny", "Cloudy", "Rainy", "Partly Cloudy")
  * icon ("sun" for sunny/clear, "cloud" for cloudy/overcast, "rain" for rainy, "partly-cloudy" for partly cloudy)
  * tempHigh (number in Fahrenheit)
  * tempLow (number in Fahrenheit)
  * summary (1-2 sentences about the weather and how it affects activities)

JSON only, no markdown.`;

      console.log('Sending prompt to AI...');

      const response = await fetch(`${process.env.EXPO_PUBLIC_TOOLKIT_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const textResponse = data.text || data.message || data.content || '';

      console.log('AI Response:', textResponse);

      let cleanedResponse = textResponse.trim();
      
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }

      cleanedResponse = cleanedResponse.trim();

      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }

      try {
        const tripData = JSON.parse(cleanedResponse) as TripData;
        console.log('Parsed trip data:', tripData);
        return tripData;
      } catch (error) {
        console.error('Failed to parse AI response:', error);
        console.error('Response was:', cleanedResponse);
        throw new Error('Failed to parse travel plan from AI');
      }
    },
    enabled: enabled && !!params.destination && !!params.startDate && !!params.endDate,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
  });

  return query;
}
