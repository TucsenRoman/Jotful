import './global.css';

import { StatusBar } from 'expo-status-bar';
import { Check, ChevronDown, CircleHelp, Lightbulb, ListTodo, MoreHorizontal, Search, Sparkles, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Linking, PanResponder, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { classifyThought, splitThoughts, type ThoughtKind } from './src/segmentation';
import { createThought, deleteThought, initializeDatabase, listThoughts, moveThought, toggleResolved, type Thought } from './src/storage';

const workspaces = ['All thoughts', 'Product ideas', 'Personal', 'Work', 'Tasks'];
const kindLabel: Record<ThoughtKind, string> = { question: 'Question', idea: 'Idea', task: 'Task', thought: 'Thought' };
const openSheetHeight = 292;

function ThoughtMark({ kind }: { kind: ThoughtKind }) {
  const props = { size: 15, strokeWidth: 2.35, color: '#315D35' };
  if (kind === 'question') return <CircleHelp {...props} />;
  if (kind === 'idea') return <Lightbulb {...props} />;
  if (kind === 'task') return <ListTodo {...props} />;
  return <Sparkles {...props} />;
}

export default function App() {
  return <SafeAreaProvider><UnsortedApp /></SafeAreaProvider>;
}

function UnsortedApp() {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [workspace, setWorkspace] = useState('All thoughts');
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const { height: viewportHeight } = useWindowDimensions();
  const preview = useMemo(() => splitThoughts(draft), [draft]);
  const refresh = () => setThoughts(listThoughts(search, workspace));

  useEffect(() => { initializeDatabase(); refresh(); }, []);
  useEffect(() => { refresh(); }, [search, workspace]);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy < -12) openSheet();
      if (gesture.dy > 28) closeSheet();
    }
  })).current;

  function openSheet() {
    setSheetOpen(true);
    setTimeout(() => inputRef.current?.focus(), 200);
  }

  function closeSheet() {
    Keyboard.dismiss();
    setSheetOpen(false);
  }

  function saveDraft() {
    preview.forEach((text) => createThought(text, classifyThought(text), workspace === 'All thoughts' ? null : workspace));
    setDraft('');
    closeSheet();
    refresh();
  }

  async function sendTo(service: 'search' | 'ai', text: string) {
    const prompt = service === 'ai' ? `Help me think through: ${text}` : text;
    const base = service === 'ai' ? 'https://chatgpt.com/?q=' : 'https://www.google.com/search?q=';
    await Linking.openURL(`${base}${encodeURIComponent(prompt)}`);
  }

  function showActions(thought: Thought) {
    Alert.alert('Thought actions', 'Your full note stays on this device.', [
      { text: 'Make an idea', onPress: () => { moveThought(thought.id, 'Product ideas', 'idea'); refresh(); } },
      { text: 'Make a task', onPress: () => { moveThought(thought.id, 'Tasks', 'task'); refresh(); } },
      { text: 'Move to Work', onPress: () => { moveThought(thought.id, 'Work'); refresh(); } },
      { text: 'Move to Personal', onPress: () => { moveThought(thought.id, 'Personal'); refresh(); } },
      { text: thought.resolvedAt ? 'Reopen thought' : 'Mark resolved', onPress: () => { toggleResolved(thought.id, thought.resolvedAt ? null : Date.now()); refresh(); } },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteThought(thought.id); refresh(); } },
      { text: 'Cancel', style: 'cancel' }
    ]);
  }

  const expandedHeight = Math.min(viewportHeight - insets.top - 12, openSheetHeight + keyboardHeight + insets.bottom);

  return <View className="flex-1 bg-unsorted-canvas"><StatusBar style="dark" />
    <View className="z-10 min-h-[78px] flex-row items-center gap-2 px-5 pb-3" style={{ paddingTop: insets.top + 10 }}>
      {searchOpen ? <><TextInput autoFocus value={search} onChangeText={setSearch} placeholder="Search your loose ends" placeholderTextColor="#899389" className="flex-1 py-2 text-base text-unsorted-ink" /><Pressable onPress={() => { setSearch(''); setSearchOpen(false); }} hitSlop={12}><X size={23} color="#637063" /></Pressable></> : <><View className="mr-auto flex-row items-center gap-2.5"><View className="h-9 w-9 items-center justify-center rounded-xl bg-unsorted-pine"><View className="h-1.5 w-4 rounded-full bg-[#EAF0E7]" /><View className="mt-1 h-1.5 w-5 rounded-full bg-[#AFC5AB]" /><View className="mt-1 h-1.5 w-3 self-start rounded-full bg-[#EAF0E7]" /></View><View><Text className="text-[25px] font-bold tracking-[-1px] text-unsorted-ink">unsorted</Text><Text className="-mt-0.5 text-[10px] font-bold uppercase tracking-[1.2px] text-[#6D846D]">hold the thought</Text></View></View><Pressable onPress={() => setWorkspaceOpen((open) => !open)} className="max-w-[104px] flex-row items-center gap-1 rounded-full bg-unsorted-soft px-3 py-2" hitSlop={6}><Text numberOfLines={1} className="shrink text-[13px] font-semibold text-[#374438]">{workspace}</Text><ChevronDown size={14} color="#374438" /></Pressable><Pressable onPress={() => setSearchOpen(true)} className="h-9 w-9 items-center justify-center rounded-full bg-white" hitSlop={10}><Search size={19} color="#526052" /></Pressable></>}
    </View>
    {workspaceOpen && <View className="absolute right-12 z-20 min-w-[184px] rounded-xl border border-[#DFE4DC] bg-white p-1.5 shadow-lg" style={{ top: insets.top + 70 }}>{workspaces.map((item) => <Pressable key={item} onPress={() => { setWorkspace(item); setWorkspaceOpen(false); }} className={`flex-row items-center justify-between rounded-lg px-3 py-2.5 ${item === workspace ? 'bg-[#EAF0E7]' : ''}`}><Text className="text-sm text-[#263027]">{item}</Text>{item === workspace && <Check size={15} color="#315D35" strokeWidth={3} />}</Pressable>)}</View>}
    <ScrollView className="flex-1" contentContainerClassName="px-5 pb-28" keyboardShouldPersistTaps="handled">
      <Text className="mb-1 mt-1 text-[11px] font-bold uppercase tracking-[0.7px] text-[#839083]">{workspace} · {thoughts.length}</Text>
      {thoughts.length === 0 ? <View className="items-center px-7 py-20"><View className="mb-5 h-12 w-12 items-center justify-center rounded-2xl bg-[#E7EFE4]"><Sparkles size={22} color="#315D35" /></View><Text className="text-lg font-bold text-[#273227]">Make a little mental space.</Text><Text className="mt-2 text-center leading-5 text-unsorted-muted">Pull up the capture sheet and leave it messy.</Text></View> : thoughts.map((thought) => <View key={thought.id} className={`border-b border-unsorted-line py-4 ${thought.resolvedAt !== null ? 'opacity-60' : ''}`}>
        <View className="flex-row items-center justify-between"><View className="flex-row items-center gap-1.5"><ThoughtMark kind={thought.kind} /><Text className="text-[11px] font-bold uppercase tracking-[0.8px] text-[#718472]">{kindLabel[thought.kind]}</Text></View><Pressable onPress={() => showActions(thought)} hitSlop={12}><MoreHorizontal size={20} color="#718071" /></Pressable></View>
        <Text selectable className={`mt-2 text-lg leading-[26px] tracking-[-0.1px] text-unsorted-ink ${thought.resolvedAt !== null ? 'text-[#657064] line-through' : ''}`}>{thought.text}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2"><Pressable onPress={() => void sendTo('search', thought.text)} className="rounded-lg bg-unsorted-mist px-3 py-2"><Text className="text-xs font-semibold text-[#425243]">Search</Text></Pressable><Pressable onPress={() => Alert.alert('Send this thought to AI?', 'Only this thought will be opened in your browser.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: () => void sendTo('ai', thought.text) }])} className="rounded-lg bg-unsorted-pine px-3 py-2"><Text className="text-xs font-bold text-white">Ask AI</Text></Pressable><Pressable onPress={() => { toggleResolved(thought.id, thought.resolvedAt ? null : Date.now()); refresh(); }} className="rounded-lg bg-unsorted-mist px-3 py-2"><Text className="text-xs font-semibold text-[#425243]">{thought.resolvedAt ? 'Reopen' : '✓ Resolve'}</Text></Pressable></View>
      </View>)}
    </ScrollView>
    {!sheetOpen && <Pressable {...panResponder.panHandlers} onPress={openSheet} className="border-t border-[#DCE5DA] bg-white px-5 pt-3 shadow-xl" style={{ position: 'absolute', bottom: -insets.bottom, left: 0, right: 0, height: 76 + insets.bottom, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: insets.bottom + 12 }}><View className="mb-2 h-1 w-[34px] self-center rounded-full bg-[#9BB39A]" /><View className="flex-row items-center"><View className="h-6 w-6 items-center justify-center rounded-lg bg-[#E8F0E5]"><Sparkles size={14} color="#315D35" /></View><Text className="ml-2.5 text-[15px] font-medium text-[#526052]">Leave a thought here</Text><Text className="ml-auto text-[11px] font-bold uppercase tracking-[0.8px] text-[#315D35]">Unsort</Text></View></Pressable>}
    {sheetOpen && <View {...panResponder.panHandlers} className="bg-white px-5 pt-3 shadow-xl" style={{ position: 'absolute', bottom: -insets.bottom, left: 0, right: 0, height: expandedHeight, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: insets.bottom + 18 }}>
      <View className="mb-2.5 h-1 w-[34px] self-center rounded-full bg-[#C8D2C6]" />
      <Text className="mb-1 text-[12px] font-bold uppercase tracking-[0.8px] text-[#6B8068]">Loose thoughts welcome</Text>
      <TextInput ref={inputRef} value={draft} onChangeText={setDraft} placeholder="Say it without organizing it…" placeholderTextColor="#879186" multiline className="h-[126px] w-full px-1 pt-1 text-[17px] leading-6 text-unsorted-ink" textAlignVertical="top" />
      <Text className="mb-3 text-xs text-[#839083]">{preview.length ? `${preview.length} separate ${preview.length === 1 ? 'thought' : 'thoughts'} found locally` : 'Thoughts are separated on this device.'}</Text><View className="flex-row items-center justify-between"><Text className="text-[13px] font-semibold text-[#607360]">{workspace}</Text><Pressable onPress={saveDraft} disabled={preview.length === 0} className={`rounded-full px-4 py-2.5 ${preview.length ? 'bg-unsorted-pine' : 'bg-[#C8CEC7]'}`}><Text className="text-[13px] font-bold text-white">Save thoughts</Text></Pressable></View>
    </View>}
  </View>;
}
