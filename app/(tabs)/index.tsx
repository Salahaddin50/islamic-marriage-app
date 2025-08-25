import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, PanResponder, ActivityIndicator } from 'react-native';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, icons, images, SIZES } from '@/constants';
import { getResponsiveWidth, getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from '@/utils/responsive';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { menbers } from '@/data';
import { supabase } from '@/src/config/supabase';
import { useProfilePicture } from '@/hooks/useProfilePicture';
import SwipeCard from '@/components/SwipeCard';
import SwipeCardFooter from '@/components/SwipeCardFooter';
import RBSheet from "react-native-raw-bottom-sheet";
import Button from '@/components/Button';
import MultiSlider, { MarkerProps } from '@ptomasroos/react-native-multi-slider';
import Input from '@/components/Input';
import { reducer } from '@/utils/reducers/formReducers';
import { validateInput } from '@/utils/actions/formActions';

interface SliderHandleProps {
  enabled: boolean;
  markerStyle: object;
}

const CustomSliderHandle: React.FC<SliderHandleProps> = ({ enabled, markerStyle }) => {
  return (
    <View
      style={[
        markerStyle,
        {
          backgroundColor: enabled ? COLORS.primary : 'lightgray',
          borderColor: 'white',
          borderWidth: 2,
          borderRadius: 10,
          width: 20,
          height: 20,
        },
      ]}
    />
  );
};

const isTestMode = true;

const initialState = {
  inputValues: {
    location: isTestMode ? 'New York' : '',
  },
  inputValidities: {
    location: false,
  },
  formIsValid: false,
}

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [users, setUsers] = useState(menbers);
  const refRBSheet = useRef<any>(null);
  const [selectedGender, setSelectedGender] = useState<string>("Female");
  const [ageRange, setAgeRange] = useState([20, 50]); // Initial age range values
  const [formState, dispatchFormState] = useReducer(reducer, initialState);
  const [displayName, setDisplayName] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { profilePicture, isLoading: profileLoading, hasCustomImage } = useProfilePicture(refreshTrigger);

  const inputChangedHandler = useCallback(
    (inputId: string, inputValue: string) => {
      const result = validateInput(inputId, inputValue)
      dispatchFormState({
        inputId,
        validationResult: result,
        inputValue,
      })
    }, [dispatchFormState]);

  const handleSliderChange = (values: any) => {
    setAgeRange(values); // Update the age range
  };

  // Animated value for swipe and titl
  const swipe = useRef(new Animated.ValueXY()).current;
  const titlSign = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!users.length) {
      setUsers(menbers);
    }
  }, [users.length])

  // Load current user's display name from Supabase profile
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // Try to get user profile data, handling the case where the table or column might not exist
        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('first_name,last_name,profile_picture_url')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.log('Error fetching profile in index.tsx:', error);
          }
        
        // Profile picture is handled by useProfilePicture hook
        
        // Set display name
        if (profile?.first_name || profile?.last_name) {
          const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
          setDisplayName(name);
        } else if (user.email) {
          setDisplayName(user.email.split('@')[0]);
        }
        } catch (profileError) {
          console.log('Error in profile data fetch:', profileError);
          // Fallback to email username if profile fetch fails
          if (user.email) {
            setDisplayName(user.email.split('@')[0]);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Pan responder config
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, { dx, dy, y0 }) => {
      swipe.setValue({ x: dx, y: dy });
      titlSign.setValue(y0 > (SIZES.height * .9) / 2 ? 1 : -1)
    },
    onPanResponderRelease: (_, { dx, dy }) => {
      const direction = Math.sign(dx);
      const isActionActive = Math.abs(dx) > 100;

      if (isActionActive) {
        // Swipe the card off the screen
        Animated.timing(swipe, {
          duration: 1000,
          toValue: {
            x: direction * 500, // 500
            y: dy
          },
          useNativeDriver: true

        }).start(removeTopCard);

      } else {
        // Return the card to its initial position
        Animated.spring(swipe, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          friction: 5
        }).start();
      }
    }
  })

  // Remove the top card from the users array
  const removeTopCard = useCallback(() => {
    setUsers((prevState) => prevState.slice(1));
    swipe.setValue({ x: 0, y: 0 })
  }, [swipe])

  // Handle users choice
  const handleChoice = useCallback((direction: number) => {
    Animated.timing(swipe.x, {
      toValue: direction * 500,
      duration: 2000,
      useNativeDriver: true
    }).start(removeTopCard)
  }, [removeTopCard, swipe.x])

  /**
 * render header
 */
  const renderHeader = () => {
    // Function to refresh profile data
    const refreshProfile = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    return (
      <View style={styles.headerContainer}>
        <View style={styles.viewLeft}>
          <TouchableOpacity onLongPress={refreshProfile}>
            {profileLoading ? (
              <View style={[styles.userIcon, styles.loadingIcon]}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : (
              <View style={styles.userIconContainer}>
                <Image
                  source={profilePicture}
                  resizeMode='cover'
                  style={styles.userIcon}
                  // Add key to force re-render when the image source changes
                  key={`header-image-${hasCustomImage ? 'custom' : 'default'}-${Date.now()}`}
                  onLoad={() => console.log('Header image loaded successfully')}
                  onError={(error) => console.log('Header image load error:', error)}
                />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.viewNameContainer}>
            <Text style={styles.greeeting}>Salam Aleykoum 👋</Text>
            <Text style={[styles.title, {
              color: COLORS.greyscale900
            }]}>{displayName || 'Welcome'}</Text>
          </View>
        </View>
        <View style={styles.viewRight}>
          <TouchableOpacity
            onPress={() => refRBSheet.current.open()}>
            <Image
              source={icons.filter}
              resizeMode='contain'
              style={[styles.bellIcon, { tintColor: COLORS.greyscale900 }]}
            />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const CustomMarker: React.FC<MarkerProps> = (props) => {
    const { currentValue } = props;
    return (
      <View style={styles.customMarker}>
        <Text style={styles.markerText}>{currentValue}</Text>
      </View>
    );
  };


  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        {renderHeader()}
        <View style={styles.viewContainer}>
          {
            users.map(({ name, image, location, distance, age }, index) => {
              const isFirst = index == 0;
              const dragHandlers = isFirst ? panResponder.panHandlers : {};

              return (
                <SwipeCard
                  key={name}
                  name={name}
                  image={image}
                  location={location}
                  distance={distance}
                  age={age}
                  isFirst={isFirst}
                  swipe={swipe}
                  titlSign={titlSign}
                  {...dragHandlers}
                />
              )
            }).reverse()
          }
          <SwipeCardFooter handleChoice={handleChoice} />
        </View>

        <RBSheet
          ref={refRBSheet}
          closeOnPressMask={true}
          height={480}
          customStyles={{
            wrapper: {
              backgroundColor: "rgba(0,0,0,0.5)",
            },
            draggableIcon: {
              backgroundColor: "#000",
            },
            container: {
              borderTopRightRadius: 32,
              borderTopLeftRadius: 32,
              height: 480,
              backgroundColor: COLORS.white,
            }
          }}
        >
          <Text style={[styles.bottomTitle, {
            color: COLORS.greyscale900
          }]}>Filter</Text>
          <View style={styles.separateLine} />
          <View style={{ marginHorizontal: 16 }}>
            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
            }]}>Gender</Text>
            <View style={styles.genderContainer}>
              {["Male", "Female", "Random"].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.button,
                    selectedGender === gender && styles.selectedButton,
                  ]}
                  onPress={() => setSelectedGender(gender)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      selectedGender === gender && styles.selectedButtonText,
                    ]}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
            }]}>Age</Text>
            <MultiSlider
              values={ageRange}
              sliderLength={SIZES.width - 32}
              onValuesChange={handleSliderChange}
              min={0}
              max={100}
              step={1}
              allowOverlap={false}
              snapped
              minMarkerOverlapDistance={10}
              selectedStyle={styles.selectedTrack}
              unselectedStyle={styles.unselectedTrack}
              containerStyle={styles.sliderContainer}
              trackStyle={styles.trackStyle}
              customMarker={(e) => <CustomMarker {...e} />}
            />
            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
            }]}>Location</Text>
            <Input
              id="location"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['email']}
              placeholder="New York"
              placeholderTextColor={COLORS.black}
              icon={icons.location2}
            />
          </View>
          <View style={styles.separateLine} />

          <View style={styles.bottomContainer}>
            <Button
              title="Reset"
              style={{
                width: (SIZES.width - 32) / 2 - 8,
                backgroundColor:  COLORS.tansparentPrimary,
                borderRadius: 32,
                borderColor:  COLORS.tansparentPrimary
              }}
              textColor={COLORS.primary}
              onPress={() => refRBSheet.current.close()}
            />
            <Button
              title="Apply"
              filled
              style={styles.logoutButton}
              onPress={() => refRBSheet.current.close()}
            />
          </View>
        </RBSheet>
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16
  },
  headerContainer: {
    flexDirection: "row",
    width: SIZES.width - 32,
    justifyContent: "space-between",
    alignItems: "center"
  },
  userIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: COLORS.grayscale200,
  },
  userIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 32
  },
  loadingIcon: {
    backgroundColor: COLORS.grayscale200,
    justifyContent: 'center',
    alignItems: 'center'
  },
  viewLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  greeeting: {
    fontSize: 12,
    fontFamily: "regular",
    color: "gray",
    marginBottom: 4
  },
  title: {
    fontSize: 20,
    fontFamily: "bold",
    color: COLORS.greyscale900
  },
  viewNameContainer: {
    marginLeft: 12
  },
  viewRight: {
    flexDirection: "row",
    alignItems: "center"
  },
  bellIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black,
    marginRight: 8
  },
  bookmarkIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black
  },
  viewContainer: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: isMobileWeb() ? 160 : 140, // Optimized padding for better space usage
    position: 'relative',
  },
  bottomTitle: {
    fontSize: 24,
    fontFamily: "semiBold",
    color: COLORS.black,
    textAlign: "center",
    marginTop: 12
  },
  separateLine: {
    height: .4,
    width: SIZES.width - 32,
    backgroundColor: COLORS.greyscale300,
    marginVertical: 12
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.black,
    marginVertical: 12
  },
  reusltTabContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: SIZES.width - 32,
    justifyContent: "space-between"
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
    paddingHorizontal: 16,
    width: SIZES.width
  },
  cancelButton: {
    width: (SIZES.width - 32) / 2 - 8,
    backgroundColor: COLORS.tansparentPrimary,
    borderRadius: 32
  },
  logoutButton: {
    width: (SIZES.width - 32) / 2 - 8,
    backgroundColor: COLORS.primary,
    borderRadius: 32
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "bold",
    color: COLORS.greyscale900,
    marginBottom: 16
  },
  genderContainer: {
    flexDirection: 'row',
    marginVertical: 12,
  },
  button: {
    backgroundColor: "transparent",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: 100,
    alignItems: 'center',
    marginRight: 16,
  },
  selectedButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderRadius: 32
  },
  buttonText: {
    fontFamily: "regular",
    color: COLORS.primary,
    fontSize: 16,
  },
  selectedButtonText: {
    fontFamily: "regular",
    color: COLORS.white
  },

  sliderContainer: {
    height: 40,
  },
  sliderLength: {
    width: SIZES.width - 32,
  },
  selectedTrack: {
    backgroundColor: COLORS.primary,
  },
  unselectedTrack: {
    backgroundColor: 'lightgray',
  },
  trackStyle: {
    height: 4,
  },
  customMarker: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: "center",
    justifyContent: "center",
  },
  markerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
})

export default HomeScreen