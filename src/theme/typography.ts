// Named styles referencing the five loaded font families (see App.tsx/
// App.web.tsx's useFonts() call, which must load every weight referenced
// here). Centralizing this is the actual fix for a real, previously-hit
// problem: screens used to reference font family strings directly
// ('Fraunces_600SemiBold'), so a typo'd family name silently fell back to
// the system font with no error anywhere. Reach for these named styles
// first; only drop to a raw fontFamily string for a one-off weight/size
// combination that doesn't fit any of them.

export const fonts = {
  logo: 'DMSerifDisplay_400Regular',
  heading: 'DMSerifDisplay_400Regular',
  nameItalic: 'CormorantGaramond_600SemiBold_Italic',
  cardTitleItalic: 'CormorantGaramond_500Medium_Italic',
  bodyItalic: 'CormorantGaramond_400Regular_Italic',
  decorative: 'CormorantGaramond_600SemiBold',
  label: 'PlusJakartaSans_600SemiBold',
  labelBold: 'PlusJakartaSans_700Bold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  // Pashto greetings / the Quran verse card specifically (not general Pashto
  // UI text - see notoNaskh below for that).
  greeting: 'Amiri_400Regular',
  greetingBold: 'Amiri_700Bold',
  // General UI text when the app is displaying Pashto or Urdu.
  notoNaskh: 'NotoNaskhArabic_400Regular',
  notoNaskhMedium: 'NotoNaskhArabic_500Medium',
  notoNaskhSemiBold: 'NotoNaskhArabic_600SemiBold',
  notoNaskhBold: 'NotoNaskhArabic_700Bold',
};

export const typography = {
  heading: {
    fontFamily: fonts.heading,
    fontSize: 32,
    lineHeight: 40,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 22,
    lineHeight: 30,
  },
  cardTitle: {
    fontFamily: fonts.nameItalic,
    fontSize: 20,
    lineHeight: 26,
  },
  label: {
    fontFamily: fonts.label,
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
};
