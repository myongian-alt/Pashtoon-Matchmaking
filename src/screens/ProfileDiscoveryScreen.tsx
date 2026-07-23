import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, FlatList, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { useUser } from '../context/UserContext';
import { RootStackParamList } from '../navigation/AppNavigator';

// Mock profile data
const maleProfiles = [
  {
    id: '1',
    name: 'Ahmed Khan',
    age: 28,
    gender: 'male',
    maritalStatus: 'Never Married',
    cityOfBirth: 'Kabul',
    currentCity: 'Kabul, Afghanistan',
    education: 'Bachelor in Engineering',
    profession: 'Software Engineer',
    location: 'Kabul, Afghanistan',
    height: '5\'10"',
    bodyType: 'Athletic',
    image: require('../../assets/pashtoon-hero.jpg'),
    aboutMe: 'Tech enthusiast with passion for innovation and family values',
    lifestyle: 'Active, gym 4x/week',
    values: 'Honest, respectful, ambitious',
    personality: 'Outgoing and friendly',
  },
  {
    id: '2',
    name: 'Farid Hassan',
    age: 31,
    gender: 'male',
    maritalStatus: 'Divorced',
    cityOfBirth: 'Peshawar',
    currentCity: 'Peshawar, Pakistan',
    education: 'Master in Business',
    profession: 'Business Analyst',
    location: 'Peshawar, Pakistan',
    height: '5\'11"',
    bodyType: 'Average',
    image: require('../../assets/pashtoon-hero.jpg'),
    aboutMe: 'Established professional seeking commitment',
    lifestyle: 'Balanced lifestyle with family priorities',
    values: 'Family-oriented, trustworthy',
    personality: 'Calm and thoughtful',
  },
  {
    id: '3',
    name: 'Rashid Ahmed',
    age: 26,
    gender: 'male',
    maritalStatus: 'Never Married',
    cityOfBirth: 'Islamabad',
    currentCity: 'Islamabad, Pakistan',
    education: 'Bachelor in Medicine',
    profession: 'Doctor',
    location: 'Islamabad, Pakistan',
    height: '5\'9"',
    bodyType: 'Slim',
    image: require('../../assets/pashtoon-hero.jpg'),
    aboutMe: 'Dedicated doctor with strong moral compass',
    lifestyle: 'Health-conscious and disciplined',
    values: 'Compassionate, dedicated, honest',
    personality: 'Patient and kind',
  },
  {
    id: '4',
    name: 'Imran Khan',
    age: 33,
    gender: 'male',
    maritalStatus: 'Never Married',
    cityOfBirth: 'Dubai',
    currentCity: 'Dubai, UAE',
    education: 'Bachelor in Law',
    profession: 'Lawyer',
    location: 'Dubai, UAE',
    height: '6\'0"',
    bodyType: 'Athletic',
    image: require('../../assets/pashtoon-hero.jpg'),
    aboutMe: 'Successful professional with traditional values',
    lifestyle: 'Balanced work-life with family focus',
    values: 'Integrity, loyalty, respectful',
    personality: 'Confident and principled',
  },
  {
    id: '5',
    name: 'Karim Saeed',
    age: 29,
    gender: 'male',
    maritalStatus: 'Never Married',
    cityOfBirth: 'Lahore',
    currentCity: 'Lahore, Pakistan',
    education: 'Bachelor in Architecture',
    profession: 'Architect',
    location: 'Lahore, Pakistan',
    height: '5\'10"',
    bodyType: 'Average',
    image: require('../../assets/pashtoon-hero.jpg'),
    aboutMe: 'Creative professional seeking genuine connection',
    lifestyle: 'Active in community, enjoys sports',
    values: 'Ethical, creative, supportive',
    personality: 'Artistic and sociable',
  },
];

