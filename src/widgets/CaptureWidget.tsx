import { Ellipse, HStack, Link, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, frame, offset, padding, rotationEffect, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type CaptureWidgetProps = { thoughtCount: number };

function CaptureWidget(_props: CaptureWidgetProps, environment: WidgetEnvironment) {
  'widget';
  const isSmall = environment.widgetFamily === 'systemSmall';
  const moth = (
    <ZStack modifiers={[frame({ width: 46, height: 42 }), rotationEffect(-35)]}>
      <Ellipse modifiers={[frame({ width: 28, height: 17 }), background('#EF705A'), offset({ x: -9, y: -4 })]} />
      <Ellipse modifiers={[frame({ width: 28, height: 17 }), background('#F5F0E6'), offset({ x: 9, y: 4 })]} />
      <Ellipse modifiers={[frame({ width: 4, height: 18 }), background('#F5F0E6')]} />
    </ZStack>
  );

  if (isSmall) {
    return (
      <VStack alignment="leading" spacing={8} modifiers={[padding({ all: 17 }), containerBackground('#242019', 'widget'), widgetURL('unsorted://capture?mode=write')]}>
        {moth}
        <Text modifiers={[font({ size: 24, weight: 'semibold', design: 'serif' }), foregroundStyle('#F5F0E6')]}>unsorted</Text>
        <Text modifiers={[font({ size: 13, weight: 'medium' }), foregroundStyle('#F5F0E6')]}>Hold that thought.</Text>
      </VStack>
    );
  }

  return (
    <VStack alignment="leading" spacing={13} modifiers={[padding({ all: 18 }), containerBackground('#242019', 'widget')]}>
      <HStack alignment="top">
        <VStack alignment="leading" spacing={3}>
          <Text modifiers={[font({ size: 27, weight: 'semibold', design: 'serif' }), foregroundStyle('#F5F0E6')]}>unsorted</Text>
          <Text modifiers={[font({ size: 13, weight: 'medium' }), foregroundStyle('#F5F0E6')]}>Hold that thought.</Text>
        </VStack>
        <Spacer />
        {moth}
      </HStack>
      <HStack spacing={9}>
        <Link destination="unsorted://capture?mode=write">
          <VStack alignment="leading" spacing={2} modifiers={[frame({ minWidth: 104 }), padding({ horizontal: 13, vertical: 10 }), background('#EF705A'), cornerRadius(14)]}>
            <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle('#242019')]}>Write</Text>
            <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle('#242019')]}>Catch it here</Text>
          </VStack>
        </Link>
        <Link destination="unsorted://capture?mode=voice">
          <VStack alignment="leading" spacing={2} modifiers={[frame({ minWidth: 104 }), padding({ horizontal: 13, vertical: 10 }), background('#F5F0E6'), cornerRadius(14)]}>
            <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle('#242019')]}>Speak</Text>
            <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle('#242019')]}>Say it out loud</Text>
          </VStack>
        </Link>
      </HStack>
    </VStack>
  );
}

export default createWidget('UnsortedCapture', CaptureWidget);
