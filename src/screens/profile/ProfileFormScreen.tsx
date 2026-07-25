import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme';
import { useForm } from '../../context/FormContext';
import { useUser } from '../../context/UserContext';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Country, City } from 'country-state-city';
import { upsertCurrentUserProfile, syncProfilePhotos } from '../../lib/database';
import { uploadProfilePhotoAsset } from '../../lib/storage';
import { buildSelfProfileFromForm } from '../../lib/selfProfile';
import { ModernMuslimAvatar } from '../../components/common/ModernMuslimAvatar';
import { AppBottomNav } from '../../components/common/AppBottomNav';

type ProfileFormNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProfileForm'>;
type FormPhase = 'required' | 'optional';

// Everything a profile needs to be usable for matching. Validated before the
// user can move past this phase - there's no way to skip these.
const MANDATORY_FIELDS: any[] = [
  { key: 'name', label: 'Full Name', type: 'text' },
  { key: 'dateOfBirth', label: 'Date of Birth', type: 'text', placeholder: 'YYYY-MM-DD' },
  { key: 'phoneNumber', label: 'Phone Number', type: 'text' },
  { key: 'maritalStatus', label: 'Marital Status', type: 'dropdown', options: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'] },
  { key: 'nationality', label: 'Country', type: 'dropdown', options: [] },
  { key: 'currentCity', label: 'Current City', type: 'dropdown', options: [] },
  { key: 'educationLevel', label: 'Education', type: 'dropdown', options: ['High School', 'Bachelors', 'Masters', 'PhD', 'Diploma'] },
  { key: 'profession', label: 'Profession', type: 'dropdown', options: ['Engineer', 'Doctor', 'Lawyer', 'Business', 'Teaching', 'Government', 'IT', 'Finance', 'Healthcare', 'Other'] },
];

function getMissingMandatoryFields(formData: any): string[] {
  return MANDATORY_FIELDS.filter((field) => !String(formData[field.key] || '').trim()).map((field) => field.label);
}

// Everything else - the user can browse as much or as little of this as they
// want, and finish at any point without visiting every section.
const optionalSections = [
  { title: 'Photos', icon: 'image-multiple' },
  { title: 'Physical', icon: 'heart-pulse' },
  { title: 'Career', icon: 'briefcase' },
  { title: 'Financial', icon: 'cash' },
  { title: 'Religious', icon: 'cross' },
  { title: 'Values', icon: 'scale-balance' },
  { title: 'Family', icon: 'family-tree' },
  { title: 'Emotional', icon: 'brain' },
  { title: 'Lifestyle', icon: 'palette' },
  { title: 'Marriage', icon: 'heart-multiple' },
];

const optionalFieldConfigs: { [key: number]: any[] } = {
  0: [ // Photos
    { key: 'profilePhoto', label: 'Choose Your Photo', type: 'avatar' },
    { key: 'galleryPhotos', label: 'Gallery Photos', type: 'gallery' },
    { key: 'aboutMe', label: 'About Me', type: 'textarea' },
  ],
  1: [ // Physical & Health
    { key: 'height', label: 'Height', type: 'dropdown', options: ['4\'10"', '4\'11"', '5\'0"', '5\'2"', '5\'4"', '5\'6"', '5\'8"', '5\'10"', '6\'0"', '6\'2"', '6\'4"'] },
    { key: 'weight', label: 'Weight', type: 'dropdown', options: ['Under 50kg', '50-60kg', '60-70kg', '70-80kg', '80-90kg', '90-100kg', '100kg+'] },
    { key: 'bodyType', label: 'Body Type', type: 'dropdown', options: ['Slim', 'Athletic', 'Average', 'Curvy', 'Heavyset'] },
    { key: 'skinColour', label: 'Skin Colour', type: 'dropdown', options: ['Fair', 'Medium', 'Olive', 'Dark', 'Very Fair'] },
    { key: 'eyeColour', label: 'Eye Colour', type: 'dropdown', options: ['Black', 'Brown', 'Hazel', 'Green', 'Blue'] },
    { key: 'bloodGroup', label: 'Blood Group', type: 'dropdown', options: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] },
    { key: 'exerciseFrequency', label: 'Exercise Frequency', type: 'dropdown', options: ['Never', '1-2x/week', '3-4x/week', '5-6x/week', 'Daily'] },
  ],
  2: [ // Career
    { key: 'employmentStatus', label: 'Employment Status', type: 'dropdown', options: ['Employed', 'Self-Employed', 'Business Owner', 'Freelancer', 'Student', 'Homemaker', 'Retired'] },
    { key: 'monthlyIncome', label: 'Monthly Income', type: 'dropdown', options: ['Not specified', 'Under 50K', '50K-100K', '100K-200K', '200K-500K', '500K-1M', '1M+'] },
    { key: 'degreeeName', label: 'Degree Name', type: 'text', placeholder: 'e.g., BS Computer Science' },
    { key: 'futureCareerPlans', label: 'Future Career Plans', type: 'textarea' },
  ],
  3: [ // Financial
    { key: 'ownsProperty', label: 'Own Land/Property?', type: 'yesno' },
    { key: 'ancestralLand', label: 'Ancestral Land/House?', type: 'yesno' },
    { key: 'savings', label: 'Savings/Investments?', type: 'yesno' },
    { key: 'debts', label: 'Debts/Loans?', type: 'yesno' },
    { key: 'ownsCar', label: 'Own a Car?', type: 'yesno' },
    { key: 'moneyManagement', label: 'Money Management Style', type: 'dropdown', options: ['Very Careful', 'Balanced', 'Moderate Spender', 'High Spender'] },
  ],
  4: [ // Religious
    { key: 'prayerFrequency', label: 'Prayer Frequency', type: 'dropdown', options: ['5 times daily', '3-4 times daily', '1-2 times daily', 'Sometimes', 'Rarely', 'Never'] },
    { key: 'fastRamadan', label: 'Fast in Ramadan?', type: 'yesno' },
    { key: 'givesZakat', label: 'Give Zakat/Charity?', type: 'yesno' },
    { key: 'religionImportance', label: 'Religion Importance', type: 'dropdown', options: ['Very Important', 'Important', 'Moderate', 'Not Important'] },
    { key: 'spouseReligiosity', label: 'Spouse Religiosity Preference', type: 'dropdown', options: ['More Religious', 'Equally Religious', 'Less Religious', 'Does not matter'] },
  ],
  5: [ // Values
    { key: 'importantValue', label: 'Most Important Value', type: 'dropdown', options: ['Honesty', 'Loyalty', 'Family', 'Faith', 'Kindness', 'Education', 'Ambition', 'Respect'] },
    { key: 'handleDisagreements', label: 'Handle Disagreements', type: 'dropdown', options: ['Discuss calmly', 'Take time apart', 'Seek advice', 'Compromise', 'Agree to disagree'] },
    { key: 'genderRoles', label: 'Gender Roles Preference', type: 'dropdown', options: ['Traditional', 'Modern', 'Balanced', 'No preference'] },
    { key: 'polygamyView', label: 'View on Polygamy', type: 'dropdown', options: ['Acceptable', 'Not acceptable', 'Situational', 'No preference'] },
  ],
  6: [ // Family
    { key: 'familyStructure', label: 'Family Structure', type: 'dropdown', options: ['Joint family', 'Nuclear family', 'Extended family'] },
    { key: 'familyCloseness', label: 'Family Closeness', type: 'dropdown', options: ['Very Close', 'Close', 'Moderate', 'Distant'] },
    { key: 'liveWithInlaws', label: 'Live with In-laws?', type: 'yesno' },
    { key: 'socializeFrequency', label: 'Socialize Frequency', type: 'dropdown', options: ['Very often', 'Often', 'Sometimes', 'Rarely', 'Never'] },
    { key: 'celebrateCustoms', label: 'Celebrate Customs?', type: 'yesno' },
  ],
  7: [ // Emotional
    { key: 'handleStress', label: 'Handle Stress', type: 'dropdown', options: ['Talking helps', 'Exercise helps', 'Alone time helps', 'Prayer helps', 'Other activities'] },
    { key: 'personality', label: 'Personality', type: 'dropdown', options: ['Introvert', 'Extrovert', 'Ambivert'] },
    { key: 'forgivenessLevel', label: 'Forgiveness Level', type: 'dropdown', options: ['Very forgiving', 'Forgiving', 'Moderate', 'Hold grudges', 'Very difficult to forgive'] },
    { key: 'loveLanguage', label: 'Love Language', type: 'dropdown', options: ['Words of affirmation', 'Acts of service', 'Receiving gifts', 'Quality time', 'Physical touch'] },
    { key: 'showAffection', label: 'Show Affection', type: 'dropdown', options: ['Very openly', 'Openly', 'Moderate', 'Reserved'] },
  ],
  8: [ // Lifestyle
    { key: 'outlook', label: 'Outlook', type: 'dropdown', options: ['Optimistic', 'Realistic', 'Pessimistic'] },
    { key: 'tradModernOutlook', label: 'Outlook on Life', type: 'dropdown', options: ['Traditional', 'Modern', 'Balanced'] },
    { key: 'musicPreference', label: 'Music Preference', type: 'dropdown', options: ['Classical', 'Sufi', 'Pop', 'Naat', 'None', 'Varied'] },
    { key: 'hobbies', label: 'Hobbies & Interests', type: 'textarea' },
  ],
  9: [ // Marriage
    { key: 'wantToMarryWhen', label: 'When to Marry?', type: 'dropdown', options: ['Immediately', '1-3 months', '3-6 months', '6-12 months', '1-2 years', 'No rush'] },
    { key: 'preferredSpouseAge', label: 'Preferred Spouse Age', type: 'dropdown', options: ['18-25', '25-30', '30-35', '35-40', '40+', 'No preference'] },
    { key: 'preferredEducation', label: 'Preferred Education', type: 'dropdown', options: ['High School', 'Bachelors', 'Masters', 'PhD', 'No preference'] },
    { key: 'preferredProfession', label: 'Preferred Profession', type: 'dropdown', options: ['Any', 'Professional', 'Business', 'Service', 'Education'] },
    { key: 'preferWorkingSpouse', label: 'Spouse Work Status', type: 'dropdown', options: ['Working', 'Homemaker', 'No preference'] },
    { key: 'expectedKids', label: 'Expected Kids', type: 'dropdown', options: ['0', '1', '2', '3', '3+', 'Undecided'] },
    { key: 'idealMarriage', label: 'About Me & Marriage Vision', type: 'textarea' },
  ],
};

