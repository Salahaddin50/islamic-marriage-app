import { Tabs } from "expo-router";
import { View, Text, Platform } from "react-native";
import { Image } from "expo-image";
import { COLORS, icons, FONTS, SIZES } from "../../constants";
import { getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from "../../utils/responsive";

const TabLayout = () => {

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: Platform.OS !== 'ios',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          right: 0,
          left: 0,
          elevation: 0,
          height: isMobileWeb() ? 75 : Platform.OS === 'ios' ? 90 : 65, // Slightly increased for better optimization
          backgroundColor: COLORS.white,
          paddingHorizontal: getResponsiveSpacing(8),
          // Add subtle shadow to separate from content
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.05)',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: ({ focused }: { focused: boolean }) => {
            return (
              <View style={{
                alignItems: "center",
                paddingTop: getResponsiveSpacing(16),
                width: isMobileWeb() ? '20%' : SIZES.width / 5,
                minWidth: 60,
              }}>
                <Image
                  source={focused ? icons.home : icons.home2Outline}
                  contentFit="contain"
                  style={{
                    width: isMobileWeb() ? 20 : 24,
                    height: isMobileWeb() ? 20 : 24,
                    tintColor: focused ? COLORS.primary : COLORS.gray3,
                  }}
                />
                <Text style={{
                  ...FONTS.body4,
                  color: focused ? COLORS.primary : COLORS.gray3,
                }}>Home</Text>
              </View>
            )
          },
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          title: "",
          tabBarIcon: ({ focused }: { focused: boolean }) => {
            return (
              <View style={{
                alignItems: "center",
                paddingTop: getResponsiveSpacing(16),
                width: isMobileWeb() ? '20%' : SIZES.width / 5,
                minWidth: 60,
              }}>
                <Image
                  source={focused ? icons.explore : icons.exploreOutline}
                  contentFit="contain"
                  style={{
                    width: isMobileWeb() ? 20 : 24,
                    height: isMobileWeb() ? 20 : 24,
                    tintColor: focused ? COLORS.primary : COLORS.gray3,
                  }}
                />
                <Text style={{
                  ...FONTS.body4,
                  color: focused ? COLORS.primary : COLORS.gray3,
                }}>Maps</Text>
              </View>
            )
          },
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: "",
          tabBarIcon: ({ focused }: { focused: boolean }) => {
            return (
              <View style={{
                alignItems: "center",
                paddingTop: getResponsiveSpacing(16),
                width: isMobileWeb() ? '20%' : SIZES.width / 5,
                minWidth: 60,
              }}>
                <Image
                  source={focused ? icons.heart2 : icons.heart2Outline}
                  contentFit="contain"
                  style={{
                    width: isMobileWeb() ? 20 : 24,
                    height: isMobileWeb() ? 20 : 24,
                    tintColor: focused ? COLORS.primary : COLORS.gray3,
                  }}
                />
                <Text style={{
                  ...FONTS.body4,
                  color: focused ? COLORS.primary : COLORS.gray3,
                }}>Match</Text>
              </View>
            )
          },
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "",
          tabBarIcon: ({ focused }: { focused: boolean }) => {
            return (
              <View style={{
                alignItems: "center",
                paddingTop: getResponsiveSpacing(16),
                width: isMobileWeb() ? '20%' : SIZES.width / 5,
                minWidth: 60,
              }}>
                <Image
                  source={focused ? icons.chat : icons.chatBubble2Outline}
                  contentFit="contain"
                  style={{
                    width: isMobileWeb() ? 20 : 24,
                    height: isMobileWeb() ? 20 : 24,
                    tintColor: focused ? COLORS.primary : COLORS.gray3,
                  }}
                />
                <Text style={{
                  ...FONTS.body4,
                  color: focused ? COLORS.primary : COLORS.gray3,
                }}>Chats</Text>
              </View>
            )
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          tabBarIcon: ({ focused }: { focused: boolean }) => {
            return (
              <View style={{
                alignItems: "center",
                paddingTop: getResponsiveSpacing(16),
                width: isMobileWeb() ? '20%' : SIZES.width / 5,
                minWidth: 60,
              }}>
                <Image
                  source={focused ? icons.user : icons.userOutline}
                  contentFit="contain"
                  style={{
                    width: isMobileWeb() ? 20 : 24,
                    height: isMobileWeb() ? 20 : 24,
                    tintColor: focused ? COLORS.primary : COLORS.gray3,
                  }}
                />
                <Text style={{
                  ...FONTS.body4,
                  color: focused ? COLORS.primary : COLORS.gray3,
                }}>Profile</Text>
              </View>
            )
          },
        }}
      />
    </Tabs>
  )
}

export default TabLayout