import './global.css';

import { Fraunces_600SemiBold, useFonts as useFraunces } from '@expo-google-fonts/fraunces';

import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, Share, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import CaptureSheet, { capturePeekHeight, type CaptureSheetHandle } from './src/components/CaptureSheet';
import { ThoughtStack } from './src/components/home/ThoughtStack';
import { ThoughtDetail } from './src/components/detail/ThoughtDetail';
import SettingsScreen from './src/components/settings/SettingsScreen';
import { FilterMenu, FilterRow, HomeHeader, TagPill } from './src/components/header/HomeHeader';
import { TagPicker } from './src/components/header/TagPicker';
import { startWatchSync } from './src/watchSync';
import CaptureWidget from './targets/widgets/CaptureWidget';
import RecentsWidget from './targets/widgets/RecentsWidget';
import { classifyThought, splitThoughts } from './src/segmentation';
import { clearCaptureDraft, createAttachmentThoughts, createThought, deleteThought, getPreference, initializeDatabase, listAttachments, listRecentThoughts, listTags, listThoughts, recoverCaptureDraft, setPreference, setThoughtTags, togglePinned, toggleResolved, updateThought, type Attachment, type AttachmentKind, type Tag, type Thought } from './src/storage';

const tokens = require('./src/theme/tokens');

const capturePrompts = [
  'What are you daydreaming of?',
  'What are you thinking about?',
  'Your next rabbit hole adventure awaits...',
  'Your next great masterpiece??',
];





export default function App() {
  const [frauncesLoaded] = useFraunces({ Fraunces_600SemiBold });


  if (!frauncesLoaded) return null;
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><JotfulApp /></SafeAreaProvider></GestureHandlerRootView>;
}

type Toast = { message: string; undo?: () => void };

