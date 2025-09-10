import { View, Text, StyleSheet, TouchableOpacity, Switch, Platform, ActivityIndicator, Share } from 'react-native';
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
import { useTranslation } from 'react-i18next';


type Nav = {
  navigate: (value: string) => void
}

import SimpleAvatar from '@/components/SimpleAvatar';

const Profile = () => {
  // Temporarily silence console noise on this screen
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;
    const originalError = console.error;
    console.log = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.error = () => {};
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.info = originalInfo;
      console.debug = originalDebug;
      console.error = originalError;
    };
  }, []);
  const refRBSheet = useRef<any>(null);
  const { t, i18n } = useTranslation();
  const { navigate } = useNavigation<Nav>();

  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [isMale, setIsMale] = useState<boolean | null>(null);

  // Load current visibility from database
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('user_profiles')
          .select('is_public, gender')
          .eq('user_id', user.id)
          .maybeSingle();
        if (typeof data?.is_public === 'boolean') {
          setIsPublicProfile(data.is_public);
        }
        if (data?.gender) {
          setIsMale(String(data.gender).toLowerCase() === 'male');
        }
      } catch {}
    })();
  }, []);

  const renderHeader = () => {
    return (
      <TouchableOpacity style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Image
            source={images.logo}
            contentFit='contain'
            style={styles.logo}
          />
          <Text style={[styles.headerTitle, { color: COLORS.greyscale900 }]}>{t('profile_page.header_title')}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.profileModeText, { color: COLORS.greyscale900 }]}>
            {isPublicProfile ? t('profile_page.visibility.public') : t('profile_page.visibility.private')}
          </Text>
          <Switch
            value={isPublicProfile}
            onValueChange={async (value) => {
              setIsPublicProfile(value);
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                await supabase
                  .from('user_profiles')
                  .update({ is_public: value })
                  .eq('user_id', user.id);
              } catch {}
            }}
            trackColor={{
              false: COLORS.grayscale200,
              true: COLORS.grayscale400
            }}
            thumbColor={COLORS.white}
            ios_backgroundColor={COLORS.grayscale200}
            style={styles.profileSwitch}
          />
        </View>
      </TouchableOpacity>
    )
  }
  /**
   * Render user profile
   */
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const renderProfile = () => {
    const [displayName, setDisplayName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Function to refresh profile data
    const refreshProfile = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
      (async () => {
        setIsLoading(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setIsLoading(false);
            return;
          }
          setEmail(user.email || '');
          setCurrentUserId(user.id);
          
          // Try to get user profile data, handling the case where the table or column might not exist
          try {
            const { data: profile, error } = await supabase
              .from('user_profiles')
              .select('first_name,last_name,profile_picture_url')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (error) {
              // Error fetching profile data
            }
          
            // Set display name
            if (profile?.first_name || profile?.last_name) {
              const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
              setDisplayName(name);
            } else if (user.email) {
              setDisplayName(user.email.split('@')[0]);
            }
          } catch (profileError) {
            // Fallback to email username if profile fetch fails
            if (user.email) {
              setDisplayName(user.email.split('@')[0]);
            }
          }
        } catch (e) {
          // Error fetching user
        } finally {
          setIsLoading(false);
        }
      })();
    }, [refreshTrigger]); // Also refresh when refreshTrigger changes

    return (
      <View style={styles.profileContainer}>
        <TouchableOpacity 
          onPress={() => navigate("photosvideos")}
          onLongPress={refreshProfile} // Allow manual refresh with long press
        >
          <SimpleAvatar 
            size={isMobileWeb() ? 100 : 120}
            displayName={displayName}
            forceRefresh={refreshTrigger}
            userId={currentUserId ?? undefined}
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: COLORS.greyscale900 }]}>{displayName || t('profile_page.header_title')}</Text>
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
        {isMale && (
          <SettingsItem
            icon={icons.crown2}
            name={t('profile_page.items.my_membership')}
            onPress={() => navigate("membership")}
          />
        )}
        <SettingsItem icon={icons.image} name={t('profile_page.items.my_photos_videos')} onPress={() => navigate("photosvideos")} />
        <SettingsItem icon={icons.idCard} name={t('profile_page.items.personal_details')} onPress={() => navigate("personaldetails")} />
        <SettingsItem icon={icons.userOutline} name={t('profile_page.items.edit_profile')} onPress={() => navigate("editprofile")} />
        {/* Hidden sections - Settings, Payment, Security (can be re-enabled in future) */}
        {false && (
          <>
            <SettingsItem
              icon={icons.settings}
              name="Settings"
              onPress={() => navigate("settingshelpcenter")}
            />
            <SettingsItem
              icon={icons.wallet2Outline}
              name="Payment"
              onPress={() => navigate("settingspayment")}
            />
            <SettingsItem
              icon={icons.shieldOutline}
              name="Security"
              onPress={() => navigate("settingssecurity")}
            />
          </>
        )}
        {/* Topup removed per request */}
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
            <Text style={[styles.settingsName, { color: COLORS.greyscale900 }]}>{t('profile_page.items.language')}</Text>
          </View>
          <View style={styles.rightContainer}>
            <Text style={[styles.rightLanguage, { color: COLORS.greyscale900 }]}>{i18n.language === 'ar' ? 'العربية' : 'English'}</Text>
            <Image
              source={icons.arrowRight}
              contentFit='contain'
              style={[styles.settingsArrowRight, {
                tintColor: COLORS.greyscale900
              }]}
            />
          </View>
        </TouchableOpacity>
        {/* Dark Mode hidden per request */}
        <SettingsItem icon={icons.lockedComputerOutline} name={t('profile_page.items.privacy_policy')} onPress={() => navigate("settingsprivacypolicy")} />
        <SettingsItem icon={icons.infoCircle} name={t('profile_page.items.help_center')} onPress={() => navigate("settingshelpcenter")} />
        <SettingsItem icon={icons.bookmark2} name={t('profile_page.items.polygamy_reminder')} onPress={() => navigate("settingsnikahreminder")} />
        <SettingsItem icon={icons.people4} name={t('profile_page.items.invite_friends')} onPress={async () => {
            try {
              const appUrl = Platform.OS === 'web' ? (typeof window !== 'undefined' ? (window.location.origin || '/') : '/') : 'https://zawajplus.app';
              const shareText = `${t('profile_page.share_invite')}: ${appUrl}`;
              // Web Share API if available
              // @ts-ignore
              if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
                // @ts-ignore
                await navigator.share({ title: 'Zawajplus', text: shareText, url: appUrl });
              } else {
                await Share.share({ message: shareText, url: appUrl });
              }
            } catch (e) {}
          }}
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
            <Text style={[styles.logoutName, { color: 'red' }]}>{t('profile_page.items.logout')}</Text>
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
        <Text style={styles.bottomTitle}>{t('profile_page.logout.title')}</Text>
        <View style={[styles.separateLine, {
          backgroundColor: COLORS.grayscale200,
        }]} />
        <Text style={[styles.bottomSubtitle, { color: COLORS.black }]}>{t('profile_page.logout.confirm')}</Text>
        <View style={styles.bottomContainer}>
          <Button
            title={t('common.cancel')}
            style={{
              width: (SIZES.width - 32) / 2 - 8,
              backgroundColor: COLORS.tansparentPrimary,
              borderRadius: 32,
              borderColor: COLORS.tansparentPrimary
            }}
            textColor={COLORS.primary}
            onPress={() => refRBSheet.current?.close()}
          />
          <Button
            title={t('profile_page.logout.yes_logout')}
            filled
            style={styles.logoutButton}
            onPress={async () => {
              try {
                await auth.signOut();
              } catch {}
              refRBSheet.current?.close();
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
    paddingVertical: getResponsiveSpacing(16),
  },
  scrollContent: {
    paddingBottom: getResponsiveSpacing(100), // Extra space for tab bar
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getResponsiveSpacing(16),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center"
  },
  profileModeText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: "semiBold",
    color: COLORS.greyscale900,
    marginRight: getResponsiveSpacing(8)
  },
  profileSwitch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }]
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
    paddingVertical: getResponsiveSpacing(20),
    paddingHorizontal: getResponsiveSpacing(16),
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
    marginVertical: 12,
    paddingHorizontal: getResponsiveSpacing(16),
  },
  settingsItemContainer: {
    width: '100%',
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