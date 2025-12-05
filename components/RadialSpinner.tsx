import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

interface RadialSpinnerProps {
  size?: number;
  opacity?: Animated.Value;
}

export default function RadialSpinner({ size = 32, opacity }: RadialSpinnerProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const barOpacities = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(1))
  ).current;

  useEffect(() => {
    const rotationAnimation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );

    const opacityAnimations = barOpacities.map((barOpacity, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 100),
          Animated.timing(barOpacity, {
            toValue: 0.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(barOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    });

    rotationAnimation.start();
    opacityAnimations.forEach(anim => anim.start());

    return () => {
      rotationAnimation.stop();
      opacityAnimations.forEach(anim => anim.stop());
    };
  }, [rotation, barOpacities]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const barWidth = size * 0.15;
  const barHeight = size * 0.35;
  const radius = size * 0.32;

  return (
    <Animated.View style={[styles.container, { opacity, width: size, height: size }]}>
      <Animated.View
        style={[
          styles.spinner,
          {
            transform: [{ rotate: rotateInterpolate }],
          },
        ]}
      >
        {Array.from({ length: 12 }).map((_, index) => {
          const angle = (index * 30 * Math.PI) / 180;
          const x = radius * Math.sin(angle);
          const y = -radius * Math.cos(angle);

          return (
            <Animated.View
              key={index}
              style={[
                styles.bar,
                {
                  width: barWidth,
                  height: barHeight,
                  borderRadius: barWidth / 2,
                  opacity: barOpacities[index],
                  transform: [
                    { translateX: x },
                    { translateY: y },
                    { rotate: `${index * 30}deg` },
                  ],
                },
              ]}
            />
          );
        })}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  spinner: {
    width: '100%',
    height: '100%',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  bar: {
    position: 'absolute' as const,
    backgroundColor: Colors.primary,
  },
});
