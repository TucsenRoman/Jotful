import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type MothMarkProps = {
  size?: number;
  dark?: boolean;
};

export function MothMark({ size = 32 }: MothMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none" accessibilityLabel="Unsorted moth mark">
      <Path d="M19.7 19.8C12 33.2 3.60001 30.5 5.70001 19.7C7.50001 10.3 15.9 11.2 19.7 18.4V19.8Z" fill="url(#wing-left)" />
      <Path d="M20.3 20.2001C28 6.80012 36.4 9.50012 34.3 20.3001C32.5 29.7001 24.1 28.8001 20.3 21.6001V20.2001Z" fill="url(#wing-right)" />
      <Path d="M22.5275 13.8402C23.6205 14.3041 23.2645 17.6063 21.7324 21.2158C20.2002 24.8254 18.0721 27.3753 16.9791 26.9114C15.8861 26.4474 16.242 23.1452 17.7742 19.5357C19.3063 15.9262 21.4344 13.3762 22.5275 13.8402Z" fill="#242019" />
      <Defs>
        <LinearGradient id="wing-left" x1="5.00001" y1="32" x2="25" y2="11" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#EF705A" />
          <Stop offset="0.72" stopColor="#EF705A" />
          <Stop offset="1" stopColor="#F5F0E6" />
        </LinearGradient>
        <LinearGradient id="wing-right" x1="35" y1="9.00012" x2="15.0001" y2="30.0001" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F5F0E6" />
          <Stop offset="0.72" stopColor="#F5F0E6" />
          <Stop offset="1" stopColor="#EF705A" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}
