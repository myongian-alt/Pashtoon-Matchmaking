import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface LoginPromptModalProps {
  visible: boolean;
  onLoginWithEmail: () => void;
  onLoginWithPhone: () => void;
  onDismiss: () => void;
}

export function LoginPromptModal({
  visible,
  onLoginWithEmail,
  onLoginWithPhone,
  onDismiss,
}: LoginPromptModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={onDismiss}>
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons name="lock-outline" size={48} color={theme.colors.primary} />
            <Text style={styles.title}>Sign In Required</Text>
            <Text style={styles.subtitle}>
              To view profile details and connect with matches, please sign in first.
            </Text>
          </View>

          {/* Login Options */}
          <View style={styles.optionsContainer}>
            <Pressable style={styles.option} onPress={onLoginWithEmail}>
              <View style={styles.optionIconContainer}>
                <MaterialCommunityIcons name="email-outline" size={28} color="#fff" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Sign In with Email</Text>
                <Text style={styles.optionSubtitle}>Use your email address</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.primary} />
            </Pressable>

            <Pressable style={styles.option} onPress={onLoginWithPhone}>
              <View style={styles.optionIconContainer}>
                <MaterialCommunityIcons name="phone-outline" size={28} color="#fff" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Sign In with Phone</Text>
                <Text style={styles.optionSubtitle}>Use your phone number</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.primary} />
            </Pressable>
          </View>

          {/* Benefits Info */}
          <View style={styles.benefitsBox}>
            <Text style={styles.benefitsTitle}>After signing in, you can:</Text>
            <View style={styles.benefitRow}>
              <MaterialCommunityIcons name="check" size={16} color={theme.colors.primary} />
              <Text style={styles.benefitText}>View complete profile details</Text>
            </View>
            <View style={styles.benefitRow}>
              <MaterialCommunityIcons name="check" size={16} color={theme.colors.primary} />
              <Text style={styles.benefitText}>Get matched with compatible partners</Text>
            </View>
            <View style={styles.benefitRow}>
              <MaterialCommunityIcons name="check" size={16} color={theme.colors.primary} />
              <Text style={styles.benefitText}>Send and receive messages</Text>
            </View>
          </View>

          {/* Continue as Guest Option */}
          <Pressable style={styles.guestButton} onPress={onDismiss}>
            <Text style={styles.guestButtonText}>Continue browsing as guest</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Georgia',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  optionsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F5EE',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8DDD0',
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  benefitsBox: {
    backgroundColor: '#F5FBF7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D5E6DB',
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  benefitText: {
    fontSize: 13,
    color: theme.colors.text,
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  guestButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
