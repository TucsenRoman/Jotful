import { History, Search, XCircle } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPreference, listTags, listThoughts, setPreference, type Tag, type Thought } from '../../storage';

const tokens = require('../../theme/tokens');

// Search page (design/mocks/r9/search-b.html, search-empty-b.html): field and
// Cancel on top, tag pills with match counts to narrow, results grouped by
// "This week" / "Earlier". Before typing: recent searches and all tags.

const RECENTS_KEY = 'recentSearches';
const STAND_INS = /^(Photo|Video|Audio recording|\d+ photos)$/;

function readRecents(): string[] {
  try { return JSON.parse(getPreference(RECENTS_KEY, '[]')); } catch { return []; }
}

function rememberSearch(query: string) {
  const q = query.trim();
  if (!q) return;
  setPreference(RECENTS_KEY, JSON.stringify([q, ...readRecents().filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 6)));
}

function shortDate(time: number) {
  const days = (Date.now() - time) / 86400000;
  if (days < 7) return new Date(time).toLocaleDateString(undefined, { weekday: 'short' });
  return new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// The text with every match of `query` in bold.
function Highlighted({ text, query, className }: { text: string; query: string; className: string }) {
  const q = query.trim();
  if (!q) return <Text className={className} numberOfLines={1}>{text}</Text>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'));
  return <Text className={className} numberOfLines={1}>{parts.map((part, i) => part.toLowerCase() === q.toLowerCase() ? <Text key={i} className="font-bold text-ink">{part}</Text> : part)}</Text>;
}

function FilterPill({ tag, count, on, onPress }: { tag: Tag; count: number; on: boolean; onPress(): void }) {
  const hex = tokens.tag[tag.color];
  const text = tag.color === 'idea' ? tokens.mix(hex, 0.75, tokens.primitive.ink) : hex;
  return <Pressable onPress={onPress} className="h-[30px] flex-row items-center gap-1.5 rounded-full px-3" style={{ backgroundColor: on ? tokens.mix(hex, 0.22) : tokens.tagPillTint[tag.color], borderWidth: on ? 1.5 : 0, borderColor: hex }} accessibilityLabel={`${tag.name}, ${count}`}>
    <Text className="text-footnote font-bold uppercase tracking-[0.4px]" style={{ color: text }}>{tag.name}</Text>
    <Text className="text-footnote font-medium" style={{ color: text, opacity: 0.7 }}>{count}</Text>
  </Pressable>;
}

function ResultRow({ thought, query, last, onPress }: { thought: Thought; query: string; last: boolean; onPress(): void }) {
  const lines = thought.text.split('\n').map((line) => line.replace(/^(#|•|\*|☐|\d+\.)\s+/, '').trim()).filter(Boolean);
  const hasText = !STAND_INS.test(thought.text.trim());
  const title = hasText ? lines[0] ?? '' : thought.attachmentKind === 'audio' ? 'Voice note' : thought.text;
  const snippet = hasText ? lines.slice(1).join(' ') : '';
  const first = thought.tags[0];
  return <Pressable onPress={onPress} className="flex-row items-center gap-3 pl-margin" accessibilityLabel={title}>
    <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: first ? tokens.tag[first.color] : tokens.primitive.grey3 }} />
    <View className={'flex-1 flex-row items-center gap-3 py-2.5 pr-margin ' + (last ? '' : 'border-b border-fill')}>
      <View className="flex-1">
        <Highlighted text={title} query={query} className="text-body text-ink" />
        {snippet ? <Highlighted text={snippet} query={query} className="text-subhead text-secondary" /> : null}
      </View>
      <Text className="self-start pt-0.5 text-footnote text-secondary">{shortDate(thought.createdAt)}</Text>
      {thought.attachmentKind === 'image' && thought.attachmentUri ? <Image source={{ uri: thought.attachmentUri }} className="h-control w-control rounded-media" /> : null}
    </View>
  </Pressable>;
}

export function SearchScreen({ onCancel, onOpen }: { onCancel(): void; onOpen(thought: Thought): void }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [recents, setRecents] = useState(readRecents);
  const tags = useMemo(listTags, []);
  // Every thought, resolved included: search is how you find old ones.
  // Tapping a tag before typing browses that tag; typing searches text.
  const browsing = !query.trim() && tagIds.length > 0;
  const matches = useMemo(() => query.trim() || browsing ? listThoughts(query.trim(), { showResolved: true }).sort((a, b) => b.createdAt - a.createdAt) : [], [query, browsing]);
  const shown = tagIds.length ? matches.filter((t) => t.tags.some((tag) => tagIds.includes(tag.id))) : matches;
  const counts = new Map<number, number>();
  (query.trim() ? matches : listThoughts('', { showResolved: true })).forEach((t) => t.tags.forEach((tag) => counts.set(tag.id, (counts.get(tag.id) ?? 0) + 1)));
  const weekAgo = Date.now() - 7 * 86400000;
  const groups = [['This week', shown.filter((t) => t.createdAt >= weekAgo)], ['Earlier', shown.filter((t) => t.createdAt < weekAgo)]] as const;
  useEffect(() => { setTagIds([]); }, [query]);

  const open = (thought: Thought) => { rememberSearch(query); setRecents(readRecents()); onOpen(thought); };
  const toggleTag = (id: number) => setTagIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

  return <View className="flex-1 bg-page" style={{ paddingTop: insets.top + 8 }}>
    <View className="flex-row items-center gap-3 px-margin">
      <View className="h-control flex-1 flex-row items-center gap-2 rounded-full bg-fill pl-3.5 pr-1.5">
        <Search size={19} color={tokens.color.secondary} />
        <TextInput autoFocus value={query} onChangeText={setQuery} onSubmitEditing={() => { rememberSearch(query); setRecents(readRecents()); }} returnKeyType="search" placeholder="Search thoughts" placeholderTextColor={tokens.color.faint} className="flex-1 py-0 text-body text-ink" />
        {query ? <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search" className="h-8 w-8 items-center justify-center"><XCircle size={18} color={tokens.color.surface} fill={tokens.color.faint} /></Pressable> : null}
      </View>
      <Pressable onPress={onCancel} hitSlop={8} accessibilityLabel="Cancel"><Text className="text-body text-ink">Cancel</Text></Pressable>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
      {query.trim() || browsing ? <>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-margin py-3">
          {tags.filter((tag) => counts.get(tag.id)).map((tag) => <FilterPill key={tag.id} tag={tag} count={counts.get(tag.id) ?? 0} on={tagIds.includes(tag.id)} onPress={() => toggleTag(tag.id)} />)}
        </ScrollView>
        {shown.length === 0 && <Text className="px-margin pt-10 text-center text-body text-secondary">{browsing ? 'No thoughts with this tag yet.' : `No thoughts match “${query.trim()}”.`}</Text>}
        {groups.map(([label, rows]) => rows.length ? <View key={label} className="mb-2">
          <Text className="px-margin pb-1 pt-2 text-footnote text-secondary">{label}</Text>
          {rows.map((thought, i) => <ResultRow key={thought.id} thought={thought} query={query} last={i === rows.length - 1} onPress={() => open(thought)} />)}
        </View> : null)}
        {shown.length > 0 && <Text className="pt-6 text-center text-footnote text-secondary">{shown.length === 1 ? '1 thought' : `${shown.length} thoughts`}</Text>}
      </> : <>
        {recents.length > 0 && <View className="mt-5">
          <View className="flex-row items-center justify-between px-margin pb-1"><Text className="text-footnote text-secondary">Recent searches</Text><Pressable onPress={() => { setPreference(RECENTS_KEY, '[]'); setRecents([]); }} hitSlop={8}><Text className="text-footnote text-secondary">Clear</Text></Pressable></View>
          {recents.map((recent) => <Pressable key={recent} onPress={() => setQuery(recent)} className="flex-row items-center gap-3 px-margin py-2.5"><History size={18} color={tokens.color.secondary} /><Text className="text-body text-ink">{recent}</Text></Pressable>)}
        </View>}
        <Text className="mt-6 px-margin pb-2 text-footnote text-secondary">Tags</Text>
        <View className="flex-row flex-wrap gap-2.5 px-margin">
          {tags.map((tag) => {
            const hex = tokens.tag[tag.color];
            const text = tag.color === 'idea' ? tokens.mix(hex, 0.75, tokens.primitive.ink) : hex;
            return <Pressable key={tag.id} onPress={() => setTagIds([tag.id])} className="h-[44px] flex-row items-center justify-between rounded-full px-4" style={{ width: '48%', backgroundColor: tokens.tagPillTint[tag.color] }} accessibilityLabel={tag.name}>
              <Text className="text-footnote font-bold uppercase tracking-[0.4px]" style={{ color: text }}>{tag.name}</Text>
              <Text className="text-footnote font-medium" style={{ color: text, opacity: 0.7 }}>{counts.get(tag.id) ?? 0}</Text>
            </Pressable>;
          })}
        </View>
      </>}
    </ScrollView>
  </View>;
}
