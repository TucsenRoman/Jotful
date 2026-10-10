import { BlurView } from "expo-blur";
import { Directory, File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library/legacy";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Camera as ExpoCamera, CameraView } from "expo-camera";
import {
  AudioLines,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  Image,
  Mic,
  ImagePlus,
  Pencil,
  RotateCw,
  Square,
  Video,
  X,
} from "lucide-react-native";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  Image as NativeImage,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  clearCaptureDraft,
  saveCaptureDraft,
  type AttachmentKind,
} from "../storage";
import AudioTimeline from "./AudioTimeline";

const collapsedHeight = 100;
const collapsedActionSize = Math.min(64, Math.max(36, collapsedHeight - 30));
const transitionDuration = 300;
// The capture controls need about 200px; the remaining height is supplied only by
// the keyboard and the device safe area. This keeps the sheet compact by default.
const expandedBaseHeight = 224;
const colors = { canvas: "#FAF8F3", cream: "#FFFDF8", roast: "#242019", moss: "#74876A", quiet: "#9B9187" };

export type CaptureSheetHandle = {
  open: (mode?: "write" | "voice" | "media" | "media-choice") => void;
  close: () => void;
};

type Props = {
  prompt: string;
  draft: string;
  previewCount: number;
  listening: boolean;
  onDraftChange: (text: string) => void;
  onRichTextChange: (html: string) => void;
  onToggleVoice: () => void;
  onStopVoice: () => void;
  onSave: () => void;
  onClear: () => void;
  onCollapseHaptic: () => void;
  onOpenHaptic: () => void;
  onExpandedChange: (expanded: boolean) => void;
  onAttachments: (
    attachments: Array<{
      kind: AttachmentKind;
      uri: string;
      durationMillis?: number;
    }>,
    caption?: string,
  ) => void;
};

type PendingAttachment = {
  kind: AttachmentKind;
  uri: string;
  durationMillis?: number;
};

