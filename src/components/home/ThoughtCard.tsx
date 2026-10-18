// One card face of the home stack (design/mocks/r6/home.html, r3/swipe/cards.css).
// Static content only; StackCard moves it.
import { memo, type ComponentProps } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Copy, Globe, MessageSquare, Mic, Pin, Play } from 'lucide-react-native';
import { RichTextViewer } from '@apollohg/react-native-rich-text-editor';
import AudioTimeline from '../AudioTimeline';
import type { Thought } from '../../storage';
import { audioDuration, bodyOf, metaLabel, richBodyOf, titleOf } from './format';
import { CARD_H } from './stackMath';

const tokens = require('../../theme/tokens');
const c = tokens.color;
const p = tokens.primitive;

const RESOLVED_BG: string = tokens.mix(p.grey, 0.18);
const BODY_TOP = 71; // 11 + 28 title + 3 + 19 meta + 10
const ACTS_H = 44 + 16; // buttons sit 16pt (the card inner padding) from the bottom
const BODY_H = CARD_H - BODY_TOP - ACTS_H - 10;

export function cardBackground(t: Thought) {
  if (t.resolvedAt) return RESOLVED_BG;
  const tag = t.tags[0];
  return tag ? (tokens.tagTint[tag.color] as string) : (c.surface as string);
}

type Props = {
  thought: Thought;
  isFront: boolean;
  more: string; // "14 more" / "Last one"
  moreStyle?: ComponentProps<typeof Animated.Text>['style']; // animated: visible on the front card only
  onPress: () => void; // front: open; behind: spin to it
  onAskAI?: () => void;
  onSearchWeb?: () => void;
  onCopy?: () => void;
};

function ThoughtCardBase({ thought: t, isFront, more, moreStyle, onPress, onAskAI, onSearchWeb, onCopy }: Props) {
  const resolved = !!t.resolvedAt;
  const tag = t.tags[0];
  const title = titleOf(t);
  const body = bodyOf(t);
  const rich = richBodyOf(t);
  const hasImage = t.attachmentKind === 'image' && !!t.attachmentUri;
  const hasAudio = t.attachmentKind === 'audio' && !!t.attachmentUri;
  const hasBody = !!(rich || body);
  const textColor = resolved ? p.grey : p.graphite;
  const strike = resolved ? styles.strike : null;

  return (
    <View style={[styles.face, { backgroundColor: cardBackground(t) }]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={isFront ? `Open ${title}` : `Show ${title}`}
      >
        <View style={styles.inner}>
          <Text numberOfLines={1} style={[styles.title, { color: resolved ? p.grey : c.ink }, strike]}>
            {title}
          </Text>
          <View style={styles.meta}>
            {tag && (
              <View style={[styles.tagPill, { backgroundColor: resolved ? p.grey3 : tokens.tag[tag.color] }]}>
                <Text numberOfLines={1} style={[styles.tagText, { color: resolved ? p.grey : tokens.tagOn[tag.color] }]}>
                  {tag.name}
                </Text>
              </View>
            )}
            {!!t.pinnedAt && <Pin size={12} color={c.secondary} strokeWidth={2.4} style={styles.metaIcon} />}
            {t.attachmentKind === 'audio' && <Mic size={12} color={c.secondary} strokeWidth={2.4} style={styles.metaIcon} />}
            <Text numberOfLines={1} style={styles.metaText}>
              {metaLabel(t)}
            </Text>
            <Animated.Text style={[styles.more, moreStyle]}>{more}</Animated.Text>
          </View>

          <View style={styles.body}>
            {rich ? (
              <View pointerEvents="none" style={{ maxHeight: hasImage || hasAudio ? 22 : 88, overflow: 'hidden' }}>
                <RichTextViewer
                  contentHTML={rich}
                  enableLinkTaps={false}
                  theme={{ text: { fontSize: 17, lineHeight: 22, color: textColor } }}
                />
              </View>
            ) : body ? (
              <Text numberOfLines={hasImage ? 1 : hasAudio ? 2 : 4} style={[styles.bodyText, { color: textColor }, strike]}>
                {body}
              </Text>
            ) : null}

            {hasImage && (
              <Image
                source={{ uri: t.attachmentUri! }}
                resizeMode="cover"
                style={[styles.photo, { height: hasBody ? BODY_H - 22 - 8 : BODY_H - 5 }, resolved && { opacity: 0.5 }]}
              />
            )}

            {hasAudio &&
              (isFront ? (
                <AudioTimeline uri={t.attachmentUri!} fallbackDurationMillis={t.attachmentDurationMillis ?? undefined} compact />
              ) : (
                <View style={styles.voiceStub}>
                  <View style={styles.voicePlay}>
                    <Play size={14} color={c.ink} fill={c.ink} />
                  </View>
                  <Text style={styles.voiceTime}>{audioDuration(t)}</Text>
                </View>
              ))}
          </View>
        </View>
      </Pressable>

      {/* Rendered on every card so nothing pops in when a card becomes the front;
          cards behind are covered by the front card here, so only its buttons get touches. */}
      <View style={[styles.acts, resolved && { opacity: 0.45 }]}>
          <Pressable onPress={onAskAI} style={[styles.pill, styles.askPill]} accessibilityRole="button" accessibilityLabel="Ask AI">
            <MessageSquare size={17} color={c.onInk} strokeWidth={2} />
            <Text style={[styles.pillText, { color: c.onInk }]}>Ask AI</Text>
          </Pressable>
          <Pressable onPress={onSearchWeb} style={styles.pill} accessibilityRole="button" accessibilityLabel="Search Web">
            <Globe size={17} color={c.ink} strokeWidth={2} />
            <Text style={styles.pillText}>Search Web</Text>
          </Pressable>
          <Pressable onPress={onCopy} style={[styles.pill, styles.iconPill]} accessibilityRole="button" accessibilityLabel="Copy">
            <Copy size={17} color={c.ink} strokeWidth={2} />
          </Pressable>
      </View>
    </View>
  );
}

export const ThoughtCard = memo(ThoughtCardBase);

const styles = StyleSheet.create({
  face: {
    flex: 1,
    borderRadius: tokens.radius.homeCard,
    overflow: 'hidden',
  },
  inner: { flex: 1, paddingHorizontal: 16 },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.45,
    paddingTop: 11,
  },
  strike: { textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 3, height: 19 },
  tagPill: { borderRadius: tokens.radius.pill, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8, flexShrink: 0 },
  tagText: { fontSize: 11, lineHeight: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  metaIcon: { marginRight: 5 },
  metaText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: c.secondary,
  },
  more: { marginLeft: 'auto', paddingLeft: 10, flexShrink: 0, fontSize: 13, lineHeight: 18, color: p.grey },
  body: { marginTop: 10, height: BODY_H, overflow: 'hidden', gap: 8 },
  bodyText: { fontSize: 17, lineHeight: 22 },
  photo: { width: '100%', borderRadius: tokens.radius.media, backgroundColor: c.fill },
  voiceStub: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 32 },
  voicePlay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceTime: { fontSize: 13, lineHeight: 18, color: c.secondary, fontVariant: ['tabular-nums'] },
  acts: { position: 'absolute', left: 16, right: 16, bottom: 16, flexDirection: 'row', gap: 12 },
  pill: {
    height: tokens.size.control,
    borderRadius: tokens.size.control / 2,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexGrow: 0,
    backgroundColor: c.fill,
  },
  askPill: { backgroundColor: c.ink },
  iconPill: { width: tokens.size.control, paddingHorizontal: 0 },
  pillText: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2, color: c.ink },
});
