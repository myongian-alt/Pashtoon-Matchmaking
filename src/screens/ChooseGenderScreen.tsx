import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { useUser } from '../context/UserContext';

const options = [
  {
    label: 'Male',
    description: 'Seek respectful, family-approved matches.',
    key: 'male',
    icon: 'ring',
  },
  {
    label: 'Female',
    description: 'Discover meaningful connections with shared values.',
    key: 'female',
    icon: 'flower-tulip',
  },
];

export default function ChooseGenderScreen() {
  const navigation = useNavigation();
  const { setSelectedGender } = useUser();
  const [selected, setSelected] = React.useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      setSelectedGender(selected as 'male' | 'female');
      navigation.navigate('AuthSelection' as never);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Back Button */}
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} />
      </Pressable>

      {/* Header Decoration - Pashtoon Geometric Pattern */}
      <View style={styles.headerDecoration}>
        <View style={styles.geometricPattern}>
          <View style={styles.diamondSmall} />
          <View style={[styles.diamondSmall, { marginLeft: 12, marginTop: -8 }]} />
          <View style={[styles.diamondSmall, { marginLeft: 24, marginTop: 8 }]} />
        </View>
        <View style={styles.geometricPattern}>
          <View style={styles.diamondSmall} />
          <View style={[styles.diamondSmall, { marginLeft: 12, marginTop: -8 }]} />
          <View style={[styles.diamondSmall, { marginLeft: 24, marginTop: 8 }]} />
        </View>
      </View>

      {/* Top Section */}
      <View style={styles.topSection}>
        <Text style={styles.title}>Select your gender</Text>
        <Text style={styles.subtitle}>
          The first step toward a tailored Pashtoon matchmaking experience.
        </Text>
      </View>

      {/* Gender Cards */}
      <View style={styles.cardsContainer}>
        {options.map((option) => {
          const active = selected === option.key;
          return (
            <Pressable
              key={option.key}
              style={[styles.card, active && styles.cardActive]}
              onPress={() => setSelected(option.key)}
            >
              {/* Decorative Dots */}
              {option.key === 'male' && (
                <>
                  <View style={styles.dotsTopRight}>
                    {[...Array(24)].map((_, i) => (
                      <View
                        key={`dot-tr-${i}`}
                        style={[
                          styles.dot,
                          {
                            width: 6,
                            height: 6,
                            left: (i % 6) * 10,
                            top: Math.floor(i / 6) * 10,
                            backgroundColor: i % 2 === 0 ? '#A84450' : '#0F7B6B',
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <View style={styles.dotsBottomLeft}>
                    {[...Array(15)].map((_, i) => (
                      <View
                        key={`dot-bl-${i}`}
                        style={[
                          styles.dot,
                          {
                            width: 6,
                            height: 6,
                            left: (i % 5) * 10,
                            top: Math.floor(i / 5) * 10,
                            backgroundColor: i % 2 === 0 ? '#A84450' : '#0F7B6B',
                          },
                        ]}
                      />
                    ))}
                  </View>
                </>
              )}

              {option.key === 'female' && (
                <View style={styles.dotsBottomLeftFemale}>
                  {[...Array(12)].map((_, i) => (
                    <View
                      key={`dot-bl-${i}`}
                      style={[
                        styles.dot,
                        {
                          width: 6,
                          height: 6,
                          left: (i % 4) * 10,
                          top: Math.floor(i / 4) * 10,
                          backgroundColor: i % 2 === 0 ? '#A84450' : '#0F7B6B',
                        },
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* Single Icon - Larger */}
              <View style={styles.iconRow}>
                <MaterialCommunityIcons
                  name={option.icon as any}
                  size={48}
                  color={option.key === 'male' ? '#134E36' : '#C9A876'}
                />
              </View>

              {/* Card Title */}
              <Text style={styles.cardLabel}>{option.label}</Text>

              {/* Card Description */}
              <Text style={styles.cardDescription}>{option.description}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Continue Button */}
      <Pressable
        style={[styles.continueButton, !selected && styles.continueButtonDisabled]}
        disabled={!selected}
        onPress={handleContinue}
      >
        <Text style={styles.continueText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7E1C9',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  headerDecoration: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
    paddingHorizontal: 20,
    height: 60,
    alignItems: 'center',
  },
  geometricPattern: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diamondSmall: {
    width: 12,
    height: 12,
    backgroundColor: '#C9A876',
    transform: [{ rotate: '45deg' }],
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    color: '#1F2924',
    fontSize: 32,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Georgia',
    letterSpacing: 0.8,
  },
  subtitle: {
    color: '#5A6360',
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'center',
    maxWidth: 320,
    fontFamily: 'Georgia',
    letterSpacing: 0.3,
    fontWeight: '400',
  },
  cardsContainer: {
    marginBottom: 24,
    gap: 14,
  },
  card: {
    backgroundColor: '#F5E6D3',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E3D4C4',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActive: {
    borderColor: '#C9A876',
    backgroundColor: '#FDF9F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1F2924',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Georgia',
    letterSpacing: 0.5,
  },
  cardDescription: {
    color: '#5A6360',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: 'Georgia',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  dotsTopRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 60,
    height: 60,
  },
  dotsBottomLeft: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 50,
    height: 50,
  },
  dotsBottomLeftFemale: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 40,
    height: 40,
  },
  dot: {
    position: 'absolute',
    borderRadius: 3,
    opacity: 0.75,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 22,
    paddingVertical: 16,
    marginTop: 12,
    alignItems: 'center',
    marginHorizontal: 0,
  },
  continueButtonDisabled: {
    backgroundColor: '#D4D4D4',
    opacity: 0.6,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    fontFamily: 'Georgia',
  },
});
