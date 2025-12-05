import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MapPin, 
  Hotel, 
  Package, 
  CloudRain, 
  Calendar,
  Coffee,
  Sun,
  Moon,
  ExternalLink,
  RefreshCw,
  Cloud,
  CloudDrizzle,
  Bookmark,
  BookmarkCheck,
  ChevronLeft
} from 'lucide-react-native';
import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Linking,
  Image,
  Animated,
} from 'react-native';

import Colors from '../../constants/colors';
import { useGenerateTrip } from '../../hooks/useGenerateTrip';
import { usePlacePhoto } from '../../hooks/usePlacePhoto';
import { useSavedTrips } from '../../contexts/SavedTripsContext';
import { useRateLimit } from '../../contexts/RateLimitContext';
import TebiAnimation from '../../components/TebiAnimation';

type TravelStyle = 'Relax' | 'Adventure' | 'Food Trip' | 'Aesthetic' | 'Nightlife' | 'Nature';

const TimeSlotPhoto = memo(({ placeName, destination }: { placeName: string; destination: string }) => {
  const { data: photoUrl, isLoading } = usePlacePhoto(placeName, destination);

  if (isLoading) {
    return (
      <View style={styles.timeSlotImagePlaceholder}>
        <MapPin size={32} color={Colors.textSecondary} />
      </View>
    );
  }
  
  if (!photoUrl) {
    return (
      <View style={styles.timeSlotImagePlaceholder}>
        <MapPin size={32} color={Colors.textSecondary} />
      </View>
    );
  }
  
  return (
    <Image
      source={{ uri: photoUrl }}
      style={styles.timeSlotImage}
      resizeMode="cover"
    />
  );
});

