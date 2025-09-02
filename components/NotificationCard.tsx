import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { COLORS, SIZES, icons } from '@/constants';
import { Image } from 'expo-image';
import { getTimeAgo } from '@/utils/date';

type NotificationCardProps = {
  title: string;
  description: string;
  date: string | Date; 
  time: string;
  type: string;
  isNew: boolean;
  onPress?: () => void;
  onDelete?: () => void;
};

const NotificationCard: React.FC<NotificationCardProps> = ({
  title,
  description,
  date,
  time,
  type,
  isNew,
  onPress,
  onDelete
}) => {
  const getIcon = (type: NotificationCardProps['type']) => {
    switch (type) {
      case 'Security':
      case 'Account':
        return icons.squareCheckbox2;
      case 'Card':
      case 'Payment':
        return icons.wallet2;
      case 'Update':
        return icons.infoSquare2;
      case 'photo_request':
      case 'photo_shared':
        return icons.gallery;
      case 'video_call_request':
      case 'video_call_approved':
        return icons.videoCamera2;
      case 'whatsapp_request':
      case 'whatsapp_shared':
        return icons.telephone;
      case 'interest_received':
      case 'interest_accepted':
        return icons.heart;
      case 'meet_request_received':
      case 'meet_request_accepted':
        return icons.videoCamera2;
      case 'message_received':
        return icons.message;
      default:
        return icons.squareCheckbox2;
    }
  };

  const getIconBackgroundColor = (type: NotificationCardProps['type']) => {
    switch (type) {
      case 'Security':
        return COLORS.transparentSecurity;
      case 'Card':
        return COLORS.transparentCard;
      case 'Payment':
        return COLORS.transparentPayment;
      case 'Update':
        return COLORS.transparentUpdate;
      case 'Account':
        return COLORS.transparentAccount;
      default:
        return COLORS.transparentPrimary;
    }
  };

  const getIconColor = (type: NotificationCardProps['type']) => {
    switch (type) {
      case 'Security':
        return COLORS.security;
      case 'Card':
        return COLORS.card;
      case 'Payment':
        return COLORS.payment;
      case 'Update':
        return COLORS.update;
      case 'Account':
        return COLORS.account;
      default:
        return COLORS.primary;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, isNew && styles.newContainer]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.headerContainer}>
        <View style={styles.headerLeftContainer}>
          <View style={[styles.iconContainer, { backgroundColor: getIconBackgroundColor(type) }]}>
            <Image
              source={getIcon(type)}
              contentFit='contain'
              style={[styles.icon, { tintColor: getIconColor(type) }]}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, {
              color: COLORS.greyscale900,
            }]}>{title}</Text>
            <Text style={[styles.date, {
              color: COLORS.grayscale700
            }]}>{getTimeAgo(date)} | {time}</Text>
          </View>
        </View>
        <View style={styles.rightContainer}>
          {isNew && (
            <View style={styles.headerRightContainer}>
              <Text style={styles.headerText}>New</Text>
            </View>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={styles.deleteButton}
            >
              <Image
                source={icons.close}
                contentFit='contain'
                style={styles.deleteIcon}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={[styles.description, {
        color: COLORS.grayscale700
      }]}>{description}</Text>
    </TouchableOpacity>
  )
};

const styles = StyleSheet.create({
  container: {
    width: SIZES.width - 32,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayscale200
  },
  newContainer: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.tansparentPrimary
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12
  },
  headerRightContainer: {
    width: 41,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginBottom: 4
  },
  headerText: {
    fontSize: 10,
    fontFamily: "semiBold",
    color: COLORS.white
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  rightContainer: {
    alignItems: 'flex-end'
  },
  iconContainer: {
    height: 50,
    width: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  icon: {
    height: 24,
    width: 24
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontFamily: "bold",
    color: COLORS.greyscale900,
    marginBottom: 4
  },
  date: {
    fontSize: 12,
    fontFamily: "regular",
    color: COLORS.grayscale700
  },
  description: {
    fontSize: 14,
    fontFamily: "regular",
    color: COLORS.grayscale700,
    lineHeight: 20
  },
  deleteButton: {
    padding: 4,
    marginTop: 4
  },
  deleteIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.grayscale600
  }
});

export default NotificationCard;