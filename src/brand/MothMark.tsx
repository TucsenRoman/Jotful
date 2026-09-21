import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

type MothMarkProps = {
  size?: number;
  dark?: boolean;
};

export function MothMark({ size = 32, dark = false }: MothMarkProps) {
  const cream = '#F5F0E6';
  const body = dark ? '#242019' : cream;

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none" accessibilityLabel="Unsorted moth mark">
      <Defs>
        <LinearGradient id="moth-persimmon" x1="5" y1="8" x2="25" y2="29" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#EF705A" />
          <Stop offset="0.72" stopColor="#EF705A" />
          <Stop offset="1" stopColor={cream} />
        </LinearGradient>
        <LinearGradient id="moth-cream" x1="35" y1="31" x2="15" y2="10" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={cream} />
          <Stop offset="0.72" stopColor={cream} />
          <Stop offset="1" stopColor="#EF705A" />
        </LinearGradient>
      </Defs>
      <Path d="M19.7 20.2C12 6.8 3.6 9.5 5.7 20.3c1.8 9.4 10.2 8.5 14 1.3Z" fill="url(#moth-persimmon)" />
      <Path d="M20.3 19.8c7.7 13.4 16.1 10.7 14-0.1-1.8-9.4-10.2-8.5-14-1.3Z" fill="url(#moth-cream)" />
      <Ellipse cx="20" cy="20" rx="2.15" ry="7.1" fill={body} transform="rotate(-45 20 20)" />
    </Svg>
  );
}
