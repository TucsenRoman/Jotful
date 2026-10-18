// Voice playback for the detail card: a white inner row (with other content) or the
// big dark block (voice-only thought). design/mocks/r8/detail/detail.css .vrow / .vtop.
import { Pause, Play } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, type GestureResponderEvent } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { BARS, T, alpha, mmss } from './detailUtils';

function useVoice(uri: string, fallbackMillis: number | null) {
  const player = useAudioPlayer(uri, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || (fallbackMillis ?? 0) / 1000;
  const [scrub, setScrub] = useState<number | null>(null);
  const progress = scrub ?? (duration > 0 ? Math.min(1, status.currentTime / duration) : 0);

  useEffect(() => {
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  }, []);

  const toggle = async () => {
    void Haptics.selectionAsync();
    if (status.playing) return player.pause();
    // The player stays at the end after finishing; rewind so it replays.
    if (duration > 0 && status.currentTime >= duration - 0.05) await player.seekTo(0);
    player.play();
  };
  const seekTo = (f: number) => {
    if (duration > 0) void player.seekTo(Math.max(0, Math.min(duration, f * duration)));
  };
  return { playing: status.playing, current: status.currentTime, duration, progress, toggle, seekTo, setScrub };
}

/** A waveform you can tap or drag to seek. */
function Waveform({
  bars,
  height,
  gap,
  progress,
  base,
  played,
  onScrub,
  onSeek,
}: {
  bars: number;
  height: number;
  gap: number;
  progress: number;
  base: string;
  played: string;
  onScrub(f: number | null): void;
  onSeek(f: number): void;
}) {
  const width = useRef(0);
  const last = useRef(0);
  const frac = (e: GestureResponderEvent) =>
    width.current > 0 ? Math.max(0, Math.min(1, e.nativeEvent.locationX / width.current)) : 0;
  return (
    <View
      style={{ flex: 1, height, flexDirection: 'row', alignItems: 'center', gap }}
      onLayout={(e) => (width.current = e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => {
        last.current = frac(e);
        onScrub(last.current);
      }}
      onResponderMove={(e) => {
        last.current = frac(e);
        onScrub(last.current);
      }}
      onResponderRelease={() => {
        onSeek(last.current);
        onScrub(null);
      }}
      onResponderTerminate={() => onScrub(null)}
      accessibilityLabel="Seek recording"
    >
      {BARS.slice(0, bars).map((h, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{ flex: 1, height: `${h}%`, borderRadius: 2, backgroundColor: i / bars < progress ? played : base }}
        />
      ))}
    </View>
  );
}

/** White inner row: play · waveform · duration. */
export function VoiceRow({ uri, durationMillis }: { uri: string; durationMillis: number | null }) {
  const v = useVoice(uri, durationMillis);
  const Icon = v.playing ? Pause : Play;
  const showCurrent = v.playing || v.current > 0;
  return (
    <View
      className="flex-row items-center bg-surface"
      style={{ gap: 12, borderRadius: T.radius.media, paddingVertical: 10, paddingLeft: 10, paddingRight: 16 }}
    >
      <Pressable
        onPress={() => void v.toggle()}
        hitSlop={4}
        accessibilityLabel={v.playing ? 'Pause recording' : 'Play recording'}
        className="items-center justify-center bg-ink"
        style={{ width: 40, height: 40, borderRadius: 20 }}
      >
        <Icon size={17} color={T.color.onInk} fill={T.color.onInk} style={{ marginLeft: v.playing ? 0 : 2 }} />
      </Pressable>
      <Waveform
        bars={34}
        height={30}
        gap={2}
        progress={v.progress}
        base={T.primitive.grey3}
        played={T.color.ink}
        onScrub={v.setScrub}
        onSeek={v.seekTo}
      />
      <Text className="text-footnote text-secondary" style={{ fontVariant: ['tabular-nums'] }}>
        {mmss(showCurrent ? v.current : v.duration)}
      </Text>
    </View>
  );
}

/** Voice-only thought: big play, draggable waveform, times. Lives on the dark card. */
export function VoiceHero({ uri, durationMillis }: { uri: string; durationMillis: number | null }) {
  const v = useVoice(uri, durationMillis);
  const Icon = v.playing ? Pause : Play;
  const white = T.primitive.white;
  return (
    <View>
      <View className="flex-row items-center" style={{ gap: 14, paddingHorizontal: 6 }}>
        <Pressable
          onPress={() => void v.toggle()}
          accessibilityLabel={v.playing ? 'Pause recording' : 'Play recording'}
          className="items-center justify-center bg-surface"
          style={{ width: 56, height: 56, borderRadius: 28 }}
        >
          <Icon size={24} color={T.color.ink} fill={T.color.ink} style={{ marginLeft: v.playing ? 0 : 3 }} />
        </Pressable>
        <Waveform
          bars={36}
          height={84}
          gap={2.5}
          progress={v.progress}
          base={alpha(white, 0.32)}
          played={white}
          onScrub={v.setScrub}
          onSeek={v.seekTo}
        />
      </View>
      <View className="flex-row justify-between" style={{ marginTop: -4, marginBottom: 4, marginLeft: 76, marginRight: 6 }}>
        <Text className="text-footnote" style={{ color: alpha(white, 0.75), fontVariant: ['tabular-nums'] }}>
          {mmss(v.progress * v.duration)}
        </Text>
        <Text className="text-footnote" style={{ color: alpha(white, 0.75), fontVariant: ['tabular-nums'] }}>
          {mmss(v.duration)}
        </Text>
      </View>
    </View>
  );
}
