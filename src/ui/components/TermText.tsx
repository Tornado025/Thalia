import { Fragment } from 'react'
import { Text, type TextStyle } from 'react-native'

import { splitToken, type NWord, type TermSpan } from '../../nlp'
import { color, font, size } from '../theme'
import { scriptRuns } from './Txt'

type Props = {
  words: NWord[]
  terms: TermSpan[]
  uncertain?: number[]
  onPressWord?: (index: number) => void
  dark?: boolean
  fontSize?: number
}

/**
 * Transcript renderer: lexicon terms as amber-tint highlights, uncertain words
 * with a blue dashed underline, each word tappable. Kannada runs use the Kannada font.
 */
export function TermText({ words, terms, uncertain = [], onPressWord, dark, fontSize = size.transcript }: Props) {
  const base: TextStyle = { fontFamily: font.body, fontSize, lineHeight: fontSize * 1.65, color: dark ? color.dText : color.ink }
  const termAt = new Map<number, TermSpan>()
  for (const t of terms) for (let i = t.start; i < t.end; i++) termAt.set(i, t)

  return (
    <Text style={base}>
      {words.map((w, i) => {
        const term = termAt.get(i)
        const isUncertain = uncertain.includes(i)
        const parts = splitToken(w.text)
        const style: TextStyle = {
          ...(term && {
            backgroundColor: dark ? color.dTermBg : color.termBg,
            color: dark ? color.dTermText : color.termText,
            fontFamily: font.semibold,
          }),
          ...(isUncertain && {
            color: color.uncertainText,
            backgroundColor: color.uncertainBg,
            textDecorationLine: 'underline',
            textDecorationStyle: 'dashed',
            textDecorationColor: color.uncertainAccent,
          }),
        }
        // Keep the highlight continuous across a multi-word term.
        const joinNext = term && termAt.get(i + 1) === term && !parts.post
        return (
          <Fragment key={i}>
            <Text
              onPress={onPressWord ? () => onPressWord(i) : undefined}
              accessibilityRole={onPressWord ? 'button' : undefined}
              accessibilityHint={isUncertain ? 'Not sure about this word' : undefined}>
              {/* Highlight the word itself, not surrounding punctuation like `coolant.` */}
              {parts.pre}
              <Text style={style}>{scriptRuns(parts.latin + parts.rest, { ...base, ...style })}</Text>
              {parts.post}
            </Text>
            {i < words.length - 1 ? <Text style={joinNext ? style : undefined}> </Text> : null}
          </Fragment>
        )
      })}
    </Text>
  )
}
