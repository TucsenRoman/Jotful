import './global.css';

import { Fraunces_600SemiBold, useFonts as useFraunces } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, useFonts as useDMSans } from '@expo-google-fonts/dm-sans';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { AudioLines, Check, Copy, Image, MoreHorizontal, Pin, PinOff, RotateCcw, Search, Settings, Sparkles, Video, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image as NativeImage, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { MothMark } from './src/brand/MothMark';
import CaptureSheet, { type CaptureSheetHandle } from './src/components/CaptureSheet';
import AudioTimeline from './src/components/AudioTimeline';
import CaptureWidget from './src/widgets/CaptureWidget';
import RecentsWidget from './src/widgets/RecentsWidget';
import { classifyThought, splitThoughts, type ThoughtKind } from './src/segmentation';
import { createAttachmentThoughts, createThought, deleteThought, getPreference, initializeDatabase, listRecentThoughts, listThoughts, setPreference, togglePinned, toggleResolved, type AttachmentKind, type Thought } from './src/storage';

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

function SwipeableThought({ thought, children, onResolve, onPin, onLongRight }: { thought: Thought; children: React.ReactNode; onResolve: () => void; onPin: () => void; onLongRight: () => void }) {
  const translateX = useSharedValue(0);
  const detent = useSharedValue(0);
  const triggerDetent = (level: 1 | 2) => void Haptics.impactAsync(level === 1 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
  const commit = (direction: 'left' | 'right', long = false) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (direction === 'left') onResolve();
    else if (long) onLongRight();
    else onPin();
  };
  const gesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      const next = Math.max(-150, Math.min(150, event.translationX));
      translateX.value = next;
      const nextDetent = next >= 122 ? 2 : Math.abs(next) >= 64 ? 1 : 0;
      if (nextDetent !== detent.value) {
        detent.value = nextDetent;
        if (nextDetent > 0) runOnJS(triggerDetent)(nextDetent as 1 | 2);
      }
    })
    .onEnd((event) => {
      const isLongRight = event.translationX >= 122;
      const isShortRight = event.translationX >= 64;
      const isLeft = event.translationX <= -64;
      if (isLeft || isShortRight) {
        translateX.value = withTiming(isLeft ? -110 : 110, { duration: 180 }, (finished) => {
          if (finished) {
            runOnJS(commit)(isLeft ? 'left' : 'right', isLongRight);
            translateX.value = withSpring(0);
          }
        });
      } else translateX.value = withSpring(0);
      detent.value = 0;
    })
    .onFinalize(() => { detent.value = 0; });
  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const pinStyle = useAnimatedStyle(() => ({ transform: [{ scale: withTiming(detent.value === 1 ? 1.18 : 0.92, { duration: 110 }) }, { rotate: withTiming(detent.value === 1 ? '-45deg' : '0deg', { duration: 140 }) }], opacity: withTiming(detent.value === 2 ? 0.42 : 1, { duration: 110 }) }));
  const ideaStyle = useAnimatedStyle(() => ({ transform: [{ scale: withTiming(detent.value === 2 ? 1.18 : 0.92, { duration: 110 }) }], opacity: withTiming(detent.value === 1 ? 0.42 : 1, { duration: 110 }) }));
  const resolveStyle = useAnimatedStyle(() => ({ transform: [{ scale: withTiming(translateX.value <= -64 ? 1.18 : 0.92, { duration: 110 }) }], opacity: withTiming(translateX.value <= -64 ? 1 : 0.5, { duration: 110 }) }));
  return <View className="mb-3 overflow-hidden rounded-3xl bg-unsorted-canvas"><View className="absolute inset-y-0 right-0 w-16 items-center justify-center"><Animated.View style={resolveStyle}><View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: '#74876A33' }}>{thought.resolvedAt ? <RotateCcw size={19} color={colors.moss} /> : <Check size={21} color={colors.moss} />}</View></Animated.View></View><View className="absolute inset-y-0 left-0 flex-row items-center gap-5 px-3"><Animated.View style={pinStyle}><View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: '#EF705A33' }}>{thought.pinnedAt ? <PinOff size={18} color={colors.persimmon} /> : <Pin size={19} color={colors.persimmon} />}</View></Animated.View><Animated.View style={ideaStyle}><View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: '#24201933' }}><Sparkles size={18} color={colors.roast} /></View></Animated.View></View><GestureDetector gesture={gesture}><Animated.View className="rounded-3xl bg-unsorted-cream" style={rowStyle}>{children}</Animated.View></GestureDetector></View>;
}

