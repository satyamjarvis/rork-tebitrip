import { useState, useCallback } from 'react';
import { popularCities } from '../constants/cities';

export interface CitySuggestion {
  id: string;
  cityName: string;
  fullText: string;
}

export function useCityAutocomplete() {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback((input: string) => {
    const trimmedInput = input.trim().toLowerCase();

    if (trimmedInput.length === 0) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const filtered = popularCities
        .filter(city => city.toLowerCase().includes(trimmedInput))
        .slice(0, 10)
        .map((city, index) => {
          const parts = city.split(', ');
          const cityName = parts[0];
          
          return {
            id: `${cityName}-${index}`,
            cityName,
            fullText: city,
          };
        });

      setSuggestions(filtered);
      setIsLoading(false);
    }, 100);
  }, []);

  return {
    suggestions,
    isLoading,
    fetchSuggestions,
  };
}