const femaleProfiles = [
  {
    id: '1',
    name: 'Ayesha Khan',
    age: 25,
    gender: 'female',
    maritalStatus: 'Never Married',
    cityOfBirth: 'Kabul',
    currentCity: 'Kabul, Afghanistan',
    education: 'Bachelor in Medicine',
    profession: 'Doctor',
    location: 'Kabul, Afghanistan',
    height: '5\'5"',
    bodyType: 'Slim',
    image: require('../../assets/pashtoon-hero.jpg'),
    aboutMe: 'Caring and dedicated healthcare professional',
    lifestyle: 'Health-conscious, enjoys outdoor activities',
    values: 'Compassionate, independent, faithful',
    personality: 'Warm and empathetic',
  },
  {
    id: '2',
    name: 'Fatima Hassan',
    age: 27,
    gender: 'female',
    maritalStatus: 'Never Married',
    cityOfBirth: 'Peshawar',
    currentCity: 'Peshawar, Pakistan',
    education: 'Master in Education',
    profession: 'Teacher',
    location: 'Peshawar, Pakistan',
    height: '5\'4"',
    bodyType: 'Average',
    image: require('../../assets/pashtoon-hero.jpg'),
    aboutMe: 'Educator passionate about knowledge and family',
    lifestyle: 'Balanced, family-oriented lifestyle',
    values: 'Educational, nurturing, honest',
    personality: 'Intelligent and caring',
  },
  {
    id: '3',
    name: 'Zainab Ahmed',
    age: 24,
    gender: 'female',
    maritalStatus: 'Never Married',
    cityOfBirth: 'Islamabad',
    currentCity: 'Islamabad, Pakistan',
    education: 'Bachelor in Engineering',
    profession: 'Engineer',
    location: 'Islamabad, Pakistan',
    height: '5\'6"',
    bodyType: 'Athletic',
    image: require('../../assets/pashtoon-hero.jpg'),
    aboutMe: 'Tech-savvy engineer with traditional values',
    lifestyle: 'Active, gym regular, tech enthusiast',
    values: 'Ambitious, supportive, principled',
    personality: 'Intelligent and independent',
  },
  {
    id: '4',
    name: 'Hina Ali',
    age: 26,
    gender: 'female',
    maritalStatus: 'Widowed',
    cityOfBirth: 'Dubai',
    currentCity: 'Dubai, UAE',
    education: 'Bachelor in Commerce',
    profession: 'Accountant',
    location: 'Dubai, UAE',
    height: '5\'5"',
    bodyType: 'Average',
    image: require('../../assets/pashtoon-hero.jpg'),
    aboutMe: 'Professional seeking sincere companion',
    lifestyle: 'Balanced lifestyle with career focus',
    values: 'Reliable, faithful, thoughtful',
    personality: 'Mature and responsible',
  },
  {
    id: '5',
    name: 'Mariam Habib',
    age: 28,
    gender: 'female',
    maritalStatus: 'Never Married',
    cityOfBirth: 'Lahore',
    currentCity: 'Lahore, Pakistan',
    education: 'Bachelor in Design',
    profession: 'Graphic Designer',
    location: 'Lahore, Pakistan',
    height: '5\'4"',
    bodyType: 'Slim',
    image: require('../../assets/pashtoon-hero.jpg'),
    aboutMe: 'Creative designer with strong family values',
    lifestyle: 'Artistic, social, family-focused',
    values: 'Creative, loyal, respectful',
    personality: 'Warm and artistic',
  },
];

