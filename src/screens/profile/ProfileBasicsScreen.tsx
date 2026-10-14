import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme';
import { fonts } from '../../theme/typography';
import { AuthButton } from '../../components/common/AuthButton';
import { useUser } from '../../context/UserContext';
import { upsertCurrentUserProfile, setBasicsCompletionStatus } from '../../lib/database';
import { RootStackParamList } from '../../navigation/AppNavigator';

type ProfileBasicsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProfileBasics'>;

// Same option sets as ProfileFormScreen's equivalent fields, kept in sync by
// hand (not imported from there - that file's lists are inline consts, not
// exported) so a user who answers here and later opens the full form sees
// the same choices, not a different vocabulary for the same question.
const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];
const EDUCATION_OPTIONS = ['High School', 'Bachelors', 'Masters', 'PhD', 'Diploma'];
const PROFESSION_OPTIONS = ['Engineer', 'Doctor', 'Lawyer', 'Business', 'Teaching', 'Government', 'IT', 'Finance', 'Healthcare', 'Other'];
const HEIGHT_OPTIONS = ['4\'10"', '4\'11"', '5\'0"', '5\'2"', '5\'4"', '5\'6"', '5\'8"', '5\'10"', '6\'0"', '6\'2"', '6\'4"'];
const PRAYER_OPTIONS = ['5 times daily', '3-4 times daily', '1-2 times daily', 'Sometimes', 'Rarely', 'Never'];
const SKIN_TONE_OPTIONS = ['Fair', 'Medium', 'Olive', 'Dark', 'Very Fair'];
const INCOME_OPTIONS = ['Not specified', 'Under 50K', '50K-100K', '100K-200K', '200K-500K', '500K-1M', '1M+'];

const MIN_AGE = 18;
const MAX_AGE = 90;

