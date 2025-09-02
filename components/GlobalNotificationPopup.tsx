import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, icons } from '@/constants';
import { NotificationRecord } from '@/src/services/notifications';
import { getResponsiveWidth, getResponsiveFontSize } from '@/utils/responsive';

interface GlobalNotificationPopupProps {
  notification: NotificationRecord | null;
  visible: boolean;
  onDismiss: () => void;
}

const GlobalNotificationPopup: React.FC<GlobalNotificationPopupProps> = ({
  notification,
  visible,
  onDismiss
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible && notification) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 3 seconds
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, 3000);
    } else {
      handleDismiss();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, notification]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'photo_request':
      case 'photo_shared':
      case 'interest_received':
      case 'interest_accepted':
        return icons.heart2; // Match interests tab icon
      case 'video_call_request':
      case 'video_call_approved':
      case 'meet_request_received':
      case 'meet_request_accepted':
        return icons.videoCamera2; // Match meet requests tab icon
      case 'whatsapp_request':
      case 'whatsapp_shared':
      case 'message_received':
        return icons.chat; // Match chats tab icon
      default:
        return icons.notificationBell;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'photo_request':
      case 'photo_shared':
        return COLORS.primary;
      case 'video_call_request':
      case 'video_call_approved':
        return COLORS.success;
      case 'whatsapp_request':
      case 'whatsapp_shared':
        return COLORS.success;
      case 'interest_received':
      case 'interest_accepted':
        return COLORS.red;
      case 'meet_request_received':
      case 'meet_request_accepted':
        return COLORS.primary;
      case 'message_received':
        return COLORS.primary;
      default:
        return COLORS.primary;
    }
  };

  if (!visible || !notification) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.popupContainer}
        onPress={handleDismiss}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Image
            source={getIcon(notification.type)}
            contentFit="contain"
            style={[styles.icon, { tintColor: getIconColor(notification.type) }]}
          />
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image
            source={icons.close}
            contentFit="contain"
            style={styles.closeIcon}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  popupContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.tansparentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    width: 20,
    height: 20,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'bold',
    color: COLORS.greyscale900,
    marginBottom: 2,
  },
  message: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'regular',
    color: COLORS.grayscale700,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.grayscale600,
  },
});

export default GlobalNotificationPopup;
