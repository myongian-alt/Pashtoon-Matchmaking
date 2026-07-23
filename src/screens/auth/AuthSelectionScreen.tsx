import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, ScrollView, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { LinkText } from '../../components/common/LinkText';

export default function AuthSelectionScreen() {
  const navigation = useNavigation();
  const [rotateValue] = React.useState(new Animated.Value(0));
  const [opacityValue] = React.useState(new Animated.Value(0.7));

  React.useEffect(() => {
    // Rotation animation
    Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Opacity pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0.5,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [rotateValue, opacityValue]);

  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['45deg', '405deg'],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Back Button */}
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} />
      </Pressable>

      {/* Decorative Header Pattern */}
      <View style={styles.decorativeHeader}>
        <View style={styles.geometricLine} />
        <View style={styles.geometricLine} />
      </View>

      {/* Main Title - Khpalwali with Decorative Diamond Rings */}
      <View style={styles.titleSection}>
        {/* Left Decorative Diamond Ring - Animated */}
        <Animated.View
          style={[
            styles.diamondRingLeft,
            {
              transform: [
                { rotate: spin },
              ],
              opacity: opacityValue,
            },
          ]}
        />
        
        <Text style={styles.mainTitle}>Khpalwali</Text>
        
        {/* Right Decorative Diamond Ring - Animated */}
        <Animated.View
          style={[
            styles.diamondRingRight,
            {
              transform: [
                { rotate: spin },
              ],
              opacity: opacityValue,
            },
          ]}
        />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitleText}>Find your perfect match</Text>

      {/* Decorative Bead Pattern */}
      <View style={styles.decorativeBeads}>
        {[...Array(20)].map((_, i) => (
          <View
            key={`bead-${i}`}
            style={[
              styles.bead,
              {
                width: 6,
                height: 6,
                marginRight: i % 5 === 4 ? 0 : 8,
                marginBottom: 8,
                backgroundColor: i % 3 === 0 ? '#A84450' : i % 3 === 1 ? '#0F7B6B' : '#C9A876',
              },
            ]}
          />
        ))}
      </View>

      {/* Login Options */}
      <View style={styles.buttons}>
        {/* Email Option */}
        <Pressable style={styles.methodCard} onPress={() => navigation.navigate('EmailAuth' as never)}>
          <View style={styles.methodIcon}>
            <MaterialCommunityIcons name="email-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.methodLabel}>Email</Text>
          <Text style={styles.methodDescription}>Connect with your email</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#134E36" style={styles.chevron} />
        </Pressable>

        {/* Gmail Option */}
        <Pressable style={[styles.methodCard, styles.gmailCard]} onPress={() => navigation.navigate('EmailAuth' as never)}>
          <View style={[styles.methodIcon, styles.gmailIcon]}>
            <MaterialCommunityIcons name="gmail" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.methodLabel}>Gmail</Text>
          <Text style={styles.methodDescription}>Quick login with Google</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#D32F2F" style={styles.chevron} />
        </Pressable>

        {/* Phone Option */}
        <Pressable style={styles.methodCard} onPress={() => navigation.navigate('PhoneAuth' as never)}>
          <View style={styles.methodIcon}>
            <MaterialCommunityIcons name="phone-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.methodLabel}>Phone</Text>
          <Text style={styles.methodDescription}>Login with phone number</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#134E36" style={styles.chevron} />
        </Pressable>

        {/* Guest Option */}
        <Pressable style={[styles.methodCard, styles.guestCard]} onPress={() => navigation.navigate('Tabs' as never)}>
          <View style={[styles.methodIcon, styles.guestIcon]}>
            <MaterialCommunityIcons name="account-heart-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.methodLabel}>Continue as Guest</Text>
          <Text style={styles.methodDescription}>Browse without signing up</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#0F7B6B" style={styles.chevron} />
        </Pressable>
      </View>

      {/* Decorative Footer Pattern */}
      <View style={styles.decorativeFooter}>
        <View style={styles.geometricDot} />
        <View style={styles.geometricDot} />
        <View style={styles.geometricDot} />
      </View>

      {/* Footer Links */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>By continuing, you agree to our </Text>
        <LinkText label="Privacy Policy" onPress={() => {}} />
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>and </Text>
        <LinkText label="Terms" onPress={() => {}} />
      </View>
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
    paddingTop: 12,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  decorativeHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  geometricLine: {
    width: 2,
    height: 24,
    backgroundColor: '#C9A876',
    transform: [{ rotate: '45deg' }],
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  decorativeRingLeft: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: '#C9A876',
    marginRight: 16,
    opacity: 0.4,
  },
  decorativeRingRight: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: '#C9A876',
    marginLeft: 16,
    opacity: 0.4,
  },
  diamondRingLeft: {
    width: 52,
    height: 52,
    backgroundColor: '#D4AF37',
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#C9A876',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  diamondRingRight: {
    width: 52,
    height: 52,
    backgroundColor: '#D4AF37',
    marginLeft: 16,
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#C9A876',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#A83860',
    fontFamily: 'Georgia',
    letterSpacing: 2,
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: '#6B1E3A',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5A6360',
    fontFamily: 'Georgia',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 24,
  },
  decorativeBeads: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    maxWidth: '60%',
    alignSelf: 'center',
  },
  bead: {
    borderRadius: 3,
    opacity: 0.8,
  },
  buttons: {
    gap: 12,
    marginBottom: 24,
  },
  methodCard: {
    backgroundColor: '#FFF5E5',
    borderRadius: 18,
    padding: 18,
    borderWidth: 2.5,
    borderColor: '#134E36',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  guestCard: {
    backgroundColor: '#EFF7F5',
    borderColor: '#134E36',
  },
  gmailCard: {
    backgroundColor: '#FFF3F0',
    borderColor: '#D32F2F',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#134E36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gmailIcon: {
    backgroundColor: '#D32F2F',
  },
  guestIcon: {
    backgroundColor: '#0F7B6B',
  },
  methodLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#134E36',
    fontFamily: 'Georgia',
    flex: 1,
  },
  methodDescription: {
    color: '#5A6360',
    fontSize: 13,
    fontFamily: 'Georgia',
    flex: 2,
    position: 'absolute',
    bottom: 18,
    left: 74,
  },
  chevron: {
    marginLeft: 'auto',
  },
  decorativeFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 28,
  },
  geometricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C9A876',
    opacity: 0.6,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    color: '#5A6360',
    fontSize: 13,
    fontFamily: 'Georgia',
  },
});
