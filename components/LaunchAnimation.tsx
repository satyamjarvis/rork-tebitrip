import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Image } from 'react-native';

const SPRITE_WIDTH = 3072;
const SPRITE_HEIGHT = 3072;
const COLUMNS = 6;
const ROWS = 6;
const FRAME_WIDTH = 512;
const FRAME_HEIGHT = 512;
const TOTAL_FRAMES = 36;
const FRAME_DURATION = 60;

const DISPLAY_WIDTH = 300;
const DISPLAY_HEIGHT = 300;

const SCALE = DISPLAY_WIDTH / FRAME_WIDTH;
const SCALED_SPRITE_WIDTH = SPRITE_WIDTH * SCALE;
const SCALED_SPRITE_HEIGHT = SPRITE_HEIGHT * SCALE;
const SCALED_FRAME_WIDTH = FRAME_WIDTH * SCALE;
const SCALED_FRAME_HEIGHT = FRAME_HEIGHT * SCALE;

interface LaunchAnimationProps {
  spriteSheetUrl: string;
  opacity?: Animated.Value;
}

export default function LaunchAnimation({ spriteSheetUrl, opacity }: LaunchAnimationProps) {
  const frameIndex = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('LaunchAnimation mounted with URL:', spriteSheetUrl);
    
    const interval = setInterval(() => {
      frameIndex.current = (frameIndex.current + 1) % TOTAL_FRAMES;
      
      const column = frameIndex.current % COLUMNS;
      const row = Math.floor(frameIndex.current / COLUMNS);
      
      translateX.setValue(-column * SCALED_FRAME_WIDTH);
      translateY.setValue(-row * SCALED_FRAME_HEIGHT);
    }, FRAME_DURATION);

    return () => clearInterval(interval);
  }, [translateX, translateY, spriteSheetUrl]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.frameContainer}>
        <Animated.View
          style={[
            styles.spriteSheet,
            {
              transform: [
                { translateX },
                { translateY },
              ],
            },
          ]}
        >
          <Image
            source={{ uri: spriteSheetUrl }}
            style={{
              width: SCALED_SPRITE_WIDTH,
              height: SCALED_SPRITE_HEIGHT,
            }}
            resizeMode="cover"
            onLoad={() => console.log('Sprite sheet loaded')}
            onError={(error) => console.error('Sprite sheet error:', error)}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  frameContainer: {
    width: DISPLAY_WIDTH,
    height: DISPLAY_HEIGHT,
    overflow: 'hidden' as const,
  },
  spriteSheet: {
    width: SCALED_SPRITE_WIDTH,
    height: SCALED_SPRITE_HEIGHT,
  },
});
