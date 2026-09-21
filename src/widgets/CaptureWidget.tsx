import { Ellipse, HStack, Link, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { background, cornerRadius, font, foregroundStyle, frame, offset, padding, rotationEffect } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type CaptureWidgetProps = { thoughtCount: number };

function CaptureWidget(props: CaptureWidgetProps, environment: WidgetEnvironment) {
  'widget';
  const count = props.thoughtCount ?? 0;
  const isSmall = environment.widgetFamily === 'systemSmall';
  const moth = (
    <ZStack modifiers={[frame({ width: 38, height: 34 }), rotationEffect(-32)]}>
      <Ellipse modifiers={[frame({ width: 23, height: 15 }), background('#EF705A'), offset({ x: -7, y: -3 })]} />
      <Ellipse modifiers={[frame({ width: 23, height: 15 }), background('#F5F0E6'), offset({ x: 7, y: 3 })]} />
      <Ellipse modifiers={[frame({ width: 4, height: 14 }), background('#F5F0E6')]} />
    </ZStack>
  );

  if (isSmall) {
    return (
      <Link destination="unsorted://capture?mode=write">
        <VStack alignment="leading" spacing={5} modifiers={[padding({ all: 16 }), background('#242019')]}>
          {moth}
          <Text modifiers={[font({ size: 22, weight: 'bold' }), foregroundStyle('#F5F0E6')]}>unsorted</Text>
          <Text modifiers={[font({ size: 13 }), foregroundStyle('#F5F0E6')]}>Hold that thought.</Text>
        </VStack>
      </Link>
    );
  }

  return (
    <VStack alignment="leading" spacing={8} modifiers={[padding({ all: 16 }), background('#242019')]}>
      <HStack spacing={10} alignment="center">
        {moth}
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 22, weight: 'bold' }), foregroundStyle('#F5F0E6')]}>unsorted</Text>
          <Text modifiers={[font({ size: 13 }), foregroundStyle('#F5F0E6')]}>Hold that thought.</Text>
        </VStack>
      </HStack>
      <HStack spacing={10}>
        <Link label="Write" destination="unsorted://capture?mode=write" modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle('#242019'), background('#EF705A'), padding({ horizontal: 14, vertical: 8 }), cornerRadius(18)]} />
        <Link label="Speak" destination="unsorted://capture?mode=voice" modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle('#F5F0E6'), background('#242019'), padding({ horizontal: 14, vertical: 8 }), cornerRadius(18)]} />
        <Text modifiers={[font({ size: 12 }), foregroundStyle('#F5F0E6')]}>It can stay here.</Text>
      </HStack>
    </VStack>
  );
}

export default createWidget('UnsortedCapture', CaptureWidget);