function JotfulApp() {
  const [draft, setDraft] = useState('');
  const [richDraft, setRichDraft] = useState('');
  const [draftTagIds, setDraftTagIds] = useState<number[] | null>(null);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filterTagIds, setFilterTagIds] = useState<number[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [screen, setScreen] = useState<'thoughts' | 'settings'>('thoughts');
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [preferredAI, setPreferredAI] = useState('ChatGPT');
  const [preferredBrowser, setPreferredBrowser] = useState('System default');
  const [editingThoughtId, setEditingThoughtId] = useState<number | null>(null);
  const [detail, setDetail] = useState<{ thought: Thought; attachments: Attachment[] } | null>(null);
  const [tagTarget, setTagTarget] = useState<'draft' | number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [capturePromptIndex] = useState(() => Math.floor(Math.random() * capturePrompts.length));
  const sheetRef = useRef<CaptureSheetHandle>(null);
  const recoveredDraft = useRef(false);
  const voiceBase = useRef('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  // The collapsed capture sheet's height; the stack keeps its front card clear of it.
  const peek = capturePeekHeight(insets.bottom);
  // This must run during the parent render, before CaptureSheet mounts. Its
  // empty initial state otherwise clears the journal before an effect can
  // restore the interrupted capture.
  if (!recoveredDraft.current) {
    initializeDatabase();
    recoverCaptureDraft();
    recoveredDraft.current = true;
  }
  const preview = useMemo(() => splitThoughts(draft), [draft]);
  // Home is time order, newest first (the Rolodex stops at both ends).
  const refresh = () => {
    const list = listThoughts(search, { tagIds: filterTagIds, showResolved });
    setThoughts([...list].sort((a, b) => b.createdAt - a.createdAt));
    setDetail((current) => {
      if (!current) return current;
      const fresh = listThoughts('', { showResolved: true }).find((thought) => thought.id === current.thought.id);
      return fresh ? { thought: fresh, attachments: listAttachments(fresh.id) } : null;
    });
  };

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (transcript) { setRichDraft(''); setDraft(voiceBase.current + (voiceBase.current ? ' ' : '') + transcript); }
  });
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    if (event.error !== 'aborted' && event.error !== 'no-speech') Alert.alert('Voice input stopped', event.message || 'Try again or type your thought.');
  });

  useEffect(() => { setPreferredAI(getPreference('preferredAI', 'ChatGPT')); setPreferredBrowser(getPreference('preferredBrowser', 'System default')); setTags(listTags()); refresh(); }, []);
  useEffect(() => { refresh(); }, [search, filterTagIds, showResolved]);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useEffect(() => startWatchSync(() => refreshRef.current()), []);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    CaptureWidget.updateSnapshot({ thoughtCount: thoughts.filter((thought) => thought.resolvedAt === null).length });
    RecentsWidget.updateSnapshot({ items: listRecentThoughts(5).map(({ id, text, kind, tags: [first] }) => ({ id, text, kind, ...(first ? { tag: { name: first.name, color: tokens.tag[first.color] } } : {}) })) });
  }, [thoughts]);

  function showToast(next: Toast) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(next);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  function openSheet(mode: 'write' | 'voice' = 'write') {
    setEditingThoughtId(null);
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

  function resetDraft() {
    setDraft('');
    setRichDraft('');
    setDraftTagIds(null);
    clearCaptureDraft();
  }

  function saveDraft() {
    const text = draft.trim();
    if (!text) return;
    if (editingThoughtId !== null) {
      updateThought(editingThoughtId, text, classifyThought(text), richDraft || undefined);
      if (draftTagIds) setThoughtTags(editingThoughtId, draftTagIds);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetDraft();
      setEditingThoughtId(null);
      closeSheet();
      refresh();
      return;
    }
    // Picked tags win; otherwise each thought gets the tag its wording suggests.
    const picked = draftTagIds ?? undefined;
    if (richDraft) createThought(text, classifyThought(text), richDraft, picked);
    else preview.forEach((item) => createThought(item, classifyThought(item), undefined, picked));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetDraft();
    closeSheet();
    refresh();
  }

  function saveAttachments(attachments: Array<{ kind: AttachmentKind; uri: string; durationMillis?: number }>, caption?: string) {
    createAttachmentThoughts(attachments, caption);
    if (draftTagIds?.length) {
      const newest = listRecentThoughts(1)[0];
      if (newest) setThoughtTags(newest.id, draftTagIds);
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Attachment saves bypass saveDraft(), so clear their optional caption here
    // before closing the shared capture sheet.
    resetDraft();
    sheetRef.current?.close();
    refresh();
  }

  function confirmClearDraft() {
    if (!draft.trim()) return;
    Alert.alert('Clear this thought?', 'This removes the text you have not saved.', [
      { text: 'Keep writing', style: 'cancel' },
      { text: 'Clear thought', style: 'destructive', onPress: () => { setDraft(''); setRichDraft(''); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } }
    ]);
  }

  async function sendTo(service: 'search' | 'ai', text: string) {
    const prompt = service === 'ai' ? 'Help me think through: ' + text : text;
    const base = service === 'ai' && preferredAI === 'Claude' ? 'https://claude.ai/new?q=' : service === 'ai' ? 'https://chatgpt.com/?q=' : 'https://www.google.com/search?q=';
    await Linking.openURL(base + encodeURIComponent(prompt));
  }

  function askAI(thought: Thought) {
    Alert.alert('Open with AI?', 'Only this thought will be opened in your browser.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: () => void sendTo('ai', thought.text) }]);
  }

  async function copyThought(text: string) {
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function resolve(thought: Thought) {
    const wasResolved = thought.resolvedAt !== null;
    toggleResolved(thought.id, wasResolved ? null : Date.now());
    refresh();
    if (!wasResolved) showToast({ message: 'Resolved', undo: () => { toggleResolved(thought.id, null); refresh(); setToast(null); } });
  }

  function pin(thought: Thought) {
    togglePinned(thought.id, thought.pinnedAt ? null : Date.now());
    refresh();
  }

  function openDetail(thought: Thought) {
    closeSheet();
    setDetail({ thought, attachments: listAttachments(thought.id) });
  }

  function editThought(thought: Thought) {
    setDetail(null);
    setDraft(thought.text);
    setRichDraft(thought.richText ?? '');
    setDraftTagIds(thought.tags.map((tag) => tag.id));
    setEditingThoughtId(thought.id);
    sheetRef.current?.open('write');
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

  const tagTargetIds = tagTarget === 'draft' ? (draftTagIds ?? []) : typeof tagTarget === 'number' ? (detail?.thought.tags.map((tag) => tag.id) ?? []) : [];
  const draftTags = (draftTagIds ?? []).map((id) => tags.find((tag) => tag.id === id)).filter((tag): tag is Tag => Boolean(tag));
  const tagRow = <View className="flex-row flex-wrap items-center gap-2">
    {draftTags.map((tag) => <TagPill key={tag.id} tag={tag} selected onPress={() => setTagTarget('draft')} />)}
    <Pressable onPress={() => setTagTarget('draft')} className="rounded-full bg-fill px-2.5 py-1" accessibilityLabel="Add a tag"><Text className="text-caption2 font-bold uppercase tracking-[0.6px] text-secondary">+ Tag</Text></Pressable>
  </View>;

  if (screen === 'settings') return <><StatusBar style="dark" /><SettingsScreen preferredAI={preferredAI} preferredBrowser={preferredBrowser} tagCount={tags.length} onChooseAI={chooseAI} onChooseBrowser={chooseBrowser} onClose={() => setScreen('thoughts')} /></>;

  return <View className="flex-1 bg-page"><StatusBar style="dark" />
    <HomeHeader topInset={insets.top} searchOpen={searchOpen} search={search} onSearchChange={setSearch} onOpenSearch={() => { closeSheet(); setSearchOpen(true); }} onCloseSearch={() => { setSearch(''); setSearchOpen(false); }} onOpenSettings={() => { setSheetExpanded(false); setScreen('settings'); }} />
    <FilterRow tags={tags} selectedIds={filterTagIds} showResolved={showResolved} onOpenMenu={() => setFilterOpen(true)} onRemoveTag={(id) => setFilterTagIds((ids) => ids.filter((x) => x !== id))} onHideResolved={() => setShowResolved(false)} />
    <View className="flex-1">
      <ThoughtStack resetKey={filterTagIds.join(',') + (showResolved ? 'r' : '') + search} thoughts={thoughts} bottomInset={peek} onOpen={openDetail} onResolve={resolve} onPin={pin} onAskAI={askAI} onSearchWeb={(thought) => void sendTo('search', thought.text)} onCopy={(thought) => void copyThought(thought.text)} onReservedSwipe={() => showToast({ message: 'Long swipe is coming soon' })} />
    </View>
    <Pressable pointerEvents={sheetExpanded ? 'auto' : 'none'} onPress={closeSheet} style={{ position: 'absolute', top: insets.top + 64, right: 0, bottom: 0, left: 0, zIndex: 19 }} accessibilityElementsHidden />
    <CaptureSheet ref={sheetRef} prompt={capturePrompts[capturePromptIndex]} draft={draft} previewCount={preview.length} listening={listening} onDraftChange={setDraft} onRichTextChange={setRichDraft} onToggleVoice={() => void toggleVoiceInput()} onStopVoice={() => ExpoSpeechRecognitionModule.stop()} onSave={saveDraft} onClear={confirmClearDraft} onCollapseHaptic={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} onOpenHaptic={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} onExpandedChange={setSheetExpanded} onAttachments={saveAttachments} tagRow={tagRow} onVoiceDiscarded={(undo) => showToast({ message: 'Recording discarded', undo: () => { if (undo()) refresh(); setToast(null); } })} />
    {toast && <View pointerEvents="box-none" className="absolute inset-x-0 items-center" style={{ bottom: peek + 12, zIndex: 40 }}>
      <View className="flex-row items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2">
        <Text className="text-subhead text-onInk">{toast.message}</Text>
        {toast.undo ? <Pressable onPress={toast.undo} className="rounded-full bg-white/20 px-4 py-2" accessibilityLabel="Undo"><Text className="text-subhead font-semibold text-onInk">Undo</Text></Pressable> : <View className="w-3" />}
      </View>
    </View>}
    <FilterMenu visible={filterOpen} top={insets.top + 100} tags={tags} selectedIds={filterTagIds} showResolved={showResolved} onToggleTag={(id) => setFilterTagIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])} onToggleResolved={setShowResolved} onClose={() => setFilterOpen(false)} />
    <Modal visible={detail !== null} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setDetail(null)}>
      {detail && <ThoughtDetail thought={detail.thought} attachments={detail.attachments}
        onClose={() => setDetail(null)}
        onToggleResolved={() => resolve(detail.thought)}
        onTogglePinned={() => pin(detail.thought)}
        onEdit={() => editThought(detail.thought)}
        onDelete={() => { deleteThought(detail.thought.id); setDetail(null); refresh(); }}
        onShare={() => void Share.share({ message: detail.thought.text })}
        onAskAI={() => askAI(detail.thought)}
        onSearchWeb={() => void sendTo('search', detail.thought.text)}
        onCopy={() => void copyThought(detail.thought.text)}
        onEditTags={() => setTagTarget(detail.thought.id)} />}
      <TagPicker visible={typeof tagTarget === 'number'} tags={tags} selectedIds={tagTargetIds} onChange={(ids) => { if (typeof tagTarget === 'number') { setThoughtTags(tagTarget, ids); refresh(); } }} onClose={() => setTagTarget(null)} />
    </Modal>
    <TagPicker visible={tagTarget === 'draft'} tags={tags} selectedIds={tagTargetIds} onChange={setDraftTagIds} onClose={() => setTagTarget(null)} />
  </View>;
}
