// Khpalwali redesign palette (2026-10) — named tokens use the designer's own
// names so this file reads as a direct transcription of the brief, not a
// re-interpretation. The legacy keys below (primary/secondary/accent/text/
// etc.) are kept as aliases onto these same values specifically so every
// existing screen that already references theme.colors.X picks up the new
// palette with zero per-file changes - only screens that want the *new*,
// more specific section colors (lapis/pomegranate headers, etc.) need to
// reference the named tokens directly.

// Main colours
const emerald = '#0F4C3A'; // buttons, main headers
const emeraldDeep = '#0A3A2C'; // header backgrounds, tab bar
const lapis = '#1E3366'; // Discover, Chats, Safety
const pomegranate = '#9E2B3A'; // Rishtas, hearts, badges
const pomegranateDeep = '#7E1F2E'; // Rishtas and Planner headers
const pomegranateBright = '#C23B4B'; // heart button, unread dots
const gold = '#C9973A'; // accents, frames
const goldLight = '#E7C27A'; // embroidery strip, active tab
const goldPale = '#F3D58E'; // highlights on dark

// Backgrounds
const ivory = '#FBF6EC'; // app background
const invitationCard = '#FFFDF7';
const sand = '#F3EBDD';
const cream = '#F6EBD3';

// Text
const ink = '#1F1A17'; // main text
const bodyText = '#3C342E';
const mutedText = '#6B625A';
const faintText = '#8A8078';
const lightTextOnDark = '#F6EBD3';

// Borders
const cardBorder = '#EFE3CC';
const inputBorder = '#E1D3B8';
const invitationGoldLine = '#E7D3A6';

// Light tints
const emeraldTint = '#E3EEE8';
const pomegranateTint = '#F7E3E3';

// Status
const statusSuccess = '#3BA06B'; // online / success
const statusVerified = '#2F7AB8'; // verified badge

export const colors = {
  // New, fully-named tokens — prefer these for anything new.
  emerald,
  emeraldDeep,
  lapis,
  pomegranate,
  pomegranateDeep,
  pomegranateBright,
  gold,
  goldLight,
  goldPale,
  ivory,
  invitationCard,
  sand,
  cream,
  ink,
  bodyText,
  mutedText,
  faintText,
  lightTextOnDark,
  cardBorder,
  inputBorder,
  invitationGoldLine,
  emeraldTint,
  pomegranateTint,
  statusSuccess,
  statusVerified,

  // Per-section accents, named by what they're for rather than by hue, so a
  // screen can say "this is the Discover section" without knowing it
  // happens to mean lapis blue.
  sectionDiscover: lapis,
  sectionChats: lapis,
  sectionSafety: lapis,
  sectionRishtas: pomegranate,
  sectionPlanner: pomegranateDeep,

  // Legacy keys — kept so every existing screen's theme.colors.X reference
  // continues to resolve, now to the new palette.
  background: ivory,
  surface: invitationCard,
  surfaceSoft: sand,
  primary: emerald,
  primarySoft: emeraldTint,
  secondary: lapis, // unused anywhere today (confirmed via grep) - safe to repoint
  accent: gold,
  accentSoft: goldPale,
  accentDeep: emeraldDeep,
  muted: mutedText,
  text: ink,
  textSecondary: mutedText,
  border: cardBorder,
  danger: pomegranateBright,
  success: statusSuccess,
  shadow: '#00000022',
};
