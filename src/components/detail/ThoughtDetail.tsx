// Thought detail: one template for every content combo (design/mocks/r8/detail, NOTES.md).
// White page · three glass islands on top · ONE grey content card (media → voice → text →
// actions) · tags · grouped info card · Resolve. The page scrolls; nothing is pinned below.
// Mount inside a Modal (pageSheet or full screen); it brings its own SafeAreaProvider.
import { RichTextViewer } from '@apollohg/react-native-rich-text-editor';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  Check,
  CircleCheck,
  Copy,
  Ellipsis,
  Globe,
  MessageSquareText,
  Plus,
  RotateCcw,
  Smartphone,
  X,
} from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Tap } from '../ui/Tap';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Attachment, Thought } from '../../storage';
import MediaPager from './MediaPager';
import { VoiceHero, VoiceRow } from './VoicePlayer';
import {
  SHADOW_GLASS,
  SHADOW_SOFT,
  T,
  alpha,
  attachmentSummary,
  formatTime,
  fullDate,
  hasRichText,
  realText,
  relativeDay,
  resolveAttachments,
} from './detailUtils';

export type ThoughtDetailProps = {
  thought: Thought;
  attachments: Attachment[];
  onClose(): void;
  onToggleResolved(): void;
  onTogglePinned(): void;
  onEdit(): void;
  onDelete(): void;
  onShare(): void;
  onAskAI(): void;
  onSearchWeb(): void;
  onCopy(): void;
  onEditTags(): void;
  onAdjustDate?(): void;
};

const ink = T.color.ink;
const white = T.primitive.white;
const ICON = 21;

// ---------- chrome ----------

/** Frosted white island (detail.css .glass). */
function Glass({ width, padH = 0, column, children }: { width?: number; padH?: number; column?: boolean; children: ReactNode }) {
  const r = 22;
  return (
    <View style={[SHADOW_GLASS, { height: 44, width, borderRadius: r }]}>
      <View style={{ borderRadius: r, overflow: 'hidden', flex: 1 }}>
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: alpha(white, 0.82), borderRadius: r, borderWidth: StyleSheet.hairlineWidth, borderColor: alpha(T.primitive.ink, 0.06) }]} />
        <View style={{ flex: 1, paddingHorizontal: padH, flexDirection: column ? 'column' : 'row', alignItems: 'center', justifyContent: 'center' }}>{children}</View>
      </View>
    </View>
  );
}

function IconButton({ label, onPress, children }: { label: string; onPress(): void; children: ReactNode }) {
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? alpha(T.primitive.ink, 0.07) : 'transparent' })}
    >
      {children}
    </Tap>
  );
}

function TopBar({ top, thought, onClose, onResolve, onMore }: { top: number; thought: Thought; onClose(): void; onResolve(): void; onMore(): void }) {
  const resolved = thought.resolvedAt != null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top, left: 16, right: 16, height: 44, zIndex: 10 }}>
      <View pointerEvents="box-none" className="flex-1 flex-row items-center justify-between">
        <Glass width={44}>
          <IconButton label="Close" onPress={onClose}>
            <X size={ICON} color={ink} strokeWidth={1.9} />
          </IconButton>
        </Glass>
        <Glass padH={2}>
          <IconButton label={resolved ? 'Bring Back' : 'Resolve'} onPress={onResolve}>
            <CircleCheck size={ICON} color={resolved ? white : ink} fill={resolved ? ink : 'transparent'} strokeWidth={1.9} />
          </IconButton>
          <IconButton label="More" onPress={onMore}>
            <Ellipsis size={ICON} color={ink} strokeWidth={1.9} />
          </IconButton>
        </Glass>
      </View>
      {/* Centred capsule, independent of the side islands' widths. */}
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { alignItems: 'center' }]}>
        <Glass padH={22} column>
          <Text className="font-semibold text-ink" style={{ fontSize: 17, lineHeight: 19 }}>
            {relativeDay(thought.createdAt)}
          </Text>
          <Text className="text-ink" style={{ fontSize: 13, lineHeight: 15, opacity: 0.75 }}>
            {formatTime(thought.createdAt)}
          </Text>
        </Glass>
      </View>
    </View>
  );
}

// ---------- card actions ----------

function ActionPill({ label, icon, onPress, variant }: { label: string; icon: ReactNode; onPress(): void; variant: 'black' | 'white' | 'smoke' }) {
  const bg = variant === 'black' ? ink : variant === 'white' ? white : alpha(white, 0.16);
  const pressedBg = variant === 'black' ? T.primitive.graphite2 : variant === 'white' ? T.color.fill : alpha(white, 0.26);
  const fg = variant === 'white' ? ink : white;
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => [
        variant === 'white' ? SHADOW_SOFT : null,
        {
          height: 44,
          borderRadius: 22,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: pressed ? pressedBg : bg,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          borderWidth: variant === 'smoke' ? StyleSheet.hairlineWidth : 0,
          borderColor: alpha(white, 0.2),
        },
      ]}
    >
      {icon}
      <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: fg }}>
        {label}
      </Text>
    </Tap>
  );
}