const CaptureSheet = forwardRef<CaptureSheetHandle, Props>(
  function CaptureSheet(
    {
      prompt,
      draft,
      previewCount,
      listening,
      onDraftChange,
      onRichTextChange,
      onToggleVoice,
      onStopVoice,
      onSave,
      onClear,
      onCollapseHaptic,
      onOpenHaptic,
      onExpandedChange,
      onAttachments,
    },
    ref,
  ) {
    const insets = useSafeAreaInsets();
    const { height: viewportHeight, width: viewportWidth } =
      useWindowDimensions();
    const inputRef = useRef<TextInput>(null);
    const focusRichEditor = () => {
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    const pendingCollapse = useRef(false);
    // CaptureSheet stays mounted while collapsed, so the write input also stays
    // in the native view hierarchy. Keep its focus lifecycle separate from the
    // current mode so mounting the sheet cannot summon the keyboard.
    const [isExpanded, setIsExpanded] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [activeMode, setActiveMode] = useState<
      | "write"
      | "voice"
      | "media"
      // Retained only to safely render an in-flight sheet from pre-cleanup
      // state; no route or control can enter this legacy mode anymore.
      | "audio"
      | "media-choice"
      | "camera"
      | "library"
    >("write");
    const [composerMode, setComposerMode] = useState<
      "text" | "audio" | "attachment"
    >("text");
    const [pendingAttachment, setPendingAttachment] =
      useState<PendingAttachment | null>(null);
    const [pendingImages, setPendingImages] = useState<PendingAttachment[]>([]);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(
      null,
    );
    const [showMediaOptions, setShowMediaOptions] = useState(false);
    const [audioDockOpen, setAudioDockOpen] = useState(false);
    const [cameraMode, setCameraMode] = useState<"photo" | "video">("photo");
    const [cameraFacing, setCameraFacing] = useState<"back" | "front">("back");
    const [cameraReady, setCameraReady] = useState(false);
    const [recordingVideo, setRecordingVideo] = useState(false);
    const [libraryAssets, setLibraryAssets] = useState<MediaLibrary.Asset[]>(
      [],
    );
    const [selectedLibraryAssets, setSelectedLibraryAssets] = useState<
      MediaLibrary.Asset[]
    >([]);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const recordingShape = useSharedValue(0);
    // 0 is open and 1 is collapsed. The sheet never unmounts or changes its view tree.
    const progress = useSharedValue(1);
    const keyboard = useAnimatedKeyboard();
    const recorder = useAudioRecorder({
      ...RecordingPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    });
    const recorderState = useAudioRecorderState(recorder, 100);
    const audioLevel = Math.max(
      0,
      Math.min(1, ((recorderState.metering ?? -60) + 60) / 60),
    );
    const selectedPreviewAttachment =
      pendingImages.find((attachment) => attachment.uri === selectedImageUri) ??
      pendingImages[0];

    useEffect(() => {
      const attachments = pendingImages.length
        ? pendingImages
        : pendingAttachment
          ? [pendingAttachment]
          : [];
      saveCaptureDraft(draft, attachments);
    }, [draft, pendingAttachment, pendingImages]);
    const composerStageHeight = keyboardHeight
      ? Math.min(
          viewportWidth - 40,
          Math.max(
            160,
            viewportHeight - keyboardHeight - insets.top - insets.bottom - 164,
          ),
        )
      : viewportWidth - 40;
    // Keep the resting composer as compact as the camera sheet. The extra room
    // is reserved for active input, rather than left as an empty panel.
    const expandedHeight = Math.max(expandedBaseHeight, viewportHeight * 0.62);
    const restingSheetHeight = Math.min(
      viewportHeight - insets.top - 12,
      expandedHeight + insets.bottom,
    );

    const sheetStyle = useAnimatedStyle(() => {
      // The thought composer is the primary surface, not a temporary popover.
      // Give it enough quiet space for a thought while keeping the capture tools
      // anchored together in the familiar message-composer position.
      // The sheet stays docked to the bottom. When the translucent keyboard is
      // present, extend its surface upward and inset its content above the keys
      // instead of translating the entire sheet toward the keyboard.
      const sheetHeight = Math.min(
        viewportHeight - insets.top - 12,
        restingSheetHeight + keyboard.height.value,
      );
      const collapsedOffset = sheetHeight - (collapsedHeight + insets.bottom);
      return {
        height: sheetHeight,
        transform: [{ translateY: progress.value * collapsedOffset }],
      };
    }, [viewportHeight, insets.top, insets.bottom, activeMode]);
    const collapsedStyle = useAnimatedStyle(
      () => ({ opacity: progress.value }),
      [],
    );
    const expandedStyle = useAnimatedStyle(
      () => ({ opacity: 1 - progress.value }),
      [],
    );
    const sheetShadowStyle = useAnimatedStyle(
      () => ({
        // Keep a quiet edge on the compact composer so it remains distinct from
        // the feed behind it, even after the expanded shadow has eased away.
        shadowOpacity: 0.1 + (1 - progress.value) * 0.08,
        shadowRadius: 10 + (1 - progress.value) * 10,
        elevation: 8 + (1 - progress.value) * 6,
      }),
      [],
    );
    const recordingShapeStyle = useAnimatedStyle(
      () => ({
        width: 46 - recordingShape.value * 16,
        height: 46 - recordingShape.value * 16,
        borderRadius: 23 - recordingShape.value * 15,
      }),
      [],
    );

    const animate = (to: 0 | 1, onDone?: () => void) => {
      setIsExpanded(to === 0);
      if (to === 0) onExpandedChange(true);
      // Release the inbox controls immediately. Waiting until the animation
      // finishes leaves an invisible backdrop that eats the first tap.
      if (to === 1) onExpandedChange(false);
      progress.value = withTiming(
        to,
        { duration: transitionDuration, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (!finished) return;
          if (onDone) runOnJS(onDone)();
        },
      );
    };

    const beginVoice = () => onToggleVoice();

    const updateDraft = (text: string) => onDraftChange(text);

    const collapseAfterKeyboard = () => {
      pendingCollapse.current = false;
      animate(1);
    };

    const open = (
      mode: "write" | "voice" | "media" | "media-choice" = "write",
    ) => {
      // Focus at the same moment the sheet rises so the iOS keyboard and sheet
      // animate as one movement instead of two consecutive animations.
      setActiveMode(mode);
      if (mode === "voice") beginVoice();
      else if (mode === "write") {
        setComposerMode(pendingAttachment ? "attachment" : "text");
        focusRichEditor();
      }
      animate(0);
    };

    // `open()` can run before the native editor mounts. Repeating the focus
    // after the composer commits makes opening and tapping into it reliable.
    useEffect(() => {
      if (!isExpanded || activeMode !== "write" || composerMode !== "text")
        return;
      focusRichEditor();
    }, [activeMode, composerMode, isExpanded]);

    const reviewAttachment = (attachment: PendingAttachment) => {
      if (attachment.kind === "image" || attachment.kind === "video") {
        if (pendingImages.some((image) => image.uri === attachment.uri)) {
          setSelectedImageUri(attachment.uri);
          setComposerMode("text");
          setActiveMode("write");
          return;
        }
        setPendingImages((images) => [...images, attachment]);
        setSelectedImageUri(attachment.uri);
        setComposerMode("text");
      } else if (attachment.kind === "audio") {
        setComposerMode("text");
      }
      setPendingAttachment(attachment);
      // A capture joins the same composer as text instead of opening another
      // review screen. The existing draft becomes its optional label.
      setActiveMode("write");
      animate(0);
    };

    const saveAttachment = () => {
      const attachments =
        pendingImages.length > 0
          ? pendingImages
          : pendingAttachment
            ? [pendingAttachment]
            : [];
      if (attachments.length === 0) return;
      onAttachments(attachments, draft.trim() || undefined);
      clearCaptureDraft();
      setPendingAttachment(null);
      setPendingImages([]);
      setSelectedImageUri(null);
      setAudioDockOpen(false);
      setComposerMode("text");
    };

    const discardAttachment = () => {
      setPendingAttachment(null);
      setPendingImages([]);
      setSelectedImageUri(null);
      setAudioDockOpen(false);
      setActiveMode("write");
      setComposerMode("text");
    };

    const removePendingImage = (uri: string) => {
      const remaining = pendingImages.filter((image) => image.uri !== uri);
      setPendingImages(remaining);
      setSelectedImageUri(remaining[remaining.length - 1]?.uri ?? null);
      if (remaining.length === 0) {
        setPendingAttachment(null);
        setComposerMode("text");
      } else {
        setPendingAttachment(remaining[remaining.length - 1]);
      }
    };

    const confirmRemoveSelectedImage = () => {
      const uri = selectedImageUri ?? pendingImages[0]?.uri;
      if (!uri) return;
      Alert.alert(
        "Remove image?",
        "This image will be removed from this thought.",
        [
          { text: "Keep", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => removePendingImage(uri),
          },
        ],
      );
    };

    const saveComposer = () => {
      if (pendingAttachment) saveAttachment();
      else onSave();
    };

    const toggleAudioDock = async () => {
      if (!audioDockOpen) {
        setAudioDockOpen(true);
        if (!(await startAudioRecording())) setAudioDockOpen(false);
        return;
      }
      if (recorderState.isRecording) {
        await finishAudioRecording();
        return;
      }
      setPendingAttachment(null);
      if (!(await startAudioRecording())) setAudioDockOpen(false);
    };

    const discardAudioDock = () => {
      setPendingAttachment(null);
      setAudioDockOpen(false);
    };

    const close = () => {
      // The first pull-down is a predictable keyboard dismissal. A second one
      // collapses the composer, so the two iOS transitions never compete.
      if (keyboardVisible) {
        inputRef.current?.blur();
        Keyboard.dismiss();
        setKeyboardVisible(false);
        return;
      }
      if (listening) onStopVoice();
      onCollapseHaptic();
      pendingCollapse.current = false;
      inputRef.current?.blur();
      animate(1);
    };

    const pickMedia = async (source: "library" | "camera" | "video") => {
      inputRef.current?.blur();
      Keyboard.dismiss();
      setKeyboardVisible(false);
      setShowMediaOptions(false);
      if (source === "library") {
        setLibraryLoading(true);
        const permission = await MediaLibrary.requestPermissionsAsync(false);
        if (!permission.granted) {
          setLibraryLoading(false);
          Alert.alert(
            "Photo access is needed",
            "Allow Jotful to browse the photos and videos you choose from.",
          );
          return;
        }
        setActiveMode("library");
        const page = await MediaLibrary.getAssetsAsync({
          first: 24,
          mediaType: [
            MediaLibrary.MediaType.photo,
            MediaLibrary.MediaType.video,
          ],
          sortBy: [MediaLibrary.SortBy.creationTime],
        });
        const displayAssets = await Promise.all(
          page.assets.map(async (asset) => {
            const info = await MediaLibrary.getAssetInfoAsync(asset);
            return { ...asset, uri: info.localUri ?? asset.uri };
          }),
        );
        setLibraryAssets(displayAssets);
        setSelectedLibraryAssets([]);
        setLibraryLoading(false);
        return;
      }
      const permission = await ExpoCamera.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Camera access is needed",
          "Allow camera access to capture it in Jotful.",
        );
        return;
      }
      setCameraMode(source === "video" ? "video" : "photo");
      setCameraReady(false);
      setActiveMode("camera");
    };

    const toggleLibraryAsset = (asset: MediaLibrary.Asset) => {
      setSelectedLibraryAssets((assets) =>
        assets.some((selected) => selected.id === asset.id)
          ? assets.filter((selected) => selected.id !== asset.id)
          : [...assets, asset],
      );
    };

    const addSelectedLibraryAssets = () => {
      const selectedMedia = selectedLibraryAssets;
      if (selectedMedia.length === 0) return;
      setPendingImages((images) => {
        const additions = selectedMedia
          .filter((asset) => !images.some((image) => image.uri === asset.uri))
          .map((asset) => ({
            kind:
              asset.mediaType === MediaLibrary.MediaType.video
                ? ("video" as const)
                : ("image" as const),
            uri: asset.uri,
            durationMillis: asset.duration ?? undefined,
          }));
        return [...images, ...additions];
      });
      const last = selectedMedia[selectedMedia.length - 1];
      setPendingAttachment({
        kind:
          last.mediaType === MediaLibrary.MediaType.video ? "video" : "image",
        uri: last.uri,
        durationMillis: last.duration ?? undefined,
      });
      setSelectedImageUri(last.uri);
      setSelectedLibraryAssets([]);
      setComposerMode("text");
      setActiveMode("write");
    };

    const captureFromCamera = async () => {
      if (!cameraRef.current || !cameraReady) return;
      if (cameraMode === "photo") {
        const image = await cameraRef.current.takePictureAsync({
          quality: 0.85,
        });
        reviewAttachment({ kind: "image", uri: image.uri });
        return;
      }
      if (recordingVideo) {
        cameraRef.current.stopRecording();
        return;
      }
      setRecordingVideo(true);
      recordingShape.value = withTiming(1, { duration: transitionDuration });
      try {
        const video = await cameraRef.current.recordAsync({ maxDuration: 90 });
        if (video) reviewAttachment({ kind: "video", uri: video.uri });
      } finally {
        setRecordingVideo(false);
        recordingShape.value = withTiming(0, { duration: transitionDuration });
      }
    };

    const startAudioRecording = async () => {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone access is needed",
          "Allow microphone access to save a raw audio recording.",
        );
        return false;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      return true;
    };

    const finishAudioRecording = async () => {
      const durationMillis = recorderState.durationMillis;
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      if (!recorder.uri) return;
      try {
        // Recorder URIs live in iOS's cache and can disappear after a reload.
        // Copy the completed recording into durable app storage first.
        const source = new File(recorder.uri);
        const recordings = new Directory(Paths.document, "recordings");
        recordings.create({ idempotent: true, intermediates: true });
        const extension = source.extension || ".m4a";
        const destination = new File(
          recordings,
          `recording-${Date.now()}${extension}`,
        );
        await source.copy(destination);
        reviewAttachment({
          kind: "audio",
          uri: destination.uri,
          durationMillis,
        });
      } catch {
        Alert.alert(
          "Recording could not be saved",
          "Try recording again. Jotful did not save a broken audio note.",
        );
      }
    };

    const toggleAudioRecording = async () => {
      if (recorderState.isRecording) await finishAudioRecording();
      else await startAudioRecording();
    };

    useEffect(() => {
      const showEvent =
        Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
      const hideEvent =
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
      const show = Keyboard.addListener(showEvent, (event) => {
        setKeyboardVisible(event.endCoordinates.height > 0);
        setKeyboardHeight(event.endCoordinates.height);
      });
      const hide = Keyboard.addListener(hideEvent, () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
        if (pendingCollapse.current)
          requestAnimationFrame(collapseAfterKeyboard);
      });
      return () => {
        show.remove();
        hide.remove();
      };
    }, []);
    useImperativeHandle(
      ref,
      () => ({
        open,
        close,
      }),
      [keyboardVisible, listening, onCollapseHaptic, onStopVoice],
    );

    const needsDismissControl =
      keyboardVisible ||
      activeMode === "media" ||
      activeMode === "media-choice" ||
      activeMode === "camera" ||
      activeMode === "library";
    const isMediaCapture =
      activeMode === "camera" || activeMode === "library";

    return (
      <Animated.View
        className="bg-unsorted-cream"
        style={[
          {
            position: "absolute",
            zIndex: 20,
            elevation: 20,
            bottom: -insets.bottom,
            left: 0,
            right: 0,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            shadowColor: colors.roast,
            shadowOffset: { width: 0, height: -8 },
            paddingHorizontal: activeMode === "camera" ? 12 : 20,
            paddingTop: activeMode === "camera" ? 12 : 20,
            paddingBottom: keyboardVisible
              ? keyboardHeight + 8
              : insets.bottom + 20,
          },
          sheetStyle,
          sheetShadowStyle,
        ]}
        >
        <Animated.View
          pointerEvents="none"
          className="absolute left-5 right-5 top-0 h-px bg-unsorted-line"
          style={expandedStyle}
        />
        <Animated.View
          className="items-center justify-center"
          style={[
            {
              position: "absolute",
              top: 0,
              left: 20,
              right: 20,
              height: collapsedHeight,
            },
            collapsedStyle,
          ]}
        >
          <Pressable
            onPress={() => {
              onOpenHaptic();
              open("write");
            }}
            className="flex-1 flex-row items-center gap-16 px-1"
            hitSlop={12}
            accessibilityLabel="Open thought capture"
          >
            <View className="flex-1 items-center gap-4">
              <Text
                numberOfLines={collapsedHeight >= 86 ? 2 : 1}
                className="text-[19px] leading-[22px] text-unsorted-ink text-center"
                style={{ fontFamily: "Fraunces_600SemiBold" }}
              >
                {prompt}
              </Text>
              <Text
                className="mt-0.5 text-sm text-unsorted-quiet uppercase"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                Tap to capture
              </Text>
            </View>

            {/* <View className="items-center">
              <View
                className="flex flex-row gap-2 items-center justify-center rounded-full bg-unsorted-moss"
                style={{ width: collapsedActionSize, height: collapsedActionSize }}
              >
                <Pencil
                  size={Math.round(collapsedActionSize * 0.38)}
                  color={colors.cream}
                  strokeWidth={2.5}
                />
              </View>


            </View> */}
          </Pressable>
        </Animated.View>
        <Animated.View
          style={[expandedStyle, { flex: 1 }]}
          pointerEvents="auto"
        >
          {activeMode === "media-choice" ? (
            <View className="flex-1 justify-center">
              <Text
                className="text-center text-xl text-unsorted-ink"
                style={{ fontFamily: "Fraunces_600SemiBold" }}
              >
                Add media
              </Text>
              <Text
                className="mt-2 text-center leading-5 text-unsorted-moss"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                Choose where this photo or video comes from.
              </Text>
              <View className="mt-7 flex-row gap-2">
                <Pressable
                  onPress={() => void pickMedia("library")}
                  className="flex-1 items-center rounded-2xl border border-unsorted-line bg-unsorted-canvas px-2 py-4"
                >
                  <Image size={21} color={colors.roast} />
                  <Text
                    className="mt-2 text-center text-[13px] text-unsorted-ink"
                    style={{ fontFamily: "DMSans_700Bold" }}
                  >
                    Library
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void pickMedia("camera")}
                  className="flex-1 items-center rounded-2xl border border-unsorted-line bg-unsorted-canvas px-2 py-4"
                >
                  <Camera size={21} color={colors.roast} />
                  <Text
                    className="mt-2 text-center text-[13px] text-unsorted-ink"
                    style={{ fontFamily: "DMSans_700Bold" }}
                  >
                    Camera
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void pickMedia("video")}
                  className="flex-1 items-center rounded-2xl border border-unsorted-line bg-unsorted-canvas px-2 py-4"
                >
                  <Video size={21} color={colors.roast} />
                  <Text
                    className="mt-2 text-center text-[13px] text-unsorted-ink"
                    style={{ fontFamily: "DMSans_700Bold" }}
                  >
                    Video
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          {activeMode === "library" ? (
            <View className="flex-1">
              <View className="mb-3 flex-row items-center justify-between">
                <Text
                  className="text-xl text-unsorted-ink"
                  style={{ fontFamily: "Fraunces_600SemiBold" }}
                >
                  Library
                </Text>
                <Pressable
                  onPress={addSelectedLibraryAssets}
                  disabled={selectedLibraryAssets.length === 0}
                  className={
                    "rounded-full px-3 py-1.5 " +
                    (selectedLibraryAssets.length
                      ? "bg-unsorted-persimmon"
                      : "bg-unsorted-mist")
                  }
                >
                  <Text
                    className={
                      "text-[13px] " +
                      (selectedLibraryAssets.length
                        ? "text-unsorted-roast"
                        : "text-unsorted-moss")
                    }
                    style={{ fontFamily: "DMSans_700Bold" }}
                  >
                    {libraryLoading
                      ? "Loading"
                      : selectedLibraryAssets.length
                        ? "Add " + selectedLibraryAssets.length
                        : "Select"}
                  </Text>
                </Pressable>
              </View>
              <FlatList
                data={libraryAssets}
                keyExtractor={(asset) => asset.id}
                numColumns={3}
                contentContainerStyle={{ paddingBottom: 12 }}
                columnWrapperStyle={{ gap: 6, marginBottom: 6 }}
                renderItem={({ item }) => {
                  const selected = selectedLibraryAssets.some(
                    (asset) => asset.id === item.id,
                  );
                  return (
                    <Pressable
                      onPress={() => toggleLibraryAsset(item)}
                      style={{ flex: 1, aspectRatio: 1 }}
                      className={
                        "overflow-hidden rounded-none bg-unsorted-mist " +
                        (selected ? "border-2 border-unsorted-persimmon" : "")
                      }
                    >
                      {item.mediaType === MediaLibrary.MediaType.video ? (
                        <View className="h-full w-full items-center justify-center bg-unsorted-moss">
                          <Video size={24} color={colors.cream} />
                        </View>
                      ) : (
                        <NativeImage
                          source={{ uri: item.uri }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      )}
                      {item.mediaType === MediaLibrary.MediaType.video && (
                        <View className="absolute bottom-1.5 right-1.5 rounded-full bg-black/50 px-1.5 py-1">
                          <Video size={12} color={colors.cream} />
                        </View>
                      )}
                      {selected && (
                        <View className="absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-unsorted-persimmon">
                          <Check
                            size={14}
                            strokeWidth={3}
                            color={colors.roast}
                          />
                        </View>
                      )}
                    </Pressable>
                  );
                }}
              />
            </View>
          ) : null}
          {activeMode === "camera" ? (
            <View className="flex-1 overflow-hidden rounded-3xl bg-unsorted-roast">
              <CameraView
                ref={cameraRef}
                facing={cameraFacing}
                mode={cameraMode === "video" ? "video" : "picture"}
                onCameraReady={() => setCameraReady(true)}
                onMountError={(event) =>
                  Alert.alert("Camera unavailable", event.message)
                }
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                }}
              />
              <View className="absolute inset-x-0 bottom-0 flex-row items-center px-4 pb-5">
                <View className="flex-1 items-start">
                  <Pressable
                    onPress={() =>
                      setCameraMode(cameraMode === "photo" ? "video" : "photo")
                    }
                    className="flex-row items-center rounded-full bg-black/40 p-1"
                    hitSlop={10}
                    accessibilityLabel="Switch between photo and video"
                  >
                    <View
                      className={
                        "h-8 w-8 items-center justify-center rounded-full " +
                        (cameraMode === "photo" ? "bg-unsorted-cream" : "")
                      }
                    >
                      <Camera
                        size={16}
                        color={
                          cameraMode === "photo" ? colors.roast : colors.cream
                        }
                      />
                    </View>
                    <View
                      className={
                        "h-8 w-8 items-center justify-center rounded-full " +
                        (cameraMode === "video" ? "bg-unsorted-persimmon" : "")
                      }
                    >
                      <Video size={16} color={colors.cream} />
                    </View>
                  </Pressable>
                </View>
                <View className="flex-1 items-center">
                  <Pressable
                    onPress={() => void captureFromCamera()}
                    disabled={!cameraReady}
                    className={
                      "h-16 w-16 items-center justify-center rounded-full " +
                      "bg-unsorted-cream"
                    }
                  >
                    <Animated.View
                      className={
                        cameraMode === "video"
                          ? "bg-unsorted-persimmon"
                          : "bg-unsorted-roast"
                      }
                      style={recordingShapeStyle}
                    />
                  </Pressable>
                </View>
                <View className="flex-1 items-end">
                  <Pressable
                    onPress={() =>
                      setCameraFacing(
                        cameraFacing === "back" ? "front" : "back",
                      )
                    }
                    className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
                    hitSlop={10}
                    accessibilityLabel="Switch camera"
                  >
                    <RotateCw size={20} color={colors.cream} />
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}
          {activeMode === "write" || activeMode === "voice" ? (
            <View className="flex-1">
              <View className="flex-row items-start">
                <View
                  className="flex-1 rounded-3xl border border-unsorted-line bg-unsorted-canvas px-3 py-2"
                  style={{ height: composerStageHeight }}
                >
                  {composerMode === "text" && (
                    <>
                      <View className="flex-1" onTouchStart={focusRichEditor}>
                        <TextInput
                          ref={inputRef}
                          value={draft}
                          onChangeText={(text) => {
                            onDraftChange(text);
                            const escaped = text
                              .replace(/&/g, "&amp;")
                              .replace(/</g, "&lt;")
                              .replace(/>/g, "&gt;")
                              .replace(/\n/g, "<br>");
                            onRichTextChange(escaped ? `<p>${escaped}</p>` : "");
                          }}
                          placeholder="Write your thought…"
                          placeholderTextColor={colors.quiet}
                          autoCapitalize="sentences"
                          multiline
                          textAlignVertical="top"
                          style={{
                            flex: 1,
                            marginBottom: 108,
                            color: colors.roast,
                            fontFamily: "DMSans_400Regular",
                            fontSize: 17,
                            lineHeight: 26,
                          }}
                        />
                      </View>
                      <View className="absolute bottom-3 left-3 right-3 gap-2">
                        <View className="items-end">
                          <Pressable
                            onPress={onToggleVoice}
                            className={
                              "h-9 w-9 items-center justify-center rounded-full " +
                              (listening ? "bg-unsorted-blush" : "bg-unsorted-blush")
                            }
                            hitSlop={10}
                            accessibilityLabel={
                              listening
                                ? "Stop voice input"
                                : "Speak to add text"
                            }
                          >
                            {listening ? (
                              <Square
                                size={12}
                                fill={colors.roast}
                                color={colors.roast}
                              />
                            ) : (
                              <Mic size={16} color={colors.roast} />
                            )}
                          </Pressable>
                        </View>
                        <View className="mx-1 h-px bg-unsorted-line" />
                        <View className="flex-row items-center justify-between gap-2">
                          <View
                            className="relative"
                            style={{ zIndex: showMediaOptions ? 2 : undefined }}
                          >
                            {pendingImages.length > 0 ? (
                              <View className="h-9 w-[72px] flex-row items-center">
                                <Pressable
                                  onPress={() => setComposerMode("attachment")}
                                  className="h-8 w-[54px]"
                                  hitSlop={10}
                                  accessibilityLabel="Review attached photos"
                                >
                                  {pendingImages
                                    .slice(-3)
                                    .map((image, index) =>
                                      image.kind === "video" ? (
                                        <View
                                          key={image.uri}
                                          className="absolute h-8 w-8 items-center justify-center rounded-full border-2 border-unsorted-canvas bg-unsorted-moss"
                                          style={{
                                            left: index * 11,
                                            top: 0,
                                            zIndex: index,
                                          }}
                                        >
                                          <Video
                                            size={14}
                                            color={colors.cream}
                                          />
                                        </View>
                                      ) : (
                                        <NativeImage
                                          key={image.uri}
                                          source={{ uri: image.uri }}
                                          style={{
                                            position: "absolute",
                                            left: index * 11,
                                            top: 0,
                                            width: 32,
                                            height: 32,
                                            borderRadius: 16,
                                            borderWidth: 2,
                                            borderColor: colors.canvas,
                                            zIndex: index,
                                          }}
                                          resizeMode="cover"
                                        />
                                      ),
                                    )}
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    setShowMediaOptions((visible) => !visible)
                                  }
                                  className={
                                    "absolute right-1 top-0 h-9 w-9 items-center justify-center rounded-full border-2 border-unsorted-canvas " +
                                    (showMediaOptions
                                      ? "bg-unsorted-blush"
                                      : "bg-unsorted-mist")
                                  }
                                  hitSlop={10}
                                  accessibilityLabel="Add a photo or video"
                                >
                                  <ImagePlus size={18} color={colors.roast} />
                                </Pressable>
                              </View>
                            ) : (
                              <Pressable
                                onPress={() =>
                                  setShowMediaOptions((visible) => !visible)
                                }
                                className={
                                  "h-9 w-9 items-center justify-center rounded-full border-2 border-unsorted-canvas " +
                                  (showMediaOptions
                                    ? "bg-unsorted-blush"
                                    : "bg-unsorted-mist")
                                }
                                hitSlop={10}
                                accessibilityLabel="Add a photo or video"
                              >
                                <ImagePlus size={18} color={colors.roast} />
                              </Pressable>
                            )}
                            {showMediaOptions && (
                              <Animated.View
                                entering={FadeIn.duration(transitionDuration)}
                                exiting={FadeOut.duration(transitionDuration)}
                                className="absolute bottom-12 left-0 overflow-hidden rounded-2xl border border-unsorted-line bg-unsorted-canvas shadow-lg"
                                style={{ minWidth: 184 }}
                              >
                                <Pressable
                                  onPress={() => void pickMedia("camera")}
                                  className="flex-row items-center gap-2 px-3 py-3"
                                  hitSlop={10}
                                  accessibilityLabel="Open camera and video capture"
                                >
                                  <Camera size={17} color={colors.roast} />
                                  <Text
                                    className="text-[14px] text-unsorted-ink"
                                    style={{ fontFamily: "DMSans_700Bold" }}
                                  >
                                    Camera or video
                                  </Text>
                                </Pressable>
                                <View className="mx-3 h-px bg-unsorted-line" />
                                <Pressable
                                  onPress={() => void pickMedia("library")}
                                  className="flex-row items-center gap-2 px-3 py-3"
                                  hitSlop={10}
                                  accessibilityLabel="Open media library"
                                >
                                  <Image size={17} color={colors.roast} />
                                  <Text
                                    className="text-[14px] text-unsorted-ink"
                                    style={{ fontFamily: "DMSans_700Bold" }}
                                  >
                                    Photo library
                                  </Text>
                                </Pressable>
                              </Animated.View>
                            )}
                          </View>
                          {audioDockOpen ? (
                            <Animated.View
                              entering={FadeIn.duration(transitionDuration)}
                              className="h-9 w-[154px] flex-row items-center justify-between gap-2 rounded-full bg-unsorted-mist px-2"
                            >
                              {pendingAttachment?.kind === "audio" ? (
                                <View className="flex-1">
                                  <AudioTimeline
                                    compact
                                    uri={pendingAttachment.uri}
                                    fallbackDurationMillis={
                                      pendingAttachment.durationMillis
                                    }
                                  />
                                </View>
                              ) : (
                    <View className="flex-1 flex-row items-center justify-center gap-1">
                                  {[0.42, 0.78, 0.55, 1, 0.64, 0.86, 0.48, 0.7, 0.92, 0.58, 0.38].map(
                                    (multiplier, index) => (
                                      <View
                                        key={index}
                          className="w-1 rounded-full bg-unsorted-persimmon"
                                        style={{
                                          height:
                                            4 +
                                            Math.max(0.16, audioLevel) *
                                              20 *
                                              multiplier,
                                        }}
                                      />
                                    ),
                                  )}
                                </View>
                              )}
                              <Pressable
                                onPress={
                                  recorderState.isRecording
                                    ? () => void toggleAudioDock()
                                    : discardAudioDock
                                }
                                className="h-7 w-7 items-center justify-center rounded-full"
                                hitSlop={10}
                                accessibilityLabel={
                                  recorderState.isRecording
                                    ? "Stop recording"
                                    : "Discard recording"
                                }
                              >
                                {recorderState.isRecording ? (
                                  <Square
                                    size={12}
                                    fill={colors.roast}
                                    color={colors.roast}
                                  />
                                ) : (
                                  <X size={16} color={colors.roast} />
                                )}
                              </Pressable>
                            </Animated.View>
                          ) : (
                            <Pressable
                              onPress={() => void toggleAudioDock()}
                              className="h-9 w-9 items-center justify-center rounded-full bg-unsorted-mist"
                              hitSlop={10}
                              accessibilityLabel="Record raw audio"
                            >
                              <AudioLines size={18} color={colors.roast} />
                            </Pressable>
                          )}
                        </View>
                      </View>
                      {showMediaOptions && (
                        <Pressable
                          onPress={() => setShowMediaOptions(false)}
                          style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
                          accessibilityLabel="Close media options"
                        />
                      )}
                    </>
                  )}
                  {composerMode === "audio" && (
                    <Animated.View
                      entering={FadeIn.duration(transitionDuration)}
                      className="h-full justify-end"
                    >
                      <View className="rounded-2xl bg-unsorted-mist px-3 py-3">
                        <View className="flex-row items-center">
                          <View
                            className={
                              "h-10 w-10 items-center justify-center rounded-full " +
                              (recorderState.isRecording
                                ? "bg-unsorted-blush"
                                : "bg-unsorted-canvas")
                            }
                          >
                            <AudioLines size={19} color={colors.roast} />
                          </View>
                          <View className="ml-3 flex-1">
                            <Text
                              className="text-[15px] text-unsorted-ink"
                              style={{ fontFamily: "DMSans_700Bold" }}
                            >
                              {recorderState.isRecording
                                ? "Recording…"
                                : "Raw audio"}
                            </Text>
                            <Text
                              className="mt-2 text-[13px] text-unsorted-moss"
                              style={{ fontFamily: "DMSans_400Regular" }}
                            >
                              {recorderState.isRecording
                                ? Math.ceil(
                                    recorderState.durationMillis / 1000,
                                  ) + " seconds"
                                : "Keep this one as sound."}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => void toggleAudioRecording()}
                            className={
                              "rounded-full px-4 py-2 " +
                              (recorderState.isRecording
                                ? "bg-unsorted-roast"
                                : "bg-unsorted-persimmon")
                            }
                          >
                            <Text
                              className={
                                recorderState.isRecording
                                  ? "text-unsorted-cream"
                                  : "text-unsorted-roast"
                              }
                              style={{ fontFamily: "DMSans_700Bold" }}
                            >
                              {recorderState.isRecording ? "Stop" : "Start"}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </Animated.View>
                  )}
                  {composerMode === "attachment" &&
                    (pendingImages.length > 0 || pendingAttachment) && (
                      <Animated.View
                        entering={FadeIn.duration(transitionDuration)}
                        className="h-full"
                      >
                        {pendingImages.length > 0 ? (
                          <View className="h-full overflow-hidden">
                            {selectedPreviewAttachment?.kind === "video" ? (
                              <View className="h-full w-full items-center justify-center bg-unsorted-moss px-8">
                                <View className="h-14 w-14 items-center justify-center rounded-full bg-black/20">
                                  <Video size={26} color={colors.cream} />
                                </View>
                                <Text
                                  className="mt-4 text-center text-[16px] text-unsorted-cream"
                                  style={{ fontFamily: "DMSans_700Bold" }}
                                >
                                  Video ready to save
                                </Text>
                                <Text
                                  className="mt-1 text-center text-[13px] text-unsorted-cream"
                                  style={{ fontFamily: "DMSans_400Regular", opacity: 0.78 }}
                                >
                                  It will be attached to this thought.
                                </Text>
                              </View>
                            ) : selectedPreviewAttachment ? (
                              <NativeImage
                                source={{
                                  uri: selectedPreviewAttachment.uri,
                                }}
                                style={{ width: "100%", height: "100%" }}
                                resizeMode="contain"
                              />
                            ) : null}
                            <View className="absolute left-3 right-3 top-3 flex-row items-center justify-between gap-3">
                              <Pressable
                                onPress={() => setComposerMode("text")}
                                className="h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-black/20"
                                hitSlop={10}
                                accessibilityLabel="Return to text"
                              >
                                <BlurView
                                  intensity={24}
                                  tint="dark"
                                  className="absolute inset-0"
                                />
                                <ChevronLeft size={22} color={colors.cream} />
                              </Pressable>
                            </View>
                            <ScrollView
                              showsVerticalScrollIndicator={false}
                              className="absolute bottom-3 right-3 top-3"
                              contentContainerStyle={{
                                gap: 8,
                                paddingBottom: 4,
                              }}
                            >
                              {pendingImages.map((image) => (
                                <Pressable
                                  key={image.uri}
                                  onPress={() => setSelectedImageUri(image.uri)}
                                  className={
                                    "h-12 w-12 overflow-hidden rounded-xl border-2 " +
                                    ((selectedImageUri ??
                                      pendingImages[0]?.uri) === image.uri
                                      ? "border-unsorted-persimmon"
                                      : "border-transparent")
                                  }
                                >
                                  {image.kind === "video" ? (
                                    <View className="h-full w-full items-center justify-center bg-unsorted-moss">
                                      <Video size={20} color={colors.cream} />
                                    </View>
                                  ) : (
                                    <NativeImage
                                      source={{ uri: image.uri }}
                                      style={{ width: "100%", height: "100%" }}
                                      resizeMode="cover"
                                    />
                                  )}
                                </Pressable>
                              ))}
                            </ScrollView>
                          </View>
                        ) : (
                          <View className="flex-row items-center">
                            <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-unsorted-mist">
                              {pendingAttachment?.kind === "audio" ? (
                                <AudioLines size={21} color={colors.roast} />
                              ) : (
                                <Video size={21} color={colors.roast} />
                              )}
                            </View>
                            <Text
                              className="ml-3 flex-1 text-[14px] text-unsorted-ink"
                              style={{ fontFamily: "DMSans_700Bold" }}
                            >
                              {pendingAttachment?.kind === "audio"
                                ? "Audio attached"
                                : "Video attached"}
                            </Text>
                            <Pressable
                              onPress={discardAttachment}
                              className="h-8 w-8 items-center justify-center rounded-full bg-unsorted-mist"
                              hitSlop={10}
                              accessibilityLabel="Remove attachment"
                            >
                              <X size={16} color={colors.roast} />
                            </Pressable>
                          </View>
                        )}
                        {pendingImages.length === 0 && (
                          <TextInput
                            ref={inputRef}
                            value={draft}
                            onChangeText={onDraftChange}
                            placeholder="Add a label (optional)…"
                            placeholderTextColor={colors.moss}
                            multiline
                            scrollEnabled
                            className="mt-2 flex-1 px-2 py-1 text-[16px] leading-6 text-unsorted-ink"
                            style={{
                              fontFamily: "DMSans_400Regular",
                              textAlignVertical: "top",
                            }}
                          />
                        )}
                      </Animated.View>
                    )}
                </View>
              </View>
              {composerMode !== "audio" && (
                <View className="mt-3 items-center">
                  {composerMode === "attachment" && pendingImages.length > 0 ? (
                    <Pressable
                      onPress={confirmRemoveSelectedImage}
                      className="rounded-full bg-unsorted-blush px-6 py-3"
                      hitSlop={10}
                      accessibilityLabel="Remove selected image"
                    >
                      <Text
                        className="text-[14px] text-unsorted-roast"
                        style={{ fontFamily: "DMSans_700Bold" }}
                      >
                        Remove image
                      </Text>
                    </Pressable>
                  ) : (
                    <>
                      <Pressable
                        onPress={saveComposer}
                        disabled={
                          (!pendingAttachment && previewCount === 0) ||
                          listening
                        }
                        className={
                          "items-center overflow-hidden rounded-full px-6 py-3 " +
                          (listening
                            ? "bg-unsorted-blush"
                            : pendingAttachment || previewCount
                              ? "bg-unsorted-persimmon"
                              : "bg-unsorted-mist")
                        }
                        style={{
                          opacity:
                            listening || pendingAttachment || previewCount
                              ? 1
                              : 0.52,
                        }}
                        accessibilityLabel="Save thought"
                      >
                        {!listening &&
                          (pendingAttachment || previewCount > 0) && (
                          <Svg
                            style={StyleSheet.absoluteFill}
                            pointerEvents="none"
                            viewBox="0 0 240 48"
                            preserveAspectRatio="none"
                          >
                            <Defs>
                              <LinearGradient
                                id="capture-save-gradient-diagonal-v2"
                                gradientUnits="userSpaceOnUse"
                                x1="0"
                                y1="0"
                                x2="240"
                                y2="48"
                              >
                                <Stop offset="0" stopColor="#E89A89" />
                                <Stop offset="0.3" stopColor="#C5A096" />
                                <Stop offset="0.58" stopColor="#9CAA94" />
                                <Stop offset="0.82" stopColor="#899985" />
                                <Stop offset="1" stopColor="#74876A" />
                              </LinearGradient>
                            </Defs>
                            <Rect
                              width="100%"
                              height="100%"
                              fill="url(#capture-save-gradient-diagonal-v2)"
                            />
                          </Svg>
                        )}
                        {listening ? (
                          <Text
                            className="text-[14px] text-unsorted-roast"
                            style={{ fontFamily: "DMSans_700Bold" }}
                          >
                            Listening
                          </Text>
                        ) : (
                          <Text
                            className={
                              "text-[14px] " +
                              (pendingAttachment || previewCount
                                ? "text-unsorted-cream"
                                : "text-unsorted-quiet")
                            }
                            style={{ fontFamily: "DMSans_700Bold" }}
                          >
                            Save thought
                          </Text>
                        )}
                      </Pressable>
                      {draft.trim().length > 0 && !listening && (
                        <Animated.View
                          entering={FadeIn.duration(transitionDuration)}
                          exiting={FadeOut.duration(transitionDuration)}
                        >
                          <Pressable
                            onPress={onClear}
                            className="mt-2 border-b border-unsorted-quiet pb-0.5"
                            hitSlop={10}
                            accessibilityLabel="Clear thought"
                          >
                            <Text
                              className="text-[13px] text-unsorted-quiet"
                              style={{ fontFamily: "DMSans_500Medium" }}
                            >
                              Clear thought
                            </Text>
                          </Pressable>
                        </Animated.View>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          ) : null}
          {activeMode === "audio" ? (
            <View className="flex-1 items-center justify-center px-8">
              <View
                className={
                  "h-16 w-16 items-center justify-center rounded-full " +
                  (recorderState.isRecording
                    ? "bg-unsorted-blush"
                    : "bg-unsorted-mist")
                }
              >
                <AudioLines size={28} color={colors.roast} />
              </View>
              <Text
                className="mt-5 text-center text-xl text-unsorted-ink"
                style={{ fontFamily: "Fraunces_600SemiBold" }}
              >
                {recorderState.isRecording
                  ? "Recording…"
                  : "Raw audio recording"}
              </Text>
              <Text
                className="mt-2 text-center leading-5 text-unsorted-moss"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                {recorderState.isRecording
                  ? Math.ceil(recorderState.durationMillis / 1000) + " seconds"
                  : "A recording you keep as audio, rather than turn into text."}
              </Text>
              <Pressable
                onPress={() => void toggleAudioRecording()}
                className={
                  "mt-7 rounded-full px-6 py-3 " +
                  (recorderState.isRecording
                    ? "bg-unsorted-roast"
                    : "bg-unsorted-persimmon")
                }
              >
                <Text
                  className={
                    recorderState.isRecording
                      ? "text-unsorted-cream"
                      : "text-unsorted-roast"
                  }
                  style={{ fontFamily: "DMSans_700Bold" }}
                >
                  {recorderState.isRecording
                    ? "Stop & save"
                    : "Start recording"}
                </Text>
              </Pressable>
            </View>
          ) : null}
          {needsDismissControl ? (
            <View
              className="mt-4 items-center"
              style={
                keyboardVisible
                  ? {
                      position: "absolute",
                      bottom: 44,
                      left: 0,
                      right: 0,
                      zIndex: 3,
                    }
                  : undefined
              }
            >
            <Pressable
              onPress={
                isMediaCapture
                  ? () => {
                      setActiveMode("write");
                      setComposerMode("text");
                    }
                  : close
              }
              className="h-8 w-14 items-center justify-center overflow-hidden rounded-full"
              style={{ backgroundColor: "rgba(36, 32, 25, 0.6)" }}
              hitSlop={12}
              accessibilityLabel={
                isMediaCapture
                  ? "Exit media capture"
                  : "Collapse thought capture"
              }
            >
              <BlurView
                intensity={20}
                tint="dark"
                className="absolute inset-0"
              />
              {isMediaCapture ? (
                <X size={19} color={colors.cream} />
              ) : (
                <ChevronDown size={20} color={colors.cream} />
              )}
            </Pressable>
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    );
  },
);

export default CaptureSheet;
