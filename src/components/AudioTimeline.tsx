import { Pause, Play } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

const colors = {
  cream: "#FFFDF8",
  roast: "#242019",
  moss: "#74876A",
  persimmon: "#EF705A",
};

function formatTime(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export default function AudioTimeline({
  uri,
  fallbackDurationMillis,
  compact = false,
}: {
  uri: string;
  fallbackDurationMillis?: number;
  compact?: boolean;
}) {
  const player = useAudioPlayer(uri, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [trackWidth, setTrackWidth] = useState(0);
  const duration = status.duration || (fallbackDurationMillis ?? 0) / 1000;
  const progress =
    duration > 0 ? Math.min(1, status.currentTime / duration) : 0;
  useEffect(() => {
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  }, []);
  const togglePlayback = async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    // Expo's player remains at its duration after finishing. Rewind before the
    // next play so the compact timeline can be replayed as often as needed.
    if (duration > 0 && status.currentTime >= duration - 0.05) {
      await player.seekTo(0);
    }
    player.play();
  };
  const seek = (x: number) => {
    if (trackWidth > 0 && duration > 0)
      void player.seekTo(
        Math.max(0, Math.min(duration, (x / trackWidth) * duration)),
      );
  };

  return (
    <View
      className={
        "flex-row items-center gap-3 " +
        (compact ? "" : "rounded-2xl bg-unsorted-mist px-3 py-3")
      }
    >
      <Pressable
        onPress={() => void togglePlayback()}
        className={
          (compact ? "h-8 w-8" : "h-9 w-9 bg-unsorted-persimmon") +
          " items-center justify-center rounded-full"
        }
        hitSlop={8}
        accessibilityLabel={
          status.playing ? "Pause recording" : "Play recording"
        }
      >
        {status.playing ? (
          <Pause size={16} fill={colors.roast} color={colors.roast} />
        ) : (
          <Play size={16} fill={colors.roast} color={colors.roast} />
        )}
      </Pressable>
      <View className="flex-1">
        <Pressable
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          onPress={(event) => seek(event.nativeEvent.locationX)}
          className="h-7 justify-center"
          accessibilityLabel="Seek audio recording"
        >
          <View className="h-1.5 overflow-hidden rounded-full bg-[#D7D0C4]">
            <View
              className="h-full rounded-full bg-unsorted-moss"
              style={{ width: `${progress * 100}%` }}
            />
          </View>
        </Pressable>
        {!compact && (
          <View className="mt-1 flex-row justify-between">
            <Text className="text-[11px] text-unsorted-moss">
              {formatTime(status.currentTime)}
            </Text>
            <Text className="text-[11px] text-unsorted-moss">
              {formatTime(duration)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