export default function ProfileFormScreen() {
  const navigation = useNavigation<ProfileFormNavigationProp>();
  const { formData, updateField, calculateProfileStrength } = useForm();
  const { setProfileCompleted, selectedGender, isAuthenticated, userId } = useUser();
  const [phase, setPhase] = useState<FormPhase>(() =>
    getMissingMandatoryFields(formData).length === 0 ? 'optional' : 'required'
  );
  const [currentSection, setCurrentSection] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  const profileStrength = calculateProfileStrength();

  const countries = useMemo(() => Country.getAllCountries(), []);
  const countryOptions = useMemo(
    () => countries.map((country) => country.name).sort((a, b) => a.localeCompare(b)),
    [countries]
  );

  const selectedCountryCode = useMemo(() => {
    const country = countries.find((item) => item.name === formData.nationality);
    return country?.isoCode;
  }, [countries, formData.nationality]);

  const cityOptions = useMemo(() => {
    if (!selectedCountryCode) {
      return [];
    }

    const cities = City.getCitiesOfCountry(selectedCountryCode) || [];
    const names = Array.from(new Set(cities.map((city) => city.name).filter(Boolean)));
    return names.sort((a, b) => a.localeCompare(b));
  }, [selectedCountryCode]);

  const handleViewMyProfile = () => {
    navigation.navigate('ProfileDetail', { profile: buildSelfProfileFromForm(formData, selectedGender) });
  };

  const updateFieldByKey = (key: string, value: string) => {
    if (key === 'nationality') {
      updateField('nationality', value);
      updateField('currentCity', '');
      return;
    }

    updateField(key as any, value);
  };

  const handleRequiredContinue = () => {
    const missing = getMissingMandatoryFields(formData);
    if (missing.length > 0) {
      Alert.alert('Missing required information', `Please complete: ${missing.join(', ')}`);
      return;
    }

    setPhase('optional');
  };

  const handleFinishProfile = async () => {
    const missing = getMissingMandatoryFields(formData);
    if (missing.length > 0) {
      Alert.alert('Missing required information', `Please complete: ${missing.join(', ')}`);
      setPhase('required');
      return;
    }

    if (isAuthenticated) {
      setSavingProfile(true);
      const formDataWithStrength = { ...formData, profileStrength };
      const result = await upsertCurrentUserProfile(formDataWithStrength, selectedGender || 'male');

      if (result.error || !result.data) {
        setSavingProfile(false);
        Alert.alert('Profile Save Failed', result.error?.message || 'Unable to save your profile right now.');
        return;
      }

      if (userId) {
        await syncProfilePhotos(userId, result.data.id, {
          profilePhoto: formData.profilePhoto,
          galleryPhotos: formData.galleryPhotos,
        });
      }

      setSavingProfile(false);
    }

    // Persist completion so user is not prompted to re-complete the form.
    setProfileCompleted(true);
    navigation.navigate('ProfileCompletion');
  };

  if (phase === 'required') {
    const resolvedFields = MANDATORY_FIELDS.map((field) => {
      if (field.key === 'nationality') return { ...field, options: countryOptions };
      if (field.key === 'currentCity') return { ...field, options: cityOptions };
      return field;
    });

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Required Information</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${profileStrength}%` }]} />
            </View>
            <Text style={styles.progressText}>{profileStrength}%</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tell us about yourself</Text>
            <Text style={styles.sectionSubtitle}>
              These details are required so matches can find and understand your profile.
            </Text>
            {resolvedFields.map((field) => (
              <FormField
                key={field.key}
                field={field}
                value={String(formData[field.key as keyof typeof formData] ?? '')}
                onChange={(v) => updateFieldByKey(field.key, v)}
              />
            ))}
          </View>

          <Pressable style={styles.buttonPrimaryFull} onPress={handleRequiredContinue}>
            <Text style={styles.buttonPrimaryText}>Continue</Text>
          </Pressable>
        </ScrollView>

        <AppBottomNav activeTab="Discover" />
      </View>
    );
  }

  const isLastOptionalSection = currentSection === optionalSections.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Additional Details</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${profileStrength}%` }]} />
          </View>
          <Text style={styles.progressText}>{profileStrength}%</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.editRequiredLink} onPress={() => setPhase('required')}>
          <MaterialCommunityIcons name="pencil-outline" size={14} color={theme.colors.primary} />
          <Text style={styles.editRequiredLinkText}>Edit required information</Text>
        </Pressable>

        <Text style={styles.optionalIntro}>
          Everything below is optional. Add as much or as little as you like, or finish now.
        </Text>

        <ProfilePreview formData={formData} />

        <View style={styles.sectionNav}>
          {optionalSections.map((section, index) => (
            <Pressable
              key={index}
              style={[styles.sectionButton, currentSection === index && styles.sectionButtonActive]}
              onPress={() => setCurrentSection(index)}
            >
              <MaterialCommunityIcons name={section.icon as any} size={16} color={currentSection === index ? '#fff' : theme.colors.primary} />
              <Text style={[styles.sectionButtonText, currentSection === index && styles.sectionButtonTextActive]}>{section.title}</Text>
            </Pressable>
          ))}
        </View>

        <OptionalSectionRenderer
          section={currentSection}
          formData={formData}
          updateField={updateFieldByKey}
        />

        <View style={styles.navigationButtons}>
          <Pressable
            style={[styles.button, currentSection === 0 && styles.buttonDisabled]}
            disabled={currentSection === 0}
            onPress={() => setCurrentSection(currentSection - 1)}
          >
            <Text style={[styles.buttonText, currentSection === 0 && styles.buttonTextDisabled]}>← Previous</Text>
          </Pressable>
          <Pressable
            style={styles.buttonPrimary}
            onPress={isLastOptionalSection ? handleFinishProfile : () => setCurrentSection(currentSection + 1)}
            disabled={savingProfile}
          >
            <Text style={styles.buttonPrimaryText}>
              {isLastOptionalSection ? (savingProfile ? 'Saving...' : 'Finish Profile') : 'Next →'}
            </Text>
          </Pressable>
        </View>

        {!isLastOptionalSection && (
          <Pressable style={styles.skipButton} onPress={handleFinishProfile} disabled={savingProfile}>
            <Text style={styles.skipButtonText}>{savingProfile ? 'Saving...' : 'Skip remaining & finish'}</Text>
          </Pressable>
        )}

        <Pressable style={styles.viewProfileButton} onPress={handleViewMyProfile}>
          <MaterialCommunityIcons name="eye-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.viewProfileButtonText}>View My Profile</Text>
        </Pressable>
      </ScrollView>

      <AppBottomNav activeTab="Discover" />
    </View>
  );
}

