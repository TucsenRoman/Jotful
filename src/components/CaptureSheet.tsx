import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library/legacy";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { Camera as ExpoCamera, CameraView } from "expo-camera";
import {
  AudioLines,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  Image,
  RotateCw,
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
  type ReactNode,
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
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  clearCaptureDraft,
  saveCaptureDraft,
  type AttachmentKind,
} from "../storage";
import AudioTimeline from "./AudioTimeline";
import {
  capturePeekHeight,
  sheetBottomPad,
  voiceContentHeight,
  voiceUndoWindowMillis,
} from "./capture/layout";
import {
  continueList,
  kindAtCursor,
  lineKind,
  linePrefix,
  stripPrefix,
  toggleLineKind,
  toRichHtml,
} from "./capture/richDraft";
import VoiceButton, { micSize } from "./capture/VoiceButton";
import VoicePanel, { type VoicePhase } from "./capture/VoicePanel";
import {
  deleteQuietly,
  dictationAvailable,
  keepRecording,
  transcriptSince,
} from "./capture/voiceFiles";
import WritingToolbar, { CircleButton } from "./capture/WritingToolbar";

export { capturePeekHeight, voiceUndoWindowMillis } from "./capture/layout";

const tokens = require("../theme/tokens");
const ink: string = tokens.color.ink;
const onInk: string = tokens.color.onInk;
const secondary: string = tokens.color.secondary;
const transitionDuration = 300;
const spring = {
  duration: tokens.motion.spring.duration,
  dampingRatio: tokens.motion.spring.dampingRatio,
};
// The camera, library and media-choice panels keep their compact height.
const expandedBaseHeight = 224;
const sheetPadding: number = tokens.space.margin;
const peekPadding: number = tokens.space.margin;

const caps = {
  fontSize: 11,
  lineHeight: 13,
  fontWeight: "600" as const,
  letterSpacing: 0.7,
  textTransform: "uppercase" as const,
};

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
  /** Tag pills for the writing sheet, drawn above the tool bar. */
  tagRow?: ReactNode;
  /**
   * A recording was discarded by swiping the voice sheet down. Show an Undo
   * toast; calling `undo` (within `voiceUndoWindowMillis`) saves it after all
   * and returns true, or returns false once the window has passed.
   */
  onVoiceDiscarded?: (undo: () => boolean) => void;
};

type PendingAttachment = {
  kind: AttachmentKind;
  uri: string;
  durationMillis?: number;
};

type VoiceSession = {
  stage: "idle" | "starting" | "recording" | "stopping";
  released: boolean;
  startedAt: number;
  draftBefore: string;
  dictating: boolean;
};

