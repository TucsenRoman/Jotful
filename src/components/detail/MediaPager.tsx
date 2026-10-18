// Photos and videos inside the detail card: 250pt tall, 12pt corners, horizontal pager
// with page dots and a thin filmstrip when there are several. design/mocks/r8/detail .mediabox/.film.
import { Play, Video as VideoIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useEventListener } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as Haptics from 'expo-haptics';
import type { Attachment } from '../../storage';
import { T, alpha, mmss } from './detailUtils';

const HEIGHT = 250;
const black = T.primitive.ink;
const white = T.primitive.white;

function VideoSlide({ item, width, active }: { item: Attachment; width: number; active: boolean }) {
  const player = useVideoPlayer(item.uri, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
  });
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState((item.durationMillis ?? 0) / 1000);

  useEventListener(player, 'playingChange', ({ isPlaying }) => setPlaying(isPlaying));
  useEventListener(player, 'timeUpdate', ({ currentTime }) => setTime(currentTime));
  useEventListener(player, 'sourceLoad', ({ duration: d }) => d > 0 && setDuration(d));
  useEventListener(player, 'playToEnd', () => {
    player.currentTime = 0;
    setTime(0);
  });

  useEffect(() => {
    if (!active) player.pause();
  }, [active, player]);

  const toggle = () => {
    void Haptics.selectionAsync();
    if (playing) player.pause();
    else player.play();
  };
  const progress = duration > 0 ? Math.min(1, time / duration) : 0;

  return (
    <Pressable onPress={toggle} style={{ width, height: HEIGHT }} accessibilityLabel={playing ? 'Pause video' : 'Play video'}>
      <VideoView player={player} nativeControls={false} contentFit="cover" style={{ width, height: HEIGHT }} pointerEvents="none" />
      {!playing && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, overflow: 'hidden' }}>
            <BlurView intensity={30} tint="light" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(white, 0.25) }}>
              <Play size={26} color={white} fill={white} style={{ marginLeft: 3 }} />
            </BlurView>
          </View>
        </View>
      )}
      <View
        pointerEvents="none"
        className="flex-row items-center"
        style={{ position: 'absolute', top: 14, right: 14, height: 24, paddingHorizontal: 9, borderRadius: 12, gap: 4, backgroundColor: alpha(black, 0.45) }}
      >
        <VideoIcon size={13} color={white} strokeWidth={2.4} />
        <Text className="text-footnote font-semibold" style={{ color: white, fontVariant: ['tabular-nums'] }}>
          {mmss(playing || time > 0 ? Math.max(0, duration - time) : duration)}
        </Text>
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: alpha(white, 0.3) }}>
        <View style={{ width: `${progress * 100}%`, height: 3, backgroundColor: white }} />
      </View>
    </Pressable>
  );
}

export default function MediaPager({ items }: { items: Attachment[] }) {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const many = items.length > 1;

  const goTo = (i: number) => {
    setPage(i);
    scroller.current?.scrollTo({ x: i * width, animated: true });
  };

  return (
    <View style={{ gap: 8 }}>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: HEIGHT, borderRadius: T.radius.media, overflow: 'hidden', backgroundColor: T.color.voiceCard }}
      >
        {width > 0 && (
          <ScrollView
            ref={scroller}
            horizontal
            pagingEnabled
            scrollEnabled={many}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              if (i !== page) void Haptics.selectionAsync();
              setPage(i);
            }}
          >
            {items.map((item, i) =>
              item.kind === 'video' ? (
                <VideoSlide key={item.id + ':' + i} item={item} width={width} active={i === page} />
              ) : (
                <Image key={item.id + ':' + i} source={{ uri: item.uri }} resizeMode="cover" style={{ width, height: HEIGHT }} accessibilityLabel="Photo" />
              ),
            )}
          </ScrollView>
        )}
        {many && (
          <View
            pointerEvents="none"
            className="flex-row"
            style={{ position: 'absolute', right: 10, bottom: 10, gap: 6, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 10, backgroundColor: alpha(black, 0.28) }}
          >
            {items.map((_, i) => (
              <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === page ? white : alpha(white, 0.5) }} />
            ))}
          </View>
        )}
      </View>
      {many && (
        <View className="flex-row items-center justify-center" style={{ gap: 2 }}>
          {items.map((item, i) => {
            const cur = i === page;
            return (
              <Pressable
                key={item.id + ':' + i}
                onPress={() => goTo(i)}
                accessibilityLabel={`Show item ${i + 1}`}
                style={{ width: cur ? 48 : 22, height: 32, marginHorizontal: cur ? 5 : 0, borderRadius: 2, overflow: 'hidden', backgroundColor: T.color.voiceCard }}
              >
                {item.kind === 'image' ? (
                  <Image source={{ uri: item.uri }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Play size={10} color={white} fill={white} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
