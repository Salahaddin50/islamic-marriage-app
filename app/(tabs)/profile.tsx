import { View, Text, StyleSheet, TouchableOpacity, Switch, Platform } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';
import { MaterialIcons } from '@expo/vector-icons';
import RBSheet from "react-native-raw-bottom-sheet";
import Button from '@/components/Button';
import { COLORS, SIZES, icons, images } from '@/constants';
import { Image } from 'expo-image';
import { launchImagePicker } from '@/utils/ImagePickerHelper';
import { useNavigation, router } from 'expo-router';
import SettingsItem from '@/components/SettingsItem';
import { getResponsiveFontSize, getResponsiveSpacing, getResponsiveWidth, isMobileWeb } from '@/utils/responsive';
import { supabase, auth } from '@/src/config/supabase';
import { useProfilePicture } from '@/hooks/useProfilePicture';

type Nav = {
  navigate: (value: string) => void
}

const Profile = () => {
  const refRBSheet = useRef<any>(null);
  const { navigate } = useNavigation<Nav>();

  const renderHeader = () => {
    return (
      <TouchableOpacity style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Image
            source={images.logo}
            contentFit='contain'
            style={styles.logo}
          />
          <Text style={[styles.headerTitle, {
            color: COLORS.greyscale900
          }]}>Profile</Text>
        </View>
        <TouchableOpacity>
          <Image
            source={icons.moreCircle}
            contentFit='contain'
            style={[styles.headerIcon, {
              tintColor: COLORS.greyscale900
            }]}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }
  /**
   * Render user profile
   */
  const profilePicture = useProfilePicture();
  
  const renderProfile = () => {
    const [displayName, setDisplayName] = useState<string>('');
    const [email, setEmail] = useState<string>('');

    useEffect(() => {
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          setEmail(user.email || '');
          // Try to get user profile data, handling the case where the table or column might not exist
          try {
            const { data: profile, error } = await supabase
              .from('user_profiles')
              .select('first_name,last_name,profile_picture_url')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (error) {
              console.log('Error fetching profile in profile.tsx:', error);
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

    // Removed pickImage function as it's no longer needed
    return (
      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={() => navigate("photosvideos")}>
          <Image
            source={profilePicture}
            contentFit='cover'
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: COLORS.greyscale900 }]}>{displayName || 'Profile'}</Text>
        <Text style={[styles.subtitle, { color: COLORS.greyscale900 }]}>{email}</Text>
      </View>
    )
  }
  /**
   * Render Settings
   */
  const renderSettings = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
      setIsDarkMode((prev) => !prev);
    };

    return (
      <View style={styles.settingsContainer}>
        <SettingsItem
          icon={icons.crown2}
          name="My Menbership"
          onPress={() => navigate("menbership")}
        />
        <SettingsItem
          icon={icons.image}
          name="My Photos and Videos"
          onPress={() => navigate("photosvideos")}
        />
        <SettingsItem
          icon={icons.idCard}
          name="Personal Details"
          onPress={() => navigate("personaldetails")}
        />
        <SettingsItem
          icon={icons.userOutline}
          name="Edit Profile"
          onPress={() => navigate("editprofile")}
        />
        <SettingsItem
          icon={icons.bell2}
          name="Notification"
          onPress={() => navigate("settingsnotifications")}
        />
        <SettingsItem
          icon={icons.wallet2Outline}
          name="Payment"
          onPress={() => navigate("settingspayment")}
        />
        <SettingsItem
          icon={icons.fund}
          name="Topup"
          onPress={() => navigate("topupamount")}
        />
        <SettingsItem
          icon={icons.shieldOutline}
          name="Security"
          onPress={() => navigate("settingssecurity")}
        />
        <TouchableOpacity
          onPress={() => navigate("settingslanguage")}
          style={styles.settingsItemContainer}>
          <View style={styles.leftContainer}>
            <Image
              source={icons.more}
              contentFit='contain'
              style={[styles.settingsIcon, {
                tintColor: COLORS.greyscale900
              }]}
            />
            <Text style={[styles.settingsName, {
              color: COLORS.greyscale900
            }]}>Language & Region</Text>
          </View>
          <View style={styles.rightContainer}>
            <Text style={[styles.rightLanguage, {
              color: COLORS.greyscale900
            }]}>English (US)</Text>
            <Image
              source={icons.arrowRight}
              contentFit='contain'
              style={[styles.settingsArrowRight, {
                tintColor: COLORS.greyscale900
              }]}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsItemContainer}>
          <View style={styles.leftContainer}>
            <Image
              source={icons.show}
              contentFit='contain'
              style={[styles.settingsIcon, {
                tintColor: COLORS.greyscale900
              }]}
            />
            <Text style={[styles.settingsName, {
              color: COLORS.greyscale900
            }]}>Dark Mode</Text>
          </View>
          <View style={styles.rightContainer}>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              thumbColor={isDarkMode ? '#fff' : COLORS.white}
              trackColor={{ false: '#EEEEEE', true: COLORS.primary }}
              ios_backgroundColor={COLORS.white}
              style={styles.switch}
            />
          </View>
        </TouchableOpacity>
        <SettingsItem
          icon={icons.lockedComputerOutline}
          name="Privacy Policy"
          onPress={() => navigate("settingsprivacypolicy")}
        />
        <SettingsItem
          icon={icons.infoCircle}
          name="Help Center"
          onPress={() => navigate("settingshelpcenter")}
        />
        <SettingsItem
          icon={icons.people4}
          name="Invite Friends"
          onPress={() => navigate("settingsinvitefriends")}
        />
        <TouchableOpacity
          onPress={() => refRBSheet.current.open()}
          style={styles.logoutContainer}>
          <View style={styles.logoutLeftContainer}>
            <Image
              source={icons.logout}
              contentFit='contain'
              style={[styles.logoutIcon, {
                tintColor: "red"
              }]}
            />
            <Text style={[styles.logoutName, {
              color: "red"
            }]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
    )
  }
  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        {renderHeader()}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderProfile()}
          {renderSettings()}
        </ScrollView>
      </View>
      <RBSheet
        ref={refRBSheet}
        closeOnPressMask={true}
        height={240}
        customStyles={{
          wrapper: {
            backgroundColor: "rgba(0,0,0,0.5)",
          },
          draggableIcon: {
            backgroundColor: COLORS.grayscale200,
            height: 4
          },
          container: {
            borderTopRightRadius: 32,
            borderTopLeftRadius: 32,
            height: 240,
            backgroundColor: COLORS.white
          }
        }}
      >
        <Text style={styles.bottomTitle}>Logout</Text>
        <View style={[styles.separateLine, {
          backgroundColor: COLORS.grayscale200,
        }]} />
        <Text style={[styles.bottomSubtitle, {
          color: COLORS.black
        }]}>Are you sure you want to log out?</Text>
        <View style={styles.bottomContainer}>
          <Button
            title="Cancel"
            style={{
              width: (SIZES.width - 32) / 2 - 8,
              backgroundColor: COLORS.tansparentPrimary,
              borderRadius: 32,
              borderColor: COLORS.tansparentPrimary
            }}
            textColor={COLORS.primary}
            onPress={() => refRBSheet.current.close()}
          />
          <Button
            title="Yes, Logout"
            filled
            style={styles.logoutButton}
            onPress={async () => {
              try {
                await auth.signOut();
              } catch {}
              refRBSheet.current.close();
              router.replace('/');
              if (Platform.OS === 'web') {
                try { (window as any).location.assign('/'); } catch {}
              }
            }}
          />
        </View>
      </RBSheet>
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
    padding: getResponsiveSpacing(16),
  },
  scrollContent: {
    paddingBottom: getResponsiveSpacing(100), // Extra space for tab bar
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  logo: {
    height: isMobileWeb() ? 28 : 32,
    width: isMobileWeb() ? 28 : 32,
    tintColor: COLORS.primary
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(22),
    fontFamily: "bold",
    color: COLORS.greyscale900,
    marginLeft: getResponsiveSpacing(12)
  },
  headerIcon: {
    height: isMobileWeb() ? 20 : 24,
    width: isMobileWeb() ? 20 : 24,
    tintColor: COLORS.greyscale900
  },
  profileContainer: {
    alignItems: "center",
    borderBottomColor: COLORS.grayscale400,
    borderBottomWidth: .4,
    paddingVertical: getResponsiveSpacing(20)
  },
  avatar: {
    width: isMobileWeb() ? 100 : 120,
    height: isMobileWeb() ? 100 : 120,
    borderRadius: 999
  },
  picContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    position: "absolute",
    right: 0,
    bottom: 8,
    zIndex: 2,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2
  },
  title: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: "bold",
    color: COLORS.greyscale900,
    marginTop: getResponsiveSpacing(12)
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    color: COLORS.greyscale900,
    fontFamily: "medium",
    marginTop: getResponsiveSpacing(4)
  },
  settingsContainer: {
    marginVertical: 12
  },
  settingsItemContainer: {
    width: SIZES.width - 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.greyscale900
  },
  settingsName: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.greyscale900,
    marginLeft: 12
  },
  settingsArrowRight: {
    width: 24,
    height: 24,
    tintColor: COLORS.greyscale900
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  rightLanguage: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.greyscale900,
    marginRight: 8
  },
  switch: {
    marginLeft: 8,
    transform: [{ scaleX: .8 }, { scaleY: .8 }], // Adjust the size of the switch
  },
  logoutContainer: {
    width: SIZES.width - 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12
  },
  logoutLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.greyscale900
  },
  logoutName: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.greyscale900,
    marginLeft: 12
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
    paddingHorizontal: 16
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
  bottomTitle: {
    fontSize: 24,
    fontFamily: "semiBold",
    color: "red",
    textAlign: "center",
    marginTop: 12
  },
  bottomSubtitle: {
    fontSize: 20,
    fontFamily: "semiBold",
    color: COLORS.greyscale900,
    textAlign: "center",
    marginVertical: 28
  },
  separateLine: {
    width: SIZES.width,
    height: 1,
    backgroundColor: COLORS.grayscale200,
    marginTop: 12
  }
})

export default Profile