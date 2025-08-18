import { View, Text, StyleSheet } from 'react-native';
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
};

const NotificationCard: React.FC<NotificationCardProps> = ({
  title,
  description,
  date,
  time,
  type,
  isNew
}) => {
  const getIcon = (type: NotificationCardProps['type']) => {
    switch (type) {
      case 'Security':
        return icons.squareCheckbox2;
      case 'Card':
        return icons.ticket;
      case 'Payment':
        return icons.wallet2;
      case 'Update':
        return icons.infoSquare2;
      case 'Account':
        return icons.profile2;
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
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeftContainer}>
          <View style={[styles.iconContainer, { backgroundColor: getIconBackgroundColor(type) }]}>
            <Image
              source={getIcon(type)}
              contentFit='contain'
              style={[styles.icon, { tintColor: getIconColor(type) }]}
            />
          </View>
          <View>
            <Text style={[styles.title, {
              color: COLORS.greyscale900,
            }]}>{title}</Text>
            <Text style={[styles.date, {
              color: COLORS.grayscale700
            }]}>{getTimeAgo(date)} | {time}</Text>
          </View>
        </View>
        {
          isNew && (
            <View style={styles.headerRightContainer}>
              <Text style={styles.headerText}>New</Text>
            </View>
          )
        }
      </View>
      <Text style={[styles.description, {
        color: COLORS.grayscale700
      }]}>{description}</Text>
    </View>
  )
};

const styles = StyleSheet.create({
  container: {
    width: SIZES.width - 32,
    marginBottom: 12
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  headerRightContainer: {
    width: 41,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary
  },
  headerText: {
    fontSize: 10,
    fontFamily: "semiBold",
    color: COLORS.white
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  iconContainer: {
    height: 60,
    width: 60,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16
  },
  icon: {
    height: 28,
    width: 28
  },
  title: {
    fontSize: 18,
    fontFamily: "bold",
    color: COLORS.greyscale900,
    marginBottom: 6
  },
  date: {
    fontSize: 14,
    fontFamily: "regular",
    color: COLORS.grayscale700
  },
  description: {
    fontSize: 14,
    fontFamily: "regular",
    color: COLORS.grayscale700
  }
});

export default NotificationCard;