import Svg, { Ellipse } from 'react-native-svg';

type MothMarkProps = {
  size?: number;
  dark?: boolean;
};

export function MothMark({ size = 32, dark = false }: MothMarkProps) {
  const cream = '#F5F0E6';
  const body = dark ? '#242019' : cream;

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none" accessibilityLabel="Unsorted moth mark">
      <Ellipse cx="15.8" cy="16.5" rx="5.9" ry="14.5" fill="#EF705A" transform="rotate(-45 15.8 16.5)" />
      <Ellipse cx="25.4" cy="20.4" rx="5.9" ry="14.5" fill={cream} transform="rotate(45 25.4 20.4)" />
      <Ellipse cx="20.7" cy="19.6" rx="2.25" ry="7.1" fill={body} transform="rotate(-18 20.7 19.6)" />
    </Svg>
  );
}
