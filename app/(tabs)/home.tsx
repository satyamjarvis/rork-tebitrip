import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Plane, Calendar, DollarSign, Sparkles } from 'lucide-react-native';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import Colors from '../../constants/colors';
import { useCityAutocomplete } from '../../hooks/useCityAutocomplete';
import { useRateLimit } from '../../contexts/RateLimitContext';
import RadialSpinner from '../../components/RadialSpinner';

type TravelStyle = 'Relax' | 'Adventure' | 'Food Trip' | 'Aesthetic' | 'Nightlife' | 'Nature';
type BudgetLevel = 'Low' | 'Mid' | 'High' | 'Luxe';

export default function HomeTab() {
  const router = useRouter();
  const [destination, setDestination] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [dateError, setDateError] = useState<string>('');
  const [budget, setBudget] = useState<BudgetLevel | ''>('');
  const [showBudgetDropdown, setShowBudgetDropdown] = useState<boolean>(false);
  const [travelStyles, setTravelStyles] = useState<TravelStyle[]>([]);
  const { suggestions, isLoading, fetchSuggestions } = useCityAutocomplete();
  const { generationsLeft, canGenerate, incrementGeneration } = useRateLimit();
  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const spinnerRotation = useRef(new Animated.Value(0)).current;
  const spinnerOpacity = useRef(new Animated.Value(0)).current;

  const budgetOptions: { level: BudgetLevel; symbol: string }[] = [
    { level: 'Low', symbol: '$' },
    { level: 'Mid', symbol: '$$' },
    { level: 'High', symbol: '$$$' },
    { level: 'Luxe', symbol: '$$$$' },
  ];
  const styleOptions: TravelStyle[] = ['Relax', 'Adventure', 'Food Trip', 'Aesthetic', 'Nightlife', 'Nature'];

  useEffect(() => {
    Animated.timing(mascotOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [mascotOpacity]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(destination);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [destination, fetchSuggestions]);

  const toggleTravelStyle = (style: TravelStyle) => {
    if (travelStyles.includes(style)) {
      setTravelStyles(travelStyles.filter(s => s !== style));
    } else {
      if (travelStyles.length < 2) {
        setTravelStyles([...travelStyles, style]);
      }
    }
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Select travel dates';
    
    const formatDate = (date: Date) => {
      const month = date.toLocaleString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    };
    
    const year = endDate.getFullYear();
    return `${formatDate(startDate)} – ${formatDate(endDate)}, ${year}`;
  };

  const isFormValid = !!(destination && startDate && endDate && budget && travelStyles.length > 0 && !dateError);

  const handleGenerate = useCallback(() => {
    if (!destination || !startDate || !endDate || !budget || travelStyles.length === 0 || dateError || !canGenerate) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setFullYear(maxDate.getFullYear() + 2);

    if (startDate < today) {
      setDateError('Please select a date from today onwards.');
      return;
    }

    if (startDate > maxDate) {
      setDateError('Tebi can plan trips up to 2 years from today. Please choose a closer date.');
      return;
    }

    if (endDate < startDate) {
      setDateError('End date cannot be before start date.');
      return;
    }

    const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (tripDuration > 5) {
      setDateError('Maximum trip duration is 6 days.');
      return;
    }

    const params = {
      destination,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      budget,
      travelStyles: travelStyles.join(','),
    };

    incrementGeneration();
    setDateError('');
    router.push({
      pathname: '/(tabs)/results',
      params,
    });
  }, [destination, startDate, endDate, budget, travelStyles, dateError, canGenerate, incrementGeneration, router]);

  const resetForm = useCallback(() => {
    setDestination('');
    setStartDate(null);
    setEndDate(null);
    setBudget('');
    setTravelStyles([]);
    setDateError('');
    setShowSuggestions(false);
    setShowBudgetDropdown(false);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    Animated.timing(spinnerOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const spinAnimation = Animated.loop(
      Animated.timing(spinnerRotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();

    setTimeout(() => {
      resetForm();
      spinAnimation.stop();
      spinnerRotation.setValue(0);
      
      Animated.timing(spinnerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      setRefreshing(false);
    }, 800);
  }, [resetForm, spinnerRotation, spinnerOpacity]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={['transparent']}
          />
        }
      >
        {refreshing && (
          <View style={styles.refreshSpinner}>
            <RadialSpinner size={32} opacity={spinnerOpacity} />
          </View>
        )}

        <View style={styles.header}>
          <Animated.Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/6jbuciyxv1g32q697z3ky' }}
            style={[styles.mascot, { opacity: mascotOpacity }]}
            resizeMode="contain"
          />
          <View style={styles.textContainer}>
            <Text style={styles.appName}>TebiTrip</Text>
            <Text style={styles.subtitle}>Your AI Travel Bestie</Text>
          </View>
        </View>

        {!canGenerate && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>Daily limit reached. Come back tomorrow!</Text>
          </View>
        )}

        <View style={styles.formCard}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Where to?</Text>
            <View>
              <View style={[styles.inputWrapper, !canGenerate && styles.inputDisabled]}>
                <Plane size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter destination"
                  placeholderTextColor={Colors.textSecondary}
                  value={destination}
                  onChangeText={(text) => {
                    const capitalizedText = text
                      .split(', ')
                      .map(part => {
                        if (part.length === 0) return part;
                        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                      })
                      .join(', ');
                    setDestination(capitalizedText);
                    setShowSuggestions(text.trim().length > 0);
                  }}
                  onFocus={() => setShowSuggestions(destination.trim().length > 0)}
                  editable={canGenerate}
                />
                {isLoading && (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />
                )}
              </View>
              
              {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <ScrollView 
                    style={styles.suggestionsList}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="always"
                  >
                    {suggestions.map((suggestion) => (
                      <Pressable
                        key={suggestion.id}
                        style={({ pressed }) => [
                          styles.suggestionItem,
                          pressed && styles.suggestionItemPressed
                        ]}
                        onPress={() => {
                          console.log('onPress triggered for:', suggestion.fullText);
                          const capitalizedFullText = suggestion.fullText
                            .split(', ')
                            .map(part => {
                              if (part.length === 0) return part;
                              return part.charAt(0).toUpperCase() + part.slice(1);
                            })
                            .join(', ');
                          console.log('Setting destination to:', capitalizedFullText);
                          setDestination(capitalizedFullText);
                          setShowSuggestions(false);
                        }}
                      >
                        <Plane size={16} color={Colors.textSecondary} />
                        <Text style={styles.suggestionText}>{suggestion.fullText}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Travel Dates</Text>
            <Pressable 
              style={[styles.datePickerButton, !canGenerate && styles.inputDisabled]}
              onPress={() => {
                setDateError('');
                setShowDatePicker(true);
              }}
              disabled={!canGenerate}
            >
              <Calendar size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <Text style={[
                styles.dateText,
                (!startDate || !endDate) && styles.placeholderText
              ]}>
                {formatDateRange()}
              </Text>
            </Pressable>

          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Budget Level</Text>
            <Pressable
              style={[styles.dropdownButton, !canGenerate && styles.inputDisabled]}
              onPress={() => setShowBudgetDropdown(!showBudgetDropdown)}
              disabled={!canGenerate}
            >
              <DollarSign size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <Text style={[
                styles.dropdownText,
                !budget && styles.placeholderText
              ]}>
                {budget || 'Select budget'}
              </Text>
            </Pressable>
            
            {showBudgetDropdown && (
              <View style={styles.dropdownList}>
                {budgetOptions.map((option) => (
                  <Pressable
                    key={option.level}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setBudget(option.level);
                      setShowBudgetDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option.level}</Text>
                    <Text style={styles.budgetSymbol}>{option.symbol}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Travel Style</Text>
            <View style={styles.tagsContainer}>
              {styleOptions.map((style) => (
                <Pressable
                  key={style}
                  style={[
                    styles.tag,
                    travelStyles.includes(style) && styles.tagSelected,
                    !travelStyles.includes(style) && travelStyles.length >= 2 && styles.tagDisabled,
                    !canGenerate && styles.inputDisabled
                  ]}
                  onPress={() => toggleTravelStyle(style)}
                  disabled={!travelStyles.includes(style) && travelStyles.length >= 2 || !canGenerate}
                >
                  <Text style={[
                    styles.tagText,
                    travelStyles.includes(style) && styles.tagTextSelected
                  ]}>
                    {style}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>



          <Pressable
            style={[styles.generateButton, (!isFormValid || !canGenerate) && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={!isFormValid || !canGenerate}
          >
            <LinearGradient
              colors={(isFormValid && canGenerate) ? [Colors.primary, Colors.accent] : [Colors.border, Colors.border]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.generateButtonGradient}
            >
              <Sparkles size={20} color={(isFormValid && canGenerate) ? '#FFF' : Colors.textSecondary} />
              <Text style={[
                styles.generateButtonText,
                (!isFormValid || !canGenerate) && styles.generateButtonTextDisabled
              ]}>
                Plan my Trip
              </Text>
            </LinearGradient>
          </Pressable>


        </View>
      </ScrollView>

      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowDatePicker(false)}
        >
          <Pressable style={styles.datePickerModal} onPress={(e) => e.stopPropagation()}>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(date) => {
                setStartDate(date);
                setDateError('');
              }}
              onEndDateChange={(date) => {
                setEndDate(date);
                setDateError('');
              }}
              onClose={() => setShowDatePicker(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onClose: () => void;
}

function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange, onClose }: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectingStart, setSelectingStart] = useState<boolean>(true);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 2);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectingStart) {
      onStartDateChange(selectedDate);
      setSelectingStart(false);
    } else {
      if (startDate && selectedDate < startDate) {
        onStartDateChange(selectedDate);
      } else {
        onEndDateChange(selectedDate);
        setTimeout(() => {
          onClose();
        }, 300);
      }
    }
  };

  const isDateInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date >= startDate && date <= endDate;
  };

  const isStartDate = (day: number) => {
    if (!startDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === startDate.toDateString();
  };

  const isEndDate = (day: number) => {
    if (!endDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === endDate.toDateString();
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    date.setHours(0, 0, 0, 0);

    if (date < today) return true;

    if (date > maxDate) return true;

    if (!selectingStart && startDate) {
      const maxEndDate = new Date(startDate);
      maxEndDate.setDate(maxEndDate.getDate() + 5);
      if (date > maxEndDate) return true;
    }

    return false;
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <View style={styles.datePickerContent}>
      <View style={styles.datePickerHeader}>
        <Text style={styles.datePickerTitle}>
          {selectingStart ? 'Select Start Date' : 'Select End Date'}
        </Text>
        <Pressable onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.monthNavigation}>
        <Pressable
          onPress={() => {
            const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
            const prevMonthEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
            if (prevMonthEnd >= today) {
              setCurrentMonth(prevMonth);
            }
          }}
          style={styles.navButton}
          disabled={currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth()}
        >
          <Text style={[
            styles.navButtonText,
            currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth() && styles.navButtonTextDisabled
          ]}>‹</Text>
        </Pressable>
        <Text style={styles.monthYear}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <Pressable
          onPress={() => {
            const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
            const nextMonthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
            if (nextMonthStart <= maxDate) {
              setCurrentMonth(nextMonth);
            }
          }}
          style={styles.navButton}
          disabled={currentMonth.getFullYear() === maxDate.getFullYear() && currentMonth.getMonth() === maxDate.getMonth()}
        >
          <Text style={[
            styles.navButtonText,
            currentMonth.getFullYear() === maxDate.getFullYear() && currentMonth.getMonth() === maxDate.getMonth() && styles.navButtonTextDisabled
          ]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekDays}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <Text key={day} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {emptyDays.map((_, index) => (
          <View key={`empty-${index}`} style={styles.dayCell} />
        ))}
        {days.map((day) => {
          const inRange = isDateInRange(day);
          const isStart = isStartDate(day);
          const isEnd = isEndDate(day);
          const disabled = isDateDisabled(day);
          
          return (
            <Pressable
              key={day}
              style={[
                styles.dayCell,
                inRange && styles.dayCellInRange,
                (isStart || isEnd) && styles.dayCellSelected,
                disabled && styles.dayCellDisabled,
              ]}
              onPress={() => handleDateSelect(day)}
              disabled={disabled}
            >
              <Text style={[
                styles.dayText,
                (isStart || isEnd) && styles.dayTextSelected,
                disabled && styles.dayTextDisabled,
              ]}>
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {startDate && (
        <Pressable
          style={styles.resetButton}
          onPress={() => {
            onStartDateChange(null as any);
            onEndDateChange(null as any);
            setSelectingStart(true);
          }}
        >
          <Text style={styles.resetButtonText}>Reset Dates</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
    gap: 14,
  },
  mascot: {
    width: 100,
    height: 100,
  },
  textContainer: {
    alignItems: 'flex-start' as const,
    justifyContent: 'center' as const,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
      },
      web: {
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
      },
    }),
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
      web: {
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 28,
    padding: 20,
    paddingBottom: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.inputBg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 16,
    shadowColor: Colors.glowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: Colors.text,
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    maxHeight: 200,
    shadowColor: Colors.glowBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  suggestionsList: {
    padding: 8,
  },
  suggestionItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  suggestionItemPressed: {
    backgroundColor: Colors.primaryLight,
  },
  suggestionText: {
    fontSize: 16,
    color: Colors.text,
  },
  datePickerButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.inputBg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: Colors.glowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  dropdownButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.inputBg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: Colors.glowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    overflow: 'hidden' as const,
    shadowColor: Colors.glowBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  dropdownItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  budgetSymbol: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  tagsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.glowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  tagSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
    shadowColor: Colors.glowBlue,
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  tagTextSelected: {
    color: Colors.white,
    fontWeight: '700' as const,
  },
  tagDisabled: {
    opacity: 0.4,
  },
  generateButton: {
    marginTop: 4,
    borderRadius: 30,
    overflow: 'hidden' as const,
    shadowColor: Colors.glowBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  generateButtonDisabled: {
    shadowOpacity: 0,
  },
  generateButtonGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  generateButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end' as const,
  },
  datePickerModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  datePickerContent: {
    padding: 24,
  },
  datePickerHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.textSecondary,
    paddingHorizontal: 8,
  },
  monthNavigation: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 28,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  weekDays: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginBottom: 8,
  },
  weekDay: {
    width: 40,
    textAlign: 'center' as const,
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderRadius: 8,
  },
  dayCellInRange: {
    backgroundColor: Colors.secondaryLight,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: 16,
    color: Colors.text,
  },
  dayTextSelected: {
    color: '#FFF',
    fontWeight: '700' as const,
  },
  resetButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center' as const,
  },
  resetButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayTextDisabled: {
    color: Colors.textSecondary,
  },
  navButtonTextDisabled: {
    opacity: 0.3,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  warningBanner: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE4A3',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8B7355',
    textAlign: 'center' as const,
  },
  refreshSpinner: {
    position: 'absolute' as const,
    top: Platform.OS === 'ios' ? 10 : -10,
    left: 0,
    right: 0,
    alignItems: 'center' as const,
    zIndex: 1000,
  },
});
