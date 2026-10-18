// Settings: iOS 26 inset-grouped page (grey page, white rounded groups, inset separators).
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const T = require('../../theme/tokens');

export type SettingsScreenProps = {
  preferredAI: string;
  preferredBrowser: string;
  tagCount: number;
  onChooseAI(): void;
  onChooseBrowser(): void;
  onManageTags?(): void;
  // Dev app only: fill or clear the sample thoughts.
  onAddSampleData?(): void;
  onClearSampleData?(): void;
  onClose(): void;
};

function Row({ title, detail, onPress, last }: { title: string; detail: string; onPress?: () => void; last?: boolean }) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityLabel={`${title}, ${detail}`}
      style={({ pressed }) => ({ paddingLeft: 16, backgroundColor: pressed ? T.color.fill : 'transparent' })}
    >
      <View
        style={{
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 11,
          paddingRight: 16,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: T.color.separator,
        }}
      >
        <Text className="text-body text-ink" style={{ flex: 1 }}>{title}</Text>
        <Text className="text-body text-secondary" style={{ marginLeft: 12, flexShrink: 1, textAlign: 'right' }} numberOfLines={1}>{detail}</Text>
        {onPress ? <ChevronRight size={17} strokeWidth={2.5} color={T.color.faint} style={{ marginLeft: 6 }} /> : null}
      </View>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: 28 }}>
      <Text className="text-subhead text-secondary" style={{ marginLeft: 32, marginBottom: 7 }}>{title}</Text>
      <View style={{ marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: T.color.surface }}>{children}</View>
    </View>
  );
}

export default function SettingsScreen({ preferredAI, preferredBrowser, tagCount, onChooseAI, onChooseBrowser, onManageTags, onAddSampleData, onClearSampleData, onClose }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }}>
        <View style={{ paddingHorizontal: 16 }}>
          <Pressable onPress={onClose} accessibilityLabel="Close settings" style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden' }}>
            <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 22 }]} />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <X size={21} strokeWidth={2.25} color={T.color.ink} />
            </View>
          </Pressable>
          <Text className="text-ink" style={{ marginTop: 12, fontSize: 34, lineHeight: 41, fontWeight: '700' }}>Settings</Text>
        </View>

        <Section title="Open with">
          <Row title="Preferred AI" detail={preferredAI} onPress={onChooseAI} />
          <Row title="Preferred browser" detail={preferredBrowser} onPress={onChooseBrowser} last />
        </Section>
        <Section title="Tags">
          <Row title="Tags" detail={`${tagCount} tags`} onPress={onManageTags} last />
        </Section>
        <Section title="Capture">
          <Row title="Voice input" detail="On-device Dictation" />
          <Row title="Photos, video & audio" detail="Coming soon" last />
        </Section>
        <Section title="Your space">
          <Row title="Pinned thoughts" detail="Ready for widgets" />
          <Row title="Storage & privacy" detail="Thoughts stay on this iPhone" last />
        </Section>
        {onAddSampleData && onClearSampleData ? <Section title="Developer (Jotful Dev only)">
          <Row title="Add sample thoughts" detail="17 thoughts, Aug–Oct" onPress={onAddSampleData} />
          <Row title="Remove sample thoughts" detail="Keeps your own" onPress={onClearSampleData} last />
        </Section> : null}
        <Section title="About">
          <Row title="Jotful" detail="Private thought inbox · version 1.0" last />
        </Section>
      </ScrollView>
    </View>
  );
}
