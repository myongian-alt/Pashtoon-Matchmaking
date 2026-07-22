import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { FormTextField } from '../../components/common/FormTextField';

const requiredFields = [
  { key: 'phone', label: 'Phone Number', placeholder: '+92 300 1234567', keyboardType: 'phone-pad' as const },
  { key: 'whatsapp', label: 'WhatsApp Number', placeholder: '+92 300 1234567', keyboardType: 'phone-pad' as const },
  { key: 'maritalStatus', label: 'Marital Status', placeholder: 'Single / Divorced / Widowed' },
  { key: 'age', label: 'Age', placeholder: '28', keyboardType: 'numeric' as const },
  { key: 'education', label: 'Education', placeholder: 'Master’s Degree' },
  { key: 'profession', label: 'Profession', placeholder: 'Software Engineer' },
  { key: 'country', label: 'Current Country', placeholder: 'Pakistan' },
  { key: 'city', label: 'Current City', placeholder: 'Peshawar' },
  { key: 'nationality', label: 'Nationality', placeholder: 'Pakistani' },
];

export default function ProfileFormScreen() {
  const navigation = useNavigation();
  const [formState, setFormState] = useState<Record<string, string>>({
    phone: '',
    whatsapp: '',
    maritalStatus: '',
    age: '',
    education: '',
    profession: '',
    country: '',
    city: '',
    nationality: '',
  });

  const progress = useMemo(() => {
    const completed = requiredFields.filter((field) => formState[field.key].trim().length > 0).length;
    return Math.round((completed / requiredFields.length) * 100);
  }, [formState]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBlock}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <Text style={styles.sectionHint}>Fill the key details that help families match with your profile.</Text>
      </View>

      <View style={styles.progressPill}>
        <Text style={styles.progressLabel}>Section progress</Text>
        <Text style={styles.progressValue}>{progress}%</Text>
      </View>

      {requiredFields.map((field) => (
        <FormTextField
          key={field.key}
          label={field.label}
          value={formState[field.key]}
          onChangeText={(value) => setFormState((prev) => ({ ...prev, [field.key]: value }))}
          placeholder={field.placeholder}
          keyboardType={field.keyboardType}
        />
      ))}

      <View style={styles.actionsRow}>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('ProfileCompletion' as never)}>
          <Text style={styles.secondaryLabel}>Save Draft</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Tabs' as never)}>
          <Text style={styles.primaryLabel}>Continue</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => navigation.navigate('Tabs' as never)} style={styles.linkRow}>
        <Text style={styles.linkText}>Continue later</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  headerBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  sectionHint: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  progressPill: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  progressValue: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryLabel: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  primaryLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  linkRow: {
    marginTop: 18,
    alignItems: 'center',
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
