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
    backgroundColor: '#F8F5F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});