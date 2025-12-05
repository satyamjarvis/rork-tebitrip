import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TripData } from '../hooks/useGenerateTrip';

const STORAGE_KEY = '@saved_trips';

export interface SavedTrip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  travelStyles: string;
  tripData: TripData;
  savedAt: number;
}

export const [SavedTripsContext, useSavedTrips] = createContextHook(() => {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedTrip[];
        setTrips(parsed.sort((a, b) => b.savedAt - a.savedAt));
      }
    } catch (error) {
      console.error('Failed to load saved trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTrip = useCallback(async (
    destination: string,
    startDate: string,
    endDate: string,
    budget: string,
    travelStyles: string,
    tripData: TripData
  ) => {
    try {
      const newTrip: SavedTrip = {
        id: Date.now().toString(),
        destination,
        startDate,
        endDate,
        budget,
        travelStyles,
        tripData,
        savedAt: Date.now(),
      };
      
      const updatedTrips = [newTrip, ...trips];
      setTrips(updatedTrips);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));
      
      console.log('Trip saved successfully');
      return newTrip.id;
    } catch (error) {
      console.error('Failed to save trip:', error);
      throw error;
    }
  }, [trips]);

  const deleteTrip = useCallback(async (id: string) => {
    try {
      const updatedTrips = trips.filter((trip) => trip.id !== id);
      setTrips(updatedTrips);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));
      
      console.log('Trip deleted successfully');
    } catch (error) {
      console.error('Failed to delete trip:', error);
      throw error;
    }
  }, [trips]);

  const isTripSaved = useCallback((destination: string, startDate: string, endDate: string): boolean => {
    return trips.some(
      (trip) =>
        trip.destination === destination &&
        trip.startDate === startDate &&
        trip.endDate === endDate
    );
  }, [trips]);

  return useMemo(() => ({
    trips,
    isLoading,
    saveTrip,
    deleteTrip,
    isTripSaved,
  }), [trips, isLoading, saveTrip, deleteTrip, isTripSaved]);
});
