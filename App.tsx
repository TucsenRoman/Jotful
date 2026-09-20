import './global.css';

import { StatusBar } from 'expo-status-bar';
import { Check, ChevronDown, Folder, MoreHorizontal, Search, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Keyboard, Linking, PanResponder, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { classifyThought, splitThoughts, type ThoughtKind } from './src/segmentation';
import { createThought, deleteThought, initializeDatabase, listThoughts, moveThought, toggleResolved, type Thought } from './src/storage';

const workspaces = ['All thoughts', 'Product ideas', 'Personal', 'Work', 'Tasks'];
const kindLabel: Record<ThoughtKind, string> = { question: 'Question', idea: 'Idea', task: 'Task', thought: 'Thought' };
const kindIcon: Record<ThoughtKind, string> = { question: '?', idea: '✦', task: '✓', thought: '•' };
const sheetTravel = 212;

export default function App() {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [workspace, setWorkspace] = useState('All thoughts');
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const sheetOffset = useRef(new Animated.Value(sheetTravel)).current;
  const keyboardLift = useRef(new Animated.Value(0)).current;
  const preview = useMemo(() => splitThoughts(draft), [draft]);
  const refresh = () => setThoughts(listThoughts(search, workspace));

  useEffect(() => { initializeDatabase(); refresh(); }, []);
  useEffect(() => { refresh(); }, [search, workspace]);
  useEffect(() => {
    Animated.timing(sheetOffset, { toValue: sheetOpen ? 0 : sheetTravel, duration: 190, useNativeDriver: true }).start();
  }, [sheetOpen]);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => {
      Animated.timing(keyboardLift, { toValue: sheetOpen ? event.endCoordinates.height - 8 : 0, duration: event.duration ?? 180, useNativeDriver: true }).start();
    });
    const hide = Keyboard.addListener(hideEvent, (event) => {
      Animated.timing(keyboardLift, { toValue: 0, duration: event.duration ?? 180, useNativeDriver: true }).start();
    });
    return () => { show.remove(); hide.remove(); };
  }, [sheetOpen]);

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
      { text: 'Move to Product ideas', onPress: () => { moveThought(thought.id, 'Product ideas'); refresh(); } },
      { text: 'Move to Work', onPress: () => { moveThought(thought.id, 'Work'); refresh(); } },
      { text: 'Move to Personal', onPress: () => { moveThought(thought.id, 'Personal'); refresh(); } },
      { text: thought.resolvedAt ? 'Reopen thought' : 'Mark resolved', onPress: () => { toggleResolved(thought.id, thought.resolvedAt ? null : Date.now()); refresh(); } },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteThought(thought.id); refresh(); } },
      { text: 'Cancel', style: 'cancel' }
    ]);
  }

  return <SafeAreaView className="flex-1 bg-unsorted-canvas"><StatusBar style="dark" />
    <View className="z-10 min-h-[66px] flex-row items-center gap-2 px-5 pb-3 pt-2">
      {searchOpen ? <><TextInput autoFocus value={search} onChangeText={setSearch} placeholder="Search thoughts" placeholderTextColor="#899389" className="flex-1 py-2 text-base text-unsorted-ink" /><Pressable onPress={() => { setSearch(''); setSearchOpen(false); }} hitSlop={12}><X size={23} color="#637063" /></Pressable></> : <><Text className="mr-auto text-[28px] font-bold tracking-[-0.7px] text-unsorted-ink">Unsorted</Text><Pressable onPress={() => setWorkspaceOpen((open) => !open)} className="max-w-[144px] flex-row items-center gap-1 rounded-lg bg-unsorted-soft px-2.5 py-2" hitSlop={6}><Folder size={14} color="#374438" /><Text numberOfLines={1} className="shrink text-[13px] font-semibold text-[#374438]">{workspace}</Text><ChevronDown size={14} color="#374438" /></Pressable><Pressable onPress={() => setSearchOpen(true)} className="h-9 w-9 items-center justify-center" hitSlop={10}><Search size={21} color="#526052" /></Pressable></>}
    </View>
    {workspaceOpen && <View className="absolute right-12 top-[62px] z-20 min-w-[184px] rounded-xl border border-[#DFE4DC] bg-white p-1.5 shadow-lg">{workspaces.map((item) => <Pressable key={item} onPress={() => { setWorkspace(item); setWorkspaceOpen(false); }} className={`flex-row items-center justify-between rounded-lg px-3 py-2.5 ${item === workspace ? 'bg-[#EAF0E7]' : ''}`}><Text className="text-sm text-[#263027]">{item}</Text>{item === workspace && <Check size={15} color="#315D35" strokeWidth={3} />}</Pressable>)}</View>}
    <ScrollView contentContainerClassName="px-5 pb-24" keyboardShouldPersistTaps="handled">
      <Text className="mb-1 mt-1 text-[11px] font-bold uppercase tracking-[0.7px] text-[#839083]">{workspace} · {thoughts.length}</Text>
      {thoughts.length === 0 ? <View className="items-center px-7 py-20"><Text className="text-lg font-bold text-[#273227]">Give your mind some room.</Text><Text className="mt-2 text-center leading-5 text-unsorted-muted">Pull up the sheet below to capture a thought.</Text></View> : thoughts.map((thought) => <View key={thought.id} className={`border-b border-unsorted-line py-4 ${thought.resolvedAt !== null ? 'opacity-60' : ''}`}>
        <View className="flex-row items-center justify-between"><Text className="text-[11px] font-bold uppercase tracking-[0.8px] text-[#718472]">{kindIcon[thought.kind]}  {kindLabel[thought.kind]}</Text><Pressable onPress={() => showActions(thought)} hitSlop={12}><MoreHorizontal size={20} color="#718071" /></Pressable></View>
        <Text selectable className={`mt-2 text-lg leading-[26px] tracking-[-0.1px] text-unsorted-ink ${thought.resolvedAt !== null ? 'text-[#657064] line-through' : ''}`}>{thought.text}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2"><Pressable onPress={() => void sendTo('search', thought.text)} className="rounded-lg bg-unsorted-mist px-3 py-2"><Text className="text-xs font-semibold text-[#425243]">Search</Text></Pressable><Pressable onPress={() => Alert.alert('Send this thought to AI?', 'Only this thought will be opened in your browser.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: () => void sendTo('ai', thought.text) }])} className="rounded-lg bg-unsorted-pine px-3 py-2"><Text className="text-xs font-bold text-white">Ask AI</Text></Pressable><Pressable onPress={() => { toggleResolved(thought.id, thought.resolvedAt ? null : Date.now()); refresh(); }} className="rounded-lg bg-unsorted-mist px-3 py-2"><Text className="text-xs font-semibold text-[#425243]">{thought.resolvedAt ? 'Reopen' : '✓ Resolve'}</Text></Pressable></View>
      </View>)}
    </ScrollView>
    <Animated.View {...panResponder.panHandlers} className="absolute bottom-2 left-2 right-2 min-h-[292px] rounded-[21px] bg-white px-4 pb-5 pt-2.5 shadow-xl" style={{ transform: [{ translateY: Animated.add(sheetOffset, Animated.multiply(keyboardLift, -1)) }] }}>
      <View className="mb-2.5 h-1 w-[34px] self-center rounded-full bg-[#D3D9D0]" />
      <TextInput ref={inputRef} value={draft} onChangeText={setDraft} onFocus={() => setSheetOpen(true)} placeholder="Capture a thought…" placeholderTextColor="#879186" multiline className={`w-full px-1 text-unsorted-ink ${sheetOpen ? 'h-[126px] pt-1 text-[17px] leading-6' : 'h-[42px] py-2 text-[15px] leading-[22px]'}`} textAlignVertical="top" />
      {sheetOpen && <><Text className="mb-3 text-xs text-[#839083]">{preview.length ? `${preview.length} separate ${preview.length === 1 ? 'thought' : 'thoughts'} found locally` : 'Thoughts are separated on this device.'}</Text><View className="flex-row items-center justify-between"><View className="flex-row items-center gap-1"><Folder size={14} color="#607360" /><Text className="text-[13px] font-semibold text-[#607360]">{workspace}</Text></View><Pressable onPress={saveDraft} disabled={preview.length === 0} className={`rounded-lg px-3.5 py-2.5 ${preview.length ? 'bg-unsorted-pine' : 'bg-[#C8CEC7]'}`}><Text className="text-[13px] font-bold text-white">Save thoughts</Text></Pressable></View></>}
    </Animated.View>
  </SafeAreaView>;
}
