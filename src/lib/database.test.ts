// These tests only exercise pure mapping/conversion functions, not any real
// Supabase call - but database.ts imports the shared client unconditionally
// at module load, which throws if EXPO_PUBLIC_SUPABASE_URL/ANON_KEY aren't
// set (they aren't, under plain `jest`, unlike Metro which Expo wires up to
// read .env automatically). Mocking the module avoids needing real
// credentials just to test pure functions.
jest.mock('./supabase', () => ({ supabase: {} }));

import {
  yesNoToBool,
  boolToYesNo,
  heightLabelToCm,
  cmToHeightLabel,
  weightLabelToKg,
  kgToWeightLabel,
  ageRangeLabelToMinMax,
  minMaxToAgeRangeLabel,
  toArrayOrNull,
  hobbiesTextToArray,
  hobbiesArrayToText,
} from './database';

// Covers the bucketed/approximate conversions used by the full profile-form
// save (see upsertCurrentUserProfile) - these are the trickiest, most
// lossy-by-design mappings in that function, and a silent regression here
// would corrupt real users' physical/preference data without ever throwing
// an error (wrong enum/number saved successfully, just wrong).

describe('yesNoToBool / boolToYesNo', () => {
  it('round-trips Yes/No through boolean', () => {
    expect(yesNoToBool('Yes')).toBe(true);
    expect(yesNoToBool('No')).toBe(false);
    expect(boolToYesNo(true)).toBe('Yes');
    expect(boolToYesNo(false)).toBe('No');
  });

  it('treats anything else (including undefined) as unanswered, not false', () => {
    expect(yesNoToBool(undefined)).toBeNull();
    expect(yesNoToBool('')).toBeNull();
    expect(yesNoToBool('Maybe')).toBeNull();
    expect(boolToYesNo(null)).toBe('');
    expect(boolToYesNo(undefined)).toBe('');
  });
});

describe('height <-> cm', () => {
  it('converts feet/inches to cm exactly', () => {
    expect(heightLabelToCm('5\'8"')).toBe(173); // 172.72 rounds to 173
    expect(heightLabelToCm('6\'0"')).toBe(183); // 182.88 rounds to 183
    expect(heightLabelToCm('4\'10"')).toBe(147); // 147.32 rounds to 147
  });

  it('returns null for an unparseable label', () => {
    expect(heightLabelToCm('tall')).toBeNull();
    expect(heightLabelToCm(undefined)).toBeNull();
  });

  it('snaps a stored cm value back to the closest fixed UI option', () => {
    expect(cmToHeightLabel(173)).toBe('5\'8"');
    expect(cmToHeightLabel(174)).toBe('5\'8"'); // closer to 173 than 178 (5'10")
    expect(cmToHeightLabel(176)).toBe('5\'10"'); // closer to 178 than 173
  });

  it('returns an empty string for a non-numeric/missing value', () => {
    expect(cmToHeightLabel(null)).toBe('');
    expect(cmToHeightLabel(undefined)).toBe('');
  });
});

describe('weight <-> kg (bucket midpoint approximation)', () => {
  it('maps each bucket label to its documented midpoint', () => {
    expect(weightLabelToKg('Under 50kg')).toBe(45);
    expect(weightLabelToKg('70-80kg')).toBe(75);
    expect(weightLabelToKg('100kg+')).toBe(105);
  });

  it('maps a stored kg value back to the bucket it falls into', () => {
    expect(kgToWeightLabel(75)).toBe('70-80kg');
    expect(kgToWeightLabel(69.9)).toBe('60-70kg');
    expect(kgToWeightLabel(100)).toBe('100kg+');
    expect(kgToWeightLabel(150)).toBe('100kg+'); // falls off the end of the fixed buckets
  });

  it('returns null/empty for unknown or missing values', () => {
    expect(weightLabelToKg('unknown')).toBeNull();
    expect(kgToWeightLabel(null)).toBe('');
  });
});

describe('preferred spouse age range <-> min/max (exact, no precision lost)', () => {
  it('parses a plain range', () => {
    expect(ageRangeLabelToMinMax('25-30')).toEqual({ min: 25, max: 30 });
  });

  it('parses an open-ended "N+" range as min with no max', () => {
    expect(ageRangeLabelToMinMax('40+')).toEqual({ min: 40, max: null });
  });

  it('treats "No preference" and missing input as both null', () => {
    expect(ageRangeLabelToMinMax('No preference')).toEqual({ min: null, max: null });
    expect(ageRangeLabelToMinMax(undefined)).toEqual({ min: null, max: null });
  });

  it('round-trips back to the exact original label for every real option', () => {
    for (const label of ['18-25', '25-30', '30-35', '35-40', '40+', 'No preference']) {
      const { min, max } = ageRangeLabelToMinMax(label);
      expect(minMaxToAgeRangeLabel(min, max)).toBe(label);
    }
  });
});

describe('toArrayOrNull', () => {
  it('wraps a real value in a single-element array', () => {
    expect(toArrayOrNull('Bachelors')).toEqual(['Bachelors']);
  });

  it('treats empty, "No preference", and "Any" as no answer at all', () => {
    expect(toArrayOrNull('')).toBeNull();
    expect(toArrayOrNull(undefined)).toBeNull();
    expect(toArrayOrNull('No preference')).toBeNull();
    expect(toArrayOrNull('Any')).toBeNull();
  });
});

describe('hobbies text <-> array', () => {
  it('splits free text on commas and newlines into trimmed tags', () => {
    expect(hobbiesTextToArray('Reading, Hiking,\nCalligraphy')).toEqual(['Reading', 'Hiking', 'Calligraphy']);
  });

  it('drops empty segments from stray separators', () => {
    expect(hobbiesTextToArray('Reading,, Hiking,')).toEqual(['Reading', 'Hiking']);
  });

  it('returns null for empty input, not an empty array', () => {
    expect(hobbiesTextToArray('')).toBeNull();
    expect(hobbiesTextToArray(undefined)).toBeNull();
  });

  it('joins an array back into a comma-separated display string', () => {
    expect(hobbiesArrayToText(['Reading', 'Hiking'])).toBe('Reading, Hiking');
    expect(hobbiesArrayToText(null)).toBe('');
    expect(hobbiesArrayToText(undefined)).toBe('');
  });
});