function Actions({ dark, onAskAI, onSearchWeb, onCopy }: { dark: boolean; onAskAI(): void; onSearchWeb(): void; onCopy(): void }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const copy = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCopy();
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1200);
  };
  // On the dark voice card, Ask AI flips to white so it stays the one high-contrast button.
  const askFg = dark ? ink : white;
  const sideFg = dark ? white : ink;
  const CopyIcon = copied ? Check : Copy;
  return (
    <View className="flex-row items-center" style={{ gap: 12 }}>
      <ActionPill
        label="Ask AI"
        variant={dark ? 'white' : 'black'}
        icon={<MessageSquareText size={18} color={askFg} strokeWidth={1.9} />}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onAskAI();
        }}
      />
      <ActionPill
        label="Search Web"
        variant={dark ? 'smoke' : 'white'}
        icon={<Globe size={18} color={sideFg} strokeWidth={1.9} />}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSearchWeb();
        }}
      />
      <Tap
        onPress={copy}
        accessibilityLabel={copied ? 'Copied' : 'Copy'}
        style={({ pressed }) => [
          dark ? null : SHADOW_SOFT,
          {
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: dark ? alpha(white, pressed ? 0.26 : 0.16) : pressed ? T.color.fill : white,
            transform: [{ scale: pressed ? 0.96 : 1 }],
            borderWidth: dark ? StyleSheet.hairlineWidth : 0,
            borderColor: alpha(white, 0.2),
          },
        ]}
      >
        <CopyIcon size={18} color={sideFg} strokeWidth={1.9} />
      </Tap>
    </View>
  );
}

// ---------- below the card ----------

function InfoRow({ first, children }: { first?: boolean; children: ReactNode }) {
  return (
    <View
      className="flex-row items-center justify-between"
      style={{ minHeight: 48, paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth, borderTopColor: T.color.separator }}
    >
      {children}
    </View>
  );
}

// ---------- screen ----------

