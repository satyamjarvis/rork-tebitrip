import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, MapPin, Trash2 } from 'lucide-react-native';
import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import Colors from '../../constants/colors';
import { useSavedTrips } from '../../contexts/SavedTripsContext';

export default function SavedTripsScreen() {
  const router = useRouter();
  const { trips, isLoading, deleteTrip } = useSavedTrips();
  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const emptyMascotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading) {
      if (trips.length === 0) {
        Animated.timing(emptyMascotOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(mascotOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [isLoading, trips.length, mascotOpacity, emptyMascotOpacity]);

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatDate = (date: Date) => {
      const month = date.toLocaleString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    };
    
    const year = end.getFullYear();
    return `${formatDate(start)} – ${formatDate(end)}, ${year}`;
  };

  const handleTripPress = (trip: any) => {
    router.push({
      pathname: '/(tabs)/results',
      params: {
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budget: trip.budget,
        travelStyles: trip.travelStyles,
        tripId: trip.id,
      },
    });
  };

  const handleDeleteTrip = async (tripId: string, e: any) => {
    e.stopPropagation();
    try {
      await deleteTrip(tripId);
    } catch (error) {
      console.error('Failed to delete trip:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading saved trips...</Text>
      </View>
    );
  }

  if (trips.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Animated.Image
          source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/f1hripuyt5r3c41yf88va' }}
          style={[styles.emptyMascotImage, { opacity: emptyMascotOpacity }]}
          resizeMode="contain"
        />
        <Text style={styles.emptyTitle}>No Saved Trips</Text>
        <Text style={styles.emptySubtitle}>
          Plan and save your adventures now with Tebi!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Animated.Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/fz18t2ogyr8o8ag2mxjvt' }}
            style={[styles.mascotImage, { opacity: mascotOpacity }]}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Saved Trips</Text>
          <Text style={styles.headerSubtitle}>
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'} saved
          </Text>
        </View>

        <View style={styles.tripsContainer}>
          {trips.map((trip) => (
            <Pressable
              key={trip.id}
              style={({ pressed }) => [
                styles.tripCard,
                pressed && styles.tripCardPressed
              ]}
              onPress={() => handleTripPress(trip)}
            >
              <View style={styles.tripCardHeader}>
                <View style={styles.tripCardHeaderLeft}>
                  <MapPin size={20} color={Colors.primary} />
                  <Text style={styles.tripDestination}>{trip.destination}</Text>
                </View>
                <Pressable
                  onPress={(e) => handleDeleteTrip(trip.id, e)}
                  style={styles.deleteButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={18} color={Colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.tripCardDetails}>
                <View style={styles.tripCardDetailRow}>
                  <Calendar size={16} color={Colors.textSecondary} />
                  <Text style={styles.tripDetailText}>
                    {formatDateRange(trip.startDate, trip.endDate)}
                  </Text>
                </View>
                
                <View style={styles.tripCardMeta}>
                  <View style={styles.tripMetaItem}>
                    <Text style={styles.tripMetaLabel}>Budget:</Text>
                    <Text style={styles.tripMetaValue}>{trip.budget}</Text>
                  </View>
                  <View style={styles.tripMetaItem}>
                    <Text style={styles.tripMetaLabel}>Styles:</Text>
                    <Text style={styles.tripMetaValue} numberOfLines={1}>
                      {trip.travelStyles}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.tripCardFooter}>
                <Text style={styles.tripCardSavedDate}>
                  Saved {new Date(trip.savedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: 32,
  },
  mascotImage: {
    width: 110,
    height: 110,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 40,
  },
  emptyMascotImage: {
    width: 240,
    height: 240,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  tripsContainer: {
    gap: 16,
  },
  tripCard: {
    backgroundColor: Colors.card,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
  },
  tripCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  tripCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  tripCardHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },
  tripDestination: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
  },
  tripCardDetails: {
    gap: 12,
    marginBottom: 12,
  },
  tripCardDetailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  tripDetailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tripCardMeta: {
    flexDirection: 'row' as const,
    gap: 20,
  },
  tripMetaItem: {
    flexDirection: 'row' as const,
    gap: 6,
    flex: 1,
  },
  tripMetaLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tripMetaValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  tripCardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tripCardSavedDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
