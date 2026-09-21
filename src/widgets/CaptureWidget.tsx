import { Ellipse, HStack, Image, Link, Spacer, VStack, ZStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, frame, offset, padding, rotationEffect } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type CaptureWidgetProps = { thoughtCount: number };

function CaptureWidget(_props: CaptureWidgetProps, _environment: WidgetEnvironment) {
  'widget';
  const moth = (
    <ZStack modifiers={[frame({ width: 64, height: 56 })]}>
      <Ellipse modifiers={[frame({ width: 29, height: 43 }), background({ type: 'linearGradient', colors: ['#EF705A', '#EF705A', '#F5F0E6'], startPoint: { x: 0, y: 1 }, endPoint: { x: 1, y: 0 } }), rotationEffect(-34), offset({ x: -10, y: 3 })]} />
      <Ellipse modifiers={[frame({ width: 29, height: 43 }), background({ type: 'linearGradient', colors: ['#F5F0E6', '#F5F0E6', '#EF705A'], startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } }), rotationEffect(34), offset({ x: 10, y: -3 })]} />
      <Ellipse modifiers={[frame({ width: 7, height: 25 }), background('#242019'), rotationEffect(23)]} />
    </ZStack>
  );

  return (
    <VStack
      alignment="leading"
      modifiers={[padding({ all: 18 }), containerBackground('#DED6C7', 'widget')]}
    >
      {moth}
      <Spacer />
      <HStack spacing={10}>
        <Link destination="unsorted://capture?mode=write">
          <ZStack modifiers={[frame({ width: 54, height: 44 }), background('#EF705A'), cornerRadius(14)]}>
            <Image systemName="square.and.pencil" size={18} color="#242019" />
          </ZStack>
        </Link>
        <Link destination="unsorted://capture?mode=voice">
          <ZStack modifiers={[frame({ width: 54, height: 44 }), background('#F5F0E6'), cornerRadius(14)]}>
            <Image systemName="mic" size={18} color="#242019" />
          </ZStack>
        </Link>
      </HStack>
    </VStack>
  );
}

export default createWidget('UnsortedCapture', CaptureWidget);