TimeSlotPhoto.displayName = 'TimeSlotPhoto';

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    destination: string;
    startDate: string;
    endDate: string;
    budget: string;
    travelStyles: string;
    tripId?: string;
  }>();

  const { saveTrip, trips } = useSavedTrips();
  const { canGenerate, incrementGeneration } = useRateLimit();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showStyleSelector, setShowStyleSelector] = useState<boolean>(false);
  const [tempSelectedStyles, setTempSelectedStyles] = useState<TravelStyle[]>(
    params.travelStyles ? params.travelStyles.split(',') as TravelStyle[] : []
  );
  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const [showWeatherArrow, setShowWeatherArrow] = useState<boolean>(false);
  const weatherArrowOpacity = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const styleOptions: TravelStyle[] = ['Relax', 'Adventure', 'Food Trip', 'Aesthetic', 'Nightlife', 'Nature'];

  const savedTrip = params.tripId ? trips.find(t => t.id === params.tripId) : null;

  const { data: generatedTripData, isLoading, error } = useGenerateTrip({
    destination: params.destination || '',
    startDate: params.startDate || '',
    endDate: params.endDate || '',
    budget: params.budget || '',
    travelStyles: params.travelStyles || '',
  }, !params.tripId);

  const tripData = useMemo(() => savedTrip?.tripData || generatedTripData, [savedTrip, generatedTripData]);

  const isAlreadySaved = useMemo(() => {
    if (!tripData) return false;
    return trips.some(
      (trip) =>
        trip.destination === params.destination &&
        trip.startDate === params.startDate &&
        trip.endDate === params.endDate &&
        JSON.stringify(trip.tripData.itinerary) === JSON.stringify(tripData.itinerary)
    );
  }, [trips, params.destination, params.startDate, params.endDate, tripData]);

  useEffect(() => {
    if (tripData) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      mascotOpacity.setValue(0);
      Animated.timing(mascotOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [tripData, mascotOpacity]);

  useEffect(() => {
    if (showWeatherArrow) {
      Animated.timing(weatherArrowOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(weatherArrowOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showWeatherArrow, weatherArrowOpacity]);

  const handleWeatherScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const contentWidth = event.nativeEvent.contentSize.width;
    const layoutWidth = event.nativeEvent.layoutMeasurement.width;
    
    const isAtEnd = scrollX + layoutWidth >= contentWidth - 20;
    setShowWeatherArrow(!isAtEnd && contentWidth > layoutWidth);
  };

  const toggleTravelStyle = (style: TravelStyle) => {
    if (tempSelectedStyles.includes(style)) {
      setTempSelectedStyles(tempSelectedStyles.filter(s => s !== style));
    } else {
      if (tempSelectedStyles.length < 2) {
        setTempSelectedStyles([...tempSelectedStyles, style]);
      }
    }
  };

  const handleGenerateNew = () => {
    if (tempSelectedStyles.length === 0 || !canGenerate) {
      return;
    }

    incrementGeneration();
    setShowStyleSelector(false);

    router.push({
      pathname: '/(tabs)/results',
      params: {
        destination: params.destination,
        startDate: params.startDate,
        endDate: params.endDate,
        budget: params.budget,
        travelStyles: tempSelectedStyles.join(','),
      },
    });
  };

  const openMap = (location: string) => {
    const query = encodeURIComponent(location);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <TebiAnimation />
          <Text style={styles.loadingText}>Tebi is creating your perfect trip...</Text>
          <Text style={styles.loadingSubtext}>This may take a moment</Text>
        </View>
      </View>
    );
  }

  if (error || !tripData) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>Unable to generate trip</Text>
          <Text style={styles.errorSubtext}>Please try again</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
        <View style={styles.mascotContainer}>
          <Animated.Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/6k6vs07088pyk1ftp2cma' }}
            style={[styles.mascotImage, { opacity: mascotOpacity }]}
            resizeMode="contain"
          />
          <Text style={styles.mascotText}>Your trip to {params.destination} is ready!</Text>
          <Text style={styles.mascotSubtext}>Tebi found these perfect spots for you!</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>TebiTrip Day by Day</Text>
          </View>
          {tripData.itinerary.map((day) => (
            <View key={day.day} style={styles.dayCard}>
              <View style={styles.dayContent}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayHeaderContent}>
                    <Text style={styles.dayNumber}>Day {day.day}</Text>
                    <Text style={styles.locationName}>{day.locationName}</Text>
                    <Text style={styles.dayDate}>{day.date}</Text>
                  </View>
                </View>
              
              <View style={styles.timeSlot}>
                <TimeSlotPhoto placeName={day.morning.placeName} destination={params.destination || ''} />
                <View style={styles.timeSlotContent}>
                  <View style={styles.timeIconContainer}>
                    <Coffee size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.timeContent}>
                    <Text style={styles.timeLabel}>Morning</Text>
                    <Text style={styles.timeDescription}>{day.morning.description}</Text>
                    <Pressable onPress={() => openMap(`${day.morning.placeName}, ${params.destination}`)}>
                      <Text style={styles.placeNameLink}>{day.morning.placeName}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={styles.timeSlot}>
                <TimeSlotPhoto placeName={day.afternoon.placeName} destination={params.destination || ''} />
                <View style={styles.timeSlotContent}>
                  <View style={styles.timeIconContainer}>
                    <Sun size={18} color={Colors.accent} />
                  </View>
                  <View style={styles.timeContent}>
                    <Text style={styles.timeLabel}>Afternoon</Text>
                    <Text style={styles.timeDescription}>{day.afternoon.description}</Text>
                    <Pressable onPress={() => openMap(`${day.afternoon.placeName}, ${params.destination}`)}>
                      <Text style={styles.placeNameLink}>{day.afternoon.placeName}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={styles.timeSlot}>
                <TimeSlotPhoto placeName={day.evening.placeName} destination={params.destination || ''} />
                <View style={styles.timeSlotContent}>
                  <View style={styles.timeIconContainer}>
                    <Moon size={18} color={Colors.secondary} />
                  </View>
                  <View style={styles.timeContent}>
                    <Text style={styles.timeLabel}>Evening</Text>
                    <Text style={styles.timeDescription}>{day.evening.description}</Text>
                    <Pressable onPress={() => openMap(`${day.evening.placeName}, ${params.destination}`)}>
                      <Text style={styles.placeNameLink}>{day.evening.placeName}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Hotel size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Recommended Hotels</Text>
          </View>
          {tripData.hotels.map((hotel, index) => (
            <View key={index} style={styles.hotelCard}>
              <View style={styles.hotelHeader}>
                <Text style={styles.hotelName}>{hotel.name}</Text>
                <Text style={styles.hotelPrice}>{hotel.estimatedPrice}</Text>
              </View>
              <Text style={styles.hotelDescription}>{hotel.description}</Text>
              <Pressable 
                style={styles.mapButton}
                onPress={() => openMap(`${hotel.name}, ${hotel.location}`)}
              >
                <MapPin size={16} color={Colors.primary} />
                <Text style={styles.mapButtonText}>{hotel.location}</Text>
                <ExternalLink size={14} color={Colors.primary} />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CloudRain size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Weather Forecast</Text>
          </View>
          <View style={styles.weatherContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weatherScrollContent}
              onScroll={handleWeatherScroll}
              scrollEventThrottle={16}
              onLayout={(event) => {
                const layoutWidth = event.nativeEvent.layout.width;
                const contentWidth = (tripData.weather.length * 172);
                setShowWeatherArrow(contentWidth > layoutWidth);
              }}
            >
              {tripData.weather.map((day, index) => {
              const WeatherIcon = 
                day.icon === 'sun' ? Sun :
                day.icon === 'rain' ? CloudDrizzle :
                day.icon === 'partly-cloudy' ? CloudRain :
                Cloud;
              
              const iconColor = 
                day.icon === 'sun' ? '#FFA500' :
                day.icon === 'rain' ? '#4A90E2' :
                day.icon === 'partly-cloudy' ? '#7B8794' :
                '#9CA3AF';

              return (
                <View key={index} style={styles.weatherDayCard}>
                  <Text style={styles.weatherDate}>{day.date}</Text>
                  <WeatherIcon size={40} color={iconColor} style={styles.weatherIcon} />
                  <Text style={styles.weatherCondition}>{day.condition}</Text>
                  <View style={styles.weatherTempContainer}>
                    <Text style={styles.weatherTempHigh}>{day.tempHigh}°</Text>
                    <Text style={styles.weatherTempLow}>{day.tempLow}°</Text>
                  </View>
                  <Text style={styles.weatherSummary}>{day.summary}</Text>
                </View>
              );
            })}
            </ScrollView>
            {showWeatherArrow && (
              <Animated.View 
                style={[
                  styles.weatherArrowIndicator,
                  { opacity: weatherArrowOpacity }
                ]}
              >
                <ChevronLeft size={24} color={Colors.primary} style={{ opacity: 0.8 }} />
              </Animated.View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Packing List</Text>
          </View>
          <View style={styles.packingCard}>
            <View style={styles.packingCategory}>
              <Text style={styles.packingCategoryTitle}>Essentials</Text>
              {tripData.packingList.essentials.map((item, index) => (
                <View key={index} style={styles.packingItem}>
                  <View style={styles.packingBullet} />
                  <Text style={styles.packingText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.packingCategory}>
              <Text style={styles.packingCategoryTitle}>Clothing</Text>
              {tripData.packingList.clothing.map((item, index) => (
                <View key={index} style={styles.packingItem}>
                  <View style={styles.packingBullet} />
                  <Text style={styles.packingText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.packingCategory}>
              <Text style={styles.packingCategoryTitle}>Extras</Text>
              {tripData.packingList.extras.map((item, index) => (
                <View key={index} style={styles.packingItem}>
                  <View style={styles.packingBullet} />
                  <Text style={styles.packingText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            style={[
              styles.saveButton,
              (isAlreadySaved || isSaving) && styles.saveButtonDisabled
            ]}
            onPress={async () => {
              if (isAlreadySaved || isSaving || !tripData) return;
              setIsSaving(true);
              try {
                await saveTrip(
                  params.destination || '',
                  params.startDate || '',
                  params.endDate || '',
                  params.budget || '',
                  params.travelStyles || '',
                  tripData
                );
              } catch (error) {
                console.error('Failed to save trip:', error);
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isAlreadySaved || isSaving}
          >
            {isAlreadySaved ? (
              <BookmarkCheck size={20} color={Colors.textSecondary} />
            ) : (
              <Bookmark size={20} color={Colors.primary} />
            )}
            <Text style={[
              styles.saveButtonText,
              (isAlreadySaved || isSaving) && styles.saveButtonTextDisabled
            ]}>
              {isSaving ? 'Saving...' : isAlreadySaved ? 'Trip Saved' : 'Save Trip'}
            </Text>
          </Pressable>

          {!canGenerate && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>Daily limit reached. Come back tomorrow!</Text>
            </View>
          )}

          {canGenerate && (
            <>
              <Pressable
                style={styles.regenerateButton}
                onPress={() => {
                  const currentStyles = params.travelStyles ? params.travelStyles.split(',') as TravelStyle[] : [];
                  setTempSelectedStyles(currentStyles);
                  setShowStyleSelector(!showStyleSelector);
                }}
              >
                <RefreshCw size={20} color={Colors.primary} />
                <Text style={styles.regenerateButtonText}>Generate New Itinerary</Text>
              </Pressable>

              {showStyleSelector && (
                <View style={styles.styleSelectorCard}>
                  <Text style={styles.styleSelectorTitle}>Select Travel Styles</Text>
                  <View style={styles.tagsContainer}>
                    {styleOptions.map((style) => (
                      <Pressable
                        key={style}
                        style={[
                          styles.tag,
                          tempSelectedStyles.includes(style) && styles.tagSelected,
                          !tempSelectedStyles.includes(style) && tempSelectedStyles.length >= 2 && styles.tagDisabled,
                        ]}
                        onPress={() => toggleTravelStyle(style)}
                        disabled={!tempSelectedStyles.includes(style) && tempSelectedStyles.length >= 2}
                      >
                        <Text style={[
                          styles.tagText,
                          tempSelectedStyles.includes(style) && styles.tagTextSelected
                        ]}>
                          {style}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable
                    style={[
                      styles.generateNewButton,
                      tempSelectedStyles.length === 0 && styles.generateNewButtonDisabled
                    ]}
                    onPress={handleGenerateNew}
                    disabled={tempSelectedStyles.length === 0}
                  >
                    <Text style={[
                      styles.generateNewButtonText,
                      tempSelectedStyles.length === 0 && styles.generateNewButtonTextDisabled
                    ]}>
                      Generate
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>

        <Text style={styles.disclaimer}>Disclaimer: Photos are sourced from public Google API.</Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingContent: {
    alignItems: 'center' as const,
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  errorContent: {
    alignItems: 'center' as const,
    gap: 8,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  mascotContainer: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  mascotImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  mascotText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    paddingHorizontal: 20,
  },
  mascotSubtext: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  dayCard: {
    backgroundColor: Colors.card,
    borderRadius: 28,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden' as const,
  },

  dayContent: {
    padding: 20,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginTop: 4,
    flexShrink: 1,
  },
  dayHeader: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayHeaderContent: {
    flexDirection: 'column' as const,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    flexShrink: 1,
  },
  dayDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  timeSlot: {
    marginBottom: 16,
  },
  timeSlotImage: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: Colors.inputBg,
  },
  timeSlotImagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  timeSlotContent: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  placeName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginTop: 4,
  },
  placeNameLink: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginTop: 4,
    textDecorationLine: 'underline' as const,
  },
  timeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 2,
  },
  timeContent: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  timeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  hotelCard: {
    backgroundColor: Colors.card,
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
  },
  hotelHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8,
  },
  hotelName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginRight: 12,
  },
  hotelPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  hotelDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  mapButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  mapButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  weatherContainer: {
    position: 'relative' as const,
  },
  weatherScrollContent: {
    paddingRight: 20,
    gap: 12,
  },
  weatherArrowIndicator: {
    position: 'absolute' as const,
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  weatherDayCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 16,
    width: 160,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
  },
  weatherDate: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  weatherIcon: {
    alignSelf: 'center' as const,
    marginBottom: 8,
  },
  weatherCondition: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  weatherTempContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  weatherTempHigh: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  weatherTempLow: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  weatherSummary: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center' as const,
  },
  packingCard: {
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
  packingCategory: {
    marginBottom: 20,
  },
  packingCategoryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 12,
  },
  packingItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    marginBottom: 8,
  },
  packingBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 7,
  },
  packingText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: Colors.card,
    borderRadius: 30,
    padding: 20,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 16,
  },
  saveButtonDisabled: {
    borderColor: Colors.border,
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  saveButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  regenerateButton: {
    backgroundColor: Colors.card,
    borderRadius: 30,
    padding: 20,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  regenerateButtonDisabled: {
    borderColor: Colors.border,
    shadowOpacity: 0,
  },
  regenerateButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  regenerateButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  warningBanner: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE4A3',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8B7355',
    textAlign: 'center' as const,
  },
  styleSelectorCard: {
    backgroundColor: Colors.card,
    borderRadius: 28,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
  },
  styleSelectorTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.glowLight,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  tagSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
    shadowColor: Colors.glowBlue,
    shadowOpacity: 0.6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tagTextSelected: {
    color: Colors.white,
  },
  tagDisabled: {
    opacity: 0.4,
  },
  generateNewButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    padding: 18,
    alignItems: 'center' as const,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  generateNewButtonDisabled: {
    backgroundColor: Colors.border,
  },
  generateNewButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  generateNewButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  bottomSpacer: {
    height: 100,
  },
  disclaimer: {
    fontSize: 11,
    color: '#1A3C6E',
    textAlign: 'center' as const,
    opacity: 0.7,
    marginTop: 32,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
});
