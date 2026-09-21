import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type CaptureWidgetProps = { thoughtCount: number };

function CaptureWidget(props: CaptureWidgetProps, _environment: WidgetEnvironment) {
  'widget';
  const count = props.thoughtCount ?? 0;

  return (
    <VStack modifiers={[padding({ all: 16 })]}>
      <Text modifiers={[font({ size: 19, weight: 'bold' }), foregroundStyle('#263D2A')]}>unsorted</Text>
      <Text modifiers={[font({ size: 14 }), foregroundStyle('#526052')]}>hold the thought</Text>
      <Text modifiers={[font({ size: 13 }), foregroundStyle('#315D35')]}> {count === 1 ? '1 loose thought' : `${count} loose thoughts`}</Text>
    </VStack>
  );
}

export default createWidget('UnsortedCapture', CaptureWidget);