const idleSession = (): VoiceSession => ({
  stage: "idle",
  released: true,
  startedAt: 0,
  draftBefore: "",
  dictating: false,
});

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
      tagRow,
      onVoiceDiscarded,
    },
    ref,
  ) {
    const insets = useSafeAreaInsets();
    const { height: viewportHeight } = useWindowDimensions();
    const inputRef = useRef<TextInput>(null);
    const focusRichEditor = () => {
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    // Latest values for async voice work and gesture callbacks.
    const draftRef = useRef(draft);
    draftRef.current = draft;
    const listeningRef = useRef(listening);
    listeningRef.current = listening;
    // Set while a save hands control to the app, so its close() collapses
    // the sheet fully instead of only lowering the keyboard.
    const forceCloseRef = useRef(false);
    // CaptureSheet stays mounted while collapsed, so the write input also stays
    // in the native view hierarchy. Keep its focus lifecycle separate from the
    // current mode so mounting the sheet cannot summon the keyboard.
    const [isExpanded, setIsExpanded] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    // From Keyboard events: the writing tool bar sits right on top of it.
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
    const [cursor, setCursor] = useState(0);
    const [forcedSelection, setForcedSelection] = useState<
      { start: number; end: number } | undefined
    >(undefined);
    const [voicePhase, setVoicePhase] = useState<"idle" | VoicePhase>("idle");
    const [holdHint, setHoldHint] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const recordingShape = useSharedValue(0);
    // 0 is open and 1 is collapsed. The sheet never unmounts or changes its view tree.
    const progress = useSharedValue(1);
    const recorder = useAudioRecorder({
      ...RecordingPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    });
    const voice = useRef<VoiceSession>(idleSession());
    const stopChain = useRef<Promise<unknown>>(Promise.resolve());
    const lockedSV = useSharedValue(0);
    const levelSV = useSharedValue(0);
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

    // Heights. The sheet is one full-height surface docked to the bottom; it
    // slides so only the part a mode needs is on screen.
    const bottomPad = sheetBottomPad(insets.bottom);
    const fullHeight = viewportHeight - insets.top - 4;
    const peekHeight = capturePeekHeight(insets.bottom);
    const voiceHeight = Math.min(fullHeight, voiceContentHeight + bottomPad);
    const mediaHeight = Math.min(
      viewportHeight - insets.top - 12,
      Math.max(expandedBaseHeight, viewportHeight * 0.62) + insets.bottom,
    );
    const modeHeight =
      activeMode === "voice"
        ? voiceHeight
        : activeMode === "write" || activeMode === "audio"
          ? fullHeight
          : mediaHeight;
    const targetHeight = isExpanded ? modeHeight : peekHeight;
    // While collapsing, the fading content keeps the size it had.
    const lastExpandedHeight = useRef(modeHeight);
    if (isExpanded) lastExpandedHeight.current = modeHeight;
    const layerHeight = isExpanded ? modeHeight : lastExpandedHeight.current;
    const visibleHeight = useSharedValue(peekHeight);
    const dragY = useSharedValue(0);
    const micShown = useSharedValue(1);
    const micActive = !isExpanded || activeMode === "voice";

    useEffect(() => {
      visibleHeight.value = withSpring(targetHeight, spring);
    }, [targetHeight]);
    useEffect(() => {
      micShown.value = withTiming(micActive ? 1 : 0, {
        duration: tokens.motion.fade,
      });
    }, [micActive]);

    const sheetStyle = useAnimatedStyle(
      () => ({
        transform: [
          {
            translateY: Math.max(
              0,
              fullHeight - visibleHeight.value + dragY.value,
            ),
          },
        ],
      }),
      [fullHeight],
    );
    const collapsedStyle = useAnimatedStyle(
      () => ({ opacity: progress.value }),
      [],
    );
    const expandedStyle = useAnimatedStyle(
      () => ({ opacity: 1 - progress.value }),
      [],
    );
    // Bottom of the expanded content: on top of the keyboard while typing,
    // otherwise clear of the home indicator.
    const contentBottom =
      (keyboardVisible && keyboardHeight > 0
        ? Math.max(keyboardHeight, bottomPad)
        : bottomPad) + 8;
    const micStyle = useAnimatedStyle(() => ({
      opacity: micShown.value,
      transform: [{ translateY: Math.max(0, dragY.value) }],
    }));
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

    const setDraftText = (text: string) => {
      draftRef.current = text;
      onDraftChange(text);
      onRichTextChange(toRichHtml(text));
    };

    const open = (
      mode: "write" | "voice" | "media" | "media-choice" = "write",
    ) => {
      // Focus at the same moment the sheet rises so the iOS keyboard and sheet
      // animate as one movement instead of two consecutive animations.
      if (mode === "voice") {
        // No finger is on the button (widget, link): start already locked,
        // so a tap on the stop square saves.
        void beginVoiceSession(true);
        return;
      }
      setActiveMode(mode);
      if (mode === "write") {
        setComposerMode(pendingImages.length ? "attachment" : "text");
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
      setComposerMode("text");
    };

    const discardAttachment = () => {
      setPendingAttachment(null);
      setPendingImages([]);
      setSelectedImageUri(null);
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
      inputRef.current?.blur();
      forceCloseRef.current = true;
      try {
        if (pendingAttachment) saveAttachment();
        else onSave();
      } finally {
        forceCloseRef.current = false;
      }
    };

    const collapseNow = (haptic: boolean) => {
      if (haptic) onCollapseHaptic();
      inputRef.current?.blur();
      Keyboard.dismiss();
      setKeyboardVisible(false);
      animate(1);
    };

    const voiceBusy = () =>
      voice.current.stage === "starting" || voice.current.stage === "recording";

    const close = () => {
      const forced = forceCloseRef.current;
      forceCloseRef.current = false;
      // A tap outside never ends a recording; swiping the sheet down does.
      if (!forced && voiceBusy()) return;
      // The first pull-down is a predictable keyboard dismissal. A second one
      // collapses the composer, so the two iOS transitions never compete.
      if (!forced && keyboardVisible) {
        inputRef.current?.blur();
        Keyboard.dismiss();
        setKeyboardVisible(false);
        return;
      }
      if (listening && !voiceBusy()) onStopVoice();
      collapseNow(!forced);
    };

    const pickMedia = async (
      source: "library" | "camera" | "video",
      collapseOnDeny = false,
    ) => {
      inputRef.current?.blur();
      Keyboard.dismiss();
      setKeyboardVisible(false);
      if (source === "library") {
        setLibraryLoading(true);
        const permission = await MediaLibrary.requestPermissionsAsync(false);
        if (!permission.granted) {
          setLibraryLoading(false);
          if (collapseOnDeny) animate(1);
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
        if (collapseOnDeny) animate(1);
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

    // Camera and photo buttons on the peek open straight into the picker.
    const openMedia = (source: "library" | "camera") => {
      onOpenHaptic();
      setActiveMode("media");
      animate(0);
      void pickMedia(source, true);
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
      try {
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
      } catch {
        Alert.alert(
          "Recording could not start",
          "Try again in a moment. Another app may be using the microphone.",
        );
        return false;
      }
    };

    // ——— Voice: one button ———

    const resetVoiceUi = () => {
      lockedSV.value = 0;
      setVoicePhase("idle");
    };

    const waitForDictationEnd = async (dictating: boolean) => {
      if (!dictating) return;
      // The final words arrive just before dictation's "end" event.
      const deadline = Date.now() + 900;
      while (listeningRef.current && Date.now() < deadline)
        await new Promise((resolve) => setTimeout(resolve, 50));
    };

    const stopCapture = async (session: VoiceSession) => {
      let durationMillis = 0;
      try {
        durationMillis = recorder.getStatus().durationMillis;
      } catch {}
      if (session.dictating && listeningRef.current) onStopVoice();
      try {
        await recorder.stop();
      } catch {}
      await waitForDictationEnd(session.dictating);
      try {
        await setAudioModeAsync({ allowsRecording: false });
      } catch {}
      return { uri: recorder.uri, durationMillis };
    };

    async function beginVoiceSession(locked: boolean) {
      if (voiceBusy()) return;
      const session: VoiceSession = {
        stage: "starting",
        released: locked,
        startedAt: Date.now(),
        draftBefore: draftRef.current,
        dictating: false,
      };
      voice.current = session;
      lockedSV.value = locked ? 1 : 0;
      setVoicePhase(locked ? "locked" : "hold");
      inputRef.current?.blur();
      Keyboard.dismiss();
      setActiveMode("voice");
      animate(0);
      // Let a previous save or discard finish with the recorder first.
      await stopChain.current;
      if (voice.current !== session) return;
      session.draftBefore = draftRef.current;
      const started = await startAudioRecording();
      if (voice.current !== session) return;
      if (!started) {
        voice.current = idleSession();
        resetVoiceUi();
        animate(1);
        return;
      }
      session.stage = "recording";
      session.startedAt = Date.now();
      if (dictationAvailable() && !listeningRef.current) {
        session.dictating = true;
        // The app starts dictation with its own light tap.
        onToggleVoice();
      } else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // The finger came up while the recorder was starting (often the
      // permission prompt): that was a tap, not a hold.
      if (session.released && !lockedSV.value) discardVoice(true);
    }

    function saveVoice() {
      const session = voice.current;
      if (session.stage !== "recording") return;
      session.stage = "stopping";
      voice.current = idleSession();
      resetVoiceUi();
      // Lower the sheet at once; the file and final words follow.
      collapseNow(false);
      const work = (async () => {
        const { uri, durationMillis } = await stopCapture(session);
        const transcript = transcriptSince(
          draftRef.current,
          session.draftBefore,
        );
        if (!uri) {
          setDraftText(session.draftBefore);
          collapseNow(false);
          return;
        }
        try {
          const file = await keepRecording(uri, "recordings");
          forceCloseRef.current = true;
          try {
            onAttachments(
              [{ kind: "audio", uri: file.uri, durationMillis }],
              transcript || undefined,
            );
          } finally {
            forceCloseRef.current = false;
          }
        } catch {
          collapseNow(false);
          Alert.alert(
            "Recording could not be saved",
            "Try recording again. Jotful did not save a broken audio note.",
          );
        }
        // The transcript went into the recording's caption; put back any
        // words that were in the draft before the hold.
        setDraftText(session.draftBefore);
      })();
      stopChain.current = work.catch(() => undefined);
    }

    function discardVoice(quiet: boolean) {
      const session = voice.current;
      if (session.stage !== "recording") return;
      session.stage = "stopping";
      voice.current = idleSession();
      resetVoiceUi();
      collapseNow(false);
      if (quiet) {
        setHoldHint(true);
        void Haptics.selectionAsync();
        setTimeout(() => setHoldHint(false), 1600);
      }
      const work = (async () => {
        const { uri, durationMillis } = await stopCapture(session);
        const transcript = transcriptSince(
          draftRef.current,
          session.draftBefore,
        );
        setDraftText(session.draftBefore);
        if (quiet || !onVoiceDiscarded || !uri) {
          deleteQuietly(uri);
          return;
        }
        // Keep the file aside until the Undo window passes.
        let held: string | null = null;
        try {
          held = (await keepRecording(uri, "discarded")).uri;
        } catch {}
        let settled = held === null;
        const timer = setTimeout(() => {
          settled = true;
          deleteQuietly(held);
        }, voiceUndoWindowMillis);
        onVoiceDiscarded(() => {
          if (settled || !held) return false;
          settled = true;
          clearTimeout(timer);
          const source = held;
          void (async () => {
            try {
              const file = await keepRecording(source, "recordings");
              deleteQuietly(source);
              const keep = draftRef.current;
              onAttachments(
                [{ kind: "audio", uri: file.uri, durationMillis }],
                transcript || undefined,
              );
              // Saving clears the app's draft; keep what is being written now.
              setDraftText(keep);
            } catch {
              Alert.alert(
                "Recording could not be restored",
                "Jotful could not bring this recording back.",
              );
            }
          })();
          return true;
        });
      })();
      stopChain.current = work.catch(() => undefined);
    }

    const onHoldStart = () => {
      void beginVoiceSession(false);
    };
    const onHoldRelease = () => {
      const session = voice.current;
      session.released = true;
      if (session.stage !== "recording" || lockedSV.value) return;
      // Under half a second is a tap: remind, don't save a blip.
      if (Date.now() - session.startedAt < 500) discardVoice(true);
      else saveVoice();
    };
    const onVoiceLock = () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      setVoicePhase("locking");
      setTimeout(
        () =>
          setVoicePhase((phase) => (phase === "locking" ? "locked" : phase)),
        480,
      );
    };
    const onLockedTap = () => {
      if (voice.current.stage === "recording") saveVoice();
    };
    const onDragChange = (dragging: boolean) =>
      setVoicePhase((phase) =>
        phase === "hold" || phase === "drag"
          ? dragging
            ? "drag"
            : "hold"
          : phase,
      );

    // ——— Sheet drag ———

    const onSheetPanEnd = (direction: "up" | "down" | "none") => {
      if (!isExpanded) {
        if (direction === "up") {
          onOpenHaptic();
          open("write");
        }
        return;
      }
      if (activeMode === "voice") {
        if (direction === "down" && voice.current.stage === "recording") {
          onCollapseHaptic();
          discardVoice(false);
        }
        return;
      }
      if (direction !== "down") return;
      if (activeMode === "camera" || activeMode === "library") {
        setActiveMode("write");
        setComposerMode("text");
        return;
      }
      close();
    };
    // Stable JS entry for the gestures, which are built once per enabled
    // change so a re-render never rebuilds one under the finger.
    const panEndRef = useRef(onSheetPanEnd);
    panEndRef.current = onSheetPanEnd;
    const callPanEnd = useMemo(
      () => (direction: "up" | "down" | "none") => panEndRef.current(direction),
      [],
    );
    const makeSheetPan = (enabled: boolean) =>
      Gesture.Pan()
        .enabled(enabled)
        .activeOffsetY([-10, 10])
        .failOffsetX([-24, 24])
        .onUpdate((event) => {
          dragY.value =
            event.translationY >= 0
              ? event.translationY
              : event.translationY * 0.25;
        })
        .onEnd((event) => {
          const direction =
            event.translationY > 80 || event.velocityY > 900
              ? "down"
              : event.translationY < -40 || event.velocityY < -700
                ? "up"
                : "none";
          runOnJS(callPanEnd)(direction);
        })
        .onFinalize(() => {
          dragY.value = withSpring(0, spring);
        });
    // The peek and the voice sheet drag anywhere; the writing sheet only by
    // its header, so the text keeps its own scrolling and selection.
    const headerPanEnabled = isExpanded && activeMode !== "voice";
    const bodyPan = useMemo(() => makeSheetPan(micActive), [micActive]);
    const headerPan = useMemo(
      () => makeSheetPan(headerPanEnabled),
      [headerPanEnabled],
    );

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
      });
      return () => {
        show.remove();
        hide.remove();
      };
    }, []);
    useImperativeHandle(ref, () => ({ open, close }));

    // ——— Editor ———

    const handleTextChange = (text: string) => {
      const continued = continueList(draftRef.current, text);
      const next = continued ? continued.text : text;
      if (continued)
        setForcedSelection({ start: continued.cursor, end: continued.cursor });
      setDraftText(next);
    };
    const applyFormat = (kind: "heading" | "bullet" | "todo") => {
      const result = toggleLineKind(draftRef.current, cursor, kind);
      setForcedSelection({ start: result.cursor, end: result.cursor });
      setCursor(result.cursor);
      setDraftText(result.text);
      void Haptics.selectionAsync();
      if (!inputRef.current?.isFocused()) focusRichEditor();
    };
    const styledLines = draft.split("\n").map((line, index, lines) => {
      const end = index < lines.length - 1 ? "\n" : "";
      const kind = lineKind(line);
      if (kind === "plain") return <Text key={index}>{line + end}</Text>;
      const prefix = linePrefix[kind];
      const body = stripPrefix(line);
      if (kind === "heading")
        return (
          <Text
            key={index}
            style={{
              fontSize: 22,
              lineHeight: 28,
              fontWeight: "600",
              letterSpacing: -0.45,
            }}
          >
            <Text style={{ color: tokens.color.faint }}>{prefix}</Text>
            {body + end}
          </Text>
        );
      return (
        <Text key={index} style={{ lineHeight: 28 }}>
          <Text style={{ color: kind === "bullet" ? ink : secondary }}>
            {prefix}
          </Text>
          <Text
            style={
              kind === "done"
                ? { color: secondary, textDecorationLine: "line-through" }
                : undefined
            }
          >
            {body}
          </Text>
          {end}
        </Text>
      );
    });

    const isMediaCapture = activeMode === "camera" || activeMode === "library";
    const needsDismissControl =
      activeMode === "media" ||
      activeMode === "media-choice" ||
      activeMode === "camera" ||
      activeMode === "library";
    const showReview =
      composerMode === "attachment" && pendingImages.length > 0;
    const firstDraftLine = draft
      .split("\n")
      .map((line) => stripPrefix(line).trim())
      .find(Boolean);
    const saveDisabled =
      (!pendingAttachment && previewCount === 0) || listening;
    const voiceTranscript =
      activeMode === "voice" && voicePhase !== "idle"
        ? transcriptSince(draft, voice.current.draftBefore)
        : "";

    return (
      <View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFill, { zIndex: 20, elevation: 20 }]}
      >
        <Animated.View
          className="bg-surface"
          style={[
            {
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: fullHeight,
              borderTopLeftRadius: tokens.radius.sheet,
              borderTopRightRadius: tokens.radius.sheet,
              shadowColor: ink,
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12,
              shadowRadius: 30,
              elevation: 14,
            },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={bodyPan}>
            <View style={{ flex: 1 }}>
              {/* Peek: gone entirely while the sheet is open. */}
              {isExpanded ? null : (
                <Animated.View
                  pointerEvents={isExpanded ? "none" : "auto"}
                  style={[
                    {
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: peekHeight,
                      paddingHorizontal: peekPadding,
                      paddingTop: 11,
                    },
                    collapsedStyle,
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      onOpenHaptic();
                      open("write");
                    }}
                    className="bg-fill flex-row items-center"
                    style={{
                      marginTop: 16,
                      height: 52,
                      borderRadius: 26,
                      paddingLeft: 20,
                      paddingRight: firstDraftLine ? 4 : 20,
                      gap: 8,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Open thought capture"
                  >
                    <Text
                      numberOfLines={1}
                      className={
                        "flex-1 text-body " +
                        (firstDraftLine ? "text-ink" : "text-secondary")
                      }
                    >
                      {firstDraftLine ?? prompt}
                    </Text>
                    {/* A waiting draft can be saved straight from the peek. */}
                    {firstDraftLine ? (
                      <Pressable
                        onPress={saveComposer}
                        disabled={saveDisabled}
                        className="bg-action items-center justify-center rounded-full"
                        style={{
                          height: 44,
                          paddingHorizontal: 18,
                          opacity: saveDisabled ? 0.4 : 1,
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Save thought"
                      >
                        <Text className="text-body font-semibold text-onInk">
                          Save
                        </Text>
                      </Pressable>
                    ) : null}
                  </Pressable>
                  <View
                    className="flex-row items-center"
                    style={{ marginTop: 14, height: micSize, gap: 12 }}
                  >
                    <CircleButton
                      onPress={() => openMedia("camera")}
                      label="Take a photo or video"
                    >
                      <Camera size={22} color={ink} strokeWidth={1.9} />
                    </CircleButton>
                    <CircleButton
                      onPress={() => openMedia("library")}
                      label="Choose from photos"
                    >
                      <Image size={22} color={ink} strokeWidth={1.9} />
                    </CircleButton>
                    <View className="flex-1" />
                    <Text
                      className={holdHint ? "text-ink" : "text-secondary"}
                      style={caps}
                    >
                      Hold to talk
                    </Text>
                    {/* The mic itself floats above the sheet (below) so it never moves. */}
                    <View style={{ width: micSize }} />
                  </View>
                </Animated.View>
              )}

              {/* Expanded */}
              <Animated.View
                pointerEvents={isExpanded ? "box-none" : "none"}
                style={[
                  { height: layerHeight, paddingBottom: contentBottom },
                  expandedStyle,
                ]}
              >
                {activeMode === "media-choice" ? (
                  <View
                    className="flex-1 justify-center"
                    style={{ paddingHorizontal: sheetPadding }}
                  >
                    <Text className="text-center text-title2 font-semibold text-ink">
                      Add media
                    </Text>
                    <Text className="mt-2 text-center text-subhead text-secondary">
                      Choose where this photo or video comes from.
                    </Text>
                    <View className="mt-7 flex-row gap-2">
                      {(
                        [
                          ["library", "Library", Image],
                          ["camera", "Camera", Camera],
                          ["video", "Video", Video],
                        ] as const
                      ).map(([source, label, Icon]) => (
                        <Pressable
                          key={source}
                          onPress={() => void pickMedia(source)}
                          className="flex-1 items-center rounded-2xl border border-separator bg-card px-2 py-4"
                          accessibilityLabel={label}
                        >
                          <Icon size={21} color={ink} />
                          <Text className="mt-2 text-center text-footnote font-semibold text-ink">
                            {label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
                {activeMode === "library" ? (
                  <View
                    className="flex-1"
                    style={{ paddingHorizontal: sheetPadding, paddingTop: 24 }}
                  >
                    <View className="mb-3 flex-row items-center justify-between">
                      <Text className="text-title2 font-semibold text-ink">
                        Library
                      </Text>
                      <Pressable
                        onPress={addSelectedLibraryAssets}
                        disabled={selectedLibraryAssets.length === 0}
                        className={
                          "rounded-full px-3 py-1.5 " +
                          (selectedLibraryAssets.length
                            ? "bg-action"
                            : "bg-fill")
                        }
                        accessibilityLabel="Add selected media"
                      >
                        <Text
                          className={
                            "text-footnote font-semibold " +
                            (selectedLibraryAssets.length
                              ? "text-onInk"
                              : "text-secondary")
                          }
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
                              "overflow-hidden rounded-none bg-fill " +
                              (selected ? "border-2 border-action" : "")
                            }
                          >
                            {item.mediaType === MediaLibrary.MediaType.video ? (
                              <View className="h-full w-full items-center justify-center bg-ink">
                                <Video size={24} color={onInk} />
                              </View>
                            ) : (
                              <NativeImage
                                source={{ uri: item.uri }}
                                style={{ width: "100%", height: "100%" }}
                                resizeMode="cover"
                              />
                            )}
                            {item.mediaType ===
                              MediaLibrary.MediaType.video && (
                              <View className="absolute bottom-1.5 right-1.5 rounded-full bg-ink/50 px-1.5 py-1">
                                <Video size={12} color={onInk} />
                              </View>
                            )}
                            {selected && (
                              <View className="absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-action">
                                <Check
                                  size={14}
                                  strokeWidth={3}
                                  color={onInk}
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
                  <View
                    className="flex-1 overflow-hidden rounded-card bg-ink"
                    style={{ marginHorizontal: sheetPadding, marginTop: 20 }}
                  >
                    <CameraView
                      ref={cameraRef}
                      facing={cameraFacing}
                      mode={cameraMode === "video" ? "video" : "picture"}
                      onCameraReady={() => setCameraReady(true)}
                      onMountError={(event) =>
                        Alert.alert("Camera unavailable", event.message)
                      }
                      style={StyleSheet.absoluteFill}
                    />
                    <View className="absolute inset-x-0 bottom-0 flex-row items-center px-4 pb-5">
                      <View className="flex-1 items-start">
                        <Pressable
                          onPress={() =>
                            setCameraMode(
                              cameraMode === "photo" ? "video" : "photo",
                            )
                          }
                          className="flex-row items-center rounded-full bg-ink/40 p-1"
                          hitSlop={10}
                          accessibilityLabel="Switch between photo and video"
                        >
                          <View
                            className={
                              "h-8 w-8 items-center justify-center rounded-full " +
                              (cameraMode === "photo" ? "bg-surface" : "")
                            }
                          >
                            <Camera
                              size={16}
                              color={cameraMode === "photo" ? ink : onInk}
                            />
                          </View>
                          <View
                            className={
                              "h-8 w-8 items-center justify-center rounded-full " +
                              (cameraMode === "video" ? "bg-danger" : "")
                            }
                          >
                            <Video size={16} color={onInk} />
                          </View>
                        </Pressable>
                      </View>
                      <View className="flex-1 items-center">
                        <Pressable
                          onPress={() => void captureFromCamera()}
                          disabled={!cameraReady}
                          className="h-16 w-16 items-center justify-center rounded-full bg-surface"
                          accessibilityLabel={
                            cameraMode === "video"
                              ? recordingVideo
                                ? "Stop video"
                                : "Record video"
                              : "Take photo"
                          }
                        >
                          <Animated.View
                            className={
                              cameraMode === "video" ? "bg-danger" : "bg-ink"
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
                          className="h-10 w-10 items-center justify-center rounded-full bg-ink/40"
                          hitSlop={10}
                          accessibilityLabel="Switch camera"
                        >
                          <RotateCw size={20} color={onInk} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : null}
                {activeMode === "write" || activeMode === "audio" ? (
                  <View
                    className="flex-1"
                    style={{ paddingHorizontal: sheetPadding }}
                  >
                    <GestureDetector gesture={headerPan}>
                      <View style={{ paddingTop: 11 }}>
                        <View
                          className="flex-row items-center justify-between"
                          style={{ marginTop: 6 }}
                        >
                          <CircleButton
                            onPress={() => {
                              if (listening) onStopVoice();
                              collapseNow(true);
                            }}
                            label="Close, keeping the draft"
                          >
                            <X size={22} color={ink} strokeWidth={1.9} />
                          </CircleButton>
                          <View
                            className="flex-1 flex-row items-center justify-center"
                            style={{ marginHorizontal: 12 }}
                          >
                            <Text
                              className="text-secondary"
                              style={caps}
                              numberOfLines={1}
                            >
                              Draft kept if you close
                            </Text>
                            {draft.trim().length > 0 && !listening && (
                              <Pressable
                                onPress={onClear}
                                hitSlop={12}
                                accessibilityRole="button"
                                accessibilityLabel="Clear thought"
                              >
                                <Text className="text-ink" style={caps}>
                                  {"  ·  "}Clear
                                </Text>
                              </Pressable>
                            )}
                          </View>
                          {/* Apple-style Save opposite the X, always on screen. */}
                          <Pressable
                            onPress={saveComposer}
                            disabled={saveDisabled}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Save thought"
                            style={{
                              height: 44,
                              minWidth: 44,
                              alignItems: "flex-end",
                              justifyContent: "center",
                              opacity: saveDisabled ? 0.4 : 1,
                            }}
                          >
                            <Text
                              style={{
                                color: tokens.color.action,
                                fontSize: 17,
                                lineHeight: 22,
                                fontWeight: "600",
                              }}
                            >
                              Save
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </GestureDetector>
                    <View
                      className="flex-1 overflow-hidden"
                      style={{ marginTop: 12, minHeight: 0 }}
                    >
                      {showReview ? (
                        <Animated.View
                          entering={FadeIn.duration(transitionDuration)}
                          className="flex-1"
                        >
                          <View className="flex-1 overflow-hidden rounded-media bg-card">
                            {selectedPreviewAttachment?.kind === "video" ? (
                              <View className="h-full w-full items-center justify-center bg-ink px-8">
                                <View className="h-14 w-14 items-center justify-center rounded-full bg-surface/20">
                                  <Video size={26} color={onInk} />
                                </View>
                                <Text className="mt-4 text-center text-body font-semibold text-onInk">
                                  Video ready to save
                                </Text>
                                <Text
                                  className="mt-1 text-center text-footnote text-onInk"
                                  style={{ opacity: 0.78 }}
                                >
                                  It will be attached to this thought.
                                </Text>
                              </View>
                            ) : selectedPreviewAttachment ? (
                              <NativeImage
                                source={{ uri: selectedPreviewAttachment.uri }}
                                style={{ width: "100%", height: "100%" }}
                                resizeMode="contain"
                              />
                            ) : null}
                            <View className="absolute left-3 right-3 top-3 flex-row items-center justify-between gap-3">
                              <Pressable
                                onPress={() => setComposerMode("text")}
                                className="h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-ink/20"
                                hitSlop={10}
                                accessibilityLabel="Return to text"
                              >
                                <BlurView
                                  intensity={24}
                                  tint="dark"
                                  className="absolute inset-0"
                                />
                                <ChevronLeft size={22} color={onInk} />
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
                                      ? "border-action"
                                      : "border-transparent")
                                  }
                                  accessibilityLabel="Show this attachment"
                                >
                                  {image.kind === "video" ? (
                                    <View className="h-full w-full items-center justify-center bg-ink">
                                      <Video size={20} color={onInk} />
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
                          <View
                            className="items-center"
                            style={{ marginTop: 12 }}
                          >
                            <Pressable
                              onPress={confirmRemoveSelectedImage}
                              className="bg-fill items-center justify-center"
                              style={{
                                height: 44,
                                borderRadius: 22,
                                paddingHorizontal: 16,
                              }}
                              hitSlop={6}
                              accessibilityLabel="Remove selected image"
                            >
                              <Text className="text-subhead font-semibold text-danger">
                                Remove Image
                              </Text>
                            </Pressable>
                          </View>
                        </Animated.View>
                      ) : (
                        <TextInput
                          ref={inputRef}
                          onChangeText={handleTextChange}
                          onSelectionChange={(event) => {
                            setCursor(event.nativeEvent.selection.start);
                            if (forcedSelection)
                              requestAnimationFrame(() =>
                                setForcedSelection(undefined),
                              );
                          }}
                          selection={forcedSelection}
                          placeholder={
                            pendingAttachment
                              ? "Add a label (optional)…"
                              : prompt
                          }
                          placeholderTextColor={secondary}
                          autoCapitalize="sentences"
                          multiline
                          scrollEnabled
                          textAlignVertical="top"
                          style={{
                            flex: 1,
                            paddingTop: 4,
                            color: ink,
                            fontSize: tokens.type.body[0],
                            lineHeight: tokens.type.body[1],
                          }}
                        >
                          {draft ? styledLines : null}
                        </TextInput>
                      )}
                    </View>
                    {!showReview && pendingImages.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ flexGrow: 0, marginTop: 8 }}
                        contentContainerStyle={{ gap: 8 }}
                        keyboardShouldPersistTaps="always"
                      >
                        {pendingImages.map((image) => (
                          <Pressable
                            key={image.uri}
                            onPress={() => {
                              setSelectedImageUri(image.uri);
                              setComposerMode("attachment");
                            }}
                            className="overflow-hidden rounded-media bg-fill"
                            style={{ width: 44, height: 44 }}
                            accessibilityLabel="Review attached photos"
                          >
                            {image.kind === "video" ? (
                              <View className="h-full w-full items-center justify-center bg-ink">
                                <Video size={16} color={onInk} />
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
                    )}
                    {pendingImages.length === 0 && pendingAttachment && (
                      <View
                        className="flex-row items-center"
                        style={{ marginTop: 8, gap: 12 }}
                      >
                        <View className="h-11 w-11 items-center justify-center rounded-full bg-fill">
                          {pendingAttachment.kind === "audio" ? (
                            <AudioLines size={20} color={ink} />
                          ) : (
                            <Video size={20} color={ink} />
                          )}
                        </View>
                        {pendingAttachment.kind === "audio" ? (
                          <View
                            className="flex-1 justify-center rounded-full bg-fill px-2"
                            style={{ height: 36 }}
                          >
                            <AudioTimeline
                              compact
                              uri={pendingAttachment.uri}
                              fallbackDurationMillis={
                                pendingAttachment.durationMillis
                              }
                            />
                          </View>
                        ) : (
                          <Text className="flex-1 text-subhead font-semibold text-ink">
                            Video attached
                          </Text>
                        )}
                        <CircleButton
                          onPress={discardAttachment}
                          label="Remove attachment"
                          size={32}
                        >
                          <X size={16} color={ink} />
                        </CircleButton>
                      </View>
                    )}
                    {tagRow ? (
                      <View style={{ marginTop: 10 }}>{tagRow}</View>
                    ) : null}
                    <View>
                      <WritingToolbar
                        activeKind={
                          showReview ? "plain" : kindAtCursor(draft, cursor)
                        }
                        onFormat={applyFormat}
                        onCamera={() => void pickMedia("camera")}
                        onPhoto={() => void pickMedia("library")}
                        onSave={saveComposer}
                        saveDisabled={saveDisabled}
                        saveLabel={listening ? "Listening" : "Save"}
                      />
                    </View>
                  </View>
                ) : null}
                {activeMode === "voice" ? (
                  <View
                    style={{ paddingHorizontal: sheetPadding, paddingTop: 11 }}
                  >
                    <VoicePanel
                      recorder={recorder}
                      phase={voicePhase === "idle" ? "hold" : voicePhase}
                      transcript={voiceTranscript}
                      listening={listening}
                      levelSV={levelSV}
                    />
                  </View>
                ) : null}
                {needsDismissControl ? (
                  <View className="mt-4 items-center">
                    <Pressable
                      onPress={
                        isMediaCapture
                          ? () => {
                              setActiveMode("write");
                              setComposerMode("text");
                            }
                          : close
                      }
                      className="h-8 w-14 items-center justify-center overflow-hidden rounded-full bg-ink/60"
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
                        <X size={19} color={onInk} />
                      ) : (
                        <ChevronDown size={20} color={onInk} />
                      )}
                    </Pressable>
                  </View>
                ) : null}
              </Animated.View>
            </View>
          </GestureDetector>
          {/* Grabber */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 6,
              alignSelf: "center",
              width: 36,
              height: 5,
              borderRadius: 3,
              backgroundColor: tokens.primitive.grey3,
            }}
          />
        </Animated.View>

        {/* The one voice button: same spot in the peek and the voice sheet. */}
        <Animated.View
          pointerEvents={micActive ? "box-none" : "none"}
          style={[
            {
              position: "absolute",
              right: peekPadding,
              bottom: bottomPad,
              width: micSize,
              height: micSize,
            },
            micStyle,
          ]}
        >
          <VoiceButton
            phase={activeMode === "voice" && isExpanded ? voicePhase : "idle"}
            enabled={micActive}
            lockedSV={lockedSV}
            levelSV={levelSV}
            sheetGesture={bodyPan}
            onHoldStart={onHoldStart}
            onHoldRelease={onHoldRelease}
            onDragChange={onDragChange}
            onLock={onVoiceLock}
            onLockedTap={onLockedTap}
          />
        </Animated.View>
      </View>
    );
  },
);

export default CaptureSheet;
