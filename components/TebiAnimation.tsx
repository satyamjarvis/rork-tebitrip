import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const SPRITE_SHEET_URL = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/dulrmr035gbwv6i7e1tf1';
const FRAME_WIDTH = 195;
const FRAME_HEIGHT = 207;
const COLUMNS = 6;
const ROWS = 6;
const TOTAL_FRAMES = 36;
const FRAME_DURATION = 80;

export default function TebiAnimation() {
  const frameIndex = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      frameIndex.current = (frameIndex.current + 1) % TOTAL_FRAMES;
      
      const col = frameIndex.current % COLUMNS;
      const row = Math.floor(frameIndex.current / COLUMNS);
      
      translateX.setValue(-col * FRAME_WIDTH);
      translateY.setValue(-row * FRAME_HEIGHT);
    }, FRAME_DURATION);

    return () => clearInterval(interval);
  }, [translateX, translateY, opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.frameWindow}>
        <Animated.Image
          source={{ uri: SPRITE_SHEET_URL }}
          style={[
            styles.spriteSheet,
            {
              transform: [
                { translateX },
                { translateY },
              ],
            },
          ]}
          resizeMode="cover"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  frameWindow: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    overflow: 'hidden' as const,
  },
  spriteSheet: {
    width: FRAME_WIDTH * COLUMNS,
    height: FRAME_HEIGHT * ROWS,
  },
});
