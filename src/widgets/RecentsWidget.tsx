import { Divider, HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, lineLimit, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type RecentItem = { id: number; text: string; kind: 'question' | 'idea' | 'thought' };
type RecentsWidgetProps = { items?: RecentItem[] };

function RecentsWidget(props: RecentsWidgetProps, environment: WidgetEnvironment) {
  'widget';
  const allItems = props.items ?? [];
  const maxItems = environment.widgetFamily === 'systemSmall' ? 1 : environment.widgetFamily === 'systemMedium' ? 2 : 5;
  const items = allItems.slice(0, maxItems);
  const isSmall = environment.widgetFamily === 'systemSmall';

  return (
    <VStack alignment="leading" spacing={isSmall ? 10 : 8} modifiers={[padding({ all: 18 }), containerBackground('#F5F0E6', 'widget')]}> 
      <HStack spacing={6}>
        <Text modifiers={[font({ size: 12, weight: 'bold', design: 'rounded' }), foregroundStyle('#242019')]}>RECENT</Text>
        <Spacer />
        <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle('#74876A')]}>{allItems.length ? `${allItems.length}` : ''}</Text>
      </HStack>
      {items.length ? items.map((item, index) => (
        <VStack key={item.id} alignment="leading" spacing={6}>
          <Text modifiers={[font({ size: isSmall ? 17 : 15, weight: isSmall ? 'medium' : 'regular' }), foregroundStyle('#242019'), lineLimit(isSmall ? 4 : 2)]}>{item.text}</Text>
          {index < items.length - 1 && <Divider modifiers={[padding({ vertical: 1 })]} />}
        </VStack>
      )) : <Text modifiers={[font({ size: 15, weight: 'regular' }), foregroundStyle('#74876A'), lineLimit(3)]}>Your latest thought will land here.</Text>}
      <Spacer />
    </VStack>
  );
}

export default createWidget('UnsortedRecents', RecentsWidget);
