import { useAudioRecorderState, type AudioRecorder } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { formatClock } from "./voiceFiles";

export type VoicePhase = "hold" | "drag" | "locking" | "locked";

const tokens = require("../../theme/tokens");

const barWidth = 5;
const barGap = 3;
const waveHeight = 68;
const maxBar = 62;
const minBar = 6;
// The newest few slots stay faint, like the mock: room for what comes next.
const pendingBars = 5;

const caps = {
  fontSize: 11,
  lineHeight: 13,
  fontWeight: "600" as const,
  letterSpacing: 0.7,
  textTransform: "uppercase" as const,
};

type Props = {
  recorder: AudioRecorder;
  phase: VoicePhase;
  transcript: string;
  listening: boolean;
  /** Written here (0–1) so the mic halo can pulse with the voice. */
  levelSV: SharedValue<number>;
};

/** RECORDING dot, timer, hint, live waveform and the live transcript. */
export default function VoicePanel({
  recorder,
  phase,
  transcript,
  listening,
  levelSV,
}: Props) {
  const state = useAudioRecorderState(recorder, 100);
  const [width, setWidth] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const tick = useRef(0);
  const hasMetering = typeof state.metering === "number";

  useEffect(() => {
    if (!state.isRecording) return;
    tick.current += 1;
    // Metering is dBFS (about -60 quiet to 0 loud). Without it, draw a calm
    // moving wave so the screen still shows that it is listening.
    const level = hasMetering
      ? Math.max(0, Math.min(1, ((state.metering ?? -60) + 55) / 50))
      : 0.25 +
        0.2 * Math.sin(tick.current / 2.2) +
        0.15 * Math.sin(tick.current / 0.9);
    levelSV.value = level;
    setLevels((current) => [...current.slice(-120), level]);
  }, [state.durationMillis, state.metering, state.isRecording]);

  useEffect(
    () => () => {
      levelSV.value = 0;
    },
    [],
  );

  const slots =
    width > 0 ? Math.floor((width + barGap) / (barWidth + barGap)) : 0;
  const live = Math.max(0, slots - pendingBars);
  const shown = levels.slice(-live);
  const padded = [
    ...Array.from({ length: Math.max(0, live - shown.length) }, () => -1),
    ...shown,
  ];

  const hint =
    phase === "locked" ? (
      <>
        <Text style={{ color: tokens.color.ink }}>Locked</Text> · Tap to save
      </>
    ) : phase === "locking" ? (
      <Text style={{ color: tokens.color.ink }}>Locked</Text>
    ) : phase === "drag" ? (
      "Drag out to the ring to lock"
    ) : (
      "Release to save · Drag out to lock"
    );

  // Dictation's newest words are still settling: show them in grey.
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const settled = listening ? words.slice(0, -3) : words;
  const settling = listening ? words.slice(-3) : [];
  const tail = settled.length > 28 ? ["…", ...settled.slice(-28)] : settled;

  return (
    <View>
      <View className="mt-4 flex-row items-center" style={{ gap: 8 }}>
        <View
          style={{
            width: 9,
            height: 9,
            borderRadius: 5,
            backgroundColor: tokens.color.danger,
          }}
        />
        <Text className="text-secondary" style={caps}>
          Recording
        </Text>
      </View>
      <Text
        className="text-ink"
        style={{
          marginTop: 2,
          fontSize: 34,
          lineHeight: 41,
          fontWeight: "700",
          letterSpacing: -0.6,
          fontVariant: ["tabular-nums"],
        }}
      >
        {formatClock(state.durationMillis)}
      </Text>
      <Text className="text-secondary" style={[caps, { marginTop: 2 }]}>
        {hint}
      </Text>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        className="flex-row items-center overflow-hidden"
        style={{ height: waveHeight, marginTop: 12, gap: barGap }}
      >
        {padded.map((level, index) => (
          <View
            key={index}
            className="bg-ink"
            style={{
              width: barWidth,
              borderRadius: 3,
              height: level < 0 ? minBar : minBar + level * (maxBar - minBar),
              opacity: level < 0 ? 0.25 : 1,
            }}
          />
        ))}
        {Array.from({ length: slots > live ? slots - live : 0 }, (_, index) => (
          <View
            key={"pending-" + index}
            className="bg-ink"
            style={{
              width: barWidth,
              height: minBar,
              borderRadius: 3,
              opacity: 0.25,
            }}
          />
        ))}
      </View>
      {words.length > 0 && (
        <Text
          className="text-body text-ink"
          style={{ marginTop: 10, lineHeight: 23 }}
          numberOfLines={4}
        >
          {tail.join(" ")}
          {settling.length > 0 && (
            <Text className="text-secondary">
              {settled.length ? " " : ""}
              {settling.join(" ")}
            </Text>
          )}
        </Text>
      )}
    </View>
  );
}
