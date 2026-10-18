import { Check } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { Tag } from '../../storage';
import { TagPill } from './HomeHeader';

const tokens = require('../../theme/tokens');

// Pick a thought's tags. The first picked tag colours the card, so order is kept.
export function TagPicker({ visible, tags, selectedIds, onChange, onClose }: { visible: boolean; tags: Tag[]; selectedIds: number[]; onChange(ids: number[]): void; onClose(): void }) {
  const insets = useSafeAreaInsets();
  const toggle = (id: number) => {
    void Haptics.selectionAsync();
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable className="flex-1 bg-black/20" onPress={onClose} accessibilityLabel="Close tags" />
    <View className="rounded-t-sheet bg-surface px-margin pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
      <View className="mb-3 h-1.5 w-10 self-center rounded-full bg-fill" />
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-title2 font-bold text-ink">Tags</Text>
        <Pressable onPress={onClose} className="h-control items-center justify-center rounded-full bg-action px-5" accessibilityLabel="Done"><Text className="text-body font-semibold text-onInk">Done</Text></Pressable>
      </View>
      <Text className="mb-3 text-footnote text-secondary">The first tag colours the card.</Text>
      {tags.map((tag) => {
        const on = selectedIds.includes(tag.id);
        return <Pressable key={tag.id} onPress={() => toggle(tag.id)} className="flex-row items-center justify-between py-2.5" accessibilityLabel={tag.name}>
          <TagPill tag={tag} bright />
          {on ? <Check size={20} color={tokens.color.action} /> : null}
        </Pressable>;
      })}
    </View>
  </Modal>;
}