function OptionField({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.fieldRow} onPress={() => setOpen(true)}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.fieldValueRow}>
          <Text style={[styles.fieldValue, !value && styles.fieldValuePlaceholder]} numberOfLines={1}>
            {value || 'Select'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={theme.colors.faintText} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView style={styles.modalList}>
              {options.map((option) => (
                <Pressable
                  key={option}
                  style={styles.optionRow}
                  onPress={() => {
                    onSelect(option);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, value === option && styles.optionTextSelected]}>{option}</Text>
                  {value === option && (
                    <MaterialCommunityIcons name="check" size={18} color={theme.colors.emerald} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.modalCancel} onPress={() => setOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function ProfileBasicsScreen() {
  const navigation = useNavigation<ProfileBasicsNavigationProp>();
  const { selectedGender } = useUser();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [location, setLocation] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [profession, setProfession] = useState('');
  const [height, setHeight] = useState('');
  const [prayerFrequency, setPrayerFrequency] = useState('');
  const [smokerDrugs, setSmokerDrugs] = useState('');
  const [skinColour, setSkinColour] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToTabs = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Tabs' }],
      })
    );
  };

  const handleSkip = async () => {
    await setBasicsCompletionStatus(true);
    goToTabs();
  };

  const handleSave = async () => {
    const ageNumber = parseInt(age, 10);

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!age.trim() || Number.isNaN(ageNumber) || ageNumber < MIN_AGE || ageNumber > MAX_AGE) {
      setError(`Please enter a valid age (${MIN_AGE}-${MAX_AGE}).`);
      return;
    }
    if (!maritalStatus) {
      setError('Please select your marital status.');
      return;
    }
    if (!location.trim()) {
      setError('Please enter your location.');
      return;
    }
    if (!educationLevel) {
      setError('Please select your education level.');
      return;
    }
    if (!profession) {
      setError('Please select your profession.');
      return;
    }

    setError(null);
    setSaving(true);

    // Age -> an approximate date of birth (Jan 1 of the birth year) - this
    // screen only asks for a round age, not an exact birthdate. The full
    // ProfileForm's own Date of Birth field overwrites this with an exact
    // value whenever the user fills it in later.
    const birthYear = new Date().getFullYear() - ageNumber;
    const approximateDateOfBirth = `${birthYear}-01-01`;

    const result = await upsertCurrentUserProfile(
      {
        name: name.trim(),
        dateOfBirth: approximateDateOfBirth,
        maritalStatus,
        currentCity: location.trim(),
        educationLevel,
        profession,
        height,
        prayerFrequency,
        smokerDrugs,
        skinColour,
        monthlyIncome,
      },
      selectedGender || 'male'
    );

    if (result.error || !result.data) {
      setSaving(false);
      console.error('Basics save failed:', result.error?.message);
      setError('Unable to save right now. Please try again.');
      return;
    }

    await setBasicsCompletionStatus(true);
    setSaving(false);
    goToTabs();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Almost there</Text>
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>
          A few quick basics so we can show you better matches right away.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>About you</Text>

          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Your full name"
            placeholderTextColor={theme.colors.faintText}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.inputLabel}>Age</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 27"
            placeholderTextColor={theme.colors.faintText}
            keyboardType="number-pad"
            value={age}
            onChangeText={setAge}
            maxLength={2}
          />

          <OptionField
            label="Marital status"
            value={maritalStatus}
            options={MARITAL_STATUS_OPTIONS}
            onSelect={setMaritalStatus}
          />

          <Text style={styles.inputLabel}>Location</Text>
          <TextInput
            style={styles.textInput}
            placeholder="City, country"
            placeholderTextColor={theme.colors.faintText}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Education & career</Text>
          <OptionField label="Education" value={educationLevel} options={EDUCATION_OPTIONS} onSelect={setEducationLevel} />
          <OptionField label="Profession" value={profession} options={PROFESSION_OPTIONS} onSelect={setProfession} />
          <OptionField label="Average income per month" value={monthlyIncome} options={INCOME_OPTIONS} onSelect={setMonthlyIncome} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Lifestyle & faith</Text>
          <OptionField label="Height" value={height} options={HEIGHT_OPTIONS} onSelect={setHeight} />
          <OptionField label="Prayers" value={prayerFrequency} options={PRAYER_OPTIONS} onSelect={setPrayerFrequency} />
          <OptionField label="Skin tone" value={skinColour} options={SKIN_TONE_OPTIONS} onSelect={setSkinColour} />

          <Text style={styles.fieldLabel}>Smoking</Text>
          <View style={styles.toggleRow}>
            {['No', 'Yes'].map((option) => (
              <Pressable
                key={option}
                style={[styles.togglePill, smokerDrugs === option && styles.togglePillActive]}
                onPress={() => setSmokerDrugs(option)}
              >
                <Text style={[styles.toggleText, smokerDrugs === option && styles.toggleTextActive]}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <AuthButton label={saving ? '' : 'Save & continue'} onPress={handleSave} disabled={saving}>
            {saving && <ActivityIndicator color="#fff" />}
          </AuthButton>
        </View>

        <Pressable style={styles.skipLink} onPress={handleSkip} disabled={saving}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.ivory,
  },
  scrollContent: {
    padding: 22,
    paddingTop: 36,
    paddingBottom: 40,
  },
  eyebrow: {
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.gold,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 27,
    color: theme.colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    color: theme.colors.mutedText,
    lineHeight: 21,
    marginBottom: 24,
  },
  card: {
    backgroundColor: theme.colors.invitationCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  cardSectionLabel: {
    fontFamily: fonts.labelBold,
    fontSize: 13,
    color: theme.colors.emerald,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: theme.colors.mutedText,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: theme.colors.ivory,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.colors.ink,
  },
  fieldRow: {
    marginTop: 10,
  },
  fieldLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: theme.colors.mutedText,
    marginBottom: 6,
  },
  fieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.ivory,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  fieldValue: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.colors.ink,
    flex: 1,
  },
  fieldValuePlaceholder: {
    color: theme.colors.faintText,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  togglePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.ivory,
  },
  togglePillActive: {
    backgroundColor: theme.colors.emerald,
    borderColor: theme.colors.emerald,
  },
  toggleText: {
    fontFamily: fonts.labelBold,
    fontSize: 14,
    color: theme.colors.mutedText,
  },
  toggleTextActive: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 26, 23, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.invitationCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 34,
    maxHeight: '75%',
  },
  modalTitle: {
    fontFamily: fonts.labelBold,
    fontSize: 17,
    color: theme.colors.ink,
    marginBottom: 14,
  },
  modalList: {
    maxHeight: 360,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  optionText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.colors.ink,
  },
  optionTextSelected: {
    fontFamily: fonts.labelBold,
    color: theme.colors.emerald,
  },
  modalCancel: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    color: theme.colors.mutedText,
    fontFamily: fonts.bodyMedium,
  },
  errorText: {
    color: theme.colors.pomegranateBright,
    fontFamily: fonts.body,
    fontSize: 14,
    marginBottom: 14,
  },
  buttonContainer: {
    marginBottom: 14,
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipText: {
    fontFamily: fonts.bodyMedium,
    color: theme.colors.mutedText,
    fontSize: 14,
  },
});
