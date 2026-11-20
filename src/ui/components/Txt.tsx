import { Text, type TextProps, type TextStyle } from 'react-native'

import { color, font, size } from '../theme'

type Variant = 'title' | 'subTitle' | 'body' | 'medium' | 'semibold' | 'label' | 'caption' | 'overline'

const variants: Record<Variant, TextStyle> = {
  title: { fontFamily: font.display, fontSize: size.title, color: color.ink },
  subTitle: { fontFamily: font.display, fontSize: size.subTitle, color: color.ink },
  body: { fontFamily: font.body, fontSize: size.body, color: color.ink },
  medium: { fontFamily: font.medium, fontSize: size.body, color: color.ink },
  semibold: { fontFamily: font.semibold, fontSize: size.body, color: color.ink },
  label: { fontFamily: font.semibold, fontSize: size.label, color: color.textSecondary },
  caption: { fontFamily: font.body, fontSize: size.caption, color: color.muted },
  overline: {
    fontFamily: font.semibold, fontSize: size.overline, color: color.muted,
    letterSpacing: size.overline * 0.06, textTransform: 'uppercase',
  },
}

const KANNADA = /[ಀ-೿]/
const RUNS = /([ಀ-೿‌‍]+)/

/** Kannada font for a style: bold weights map to the semibold Kannada face. */
export function kannadaFace(style: TextStyle): string {
  const f = String(style.fontFamily ?? '')
  return /Bold|SemiBold|Medium/.test(f) ? font.kannadaBold : font.kannada
}

/** Split a string into Kannada / non-Kannada runs, Kannada ones in the Kannada face. */
export function scriptRuns(text: string, base: TextStyle) {
  if (!KANNADA.test(text)) return text
  return text.split(RUNS).map((run, i) =>
    KANNADA.test(run) ? <Text key={i} style={{ fontFamily: kannadaFace(base) }}>{run}</Text> : run,
  )
}

/**
 * Text that renders Kannada runs in Noto Sans Kannada and everything else in
 * the variant's Latin font. Mixed transcripts need this on every platform.
 */
export function Txt({ variant = 'body', style, children, ...rest }: TextProps & { variant?: Variant }) {
  const base = variants[variant]
  const content = typeof children === 'string' ? scriptRuns(children, base) : children
  return (
    <Text style={[base, style]} {...rest}>
      {content}
    </Text>
  )
}
