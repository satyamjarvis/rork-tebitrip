import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Image, Animated } from 'react-native';
import Colors from '../constants/colors';
import LaunchAnimation from '../components/LaunchAnimation';

const SPRITE_SHEET_URL = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/vvjh2cel2axma0p85sy1z';
const LAUNCH_DURATION = 5000;

const PRELOAD_ASSETS = [
  'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/6jbuciyxv1g32q697z3ky',
];

export default function LaunchScreen() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [startFadeOut, setStartFadeOut] = useState(false);

  useEffect(() => {
    console.log('LaunchScreen: Starting asset preload');
    
    const preloadPromises = PRELOAD_ASSETS.map((uri) => {
      return new Promise<void>((resolve, reject) => {
        Image.prefetch(uri)
          .then(() => {
            console.log('LaunchScreen: Preloaded asset:', uri);
            resolve();
          })
          .catch((error) => {
            console.error('LaunchScreen: Failed to preload asset:', uri, error);
            resolve();
          });
      });
    });

    Promise.all(preloadPromises).then(() => {
      console.log('LaunchScreen: All assets preloaded');
      setAssetsLoaded(true);
    });
  }, []);

  useEffect(() => {
    console.log('LaunchScreen: Starting fade-in animation');
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      console.log('LaunchScreen: Fade-in completed');
    });
  }, [fadeAnim]);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('LaunchScreen: Timer completed, starting fade-out');
      setStartFadeOut(true);
    }, LAUNCH_DURATION - 400);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (startFadeOut) {
      console.log('LaunchScreen: Starting fade-out animation');
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        console.log('LaunchScreen: Fade-out completed');
        setIsReady(true);
      });
    }
  }, [startFadeOut, fadeAnim]);

  useEffect(() => {
    if (isReady && assetsLoaded) {
      console.log('LaunchScreen: Both timer and assets ready, navigating to home');
      router.replace('/(tabs)/home');
    }
  }, [isReady, assetsLoaded, router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      <View style={styles.animationContainer}>
        <LaunchAnimation spriteSheetUrl={SPRITE_SHEET_URL} opacity={fadeAnim} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
