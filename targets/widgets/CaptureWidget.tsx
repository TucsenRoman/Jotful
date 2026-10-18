import { Ellipse, HStack, Image, Link, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, frame, offset, padding, rotationEffect } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

// `scheme` comes from the app (jotful, or jotful-dev in the dev app) so the dev app's
// widget opens the dev app, not the store one.
type CaptureWidgetProps = { thoughtCount: number; scheme?: string };

function CaptureWidget(props: CaptureWidgetProps, environment: WidgetEnvironment) {
  'widget';
  const isAccented = environment.widgetRenderingMode === 'accented' || environment.widgetRenderingMode === 'vibrant';
  const ink = isAccented ? '#FFFFFF' : '#020204';
  const secondary = isAccented ? '#FFFFFF' : 'rgba(60,60,67,0.6)';
  const fill = isAccented ? '#FFFFFF' : 'rgba(118,118,128,0.12)';
  const moss = isAccented ? '#FFFFFF' : '#58795C';
  const persimmon = isAccented ? '#FFFFFF' : '#EF705A';
  const openJots = props.thoughtCount ?? 0;
  const scheme = props.scheme ?? 'jotful';
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
      modifiers={[padding({ all: 18 }), containerBackground('#FFFFFF', 'widget')]}
    >
      <HStack spacing={10}>
        {moth}
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(ink)]}>Jotful</Text>
          <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(secondary)]}>{countLabel}</Text>
        </VStack>
      </HStack>
      <Spacer />
      <HStack spacing={12}>
        <Link destination={scheme + '://capture?mode=write'}>
          <ZStack modifiers={[frame({ width: 48, height: 44 }), background(ink), cornerRadius(16)]}>
            <Image systemName="square.and.pencil" size={18} color={isAccented ? '#000000' : '#FFFFFF'} />
          </ZStack>
        </Link>
        <Link destination={scheme + '://capture?mode=voice'}>
          <ZStack modifiers={[frame({ width: 48, height: 44 }), background(fill), cornerRadius(16)]}>
            <Image systemName="mic" size={18} color={ink} />
          </ZStack>
        </Link>
      </HStack>
    </VStack>
  );
}

export default createWidget('UnsortedCapture', CaptureWidget);
