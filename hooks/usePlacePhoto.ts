import { useQuery } from '@tanstack/react-query';

const CLOUDFLARE_WORKER_ENDPOINT = 'https://broad-frost-da6c.hanah-july89.workers.dev/';

interface PlacePhotoResponse {
  place?: string;
  placeId?: string;
  photoURL?: string;
}

async function fetchPlacePhoto(placeName: string, destination: string): Promise<string | null> {
  try {
    const searchQuery = `${placeName}, ${destination}`;
    console.log('[usePlacePhoto] Fetching photo for:', searchQuery);
    
    const url = `${CLOUDFLARE_WORKER_ENDPOINT}?place=${encodeURIComponent(searchQuery)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    }).catch((fetchError) => {
      console.log('[usePlacePhoto] Network/CORS error caught:', fetchError.message || 'Unknown fetch error');
      throw fetchError;
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log('[usePlacePhoto] Non-OK response status:', response.status);
      try {
        const errorText = await response.text();
        console.log('[usePlacePhoto] Error response body:', errorText.substring(0, 200));
      } catch {
        console.log('[usePlacePhoto] Could not read error response body');
      }
      return null;
    }
    
    let data: PlacePhotoResponse;
    try {
      const responseText = await response.text();
      if (!responseText || responseText.trim().length === 0) {
        console.log('[usePlacePhoto] Empty response body');
        return null;
      }
      console.log('[usePlacePhoto] Response preview:', responseText.substring(0, 100));
      data = JSON.parse(responseText) as PlacePhotoResponse;
    } catch {
      console.log('[usePlacePhoto] JSON parse error - response might not be valid JSON');
      return null;
    }
    
    if (!data || !data.photoURL) {
      console.log('[usePlacePhoto] No photoURL in response for:', searchQuery);
      return null;
    }
    
    console.log('[usePlacePhoto] Successfully fetched photo for:', searchQuery);
    return data.photoURL;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.log('[usePlacePhoto] Request timeout (20s) for:', placeName);
      } else if (error.message.includes('CORS') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        console.log('[usePlacePhoto] Network/CORS error for:', placeName, '- returning null (will show placeholder)');
      } else {
        console.log('[usePlacePhoto] Error:', error.message);
      }
    } else {
      console.log('[usePlacePhoto] Unknown error type - returning null');
    }
    return null;
  }
}

export function usePlacePhoto(placeName: string, destination: string) {
  return useQuery<string | null>({
    queryKey: ['placePhoto', placeName, destination],
    queryFn: () => fetchPlacePhoto(placeName, destination),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 3000),
    enabled: !!(placeName && destination),
  });
}
