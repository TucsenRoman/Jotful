import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { classifyThought, splitThoughts, type ThoughtKind } from './src/segmentation';
import { createThought, deleteThought, initializeDatabase, listThoughts, moveThought, type Thought } from './src/storage';

const kindLabel: Record<ThoughtKind, string> = { question: 'Question', idea: 'Idea', task: 'Task', thought: 'Thought' };
const kindIcon: Record<ThoughtKind, string> = { question: '?', idea: '✦', task: '✓', thought: '•' };

export default function App() {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const preview = useMemo(() => splitThoughts(draft), [draft]);

  const refresh = () => setThoughts(listThoughts(search));
  useEffect(() => { initializeDatabase(); refresh(); }, []);
  useEffect(() => { refresh(); }, [search]);

  const saveDraft = () => {
    preview.forEach((text) => createThought(text, classifyThought(text)));
    setDraft('');
    refresh();
  };

  const sendTo = async (service: 'search' | 'ai', text: string) => {
    const prompt = service === 'ai' ? `Help me think through: ${text}` : text;
    const base = service === 'ai' ? 'https://chatgpt.com/?q=' : 'https://www.google.com/search?q=';
    await Linking.openURL(`${base}${encodeURIComponent(prompt)}`);
  };

  const actions = (thought: Thought) => Alert.alert('Thought actions', 'Your full note stays on this device.', [
    { text: 'Search web', onPress: () => void sendTo('search', thought.text) },
    { text: 'Ask AI', onPress: () => Alert.alert('Send this thought to AI?', 'Only this thought will be opened in your browser.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: () => void sendTo('ai', thought.text) }]) },
    { text: 'Move to Ideas', onPress: () => { moveThought(thought.id, 'Ideas'); refresh(); } },
    { text: 'Make task', onPress: () => { moveThought(thought.id, 'Tasks', 'task'); refresh(); } },
    { text: 'Delete', style: 'destructive', onPress: () => { deleteThought(thought.id); refresh(); } },
    { text: 'Cancel', style: 'cancel' }
  ]);

  return <SafeAreaView style={styles.safe}><StatusBar style="dark" />
    <View style={styles.header}><View><Text style={styles.brand}>Unsorted</Text><Text style={styles.date}>Your private thought inbox</Text></View><Text style={styles.lock}>⌁ Offline</Text></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Dump questions, thoughts, or ideas here…" placeholderTextColor="#839086" multiline style={styles.input} textAlignVertical="top" />
        <View style={styles.composerFooter}><Text style={styles.hint}>{preview.length ? `Found ${preview.length} separate ${preview.length === 1 ? 'thought' : 'thoughts'}` : 'Saved only on this device'}</Text><Pressable disabled={!preview.length} onPress={saveDraft} style={[styles.save, !preview.length && styles.saveDisabled]}><Text style={styles.saveText}>Save</Text></Pressable></View>
      </View>
      <TextInput value={search} onChangeText={setSearch} placeholder="Search your thoughts" placeholderTextColor="#839086" style={styles.search} />
      {thoughts.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Give your mind some room.</Text><Text style={styles.emptyText}>Write naturally above. Unsorted separates each thought when you save it.</Text></View> : thoughts.map((thought) => <View key={thought.id} style={styles.card}>
        <View style={styles.cardTop}><Text style={styles.kind}>{kindIcon[thought.kind]}  {kindLabel[thought.kind].toUpperCase()}</Text><Pressable onPress={() => actions(thought)} hitSlop={12}><Text style={styles.ellipsis}>•••</Text></Pressable></View>
        <Text selectable style={styles.thought}>{thought.text}</Text>
        <View style={styles.inlineActions}><Pressable onPress={() => void sendTo('search', thought.text)} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Search web</Text></Pressable><Pressable onPress={() => Alert.alert('Send this thought to AI?', 'Only this thought will be opened in your browser.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: () => void sendTo('ai', thought.text) }])} style={styles.primaryAction}><Text style={styles.primaryActionText}>Ask AI</Text></Pressable><Pressable onPress={() => actions(thought)} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>More</Text></Pressable>{thought.collection && <Text style={styles.collection}>{thought.collection}</Text>}</View>
      </View>)}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F1' }, header: { paddingHorizontal: 22, paddingTop: Platform.OS === 'android' ? 20 : 8, paddingBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { fontSize: 30, fontWeight: '700', color: '#1C261C' }, date: { marginTop: 2, fontSize: 14, color: '#68746A' }, lock: { color: '#527657', fontSize: 13, fontWeight: '600', backgroundColor: '#E5EEE1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 }, content: { padding: 14, paddingBottom: 46 }, composer: { backgroundColor: '#FFFEFA', borderRadius: 20, padding: 14, shadowColor: '#36523A', shadowOpacity: 0.09, shadowRadius: 12, elevation: 2 }, input: { minHeight: 120, fontSize: 18, lineHeight: 26, color: '#1C261C' }, composerFooter: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#DEE6DB', paddingTop: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, hint: { color: '#718071', fontSize: 12, flex: 1 }, save: { backgroundColor: '#315D35', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 }, saveDisabled: { backgroundColor: '#B9C4B8' }, saveText: { color: '#FFF', fontWeight: '700' }, search: { backgroundColor: '#E8EEE5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginTop: 18, fontSize: 15, color: '#1C261C' }, empty: { paddingVertical: 60, paddingHorizontal: 30, alignItems: 'center' }, emptyTitle: { color: '#273227', fontSize: 18, fontWeight: '700' }, emptyText: { color: '#718071', lineHeight: 21, textAlign: 'center', marginTop: 8 }, card: { marginTop: 12, padding: 16, borderRadius: 18, backgroundColor: '#FFFEFA', borderWidth: 1, borderColor: '#E4E9E0' }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, kind: { color: '#557258', fontSize: 11, fontWeight: '700', letterSpacing: 0.7 }, ellipsis: { color: '#526052', fontWeight: '700', letterSpacing: 1 }, thought: { fontSize: 17, lineHeight: 25, color: '#1C261C', marginTop: 10 }, inlineActions: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14, flexWrap: 'wrap' }, primaryAction: { backgroundColor: '#315D35', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9 }, primaryActionText: { color: '#FFF', fontSize: 13, fontWeight: '700' }, secondaryAction: { backgroundColor: '#EAF0E7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9 }, secondaryActionText: { color: '#38503A', fontSize: 13, fontWeight: '600' }, collection: { color: '#617361', fontSize: 12, paddingHorizontal: 6 }
});
