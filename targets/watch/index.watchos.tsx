import '@appsent-co/react-native-watchos/dev-support';

import { useEffect, useState } from 'react';
import {
  Button,
  Divider,
  ScrollView,
  Text,
  TextField,
  VStack,
  font,
  foregroundColor,
  padding,
  render,
} from '@appsent-co/react-native-watchos/renderer';
import { WatchConnectivity } from '@appsent-co/react-native-watchos/watch-connectivity';

type DeliveryState = 'ready' | 'queued' | 'sent' | 'error';

function newCaptureId() {
  return `watch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function WatchApp() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<DeliveryState>('ready');

  useEffect(() => {
    void WatchConnectivity.activate();
    const delivered = WatchConnectivity.on('message', ({ content }) => {
      if (content.type === 'jotful.capture.ack') setStatus('sent');
      return { type: 'jotful.watch.received' };
    });
    return () => delivered.remove();
  }, []);

  async function saveToPhone() {
    const value = text.trim();
    if (!value) return;
    setStatus('queued');
    const capture = {
      type: 'jotful.capture.v1',
      id: newCaptureId(),
      text: value,
      createdAt: Date.now(),
      source: 'watch',
    };
    try {
      // This is durable OS-managed delivery. The phone will later acknowledge
      // after it commits the jot to its own local database.
      await WatchConnectivity.transferUserInfo(capture);
      setText('');
    } catch {
      setStatus('error');
    }
  }

  const statusText = status === 'queued'
    ? 'Queued for your iPhone'
    : status === 'sent'
      ? 'Saved to Jotful'
      : status === 'error'
        ? 'Will retry when connected'
        : 'Private, local capture';

  return (
    <ScrollView>
      <VStack modifiers={[padding({ horizontal: 12, vertical: 10 })]}>
        <Text modifiers={[font({ style: 'title3', weight: 'semibold' })]}>Jotful</Text>
        <Text modifiers={[font('caption'), foregroundColor('#74876A')]}>Capture it before it drifts away.</Text>
        <Divider />
        <TextField placeholder="A thought…" value={text} onChange={setText} />
        <Button onPress={() => void saveToPhone()} modifiers={[padding({ vertical: 8 })]}>
          <Text modifiers={[font({ style: 'headline', weight: 'semibold' })]}>Save to iPhone</Text>
        </Button>
        <Text modifiers={[font('caption2'), foregroundColor(status === 'error' ? '#EF705A' : '#74876A')]}> {statusText}</Text>
      </VStack>
    </ScrollView>
  );
}

render(<WatchApp />);
