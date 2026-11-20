// Design tokens — values from docs/SCREENS.md. Use these instead of ad-hoc hex codes.
export const color = {
  bg: '#F3F4F6', surface: '#FFFFFF', ink: '#111418', textSecondary: '#3B414A',
  muted: '#565D68', border: '#DDE1E6', borderStrong: '#C9CED5', segmentBg: '#E4E7EB',
  accent: '#F5A524', // high-vis amber — fills only, always with ink text on it
  termBg: '#FDEFD2', termText: '#6B4100', // workshop-term chips/highlights
  uncertainBg: '#E8EEFC', uncertainText: '#15307A', uncertainAccent: '#1F4FD1',
  successBg: '#E3F4EA', successText: '#145A32',
  // dark (recording screen)
  dBg: '#121417', dSurface: '#1B1E22', dRaised: '#22262B', dBorder: '#2C3137',
  dText: '#F3F4F6', dMuted: '#A8B0BC', dTermBg: '#4A3410', dTermText: '#FFD48A',
  recRed: '#FF5A4E',
  // mic button halo (accent at 12% / 22%)
  ringOuter: 'rgba(245,165,36,0.12)', ringInner: 'rgba(245,165,36,0.22)',
  scrim: 'rgba(17,20,24,0.72)',
} as const

export const radius = { card: 14, input: 12, chip: 6, pill: 999 } as const

export const font = {
  display: 'SpaceGrotesk_700Bold', // screen titles 26, sub-screen titles 21
  heading: 'SpaceGrotesk_600SemiBold',
  body: 'Inter_400Regular', medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold', bold: 'Inter_700Bold',
  kannada: 'NotoSansKannada_400Regular', kannadaBold: 'NotoSansKannada_600SemiBold',
} as const

export const size = {
  title: 26, subTitle: 21, body: 15, transcript: 17, transcriptLive: 19,
  label: 13, caption: 12, overline: 11,
} as const

export const space = { screen: 20, cardV: 12, cardH: 14, gapS: 8, gapM: 10, gapL: 14 } as const

/** Minimum touch target and primary CTA height. */
export const touch = { min: 44, cta: 52 } as const
