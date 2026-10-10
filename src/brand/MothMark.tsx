import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type MothMarkProps = {
  size?: number;
  dark?: boolean;
  withBackdrop?: boolean;
};

export function MothMark({ size = 32, dark = false, withBackdrop = false }: MothMarkProps) {
  const background = dark ? '#242019' : '#FFFDF8';
  const body = dark ? '#FFFDF8' : '#242019';
  const gradientId = dark ? 'moth-dark-left' : 'moth-light-left';

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" accessibilityLabel="Jotful moth mark">
      {withBackdrop && <Rect width={32} height={32} fill={background} />}
      <Path d="M15.8272 15.9448C8.12721 29.3448 -0.272795 26.6448 1.82721 15.8448C3.62721 6.44482 12.0272 7.34482 15.8272 14.5448V15.9448Z" fill={`url(#${gradientId})`} />
      <Path d="M16.4272 16.3449C24.1272 2.9449 32.5272 5.6449 30.4272 16.4449C28.6272 25.8449 20.2272 24.9449 16.4272 17.7449V16.3449Z" fill="#58795C" />
      <Path d="M18.6547 9.98497C19.7477 10.4489 19.3917 13.7511 17.8596 17.3606C16.3274 20.9701 14.1993 23.5201 13.1063 23.0561C12.0133 22.5922 12.3692 19.29 13.9014 15.6805C15.4335 12.071 17.5616 9.52101 18.6547 9.98497Z" fill={body} />
      <Defs>
        <LinearGradient id={gradientId} x1="1.1272" y1="28.1448" x2="21.1272" y2="7.14482" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#EF705A" />
          <Stop offset={0.72} stopColor="#EF705A" />
          <Stop offset="1" stopColor="#FFFDF8" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}
