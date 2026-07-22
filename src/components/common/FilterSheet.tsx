import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

const FILTER_OPTIONS = [
  'Gender',
  'Age Range',
  'Religion',
  'Education',
  'Location',
];

export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Refine Search</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeLabel}>Close</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>Choose filters to discover curated matches faster.</Text>

          {FILTER_OPTIONS.map(option => (
            <Pressable key={option} style={styles.optionButton} onPress={() => {}}>
              <Text style={styles.optionText}>{option}</Text>
              <Text style={styles.optionHint}>Select</Text>
            </Pressable>
          ))}

          <Pressable style={styles.applyButton} onPress={onClose}>
            <Text style={styles.applyLabel}>Apply Filters</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 15, 24, 0.54)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 34,
    minHeight: '45%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  closeButton: {
    padding: 8,
  },
  closeLabel: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  optionButton: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSoft,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  optionHint: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  applyButton: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyLabel: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
