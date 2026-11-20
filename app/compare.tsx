import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { models } from '@/models/manifest'
import { Card, Header, Txt } from '@/ui/components'
import { color, space } from '@/ui/theme'

/** M5: run one clip through every downloaded model, sequentially, releasing between runs. */
export default function CompareScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header title="Compare models" />
      <View style={{ padding: space.screen, gap: 12 }}>
        <Txt variant="caption" style={{ fontSize: 14 }}>
          Runs one clip through every downloaded model and shows the outputs side by side. Available once models can be downloaded.
        </Txt>
        {models.map((m) => (
          <Card key={m.id} style={{ borderStyle: 'dashed', borderColor: color.borderStrong, gap: 2 }}>
            <Txt variant="semibold">{m.name}</Txt>
            <Txt variant="caption">Download to compare</Txt>
          </Card>
        ))}
      </View>
    </SafeAreaView>
  )
}
