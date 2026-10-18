import { ListFilter, Search, Settings, X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { MothMark } from '../../brand/MothMark';
import { Glass } from '../ui/Glass';
import type { Tag } from '../../storage';

const tokens = require('../../theme/tokens');

// The one brand moment in the header: gradient Fraunces "Jotful" (BRAND.md).
export function Wordmark() {
  return <Svg width={112} height={42} viewBox="0 0 112 42" accessibilityLabel="Jotful">
    <Defs><LinearGradient id="wordmark-gradient" x1="0" y1="0" x2="150" y2="0" gradientUnits="userSpaceOnUse"><Stop offset="0" stopColor={tokens.primitive.persimmon} /><Stop offset="0.48" stopColor={tokens.primitive.mothGreen} /><Stop offset="1" stopColor={tokens.primitive.ink} /></LinearGradient></Defs>
    <SvgText x="0" y="34" fill="url(#wordmark-gradient)" fontFamily={tokens.font.wordmark} fontSize="34" letterSpacing="-1">Jotful</SvgText>
  </Svg>;
}

// White Liquid-Glass-style capsule holding icon buttons (APPLE_SPECS: glass only on controls).
export function GlassGroup({ children }: { children: React.ReactNode }) {
  // iOS 26 Liquid Glass capsule (blur fallback), shadow on the outer view.
  return <View style={{ borderRadius: 999, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
    <Glass interactive style={{ borderRadius: 999, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
      {children}
    </Glass>
  </View>;
}

export function GlassIcon({ onPress, label, children }: { onPress(): void; label: string; children: React.ReactNode }) {
  return <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={4} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>{children}</Pressable>;
}

type HeaderProps = {
  topInset: number;
  searchOpen: boolean;
  search: string;
  onSearchChange(text: string): void;
  onOpenSearch(): void;
  onCloseSearch(): void;
  onOpenSettings(): void;
};

export function HomeHeader({ topInset, searchOpen, search, onSearchChange, onOpenSearch, onCloseSearch, onOpenSettings }: HeaderProps) {
  return <View className="flex-row items-center gap-3 px-margin" style={{ paddingTop: topInset + 8, height: topInset + 64 }}>
    {searchOpen ? <>
      <View className="h-control flex-1 flex-row items-center gap-2 rounded-full bg-fill px-4"><Search size={17} color={tokens.color.secondary} /><TextInput autoFocus value={search} onChangeText={onSearchChange} placeholder="Search thoughts" placeholderTextColor={tokens.color.secondary} className="flex-1 py-0 text-body text-ink" /></View>
      <GlassGroup><GlassIcon onPress={onCloseSearch} label="Close search"><X size={20} color={tokens.color.ink} /></GlassIcon></GlassGroup>
    </> : <>
      <View className="mr-auto flex-row items-center gap-1.5"><MothMark size={26} /><Wordmark /></View>
      <GlassGroup>
        <GlassIcon onPress={onOpenSearch} label="Search"><Search size={20} color={tokens.color.ink} /></GlassIcon>
        <GlassIcon onPress={onOpenSettings} label="Open settings"><Settings size={20} color={tokens.color.ink} /></GlassIcon>
      </GlassGroup>
    </>}
  </View>;
}

// Small tag pill. `bright` = solid tag colour (cards); otherwise tinted with coloured text (filters).
export function TagPill({ tag, bright = false, selected = false, onPress, onRemove }: { tag: Tag; bright?: boolean; selected?: boolean; onPress?(): void; onRemove?(): void }) {
  const hex = tokens.tag[tag.color];
  const style = bright
    ? { backgroundColor: hex }
    : { backgroundColor: selected ? tokens.mix(hex, 0.22) : tokens.tagPillTint[tag.color], borderWidth: selected ? 1.5 : 0, borderColor: hex };
  const textColor = bright ? tokens.tagOn[tag.color] : tag.color === 'idea' ? tokens.mix(hex, 0.75, tokens.primitive.ink) : hex;
  return <Pressable disabled={!onPress && !onRemove} onPress={onPress ?? onRemove} className="flex-row items-center gap-1 rounded-full px-2.5 py-1" style={style} accessibilityLabel={tag.name}>
    {selected && <Text style={{ color: textColor }} className="text-caption font-semibold">✓</Text>}
    <Text style={{ color: textColor }} className="text-caption2 font-bold uppercase tracking-[0.6px]">{tag.name}</Text>
    {onRemove && <X size={12} color={textColor} />}
  </Pressable>;
}

// The row under the title: a plain floating filter icon, then the active filters.
export function FilterRow({ tags, selectedIds, showResolved, onOpenMenu, onRemoveTag, onHideResolved }: { tags: Tag[]; selectedIds: number[]; showResolved: boolean; onOpenMenu(): void; onRemoveTag(id: number): void; onHideResolved(): void }) {
  const active = tags.filter((tag) => selectedIds.includes(tag.id));
  return <View className="flex-row flex-wrap items-center gap-2 px-margin pb-2" style={{ minHeight: 32 }}>
    <Pressable onPress={onOpenMenu} hitSlop={10} accessibilityLabel="Filter thoughts" className="h-8 w-8 items-center justify-center rounded-full" style={active.length || showResolved ? { backgroundColor: tokens.color.ink } : undefined}>
      <ListFilter size={18} color={active.length || showResolved ? tokens.color.onInk : tokens.color.secondary} />
    </Pressable>
    {active.length === 0 && !showResolved && <Text className="text-subhead text-secondary">All thoughts</Text>}
    {active.map((tag) => <TagPill key={tag.id} tag={tag} onRemove={() => onRemoveTag(tag.id)} />)}
    {showResolved && <Pressable onPress={onHideResolved} className="flex-row items-center gap-1 rounded-full bg-fill px-2.5 py-1"><Text className="text-caption2 font-bold uppercase tracking-[0.6px] text-secondary">Resolved</Text><X size={12} color={tokens.color.secondary} /></Pressable>}
  </View>;
}

// Glass popover from the filter icon: multi-select tags, then "Show resolved".
export function FilterMenu({ visible, top, tags, selectedIds, showResolved, onToggleTag, onToggleResolved, onClose }: { visible: boolean; top: number; tags: Tag[]; selectedIds: number[]; showResolved: boolean; onToggleTag(id: number): void; onToggleResolved(value: boolean): void; onClose(): void }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Close filter">
      <Pressable onPress={() => {}} className="absolute overflow-hidden rounded-card" style={{ top, left: tokens.space.margin, width: 300, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } }}>
        <Glass style={{ padding: 16 }} fallbackFill="rgba(255,255,255,0.88)">
          <Text className="mb-2 text-footnote text-secondary">Tags</Text>
          <View className="flex-row flex-wrap gap-2">
            {tags.map((tag) => <TagPill key={tag.id} tag={tag} selected={selectedIds.includes(tag.id)} onPress={() => { void Haptics.selectionAsync(); onToggleTag(tag.id); }} />)}
          </View>
          <View className="my-3 h-px bg-fill" />
          <View className="flex-row items-center justify-between"><Text className="text-body text-ink">Show resolved</Text><Switch value={showResolved} onValueChange={onToggleResolved} /></View>
        </Glass>
      </Pressable>
    </Pressable>
  </Modal>;
}