function OptionalSectionRenderer({
  section,
  formData,
  updateField,
}: {
  section: number;
  formData: any;
  updateField: (key: string, value: string) => void;
}) {
  const sectionTitle = optionalSections[section].title;
  const fields = optionalFieldConfigs[section] || [];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      {fields.map((field) => (
        <FormField
          key={field.key}
          field={field}
          value={formData[field.key as keyof typeof formData] || ''}
          onChange={(v) => updateField(field.key, v)}
        />
      ))}
    </View>
  );
}

function ProfilePreview({ formData }: { formData: any }) {
  const optionalFields: { [key: string]: string } = {
    profilePhoto: 'Profile Photo',
    height: 'Height',
    weight: 'Weight',
    bodyType: 'Body Type',
    skinColour: 'Skin Colour',
    eyeColour: 'Eye Colour',
    bloodGroup: 'Blood Group',
    exerciseFrequency: 'Exercise',
    degreeeName: 'Degree',
    employmentStatus: 'Employment',
    monthlyIncome: 'Income',
    futureCareerPlans: 'Career Goals',
    outlook: 'Outlook',
    tradModernOutlook: 'Tradition/Modern',
    musicPreference: 'Music',
    hobbies: 'Hobbies',
    aboutMe: 'About Me',
  };

  const filledOptional = Object.entries(optionalFields)
    .filter(([key]) => formData[key])
    .map(([key, label]) => ({ key, label, value: formData[key] }));

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewHeader}>
        <MaterialCommunityIcons name="eye" size={20} color={theme.colors.primary} />
        <Text style={styles.previewTitle}>Profile Preview</Text>
      </View>

      {filledOptional.length > 0 ? (
        <View style={styles.previewContent}>
          <Text style={styles.previewSubtitle}>Filled Information ({filledOptional.length})</Text>
          {filledOptional.map((item) => (
            <View key={item.key} style={styles.previewItem}>
              <Text style={styles.previewLabel}>{item.label}:</Text>
              <Text style={styles.previewValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.previewEmpty}>
          <MaterialCommunityIcons name="information" size={20} color="#999" />
          <Text style={styles.previewEmptyText}>No additional information filled yet</Text>
        </View>
      )}
    </View>
  );
}

function FormField({ field, value, onChange }: { field: any; value: string; onChange: (v: string) => void }) {
  const { formData, updateField } = useForm();
  const { userId } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownQuery, setDropdownQuery] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePickImage = async (target: 'profilePhoto' | 'gallery', index?: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to upload pictures.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: target === 'profilePhoto',
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    let uri = result.assets[0].uri;

    if (userId) {
      const photoType = target === 'profilePhoto' ? 'profile_picture' : 'gallery';
      const currentGalleryLength = Array.isArray(formData.galleryPhotos) ? formData.galleryPhotos.length : 0;
      const slotIndex = target === 'profilePhoto' ? 0 : typeof index === 'number' ? index : currentGalleryLength;

      setUploadingPhoto(true);
      const uploadResult = await uploadProfilePhotoAsset(userId, uri, photoType, slotIndex);
      setUploadingPhoto(false);

      if (uploadResult.error || !uploadResult.publicUrl) {
        Alert.alert('Upload failed', 'Could not upload this photo. It will only be saved on this device for now.');
      } else {
        uri = uploadResult.publicUrl;
      }
    }

    if (target === 'profilePhoto') {
      updateField('profilePhoto', uri);
      return;
    }

    const currentGallery = Array.isArray(formData.galleryPhotos) ? [...formData.galleryPhotos] : [];

    if (typeof index === 'number') {
      currentGallery[index] = uri;
    } else if (currentGallery.length < 5) {
      currentGallery.push(uri);
    } else {
      currentGallery[currentGallery.length - 1] = uri;
    }

    updateField('galleryPhotos', currentGallery.slice(0, 5));
  };

  if (field.type === 'text') {
    return (
      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{field.label}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          placeholderTextColor="#999"
        />
      </View>
    );
  }

  if (field.type === 'textarea') {
    return (
      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{field.label}</Text>
        </View>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={value}
          onChangeText={onChange}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />
      </View>
    );
  }

  if (field.type === 'yesno') {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{field.label}</Text>
        <View style={styles.yesnoContainer}>
          <Pressable
            style={[styles.yesnoButton, value === 'Yes' && styles.yesnoButtonActive]}
            onPress={() => onChange('Yes')}
          >
            <MaterialCommunityIcons name="check-circle" size={20} color={value === 'Yes' ? '#fff' : theme.colors.primary} />
            <Text style={[styles.yesnoText, value === 'Yes' && styles.yesnoTextActive]}>Yes</Text>
          </Pressable>
          <Pressable
            style={[styles.yesnoButton, value === 'No' && styles.yesnoButtonActive]}
            onPress={() => onChange('No')}
          >
            <MaterialCommunityIcons name="close-circle" size={20} color={value === 'No' ? '#fff' : theme.colors.primary} />
            <Text style={[styles.yesnoText, value === 'No' && styles.yesnoTextActive]}>No</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (field.type === 'dropdown') {
    const options: string[] = Array.isArray(field.options) ? field.options : [];
    const filteredOptions = options.filter((option) => option.toLowerCase().includes(dropdownQuery.toLowerCase()));

    return (
      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{field.label}</Text>
        </View>
        <Pressable
          style={styles.dropdownButton}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
            {value || `Select ${field.label.toLowerCase()}`}
          </Text>
          <MaterialCommunityIcons
            name={showDropdown ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.primary}
          />
        </Pressable>
        {showDropdown && (
          <View style={styles.dropdownMenu}>
            {options.length > 12 ? (
              <TextInput
                style={styles.dropdownSearchInput}
                value={dropdownQuery}
                onChangeText={setDropdownQuery}
                placeholder="Search..."
                placeholderTextColor="#999"
              />
            ) : null}

            <ScrollView style={styles.dropdownOptionsScroller} nestedScrollEnabled>
              {filteredOptions.map((option: string) => (
                <Pressable
                  key={option}
                  style={[styles.dropdownOption, value === option && styles.dropdownOptionSelected]}
                  onPress={() => {
                    onChange(option);
                    setDropdownQuery('');
                    setShowDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, value === option && styles.dropdownOptionSelectedText]}>
                    {option}
                  </Text>
                  {value === option && (
                    <MaterialCommunityIcons name="check" size={18} color={theme.colors.primary} />
                  )}
                </Pressable>
              ))}
              {filteredOptions.length === 0 ? (
                <Text style={styles.dropdownEmptyText}>No options found</Text>
              ) : null}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  if (field.type === 'avatar') {
    const isImageUri = typeof value === 'string' && (value.startsWith('file:') || value.startsWith('http'));

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{field.label}</Text>
        <Text style={styles.avatarSubtext}>
          {uploadingPhoto ? 'Uploading photo...' : 'Select a profile photo or upload your own'}
        </Text>
        {isImageUri && (
          <View style={styles.avatarPreviewContainer}>
            <Image source={{ uri: value }} style={styles.avatarPreviewImage} />
          </View>
        )}
        <View style={styles.avatarContainer}>
          <Pressable
            style={[styles.avatarOption, value === 'male-avatar' && styles.avatarOptionSelected]}
            onPress={() => onChange('male-avatar')}
            disabled={uploadingPhoto}
          >
            <ModernMuslimAvatar gender="male" size={64} />
            <Text style={[styles.avatarOptionText, value === 'male-avatar' && styles.avatarOptionTextSelected]}>Male Avatar</Text>
          </Pressable>
          <Pressable
            style={[styles.avatarOption, value === 'female-avatar' && styles.avatarOptionSelected]}
            onPress={() => onChange('female-avatar')}
            disabled={uploadingPhoto}
          >
            <ModernMuslimAvatar gender="female" size={64} />
            <Text style={[styles.avatarOptionText, value === 'female-avatar' && styles.avatarOptionTextSelected]}>Female Avatar</Text>
          </Pressable>
          <Pressable style={styles.avatarOption} onPress={() => handlePickImage('profilePhoto')} disabled={uploadingPhoto}>
            <MaterialCommunityIcons name="cloud-upload" size={40} color="#999" />
            <Text style={styles.avatarOptionText}>Upload Photo</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (field.type === 'gallery') {
    const galleryPhotos = Array.isArray(formData.galleryPhotos) ? formData.galleryPhotos : [];

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{field.label}</Text>
        <Text style={styles.avatarSubtext}>
          {uploadingPhoto ? 'Uploading photo...' : 'Add up to 5 photos to your gallery'}
        </Text>
        <View style={styles.galleryContainer}>
          {Array.from({ length: 5 }).map((_, index) => {
            const imageUri = galleryPhotos[index];

            return (
              <Pressable
                key={index}
                style={[styles.galleryPlaceholder, imageUri ? styles.galleryFilled : null]}
                onPress={() => handlePickImage('gallery', index)}
                disabled={uploadingPhoto}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.galleryImage} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="plus" size={32} color={theme.colors.primary} />
                    <Text style={styles.galleryPlaceholderText}>Add Photo</Text>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.galleryHint}>More photos increase profile visibility and matches</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7E1C9' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8DDD0' },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF5E5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2924', marginBottom: 8, fontFamily: 'Georgia' },
  progressBar: { height: 6, backgroundColor: '#E8DDD0', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary },
  progressText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  sectionSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 14, lineHeight: 17 },
  editRequiredLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, alignSelf: 'flex-start' },
  editRequiredLinkText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  optionalIntro: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 14, lineHeight: 17 },
  sectionNav: { marginBottom: 20 },
  sectionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#FFF5E5', borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: '#F0E0D0', gap: 6 },
  sectionButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  sectionButtonText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary, flex: 1 },
  sectionButtonTextActive: { color: '#fff' },
  section: { marginBottom: 20, backgroundColor: '#FFF5E5', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F0E0D0' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1F2924', marginBottom: 12, fontFamily: 'Georgia' },
  fieldContainer: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#1F2924' },
  input: { borderWidth: 1, borderColor: '#E3D4C4', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, fontSize: 13, color: '#1F2924', backgroundColor: '#FFFFFF' },
  inputMultiline: { textAlignVertical: 'top', minHeight: 90 },
  yesnoContainer: { flexDirection: 'row', gap: 10 },
  yesnoButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3D4C4', gap: 6 },
  yesnoButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  yesnoText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  yesnoTextActive: { color: '#fff' },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3D4C4' },
  dropdownText: { fontSize: 13, fontWeight: '600', color: '#1F2924', flex: 1 },
  placeholderText: { color: '#999' },
  dropdownMenu: { marginTop: 6, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3D4C4', overflow: 'hidden' },
  dropdownSearchInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0E0D0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1F2924',
  },
  dropdownOptionsScroller: {
    maxHeight: 220,
  },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F0E0D0' },
  dropdownOptionSelected: { backgroundColor: '#FFF5E5' },
  dropdownOptionText: { fontSize: 13, color: '#1F2924', flex: 1 },
  dropdownOptionSelectedText: { fontWeight: '600', color: theme.colors.primary },
  dropdownEmptyText: {
    fontSize: 12,
    color: '#999',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  navigationButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { borderColor: '#ddd', opacity: 0.5 },
  buttonText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  buttonTextDisabled: { color: '#ccc' },
  buttonPrimary: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  buttonPrimaryFull: { paddingVertical: 14, borderRadius: 10, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonPrimaryText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  skipButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  viewProfileButton: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  viewProfileButtonText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  previewCard: { marginBottom: 16, backgroundColor: '#FFF5E5', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#D4AF37' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  previewTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.primary, fontFamily: 'Georgia' },
  previewContent: { gap: 8 },
  previewSubtitle: { fontSize: 12, fontWeight: '600', color: '#1F2924', marginBottom: 6 },
  previewItem: { paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#FFFFFF', borderRadius: 6, borderLeftWidth: 3, borderLeftColor: theme.colors.primary },
  previewLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.primary },
  previewValue: { fontSize: 12, color: '#1F2924', marginTop: 2 },
  previewEmpty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  previewEmptyText: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  avatarContainer: { flexDirection: 'row', gap: 10, marginVertical: 12 },
  avatarOption: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 2, borderColor: '#E3D4C4' },
  avatarOptionSelected: { borderColor: theme.colors.primary, backgroundColor: '#FFF5E5' },
  avatarOptionText: { fontSize: 11, fontWeight: '600', color: '#999', marginTop: 6 },
  avatarOptionTextSelected: { color: theme.colors.primary },
  avatarPreviewContainer: { alignItems: 'center', marginTop: 6, marginBottom: 6 },
  avatarPreviewImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: theme.colors.primary },
  avatarSubtext: { fontSize: 12, color: '#999', marginBottom: 8 },
  galleryContainer: { flexDirection: 'row', gap: 8, marginVertical: 12, flexWrap: 'wrap' },
  galleryPlaceholder: { width: '31%', aspectRatio: 1, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 2, borderColor: '#E3D4C4', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  galleryFilled: { borderStyle: 'solid', overflow: 'hidden' },
  galleryImage: { width: '100%', height: '100%' },
  galleryPlaceholderText: { fontSize: 10, color: '#999', fontWeight: '600' },
  galleryHint: { fontSize: 11, color: '#999', fontStyle: 'italic', marginTop: 8 },
});
