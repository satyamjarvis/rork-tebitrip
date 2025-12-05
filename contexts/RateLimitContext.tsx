import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = '@rate_limit';
const MAX_GENERATIONS_PER_DAY = 10;

interface RateLimitData {
  count: number;
  date: string;
}

export const [RateLimitContext, useRateLimit] = createContextHook(() => {
  const [generationsLeft, setGenerationsLeft] = useState<number>(MAX_GENERATIONS_PER_DAY);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  const loadRateLimit = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const todayStr = getTodayDateString();

      if (stored) {
        const data = JSON.parse(stored) as RateLimitData;
        
        if (data.date === todayStr) {
          setGenerationsLeft(Math.max(0, MAX_GENERATIONS_PER_DAY - data.count));
        } else {
          setGenerationsLeft(MAX_GENERATIONS_PER_DAY);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
            count: 0,
            date: todayStr,
          }));
        }
      } else {
        setGenerationsLeft(MAX_GENERATIONS_PER_DAY);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
          count: 0,
          date: todayStr,
        }));
      }
    } catch (error) {
      console.error('Failed to load rate limit:', error);
      setGenerationsLeft(MAX_GENERATIONS_PER_DAY);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRateLimit();
  }, []);

  const incrementGeneration = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const todayStr = getTodayDateString();

      if (stored) {
        const data = JSON.parse(stored) as RateLimitData;
        
        if (data.date === todayStr) {
          const newCount = data.count + 1;
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
            count: newCount,
            date: todayStr,
          }));
          setGenerationsLeft(Math.max(0, MAX_GENERATIONS_PER_DAY - newCount));
        } else {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
            count: 1,
            date: todayStr,
          }));
          setGenerationsLeft(MAX_GENERATIONS_PER_DAY - 1);
        }
      }
    } catch (error) {
      console.error('Failed to increment generation count:', error);
    }
  }, []);

  const canGenerate = generationsLeft > 0;

  return {
    generationsLeft,
    canGenerate,
    incrementGeneration,
    isLoading,
    maxGenerations: MAX_GENERATIONS_PER_DAY,
  };
});
