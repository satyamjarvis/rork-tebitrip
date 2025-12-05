import { useState, useCallback, useRef } from 'react';

const GOOGLE_PLACES_API_KEY = 'AIzaSyC1nj6p8mDwrS-spok9oGdalt7bYGBbBk4';

export interface CitySuggestion {
  id: string;
  cityName: string;
  fullText: string;
}

export function useCityAutocomplete() {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async (input: string) => {
    const trimmedInput = input.trim();

    if (trimmedInput.length === 0) {
      setSuggestions([]);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(trimmedInput)}&types=(cities)&key=${GOOGLE_PLACES_API_KEY}&language=en`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        console.error('API error:', response.status);
        try {
          const errorText = await response.text();
          console.error('Error response:', errorText.substring(0, 200));
        } catch {
          console.error('Could not read error response');
        }
        setSuggestions([]);
        return;
      }

      let data;
      try {
        const responseText = await response.text();
        if (!responseText || responseText.trim().length === 0) {
          console.error('Empty response from API');
          setSuggestions([]);
          return;
        }
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        console.error('Failed to parse response as JSON');
        setSuggestions([]);
        return;
      }

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API returned error:', data.status);
        setSuggestions([]);
        return;
      }

      const filteredSuggestions: CitySuggestion[] = (data.predictions || [])
        .map((prediction: any) => {
          const cityName = prediction.structured_formatting?.main_text || prediction.description;
          const country = prediction.structured_formatting?.secondary_text || '';
          const fullText = country ? `${cityName}, ${country}` : cityName;

          console.log('Mapped suggestion:', { cityName, country, fullText });

          return {
            id: prediction.place_id,
            cityName,
            fullText,
          };
        });

      setSuggestions(filteredSuggestions);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      console.error('Error fetching city suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    fetchSuggestions,
  };
}
