import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SIZES, icons } from '@/constants';
import { getResponsiveFontSize, getResponsiveWidth } from '@/utils/responsive';
import { useTranslation } from 'react-i18next';

interface AcceptConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  userName: string;
  userAge: number;
  requestType: 'photo' | 'video';
}

const AcceptConfirmationModal: React.FC<AcceptConfirmationModalProps> = ({
  visible,
  onClose,
  onAccept,
  userName,
  userAge,
  requestType
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { t } = useTranslation();

  const handleAccept = () => {
    if (isConfirmed) {
      onAccept();
      setIsConfirmed(false); // Reset for next time
      onClose();
    }
  };

  const handleClose = () => {
    setIsConfirmed(false); // Reset when closing
    onClose();
  };

  const getRequestTypeText = () => {
    return requestType === 'photo' ? t('interests.modal.photo_request') : t('interests.modal.video_meet_request');
  };

  const getIcon = () => {
    return requestType === 'photo' ? icons.heart2 : icons.videoCamera2;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Image
                  source={getIcon()}
                  contentFit="contain"
                  style={[styles.headerIcon, { tintColor: COLORS.primary }]}
                />
              </View>
              <Text style={styles.headerTitle}>{t('interests.modal.accept_title', { type: getRequestTypeText() })}</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Image
                  source={icons.close}
                  contentFit="contain"
                  style={styles.closeIcon}
                />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.mainText}>
                {t('interests.modal.accept_about_to', { type: getRequestTypeText() })}{' '}
                <Text style={styles.userName}>{userName}, {userAge}</Text>.
              </Text>

              <Text style={styles.confirmationText}>
                {t('interests.modal.accept_confirm_header')}
              </Text>

              <View style={styles.confirmationPoints}>
                <Text style={styles.bulletPoint}>
                  • {t('interests.modal.point_review_profile', { name: userName })}
                </Text>
                <Text style={styles.bulletPoint}>
                  • {t('interests.modal.point_consider_marriage')}
                </Text>
                <Text style={styles.bulletPoint}>
                  • {t('interests.modal.point_serious_intentions')}
                </Text>
              </View>

              {/* Islamic Confirmation Checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setIsConfirmed(!isConfirmed)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isConfirmed && styles.checkboxChecked]}>
                  {isConfirmed && (
                    <Image
                      source={icons.check}
                      contentFit="contain"
                      style={styles.checkIcon}
                    />
                  )}
                </View>
                <Text style={styles.checkboxText}>
                  {t('interests.modal.oath_text')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{t('interests.modal.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  !isConfirmed && styles.acceptButtonDisabled
                ]}
                onPress={handleAccept}
                disabled={!isConfirmed}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.acceptButtonText,
                  !isConfirmed && styles.acceptButtonTextDisabled
                ]}>
                  {t('interests.modal.accept_request')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: getResponsiveWidth(400),
    maxHeight: '80%',
    padding: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.tansparentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'bold',
    color: COLORS.greyscale900,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.grayscale600,
  },
  content: {
    padding: 20,
  },
  mainText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.greyscale900,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  userName: {
    fontFamily: 'bold',
    color: COLORS.primary,
  },
  confirmationText: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'semiBold',
    color: COLORS.greyscale900,
    marginBottom: 12,
  },
  confirmationPoints: {
    marginBottom: 24,
  },
  bulletPoint: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.grayscale700,
    lineHeight: 22,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 12,
    backgroundColor: COLORS.tansparentPrimary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkIcon: {
    width: 12,
    height: 12,
    tintColor: COLORS.white,
  },
  checkboxText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'semiBold',
    color: COLORS.primary,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.grayscale300,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'semiBold',
    color: COLORS.grayscale700,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: COLORS.grayscale300,
  },
  acceptButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'bold',
    color: COLORS.white,
  },
  acceptButtonTextDisabled: {
    color: COLORS.grayscale500,
  },
});

export default AcceptConfirmationModal;
