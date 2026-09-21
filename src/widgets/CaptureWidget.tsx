import { Ellipse, HStack, Image, Link, Spacer, VStack, ZStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, frame, offset, padding, rotationEffect } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type CaptureWidgetProps = { thoughtCount: number };

function CaptureWidget(_props: CaptureWidgetProps, _environment: WidgetEnvironment) {
  'widget';
  const moth = (
    <ZStack modifiers={[frame({ width: 66, height: 60 }), rotationEffect(-35)]}>
      <Ellipse modifiers={[frame({ width: 38, height: 24 }), background('#EF705A'), offset({ x: -12, y: -5 })]} />
      <Ellipse modifiers={[frame({ width: 38, height: 24 }), background('#F5F0E6'), offset({ x: 12, y: 5 })]} />
      <Ellipse modifiers={[frame({ width: 5, height: 24 }), background('#F5F0E6')]} />
    </ZStack>
  );

  return (
    <VStack
      alignment="leading"
      modifiers={[padding({ all: 18 }), containerBackground('#242019', 'widget')]}
    >
      {moth}
      <Spacer />
      <HStack spacing={10}>
        <Link destination="unsorted://capture?mode=write">
          <ZStack modifiers={[frame({ width: 54, height: 44 }), background('#EF705A'), cornerRadius(14)]}>
            <Image systemName="pencil" size={18} color="#242019" />
          </ZStack>
        </Link>
        <Link destination="unsorted://capture?mode=voice">
          <ZStack modifiers={[frame({ width: 54, height: 44 }), background('#F5F0E6'), cornerRadius(14)]}>
            <Image systemName="mic.fill" size={18} color="#242019" />
          </ZStack>
        </Link>
      </HStack>
    </VStack>
  );
}

export default createWidget('UnsortedCapture', CaptureWidget);
