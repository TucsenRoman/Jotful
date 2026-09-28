import { Ellipse, HStack, Image, Link, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, frame, offset, padding, rotationEffect } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type CaptureWidgetProps = { thoughtCount: number };

function CaptureWidget(props: CaptureWidgetProps, environment: WidgetEnvironment) {
  'widget';
  const isAccented = environment.widgetRenderingMode === 'accented' || environment.widgetRenderingMode === 'vibrant';
  const ink = isAccented ? '#FFFFFF' : '#242019';
  const cream = isAccented ? '#FFFFFF' : '#F5F0E6';
  const moss = isAccented ? '#FFFFFF' : '#58795C';
  const persimmon = isAccented ? '#FFFFFF' : '#EF705A';
  const openJots = props.thoughtCount ?? 0;
  const countLabel = openJots === 1 ? '1 jot waiting' : `${openJots} jots waiting`;
  const moth = (
    <ZStack modifiers={[frame({ width: 54, height: 46 })]}>
      <Ellipse modifiers={[frame({ width: 25, height: 37 }), background(persimmon), rotationEffect(-34), offset({ x: -8, y: 2 })]} />
      <Ellipse modifiers={[frame({ width: 25, height: 37 }), background(moss), rotationEffect(34), offset({ x: 8, y: -2 })]} />
      <Ellipse modifiers={[frame({ width: 6, height: 22 }), background(ink), rotationEffect(23)]} />
    </ZStack>
  );

  return (
    <VStack
      alignment="leading"
      modifiers={[padding({ all: 18 }), containerBackground('#F5F0E6', 'widget')]}
    >
      <HStack spacing={10}>
        {moth}
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 15, weight: 'bold', design: 'rounded' }), foregroundStyle(ink)]}>JOTFUL</Text>
          <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(moss)]}>{countLabel}</Text>
        </VStack>
      </HStack>
      <Spacer />
      <HStack spacing={12}>
        <Link destination="jotful://capture?mode=write">
          <ZStack modifiers={[frame({ width: 48, height: 44 }), background(persimmon), cornerRadius(16)]}>
            <Image systemName="square.and.pencil" size={18} color={ink} />
          </ZStack>
        </Link>
        <Link destination="jotful://capture?mode=voice">
          <ZStack modifiers={[frame({ width: 48, height: 44 }), background(cream), cornerRadius(16)]}>
            <Image systemName="mic" size={18} color={ink} />
          </ZStack>
        </Link>
      </HStack>
    </VStack>
  );
}

export default createWidget('UnsortedCapture', CaptureWidget);
