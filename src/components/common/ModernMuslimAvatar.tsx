import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

type ModernMuslimAvatarProps = {
  gender: 'male' | 'female';
  size?: number;
};

export function ModernMuslimAvatar({ gender, size = 120 }: ModernMuslimAvatarProps) {
  const source =
    gender === 'female'
      ? require('../../../assets/female-avatar.png')
      : require('../../../assets/male-avatar.png');

  return (
    <View style={[styles.container, { width: size, height: size }]}> 
      <Image source={source} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    // Transparent, not a fixed color — every call site already wraps this in
    // its own container that sets the appropriate backdrop (a tinted arch
    // fill, a card's empty-photo placeholder, etc.), so this shouldn't paint
    // over that with its own opinion.
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});