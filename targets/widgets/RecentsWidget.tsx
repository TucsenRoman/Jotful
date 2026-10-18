import { Divider, HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, lineLimit, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type RecentItem = { id: number; text: string; kind: 'question' | 'idea' | 'thought'; tag?: { name: string; color: string } };
type RecentsWidgetProps = { items?: RecentItem[] };

function RecentsWidget(props: RecentsWidgetProps, environment: WidgetEnvironment) {
  'widget';
  const isAccented = environment.widgetRenderingMode === 'accented' || environment.widgetRenderingMode === 'vibrant';
  const ink = isAccented ? '#FFFFFF' : '#020204';
  const secondary = isAccented ? '#FFFFFF' : 'rgba(60,60,67,0.6)';
  const allItems = props.items ?? [];
  const maxItems = environment.widgetFamily === 'systemSmall' ? 1 : environment.widgetFamily === 'systemMedium' ? 2 : 5;
  const items = allItems.slice(0, maxItems);
  const isSmall = environment.widgetFamily === 'systemSmall';

  return (
    <VStack alignment="leading" spacing={isSmall ? 10 : 8} modifiers={[padding({ all: 18 }), containerBackground('#FFFFFF', 'widget')]}> 
      <HStack spacing={6}>
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(ink)]}>Jotful</Text>
        <Spacer />
        <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(secondary)]}>{allItems.length ? `${allItems.length}` : 'New'}</Text>
      </HStack>
      {items.length ? items.map((item, index) => (
        <VStack key={item.id} alignment="leading" spacing={6}>
          <Text modifiers={[font({ size: isSmall ? 17 : 15, weight: isSmall ? 'medium' : 'regular' }), foregroundStyle(ink), lineLimit(isSmall ? 4 : 2)]}>{item.text}</Text>
          {item.tag && !isSmall && (
            <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(isAccented ? '#000000' : item.tag.color === '#F2B705' ? '#020204' : '#FFFFFF'), padding({ horizontal: 8, vertical: 2 }), background(isAccented ? '#FFFFFF' : item.tag.color), cornerRadius(10)]}>{item.tag.name}</Text>
          )}
          {index < items.length - 1 && <Divider modifiers={[padding({ vertical: 1 })]} />}
        </VStack>
      )) : <Text modifiers={[font({ size: 15, weight: 'medium' }), foregroundStyle(secondary), lineLimit(3)]}>Your next jot lands here.</Text>}
      <Spacer />
    </VStack>
  );
}

export default createWidget('UnsortedRecents', RecentsWidget);
