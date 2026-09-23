import './global.css';

import { Fraunces_600SemiBold, useFonts as useFraunces } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, useFonts as useDMSans } from '@expo-google-fonts/dm-sans';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Copy, MoreHorizontal, Search, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { MothMark } from './src/brand/MothMark';
import CaptureSheet, { type CaptureSheetHandle } from './src/components/CaptureSheet';
import CaptureWidget from './src/widgets/CaptureWidget';
import RecentsWidget from './src/widgets/RecentsWidget';
import { classifyThought, splitThoughts, type ThoughtKind } from './src/segmentation';
import { createThought, deleteThought, initializeDatabase, listRecentThoughts, listThoughts, toggleResolved, type Thought } from './src/storage';

const colors = { cream: '#F5F0E6', roast: '#242019', moss: '#74876A', persimmon: '#EF705A', line: '#DED6C7' };
const capturePrompts = [
  'Say it without organizing it…', 'Drop the thought here…', 'Before it slips away…', 'Start in the middle…',
  'Write the messy version…', 'What are you circling?', 'Leave yourself a breadcrumb…', 'No need to make it neat…',
  'Catch the thing you almost forgot…', 'Put the loose end here…', 'Write it how it arrived…', 'The unfinished thought is welcome…',
  'Say the quiet part…', 'What is taking up space?', 'A question counts too…', 'Get it out of your head…',
  'The first draft can be a fragment…', 'Keep the thread for later…', 'Name the thing, roughly…', 'There is no right way to start…'
];

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
  const [listening, setListening] = useState(false);
  const [capturePromptIndex] = useState(() => Math.floor(Math.random() * capturePrompts.length));
  const sheetRef = useRef<CaptureSheetHandle>(null);
  const voiceBase = useRef('');
  const insets = useSafeAreaInsets();
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
    if (Platform.OS !== 'ios') return;
    CaptureWidget.updateSnapshot({ thoughtCount: thoughts.filter((thought) => thought.resolvedAt === null).length });
    RecentsWidget.updateSnapshot({ items: listRecentThoughts(5).map(({ id, text, kind }) => ({ id, text, kind })) });
  }, [thoughts]);
  function openSheet(mode: 'write' | 'voice' = 'write') {
    sheetRef.current?.open(mode);
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

  function closeSheet() {
    sheetRef.current?.close();
  }

  async function toggleVoiceInput() {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      void Haptics.selectionAsync();
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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true, continuous: true, requiresOnDeviceRecognition: true, addsPunctuation: true, iosTaskHint: 'dictation' });
  }

  function saveDraft() {
    preview.forEach((text) => createThought(text, classifyThought(text)));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDraft('');
    closeSheet();
    refresh();
  }

  function confirmClearDraft() {
    if (!draft.trim()) return;
    Alert.alert('Clear this thought?', 'This removes the text you have not saved.', [
      { text: 'Keep writing', style: 'cancel' },
      { text: 'Clear thought', style: 'destructive', onPress: () => { setDraft(''); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } }
    ]);
  }

  async function sendTo(service: 'search' | 'ai', text: string) {
    const prompt = service === 'ai' ? 'Help me think through: ' + text : text;
    const base = service === 'ai' ? 'https://chatgpt.com/?q=' : 'https://www.google.com/search?q=';
    await Linking.openURL(base + encodeURIComponent(prompt));
  }

  async function copyThought(text: string) {
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function showActions(thought: Thought) {
    Alert.alert('Thought', 'It can stay here.', [
      { text: thought.resolvedAt ? 'Bring it back' : 'Settle this thought', onPress: () => { toggleResolved(thought.id, thought.resolvedAt ? null : Date.now()); refresh(); } },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteThought(thought.id); refresh(); } },
      { text: 'Cancel', style: 'cancel' }
    ]);
  }

  return <View className="flex-1 bg-unsorted-canvas"><StatusBar style="dark" />
    <View className="z-10 flex-row items-center gap-2 px-5" style={{ height: insets.top + 72, paddingTop: insets.top + 10 }}>
      {searchOpen ? <><TextInput autoFocus value={search} onChangeText={setSearch} placeholder="Search thoughts" placeholderTextColor={colors.moss} className="h-10 flex-1 py-0 text-base text-unsorted-ink" style={{ fontFamily: 'DMSans_400Regular' }} /><Pressable onPress={() => { setSearch(''); setSearchOpen(false); }} hitSlop={12}><X size={23} color={colors.roast} /></Pressable></> : <><View className="mr-auto"><Svg width={122} height={31} viewBox="0 0 122 31" accessibilityLabel="Unsorted"><Defs><LinearGradient id="wordmark-gradient" x1="0" y1="0" x2="122" y2="0" gradientUnits="userSpaceOnUse"><Stop offset="0" stopColor="#EF705A" /><Stop offset="0.48" stopColor="#74876A" /><Stop offset="1" stopColor="#242019" /></LinearGradient></Defs><SvgText x="0" y="25" fill="url(#wordmark-gradient)" fontFamily="Fraunces_600SemiBold" fontSize="27" letterSpacing="-1">unsorted</SvgText></Svg><Text className="-mt-0.5 text-[10px] uppercase tracking-[1.2px] text-unsorted-ink" style={{ fontFamily: 'DMSans_700Bold' }}>Hold that thought.</Text></View><Pressable onPress={() => { closeSheet(); setSearchOpen(true); }} className="h-10 w-10 items-center justify-center rounded-xl bg-unsorted-mist" hitSlop={10}><Search size={19} color={colors.roast} /></Pressable></>}
    </View>
    <View className="mx-5 h-px bg-unsorted-line" />
    <ScrollView className="flex-1" contentContainerClassName="px-5 pb-28 pt-2" keyboardShouldPersistTaps="handled">
      {thoughts.length === 0 ? <View className="items-center px-7 py-20"><MothMark size={58} dark /><Text className="mt-5 text-[22px] text-unsorted-ink" style={{ fontFamily: 'Fraunces_600SemiBold' }}>Hold that thought.</Text><Text className="mt-2 text-center leading-5 text-unsorted-ink" style={{ fontFamily: 'DMSans_400Regular' }}>Speak or type it exactly as it arrives.</Text></View> : thoughts.map((thought) => <View key={thought.id} className={'border-b border-unsorted-line py-4 ' + (thought.resolvedAt !== null ? 'opacity-60' : '')}>
        <View className="flex-row items-center justify-between"><View className={'rounded-full px-2.5 py-1 ' + (thought.resolvedAt ? 'bg-[#DDE5D8]' : 'bg-unsorted-mist')}><Text className={'text-[11px] uppercase tracking-[0.7px] ' + (thought.resolvedAt ? 'text-unsorted-moss' : 'text-unsorted-ink')} style={{ fontFamily: 'DMSans_700Bold' }}>{thought.resolvedAt ? 'Settled' : kindLabel(thought.kind)}</Text></View><Pressable onPress={() => showActions(thought)} hitSlop={12} accessibilityLabel={'Actions for ' + kindLabel(thought.kind)}><MoreHorizontal size={20} color={colors.roast} /></Pressable></View>
        <Text selectable className={'mt-3 text-lg leading-[26px] tracking-[-0.1px] text-unsorted-ink ' + (thought.resolvedAt !== null ? 'line-through' : '')} style={{ fontFamily: 'DMSans_400Regular' }}>{thought.text}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2"><Pressable onPress={() => void sendTo('search', thought.text)} className="rounded-full border border-unsorted-line bg-unsorted-canvas px-3 py-2"><Text className="text-xs text-unsorted-ink" style={{ fontFamily: 'DMSans_500Medium' }}>Search</Text></Pressable><Pressable onPress={() => Alert.alert('Open with AI?', 'Only this thought will be opened in your browser.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: () => void sendTo('ai', thought.text) }])} className="rounded-full bg-unsorted-roast px-3 py-2"><Text className="text-xs text-unsorted-cream" style={{ fontFamily: 'DMSans_700Bold' }}>Ask AI</Text></Pressable><Pressable onPress={() => void copyThought(thought.text)} className="flex-row items-center rounded-full border border-unsorted-line bg-unsorted-canvas px-3 py-2" accessibilityLabel="Copy thought"><Copy size={13} color={colors.roast} /><Text className="ml-1.5 text-xs text-unsorted-ink" style={{ fontFamily: 'DMSans_500Medium' }}>Copy</Text></Pressable><Pressable onPress={() => { toggleResolved(thought.id, thought.resolvedAt ? null : Date.now()); refresh(); }} className="rounded-full border border-unsorted-line bg-unsorted-canvas px-3 py-2"><Text className="text-xs text-unsorted-moss" style={{ fontFamily: 'DMSans_500Medium' }}>{thought.resolvedAt ? 'Bring back' : 'Settle'}</Text></Pressable></View>
      </View>)}
    </ScrollView>
    <CaptureSheet ref={sheetRef} prompt={capturePrompts[capturePromptIndex]} draft={draft} previewCount={preview.length} listening={listening} onDraftChange={setDraft} onToggleVoice={() => void toggleVoiceInput()} onStopVoice={() => ExpoSpeechRecognitionModule.stop()} onSave={saveDraft} onClear={confirmClearDraft} onCollapseHaptic={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} />
  </View>;
}
