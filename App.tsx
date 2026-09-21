import './global.css';

import { Fraunces_600SemiBold, useFonts as useFraunces } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, useFonts as useDMSans } from '@expo-google-fonts/dm-sans';
import { StatusBar } from 'expo-status-bar';
import { Mic, MoreHorizontal, Search, Square, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Linking, PanResponder, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { MothMark } from './src/brand/MothMark';
import CaptureWidget from './src/widgets/CaptureWidget';
import { classifyThought, splitThoughts, type ThoughtKind } from './src/segmentation';
import { createThought, deleteThought, initializeDatabase, listThoughts, toggleResolved, type Thought } from './src/storage';

const collapsedSheetHeight = 76;
const openSheetHeight = 292;
const colors = { cream: '#F5F0E6', roast: '#242019', moss: '#74876A', persimmon: '#EF705A', line: '#DED6C7' };

function kindLabel(kind: ThoughtKind) {
  if (kind === 'question') return 'Question';
  if (kind === 'idea') return 'Idea';
  return 'Thought';
}

export default function App() {
  const [frauncesLoaded] = useFraunces({ Fraunces_600SemiBold });
  const [dmSansLoaded] = useDMSans({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  if (!frauncesLoaded || !dmSansLoaded) return null;
  return <SafeAreaProvider><UnsortedApp /></SafeAreaProvider>;
}

function UnsortedApp() {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [listening, setListening] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const voiceBase = useRef('');
  const insets = useSafeAreaInsets();
  const { height: viewportHeight } = useWindowDimensions();
  const preview = useMemo(() => splitThoughts(draft), [draft]);
  const refresh = () => setThoughts(listThoughts(search));

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (transcript) setDraft(voiceBase.current + (voiceBase.current ? ' ' : '') + transcript);
  });
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    if (event.error !== 'aborted' && event.error !== 'no-speech') Alert.alert('Voice input stopped', event.message || 'Try again or type your thought.');
  });

  useEffect(() => { initializeDatabase(); refresh(); }, []);
  useEffect(() => { refresh(); }, [search]);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => setKeyboardHeight(event.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  useEffect(() => {
    if (Platform.OS === 'ios') CaptureWidget.updateSnapshot({ thoughtCount: thoughts.filter((thought) => thought.resolvedAt === null).length });
  }, [thoughts]);

  function openSheet(mode: 'write' | 'voice' = 'write') {
    setSheetOpen(true);
    setTimeout(() => {
      if (mode === 'voice') void toggleVoiceInput();
      else inputRef.current?.focus();
    }, 250);
  }

  useEffect(() => {
    function handleUrl(url: string) {
      const parsed = new URL(url);
      if (parsed.hostname === 'capture') openSheet(parsed.searchParams.get('mode') === 'voice' ? 'voice' : 'write');
    }
    void Linking.getInitialURL().then((url) => { if (url) handleUrl(url); });
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy < -12) openSheet();
      if (gesture.dy > 28) closeSheet();
    }
  })).current;

  function closeSheet() {
    if (listening) ExpoSpeechRecognitionModule.stop();
    Keyboard.dismiss();
    setSheetOpen(false);
  }

  async function toggleVoiceInput() {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable() || !ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()) {
      Alert.alert('Voice input is unavailable', 'This iPhone needs on-device Dictation enabled to keep voice capture private. You can still type a thought.');
      return;
    }
    const permission = await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone access is needed', 'Allow microphone access to turn your voice into a local thought.');
      return;
    }
    voiceBase.current = draft.trim();
    ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true, continuous: false, requiresOnDeviceRecognition: true, addsPunctuation: true });
  }

  function saveDraft() {
    preview.forEach((text) => createThought(text, classifyThought(text)));
    setDraft('');
    closeSheet();
    refresh();
  }

  async function sendTo(service: 'search' | 'ai', text: string) {
    const prompt = service === 'ai' ? 'Help me think through: ' + text : text;
    const base = service === 'ai' ? 'https://chatgpt.com/?q=' : 'https://www.google.com/search?q=';
    await Linking.openURL(base + encodeURIComponent(prompt));
  }

  function showActions(thought: Thought) {
    Alert.alert('Thought', 'It can stay here.', [
      { text: thought.resolvedAt ? 'Bring it back' : 'Settle this thought', onPress: () => { toggleResolved(thought.id, thought.resolvedAt ? null : Date.now()); refresh(); } },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteThought(thought.id); refresh(); } },
      { text: 'Cancel', style: 'cancel' }
    ]);
  }

  const expandedHeight = Math.min(viewportHeight - insets.top - 12, openSheetHeight + keyboardHeight + insets.bottom);
  const activeThoughts = thoughts.filter((thought) => thought.resolvedAt === null).length;

  return <View className="flex-1 bg-unsorted-canvas"><StatusBar style="dark" />
    <View className="z-10 min-h-[78px] flex-row items-center gap-2 px-5 pb-3" style={{ paddingTop: insets.top + 10 }}>
      {searchOpen ? <><TextInput autoFocus value={search} onChangeText={setSearch} placeholder="Search thoughts" placeholderTextColor={colors.moss} className="flex-1 py-2 text-base text-unsorted-ink" style={{ fontFamily: 'DMSans_400Regular' }} /><Pressable onPress={() => { setSearch(''); setSearchOpen(false); }} hitSlop={12}><X size={23} color={colors.roast} /></Pressable></> : <><View className="mr-auto flex-row items-center gap-2.5"><View className="h-9 w-9 items-center justify-center rounded-xl bg-unsorted-roast"><MothMark size={27} /></View><View><Text className="text-[26px] tracking-[-1px] text-unsorted-ink" style={{ fontFamily: 'Fraunces_600SemiBold' }}>unsorted</Text><Text className="-mt-0.5 text-[10px] uppercase tracking-[1.2px] text-unsorted-ink" style={{ fontFamily: 'DMSans_700Bold' }}>Hold that thought.</Text></View></View><Pressable onPress={() => setSearchOpen(true)} className="h-9 w-9 items-center justify-center rounded-full bg-unsorted-mist" hitSlop={10}><Search size={19} color={colors.roast} /></Pressable></>}
    </View>
    <ScrollView className="flex-1" contentContainerClassName="px-5 pb-28" keyboardShouldPersistTaps="handled">
      <View className="mb-1 mt-1 flex-row items-center justify-between"><Text className="text-[11px] uppercase tracking-[0.9px] text-unsorted-ink" style={{ fontFamily: 'DMSans_700Bold' }}>Thoughts</Text><Text className="text-[12px] text-unsorted-muted" style={{ fontFamily: 'DMSans_500Medium' }}>{activeThoughts === 1 ? '1 waiting' : activeThoughts + ' waiting'}</Text></View>
      {thoughts.length === 0 ? <View className="items-center px-7 py-20"><MothMark size={58} dark /><Text className="mt-5 text-[22px] text-unsorted-ink" style={{ fontFamily: 'Fraunces_600SemiBold' }}>Hold that thought.</Text><Text className="mt-2 text-center leading-5 text-unsorted-ink" style={{ fontFamily: 'DMSans_400Regular' }}>Speak or type it exactly as it arrives.</Text></View> : thoughts.map((thought) => <View key={thought.id} className={'border-b border-unsorted-line py-4 ' + (thought.resolvedAt !== null ? 'opacity-60' : '')}>
        <View className="flex-row items-center justify-between"><View className={'rounded-full px-2.5 py-1 ' + (thought.resolvedAt ? 'bg-[#DDE5D8]' : 'bg-unsorted-mist')}><Text className={'text-[11px] uppercase tracking-[0.7px] ' + (thought.resolvedAt ? 'text-unsorted-moss' : 'text-unsorted-ink')} style={{ fontFamily: 'DMSans_700Bold' }}>{thought.resolvedAt ? 'Settled' : kindLabel(thought.kind)}</Text></View><Pressable onPress={() => showActions(thought)} hitSlop={12} accessibilityLabel={'Actions for ' + kindLabel(thought.kind)}><MoreHorizontal size={20} color={colors.roast} /></Pressable></View>
        <Text selectable className={'mt-3 text-lg leading-[26px] tracking-[-0.1px] text-unsorted-ink ' + (thought.resolvedAt !== null ? 'line-through' : '')} style={{ fontFamily: 'DMSans_400Regular' }}>{thought.text}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2"><Pressable onPress={() => void sendTo('search', thought.text)} className="rounded-full border border-unsorted-line bg-unsorted-canvas px-3 py-2"><Text className="text-xs text-unsorted-ink" style={{ fontFamily: 'DMSans_500Medium' }}>Search</Text></Pressable><Pressable onPress={() => Alert.alert('Open with AI?', 'Only this thought will be opened in your browser.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: () => void sendTo('ai', thought.text) }])} className="rounded-full bg-unsorted-roast px-3 py-2"><Text className="text-xs text-unsorted-cream" style={{ fontFamily: 'DMSans_700Bold' }}>Ask AI</Text></Pressable><Pressable onPress={() => { toggleResolved(thought.id, thought.resolvedAt ? null : Date.now()); refresh(); }} className="rounded-full border border-unsorted-line bg-unsorted-canvas px-3 py-2"><Text className="text-xs text-unsorted-moss" style={{ fontFamily: 'DMSans_500Medium' }}>{thought.resolvedAt ? 'Bring back' : 'Settle'}</Text></Pressable></View>
      </View>)}
    </ScrollView>
    {!sheetOpen && <View {...panResponder.panHandlers} style={{ position: 'absolute', bottom: -insets.bottom, left: 0, right: 0, height: collapsedSheetHeight + insets.bottom }}><View className="h-full flex-row items-center border-t border-unsorted-line bg-unsorted-cream px-5 pt-1 shadow-xl" style={{ borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: insets.bottom }}><Pressable onPress={() => openSheet()} className="flex-1 py-3" accessibilityLabel="Open thought capture"><View className="mb-2 h-1 w-[34px] self-center rounded-full bg-[#C9BCAB]" /><View className="flex-row items-center"><MothMark size={22} dark /><Text className="ml-2.5 text-[15px] text-unsorted-ink" style={{ fontFamily: 'DMSans_500Medium' }}>Hold that thought.</Text></View></Pressable><Pressable onPress={() => openSheet('voice')} className="ml-3 h-11 w-11 items-center justify-center rounded-full bg-unsorted-persimmon" hitSlop={10} accessibilityLabel="Speak a thought"><Mic size={19} color={colors.roast} /></Pressable></View></View>}
    {sheetOpen && <View className="bg-unsorted-cream px-5 pt-3 shadow-xl" style={{ position: 'absolute', bottom: -insets.bottom, left: 0, right: 0, height: expandedHeight, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: insets.bottom + 18 }}><View {...panResponder.panHandlers} className="items-center pb-2.5"><View className="h-1 w-[34px] rounded-full bg-[#C9BCAB]" /></View><Text className="mb-1 text-[12px] uppercase tracking-[0.8px] text-unsorted-ink" style={{ fontFamily: 'DMSans_700Bold' }}>Capture</Text><TextInput ref={inputRef} value={draft} onChangeText={setDraft} placeholder="Say it without organizing it…" placeholderTextColor={colors.moss} multiline className="h-[126px] w-full px-1 pt-1 text-[17px] leading-6 text-unsorted-ink" style={{ fontFamily: 'DMSans_400Regular' }} textAlignVertical="top" /><Text className="mb-3 text-xs text-unsorted-ink" style={{ fontFamily: 'DMSans_400Regular' }}>{listening ? 'Listening on this iPhone…' : preview.length ? preview.length + ' separate ' + (preview.length === 1 ? 'thought' : 'thoughts') + ' found locally' : 'Nothing lost.'}</Text><View className="flex-row items-center justify-between"><Pressable onPress={() => void toggleVoiceInput()} className={'flex-row items-center rounded-full px-3 py-2.5 ' + (listening ? 'bg-[#F8D8D1]' : 'bg-unsorted-mist')}>{listening ? <Square size={13} fill={colors.roast} color={colors.roast} /> : <Mic size={15} color={colors.roast} />}<Text className="ml-1.5 text-[13px] text-unsorted-ink" style={{ fontFamily: 'DMSans_700Bold' }}>{listening ? 'Stop' : 'Speak'}</Text></Pressable><Pressable onPress={saveDraft} disabled={preview.length === 0} className={'rounded-full px-4 py-2.5 ' + (preview.length ? 'bg-unsorted-persimmon' : 'bg-[#C9BCAB]')}><Text className="text-[13px] text-unsorted-roast" style={{ fontFamily: 'DMSans_700Bold' }}>Save</Text></Pressable></View></View>}
  </View>;
}