function SettingsRow({ title, detail, onPress }: { title: string; detail: string; onPress?: () => void }) {
  return <Pressable disabled={!onPress} onPress={onPress} className="flex-row items-center justify-between border-b border-unsorted-line py-4" style={{ opacity: onPress ? 1 : 0.78 }}><View className="flex-1 pr-5"><Text className="text-base text-unsorted-ink" style={{ fontFamily: 'DMSans_500Medium' }}>{title}</Text><Text className="mt-1 text-sm text-unsorted-moss" style={{ fontFamily: 'DMSans_400Regular' }}>{detail}</Text></View>{onPress && <Text className="text-xl text-unsorted-moss">›</Text>}</Pressable>;
}

export default function App() {
  const [frauncesLoaded] = useFraunces({ Fraunces_600SemiBold });
  const [dmSansLoaded] = useDMSans({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  if (!frauncesLoaded || !dmSansLoaded) return null;
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><UnsortedApp /></SafeAreaProvider></GestureHandlerRootView>;
}

function UnsortedApp() {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [screen, setScreen] = useState<'thoughts' | 'settings'>('thoughts');
  const [preferredAI, setPreferredAI] = useState('ChatGPT');
  const [preferredBrowser, setPreferredBrowser] = useState('System default');
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

  useEffect(() => { initializeDatabase(); setPreferredAI(getPreference('preferredAI', 'ChatGPT')); setPreferredBrowser(getPreference('preferredBrowser', 'System default')); refresh(); }, []);
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

  function saveAttachments(attachments: Array<{ kind: AttachmentKind; uri: string; durationMillis?: number }>, caption?: string) {
    createAttachmentThoughts(attachments, caption);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sheetRef.current?.close();
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
    const base = service === 'ai' && preferredAI === 'Claude' ? 'https://claude.ai/new?q=' : service === 'ai' ? 'https://chatgpt.com/?q=' : 'https://www.google.com/search?q=';
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

  function chooseAI() {
    Alert.alert('Preferred AI', 'This is where Ask AI will open your thought.', [
      { text: 'ChatGPT', onPress: () => { setPreferredAI('ChatGPT'); setPreference('preferredAI', 'ChatGPT'); } },
      { text: 'Claude', onPress: () => { setPreferredAI('Claude'); setPreference('preferredAI', 'Claude'); } },
      { text: 'Cancel', style: 'cancel' }
    ]);
  }

  function chooseBrowser() {
    Alert.alert('Preferred browser', 'Search links will use this preference when supported.', [
      { text: 'System default', onPress: () => { setPreferredBrowser('System default'); setPreference('preferredBrowser', 'System default'); } },
      { text: 'Safari', onPress: () => { setPreferredBrowser('Safari'); setPreference('preferredBrowser', 'Safari'); } },
      { text: 'Chrome', onPress: () => { setPreferredBrowser('Chrome'); setPreference('preferredBrowser', 'Chrome'); } },
      { text: 'Cancel', style: 'cancel' }
    ]);
  }

  if (screen === 'settings') return <View className="flex-1 bg-unsorted-canvas"><StatusBar style="dark" /><View className="flex-row items-center px-5" style={{ height: insets.top + 72, paddingTop: insets.top + 10 }}><Pressable onPress={() => setScreen('thoughts')} hitSlop={12}><X size={23} color={colors.roast} /></Pressable><Text className="ml-4 text-[25px] text-unsorted-ink" style={{ fontFamily: 'Fraunces_600SemiBold' }}>Settings</Text></View><View className="mx-5 h-px bg-unsorted-line" /><ScrollView contentContainerClassName="px-5 pb-12 pt-6"><Text className="text-[11px] uppercase tracking-[1px] text-unsorted-moss" style={{ fontFamily: 'DMSans_700Bold' }}>Open with</Text><View className="mt-2 rounded-3xl bg-unsorted-cream px-4"><SettingsRow title="Preferred AI" detail={preferredAI} onPress={chooseAI} /><SettingsRow title="Preferred browser" detail={preferredBrowser} onPress={chooseBrowser} /></View><Text className="mt-8 text-[11px] uppercase tracking-[1px] text-unsorted-moss" style={{ fontFamily: 'DMSans_700Bold' }}>Capture</Text><View className="mt-2 rounded-3xl bg-unsorted-cream px-4"><SettingsRow title="Voice input" detail="On-device Dictation" /><SettingsRow title="Photos, video & audio" detail="Coming soon" /></View><Text className="mt-8 text-[11px] uppercase tracking-[1px] text-unsorted-moss" style={{ fontFamily: 'DMSans_700Bold' }}>Your space</Text><View className="mt-2 rounded-3xl bg-unsorted-cream px-4"><SettingsRow title="Pinned thoughts" detail="Ready for widgets" /><SettingsRow title="Storage & privacy" detail="Thoughts stay on this iPhone" /></View><Text className="mt-8 text-[11px] uppercase tracking-[1px] text-unsorted-moss" style={{ fontFamily: 'DMSans_700Bold' }}>About</Text><View className="mt-2 rounded-3xl bg-unsorted-cream px-4"><SettingsRow title="Unsorted" detail="Private thought inbox · version 1.0" /></View></ScrollView></View>;

  return <View className="flex-1 bg-unsorted-canvas"><StatusBar style="dark" />
    <View className="z-10 flex-row items-center gap-2 px-5" style={{ height: insets.top + 72, paddingTop: insets.top + 10 }}>
      {searchOpen ? <><TextInput autoFocus value={search} onChangeText={setSearch} placeholder="Search thoughts" placeholderTextColor={colors.moss} className="h-10 flex-1 py-0 text-base text-unsorted-ink" style={{ fontFamily: 'DMSans_400Regular' }} /><Pressable onPress={() => { setSearch(''); setSearchOpen(false); }} hitSlop={12}><X size={23} color={colors.roast} /></Pressable></> : <><View className="mr-auto"><Svg width={122} height={31} viewBox="0 0 122 31" accessibilityLabel="Unsorted"><Defs><LinearGradient id="wordmark-gradient" x1="0" y1="0" x2="122" y2="0" gradientUnits="userSpaceOnUse"><Stop offset="0" stopColor="#EF705A" /><Stop offset="0.48" stopColor="#74876A" /><Stop offset="1" stopColor="#242019" /></LinearGradient></Defs><SvgText x="0" y="25" fill="url(#wordmark-gradient)" fontFamily="Fraunces_600SemiBold" fontSize="27" letterSpacing="-1">unsorted</SvgText></Svg><Text className="-mt-0.5 text-[10px] uppercase tracking-[1.2px] text-unsorted-ink" style={{ fontFamily: 'DMSans_700Bold' }}>Hold that thought.</Text></View><Pressable onPress={() => { closeSheet(); setSearchOpen(true); }} className="h-10 w-10 items-center justify-center rounded-xl bg-unsorted-mist" hitSlop={10}><Search size={19} color={colors.roast} /></Pressable><Pressable onPress={() => { closeSheet(); setScreen('settings'); }} className="ml-2 h-10 w-10 items-center justify-center rounded-xl bg-unsorted-mist" hitSlop={10} accessibilityLabel="Open settings"><Settings size={19} color={colors.roast} /></Pressable></>}
    </View>
    <View className="mx-5 h-px bg-unsorted-line" />
    <ScrollView className="flex-1" contentContainerClassName="px-5 pb-28 pt-2" keyboardShouldPersistTaps="handled">
      {thoughts.length === 0 ? <View className="items-center px-7 py-20"><MothMark size={58} dark /><Text className="mt-5 text-[22px] text-unsorted-ink" style={{ fontFamily: 'Fraunces_600SemiBold' }}>Hold that thought.</Text><Text className="mt-2 text-center leading-5 text-unsorted-ink" style={{ fontFamily: 'DMSans_400Regular' }}>Speak or type it exactly as it arrives.</Text></View> : thoughts.map((thought) => <SwipeableThought key={thought.id} thought={thought} onResolve={() => { toggleResolved(thought.id, thought.resolvedAt ? null : Date.now()); refresh(); }} onPin={() => { togglePinned(thought.id, thought.pinnedAt ? null : Date.now()); refresh(); }} onLongRight={() => Alert.alert('Gesture idea saved', 'Long right swipe is reserved for a future action.')}><View className={'p-4 ' + (thought.resolvedAt !== null ? 'opacity-60' : '')}>
        <View className="flex-row items-center justify-between"><View className="flex-row items-center rounded-full bg-unsorted-mist px-2.5 py-1">{thought.attachmentKind === 'image' ? <Image size={13} color={colors.roast} /> : thought.attachmentKind === 'video' ? <Video size={13} color={colors.roast} /> : thought.attachmentKind === 'audio' ? <AudioLines size={13} color={colors.roast} /> : null}<Text className={'text-[11px] uppercase tracking-[0.7px] text-unsorted-ink ' + (thought.attachmentKind ? 'ml-1.5' : '')} style={{ fontFamily: 'DMSans_700Bold' }}>{thought.attachmentKind === 'image' ? 'Photo' : thought.attachmentKind === 'video' ? 'Video' : thought.attachmentKind === 'audio' ? 'Audio' : thought.pinnedAt ? 'Pinned' : kindLabel(thought.kind)}</Text></View><Pressable onPress={() => showActions(thought)} hitSlop={12} accessibilityLabel={'Actions for ' + kindLabel(thought.kind)}><MoreHorizontal size={20} color={colors.roast} /></Pressable></View>
        <Text selectable className={'mt-3 text-lg leading-[26px] tracking-[-0.1px] text-unsorted-ink ' + (thought.resolvedAt !== null ? 'line-through' : '')} style={{ fontFamily: 'DMSans_400Regular' }}>{thought.text}</Text>
        {thought.attachmentKind === 'image' && thought.attachmentUri && <NativeImage source={{ uri: thought.attachmentUri }} className="mt-3 h-32 w-full rounded-2xl bg-unsorted-mist" resizeMode="cover" accessibilityLabel="Attached photo" />}
        {thought.attachmentKind === 'video' && <View className="mt-3 h-24 items-center justify-center rounded-2xl bg-unsorted-mist"><Text className="text-sm text-unsorted-ink" style={{ fontFamily: 'DMSans_700Bold' }}>Video attached</Text><Text className="mt-1 text-xs text-unsorted-moss" style={{ fontFamily: 'DMSans_400Regular' }}>Playback is coming next.</Text></View>}
        {thought.attachmentKind === 'audio' && thought.attachmentUri && <View className="mt-3"><AudioTimeline uri={thought.attachmentUri} fallbackDurationMillis={thought.attachmentDurationMillis ?? undefined} /></View>}
        <View className="mt-3 flex-row flex-wrap gap-2"><Pressable onPress={() => void sendTo('search', thought.text)} className="rounded-full border border-unsorted-line bg-unsorted-canvas px-3 py-2"><Text className="text-xs text-unsorted-ink" style={{ fontFamily: 'DMSans_500Medium' }}>Search</Text></Pressable><Pressable onPress={() => Alert.alert('Open with AI?', 'Only this thought will be opened in your browser.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: () => void sendTo('ai', thought.text) }])} className="rounded-full bg-unsorted-roast px-3 py-2"><Text className="text-xs text-unsorted-cream" style={{ fontFamily: 'DMSans_700Bold' }}>Ask AI</Text></Pressable><Pressable onPress={() => void copyThought(thought.text)} className="flex-row items-center rounded-full border border-unsorted-line bg-unsorted-canvas px-3 py-2" accessibilityLabel="Copy thought"><Copy size={13} color={colors.roast} /><Text className="ml-1.5 text-xs text-unsorted-ink" style={{ fontFamily: 'DMSans_500Medium' }}>Copy</Text></Pressable></View>
      </View></SwipeableThought>)}
    </ScrollView>
    <CaptureSheet ref={sheetRef} prompt={capturePrompts[capturePromptIndex]} draft={draft} previewCount={preview.length} listening={listening} onDraftChange={setDraft} onToggleVoice={() => void toggleVoiceInput()} onStopVoice={() => ExpoSpeechRecognitionModule.stop()} onSave={saveDraft} onClear={confirmClearDraft} onCollapseHaptic={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} onAttachments={saveAttachments} />
  </View>;
}
