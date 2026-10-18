import { Camera, Heading, Image, List, ListTodo } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import type { LineKind } from "./richDraft";

const tokens = require("../../theme/tokens");
const iconColor: string = tokens.color.ink;

/** A 44pt grey icon circle (camera, photo, close). */
export function CircleButton({
  onPress,
  label,
  children,
  size = tokens.size.control,
  disabled,
}: {
  onPress: () => void;
  label: string;
  children: ReactNode;
  size?: number;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        backgroundColor: tokens.color.fill,
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size / 2,
        opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

type Props = {
  activeKind: LineKind;
  onFormat: (kind: "heading" | "bullet" | "todo") => void;
  onCamera: () => void;
  onPhoto: () => void;
  onSave: () => void;
  saveDisabled: boolean;
  saveLabel?: string;
};

const formats = [
  { kind: "heading" as const, label: "Heading", Icon: Heading },
  { kind: "bullet" as const, label: "Bulleted list", Icon: List },
  { kind: "todo" as const, label: "Checklist", Icon: ListTodo },
];

/** The bar above the keyboard: formats, camera, photo, and the blue Save. */
export default function WritingToolbar({
  activeKind,
  onFormat,
  onCamera,
  onPhoto,
  onSave,
  saveDisabled,
  saveLabel = "Save",
}: Props) {
  return (
    <View className="flex-row items-center" style={{ height: 56, gap: 12 }}>
      <View
        className="bg-fill flex-row items-center"
        style={{ height: 44, borderRadius: 22, paddingHorizontal: 4 }}
      >
        {formats.map(({ kind, label, Icon }) => {
          const on =
            activeKind === kind || (kind === "todo" && activeKind === "done");
          return (
            <Pressable
              key={kind}
              // Keep the keyboard up: the tool acts on the line being typed.
              onPressIn={() => onFormat(kind)}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: on }}
              className={on ? "bg-surface" : undefined}
              style={[
                {
                  width: 42,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                },
                on && {
                  shadowColor: tokens.color.ink,
                  shadowOpacity: 0.12,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                },
              ]}
            >
              <Icon size={22} color={iconColor} strokeWidth={1.9} />
            </Pressable>
          );
        })}
      </View>
      <CircleButton onPress={onCamera} label="Take a photo or video">
        <Camera size={22} color={iconColor} strokeWidth={1.9} />
      </CircleButton>
      <CircleButton onPress={onPhoto} label="Choose from photos">
        <Image size={22} color={iconColor} strokeWidth={1.9} />
      </CircleButton>
      <View className="flex-1" />
      <Pressable
        onPress={onSave}
        disabled={saveDisabled}
        accessibilityRole="button"
        accessibilityLabel="Save thought"
        style={({ pressed }) => ({
          backgroundColor: tokens.color.action,
          alignItems: "center",
          justifyContent: "center",
          height: 44,
          borderRadius: 22,
          paddingHorizontal: 20,
          opacity: saveDisabled ? 0.4 : pressed ? 0.75 : 1,
        })}
      >
        <Text className="text-body text-onInk font-semibold">{saveLabel}</Text>
      </Pressable>
    </View>
  );
}
