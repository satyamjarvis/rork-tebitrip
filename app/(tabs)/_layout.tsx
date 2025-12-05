import { Tabs } from 'expo-router';
import { Home, Bookmark } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Colors from '../../constants/colors';

const TAB_WIDTH = 160;
const TAB_HEIGHT = 52;

function ElasticTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const animatedWidth = useRef(new Animated.Value(TAB_WIDTH)).current;

  const visibleRoutes = state.routes.filter((route) => {
    const routeName = route.name;
    return routeName !== 'results';
  });

  useEffect(() => {
    const currentRoute = state.routes[state.index];
    const isResultsRoute = currentRoute.name === 'results';
    const visibleIndex = isResultsRoute 
      ? visibleRoutes.findIndex(r => r.name === 'home')
      : visibleRoutes.findIndex(r => r.key === currentRoute.key);

    if (visibleIndex === -1) return;

    Animated.parallel([
      Animated.spring(animatedValue, {
        toValue: visibleIndex,
        useNativeDriver: false,
        tension: 68,
        friction: 12,
      }),
      Animated.sequence([
        Animated.timing(animatedWidth, {
          toValue: TAB_WIDTH * 1.15,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.spring(animatedWidth, {
          toValue: TAB_WIDTH,
          tension: 100,
          friction: 10,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, [state.index, state.routes, visibleRoutes, animatedValue, animatedWidth]);

  const translateX = animatedValue.interpolate({
    inputRange: visibleRoutes.map((_, i) => i),
    outputRange: visibleRoutes.map((_, i) => i * (TAB_WIDTH + 12) + 16),
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(220, 239, 255, 0.95)']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.tabsContainer}>
        <Animated.View
          style={[
            styles.activeTabBackground,
            {
              transform: [{ translateX }],
              width: animatedWidth,
            },
          ]}
        >
          <LinearGradient
            colors={['#A9D8FF', '#0A4D96']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activeGradient}
          />
        </Animated.View>

        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title || route.name;
          const currentRoute = state.routes[state.index];
          const isResultsRoute = currentRoute.name === 'results';
          const isFocused = isResultsRoute 
            ? route.name === 'home'
            : state.index === state.routes.findIndex(r => r.key === route.key);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const IconComponent = options.tabBarIcon as any;
          const iconColor = isFocused ? '#ffffff' : '#94C5E8';
          const textColor = isFocused ? '#ffffff' : '#6B9CC4';

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.8}
            >
              {IconComponent && (
                <IconComponent color={iconColor} size={22} />
              )}
              <Text style={[styles.tabLabel, { color: textColor }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <ElasticTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved Trips',
          tabBarIcon: ({ color, size }) => <Bookmark size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          href: null,
          title: 'Your TebiTrip Plan',
          headerShown: true,
          headerStyle: { 
            backgroundColor: 'transparent',
          },
          headerTintColor: Colors.primary,
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 20,
            color: Colors.text,
          },
          headerBackground: () => (
            <View style={styles.headerContainer}>
              <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientMid]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: TAB_HEIGHT,
    marginTop: 12,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  activeTabBackground: {
    position: 'absolute',
    height: TAB_HEIGHT,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#0A4D96',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  activeGradient: {
    flex: 1,
    borderRadius: 28,
  },
  tab: {
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginRight: 12,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center' as const,
    includeFontPadding: false,
    textAlignVertical: 'center' as const,
  },
});
