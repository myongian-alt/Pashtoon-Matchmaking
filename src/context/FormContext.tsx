import React, { createContext, useState, ReactNode } from 'react';

export interface ProfileFormData {
  // Basic Information
  name: string;
  dateOfBirth: string;
  maritalStatus: string;
  hasKids: string;
  kidsCount: string;
  cityOfBirth: string;
  currentCity: string;
  nationality: string;
  languages: string[];
  sect: string;
  phoneNumber: string;

  // Physical & Health
  height: string;
  weight: string;
  bodyType: string;
  skinColour: string;
  eyeColour: string;
  bloodGroup: string;
  disabilities: string;
  wearsGlasses: string;
  smokerDrugs: string;
  medicalConditions: string;
  exerciseFrequency: string;

  // Education & Career
  educationLevel: string;
  degreeeName: string;
  employmentStatus: string;
  businessDetails: string;
  profession: string;
  monthlyIncome: string;
  incomeSource: string;
  workTimings: string;
  futureCareerPlans: string;

  // Financial Status
  ownsProperty: string;
  ancestralLand: string;
  savings: string;
  debts: string;
  ownsCar: string;
  moneyManagement: string;

  // Spiritual & Religious
  prayerFrequency: string;
  fastRamadan: string;
  givesZakat: string;
  religionImportance: string;
  spouseReligiosity: string;
  religionDifferences: string;

  // Moral & Values
  importantValue: string;
  handleDisagreements: string;
  genderRoles: string;
  polygamyView: string;
  truthfulness: string;

  // Social & Family
  familyStructure: string;
  familyCloseness: string;
  liveWithInlaws: string;
  socializeFrequency: string;
  celebrateCustoms: string;
  tribalImportance: string;

  // Psychological & Emotional
  handleStress: string;
  personality: string;
  forgivenessLevel: string;
  loveLanguage: string;
  showAffection: string;
  emotionalSupportImportance: string;

  // Personality & Lifestyle
  outlook: string;
  tradModernOutlook: string;
  casualDress: string;
  shoeStyle: string;
  weekendSpending: string;
  livingPreference: string;
  sleepSchedule: string;
  musicPreference: string;
  likesPets: string;
  travelPreference: string;
  hobbies: string;
  favoriteFoodBooksMusic: string;

  // Marriage & Future Vision
  wantToMarryWhen: string;
  preferredSpouseAge: string;
  preferredSpouseHeight: string;
  preferredEducation: string;
  preferredProfession: string;
  preferWorkingSpouse: string;
  expectedKids: string;
  willSponsorSpouse: string;
  housingSituation: string;
  spouseCooking: string;
  allowSpouseWork: string;
  shareHouseholdResponsibilities: string;
  idealMarriage: string;

  // Profile Media
  profilePhoto: string;
  galleryPhotos: string[];
  profileStrength: number;
  isVerified: boolean;
  aboutMe: string;
  interests: string[];
}

const initialFormData: ProfileFormData = {
  name: '',
  dateOfBirth: '',
  maritalStatus: '',
  hasKids: '',
  kidsCount: '',
  cityOfBirth: '',
  currentCity: '',
  nationality: '',
  languages: [],
  sect: '',
  phoneNumber: '',
  height: '',
  weight: '',
  bodyType: '',
  skinColour: '',
  eyeColour: '',
  bloodGroup: '',
  disabilities: '',
  wearsGlasses: '',
  smokerDrugs: '',
  medicalConditions: '',
  exerciseFrequency: '',
  educationLevel: '',
  degreeeName: '',
  employmentStatus: '',
  businessDetails: '',
  profession: '',
  monthlyIncome: '',
  incomeSource: '',
  workTimings: '',
  futureCareerPlans: '',
  ownsProperty: '',
  ancestralLand: '',
  savings: '',
  debts: '',
  ownsCar: '',
  moneyManagement: '',
  prayerFrequency: '',
  fastRamadan: '',
  givesZakat: '',
  religionImportance: '',
  spouseReligiosity: '',
  religionDifferences: '',
  importantValue: '',
  handleDisagreements: '',
  genderRoles: '',
  polygamyView: '',
  truthfulness: '',
  familyStructure: '',
  familyCloseness: '',
  liveWithInlaws: '',
  socializeFrequency: '',
  celebrateCustoms: '',
  tribalImportance: '',
  handleStress: '',
  personality: '',
  forgivenessLevel: '',
  loveLanguage: '',
  showAffection: '',
  emotionalSupportImportance: '',
  outlook: '',
  tradModernOutlook: '',
  casualDress: '',
  shoeStyle: '',
  weekendSpending: '',
  livingPreference: '',
  sleepSchedule: '',
  musicPreference: '',
  likesPets: '',
  travelPreference: '',
  hobbies: '',
  favoriteFoodBooksMusic: '',
  wantToMarryWhen: '',
  preferredSpouseAge: '',
  preferredSpouseHeight: '',
  preferredEducation: '',
  preferredProfession: '',
  preferWorkingSpouse: '',
  expectedKids: '',
  willSponsorSpouse: '',
  housingSituation: '',
  spouseCooking: '',
  allowSpouseWork: '',
  shareHouseholdResponsibilities: '',
  idealMarriage: '',
  profilePhoto: '',
  galleryPhotos: [],
  profileStrength: 0,
  isVerified: false,
  aboutMe: '',
  interests: [],
};

interface FormContextType {
  formData: ProfileFormData;
  updateFormData: (updates: Partial<ProfileFormData>) => void;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  resetForm: () => void;
  calculateProfileStrength: () => number;
}

export const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);

  const updateFormData = (updates: Partial<ProfileFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateField = (field: keyof ProfileFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const calculateProfileStrength = () => {
    let filledFields = 0;
    let totalFields = 0;

    Object.keys(formData).forEach((key) => {
      const value = formData[key as keyof ProfileFormData];
      totalFields++;

      if (
        (typeof value === 'string' && value.trim() !== '') ||
        (Array.isArray(value) && value.length > 0) ||
        (typeof value === 'boolean' && value)
      ) {
        filledFields++;
      }
    });

    return Math.round((filledFields / totalFields) * 100);
  };

  return (
    <FormContext.Provider
      value={{
        formData,
        updateFormData,
        updateField,
        resetForm,
        calculateProfileStrength,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export function useForm() {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
}
