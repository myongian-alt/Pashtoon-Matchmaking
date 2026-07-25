import { ProfileFormData } from '../context/FormContext';

/**
 * Builds the "self profile" object passed to ProfileDetail's `isSelfProfile`
 * view from in-memory FormContext state. Shared by every screen that offers
 * a "View My Profile" action so the mapping only lives in one place.
 */
export function buildSelfProfileFromForm(
  formData: ProfileFormData,
  selectedGender: 'male' | 'female' | null
) {
  return {
    id: 'self',
    name: formData.name || 'Your Profile',
    age: formData.dateOfBirth
      ? Math.max(18, new Date().getFullYear() - Number(formData.dateOfBirth.split('-')[0]))
      : 0,
    gender: selectedGender || 'male',
    maritalStatus: formData.maritalStatus || 'Not set',
    cityOfBirth: formData.cityOfBirth || 'Not set',
    currentCity: formData.currentCity || 'Not set',
    nationality: formData.nationality || 'Not set',
    education: formData.educationLevel || formData.degreeeName || 'Not set',
    profession: formData.profession || 'Not set',
    location: [formData.currentCity, formData.nationality].filter(Boolean).join(', ') || 'Not set',
    height: formData.height || 'Not set',
    bodyType: formData.bodyType || 'Not set',
    aboutMe: formData.aboutMe || '',
    lifestyle: formData.outlook || '',
    values: formData.importantValue || '',
    personality: formData.personality || '',
    image: formData.profilePhoto || null,
    galleryPhotos: Array.isArray(formData.galleryPhotos) ? formData.galleryPhotos : [],
    isSelfProfile: true,
  };
}
