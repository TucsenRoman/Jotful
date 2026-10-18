import { StyleSheet, Text, View } from 'react-native';
import { MothMark } from '../../brand/MothMark';

const tokens = require('../../theme/tokens');

export function EmptyStack({ bottomInset }: { bottomInset: number }) {
  return (
    <View style={[styles.wrap, { paddingBottom: bottomInset }]}>
      <MothMark size={58} />
      <Text style={styles.title}>Hold that thought.</Text>
      <Text style={styles.sub}>Speak or type it exactly as it arrives.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.space.margin },
  title: { marginTop: 16, fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.45, color: tokens.color.ink, textAlign: 'center' },
  sub: { marginTop: 6, fontSize: 15, lineHeight: 20, color: tokens.color.secondary, textAlign: 'center' },
});