export default function ProfileDiscoveryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedGender } = useUser();
  const [likedProfiles, setLikedProfiles] = React.useState<string[]>([]);

  // Show opposite gender profiles based on user's selected gender
  // If user is male, show female profiles. If user is female, show male profiles.
  const profiles = selectedGender === 'male' ? femaleProfiles : maleProfiles;

  const handleLike = (profileId: string) => {
    setLikedProfiles([...likedProfiles, profileId]);
  };

  const handleViewProfile = (profile: typeof maleProfiles[0]) => {
    navigation.navigate('ProfileDetail', {
      profile: {
        ...profile,
        compatibility: 85, // Mock compatibility score
      },
    });
  };

  const renderProfileCard = ({ item }: { item: typeof maleProfiles[0] }) => {
    const isLiked = likedProfiles.includes(item.id);

    return (
      <Pressable
        style={styles.profileCard}
        onPress={() => handleViewProfile(item)}
      >
        {/* Profile Image */}
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.profileImage} />
          <View style={styles.overlayGradient} />
        </View>

        {/* Gender Avatar Badge */}
        <View style={styles.genderBadge}>
          {item.gender === 'male' ? (
            <MaterialCommunityIcons name="human-male" size={32} color="#fff" />
          ) : (
            <MaterialCommunityIcons name="human-female" size={32} color="#fff" />
          )}
        </View>

        {/* Profile Info Overlay */}
        <View style={styles.cardContent}>
          {/* Basic Info */}
          <View style={styles.basicInfo}>
            <Text style={styles.profileName}>{item.name}</Text>
            <View style={styles.ageLocationRow}>
              <MaterialCommunityIcons name="cake-variant" size={16} color="#C9A876" />
              <Text style={styles.infoText}>{item.age} years</Text>
              <MaterialCommunityIcons name="map-marker" size={16} color="#C9A876" style={{ marginLeft: 12 }} />
              <Text style={styles.infoText}>{item.location}</Text>
            </View>
            <View style={styles.maritalStatusRow}>
              <MaterialCommunityIcons name="ring" size={14} color="#D4AF37" />
              <Text style={styles.maritalStatusText}>{item.maritalStatus}</Text>
            </View>
          </View>

          {/* Biodata Details */}
          <View style={styles.biodataSection}>
            <View style={styles.biodataRow}>
              <View style={styles.biodataItem}>
                <MaterialCommunityIcons name="school" size={18} color={theme.colors.primary} />
                <Text style={styles.biodataLabel}>Education</Text>
                <Text style={styles.biodataValue}>{item.education}</Text>
              </View>

              <View style={styles.biodataItem}>
                <MaterialCommunityIcons name="briefcase" size={18} color={theme.colors.primary} />
                <Text style={styles.biodataLabel}>Profession</Text>
                <Text style={styles.biodataValue}>{item.profession}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable style={styles.skipButton}>
              <MaterialCommunityIcons name="close" size={20} color={theme.colors.primary} />
              <Text style={styles.buttonLabel}>Skip</Text>
            </Pressable>

            <Pressable
              style={[styles.likeButton, isLiked && styles.likeButtonActive]}
              onPress={() => handleLike(item.id)}
            >
              <MaterialCommunityIcons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={22}
                color={isLiked ? '#E74C3C' : '#FFFFFF'}
              />
              <Text style={styles.likeButtonLabel}>{isLiked ? 'Liked' : 'Like'}</Text>
            </Pressable>

            <Pressable style={styles.viewButton} onPress={() => handleViewProfile(item)}>
              <MaterialCommunityIcons name="eye" size={20} color={theme.colors.primary} />
              <Text style={styles.buttonLabel}>View</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Discover Matches</Text>
        <View style={styles.spacer} />
      </View>

      {/* Profile Grid */}
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        numColumns={1}
        contentContainerStyle={styles.profilesList}
        renderItem={renderProfileCard}
        scrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7E1C9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD0',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2924',
    fontFamily: 'Georgia',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 44,
  },
  profilesList: {
    padding: 16,
    paddingBottom: 100,
  },
  profileCard: {
    height: 580,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  genderBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(19, 78, 54, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F0E8E0',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.3))',
  },
  cardContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'space-between',
  },
  basicInfo: {
    marginBottom: 12,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2924',
    fontFamily: 'Georgia',
    marginBottom: 8,
  },
  ageLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#5A6360',
    fontFamily: 'Georgia',
  },
  maritalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  maritalStatusText: {
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  biodataSection: {
    backgroundColor: '#F5E6D3',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  biodataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  biodataItem: {
    flex: 1,
    alignItems: 'center',
  },
  biodataLabel: {
    fontSize: 12,
    color: '#5A6360',
    fontFamily: 'Georgia',
    marginTop: 6,
    fontWeight: '600',
  },
  biodataValue: {
    fontSize: 13,
    color: '#1F2924',
    fontFamily: 'Georgia',
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 6,
  },
  likeButton: {
    flex: 1.2,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  likeButtonActive: {
    backgroundColor: '#E74C3C',
  },
  viewButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 6,
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
    fontFamily: 'Georgia',
  },
  likeButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Georgia',
  },
});