function DetailScreen(props: ThoughtDetailProps) {
  const { thought } = props;
  const insets = useSafeAreaInsets();
  const all = resolveAttachments(thought, props.attachments);
  const visual = all.filter((a) => a.kind === 'image' || a.kind === 'video');
  const audio = all.find((a) => a.kind === 'audio');
  const rich = hasRichText(thought.richText) ? thought.richText : null;
  const text = rich ? '' : realText(thought.text);
  const hasText = !!rich || !!text;
  const voiceOnly = !!audio && !visual.length && !hasText;
  const textOnly = hasText && !visual.length && !audio;
  const resolved = thought.resolvedAt != null;
  const pinned = thought.pinnedAt != null;
  const summary = attachmentSummary(all);

  // Inside a pageSheet the top inset is 0; full screen it's the status bar.
  const barTop = insets.top > 0 ? insets.top + 6 : 12;
  const contentTop = barTop + 44 + 12;

  const resolve = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    props.onToggleResolved();
  };

  const confirmDelete = () =>
    Alert.alert('Delete this thought?', 'This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          props.onDelete();
        },
      },
    ]);

  const openMore = () => {
    void Haptics.selectionAsync();
    const options = [pinned ? 'Unpin' : 'Pin', 'Edit', 'Share', 'Delete', 'Cancel'];
    const run = (i: number) => {
      if (i === 0) props.onTogglePinned();
      else if (i === 1) props.onEdit();
      else if (i === 2) props.onShare();
      else if (i === 3) confirmDelete();
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, destructiveButtonIndex: 3, cancelButtonIndex: 4 }, run);
    } else {
      Alert.alert('', undefined, [
        ...options.slice(0, 4).map((text, i) => ({ text, style: i === 3 ? ('destructive' as const) : ('default' as const), onPress: () => run(i) })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  };

  const textSize = textOnly ? { fontSize: 28, lineHeight: 34, letterSpacing: -0.4 } : { fontSize: 22, lineHeight: 28, letterSpacing: -0.2 };
  const textPad = textOnly ? { paddingTop: 10, paddingHorizontal: 8, paddingBottom: 6 } : { paddingHorizontal: 6 };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: contentTop, paddingBottom: Math.max(insets.bottom, 16) + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* THE CARD: all of the thought's content, then the actions. */}
        <View
          className={voiceOnly ? 'bg-voiceCard' : 'bg-card'}
          style={{
            marginHorizontal: 16,
            borderRadius: T.radius.card,
            padding: 12,
            paddingTop: voiceOnly ? 20 : 12,
            gap: 12,
            overflow: 'hidden',
          }}
        >
          {visual.length > 0 && <MediaPager items={visual} />}
          {audio &&
            (voiceOnly ? (
              <VoiceHero uri={audio.uri} durationMillis={audio.durationMillis} />
            ) : (
              <VoiceRow uri={audio.uri} durationMillis={audio.durationMillis} />
            ))}
          {rich ? (
            <View style={textPad}>
              <RichTextViewer contentHTML={rich} theme={{ text: { ...textSize, fontWeight: 600, color: ink } }} />
            </View>
          ) : text ? (
            <Text selectable className="text-ink" style={[textSize, textPad, { fontWeight: '600' }]}>
              {text}
            </Text>
          ) : null}
          <Actions dark={voiceOnly} onAskAI={props.onAskAI} onSearchWeb={props.onSearchWeb} onCopy={props.onCopy} />
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 12 }}>
          {/* Tags (bright) + Add */}
          <View className="flex-row flex-wrap items-center" style={{ gap: 8 }}>
            {thought.tags.map((tag) => (
              <Pressable
                key={tag.id}
                onPress={props.onEditTags}
                accessibilityLabel={`Tag ${tag.name}`}
                style={{ height: 26, paddingHorizontal: 11, borderRadius: 13, justifyContent: 'center', backgroundColor: T.tag[tag.color] }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: T.tagOn[tag.color] }}>{tag.name}</Text>
              </Pressable>
            ))}
            <Tap
              onPress={props.onEditTags}
              accessibilityLabel="Add tag"
              className="flex-row items-center bg-card"
              style={({ pressed }) => ({ height: 26, paddingLeft: 8, paddingRight: 11, borderRadius: 13, gap: 4, opacity: pressed ? 0.6 : 1 })}
            >
              <Plus size={14} color={T.color.secondary} strokeWidth={2.4} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: T.color.secondary }}>Add</Text>
            </Tap>
          </View>

          {/* Grouped info card */}
          <View className="bg-card" style={{ borderRadius: 16 }}>
            <InfoRow first>
              <Text className="text-ink" style={{ fontSize: 17, flexShrink: 1 }} numberOfLines={1}>
                {fullDate(thought.createdAt)}
              </Text>
              {props.onAdjustDate && (
                <Pressable onPress={props.onAdjustDate} hitSlop={10} accessibilityLabel="Adjust date">
                  <Text style={{ fontSize: 17, color: T.color.action }}>Adjust</Text>
                </Pressable>
              )}
            </InfoRow>
            <InfoRow>
              <Text className="text-ink" style={{ fontSize: 17 }}>From</Text>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Smartphone size={18} color={T.color.secondary} strokeWidth={1.9} />
                <Text style={{ fontSize: 17, color: T.color.secondary }}>iPhone</Text>
              </View>
            </InfoRow>
            {summary !== '' && (
              <InfoRow>
                <Text className="text-ink" style={{ fontSize: 17 }}>Attachments</Text>
                <Text style={{ fontSize: 17, color: T.color.secondary, flexShrink: 1, marginLeft: 12 }} numberOfLines={1}>
                  {summary}
                </Text>
              </InfoRow>
            )}
            <InfoRow>
              <Text className="text-ink" style={{ fontSize: 17 }}>Pinned</Text>
              <Switch
                value={pinned}
                onValueChange={() => {
                  void Haptics.selectionAsync();
                  props.onTogglePinned();
                }}
                trackColor={{ true: ink, false: T.color.fill }}
                ios_backgroundColor={T.color.fill}
                accessibilityLabel="Pinned"
              />
            </InfoRow>
          </View>

          {/* Resolve */}
          <Tap
            onPress={resolve}
            accessibilityLabel={resolved ? 'Bring Back' : 'Resolve'}
            className="flex-row items-center justify-center bg-card"
            style={({ pressed }) => ({ height: 50, borderRadius: 25, gap: 8, transform: [{ scale: pressed ? 0.98 : 1 }], opacity: pressed ? 0.8 : 1 })}
          >
            {resolved ? <RotateCcw size={20} color={ink} strokeWidth={2} /> : <CircleCheck size={20} color={ink} strokeWidth={2} />}
            <Text className="text-ink" style={{ fontSize: 17, fontWeight: '600' }}>
              {resolved ? 'Bring Back' : 'Resolve'}
            </Text>
          </Tap>
        </View>
      </ScrollView>

      <TopBar top={barTop} thought={thought} onClose={props.onClose} onResolve={resolve} onMore={openMore} />
    </View>
  );
}

export function ThoughtDetail(props: ThoughtDetailProps) {
  return (
    <SafeAreaProvider>
      <DetailScreen {...props} />
    </SafeAreaProvider>
  );
}

export default ThoughtDetail;
