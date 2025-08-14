import { describe, it, expect } from 'vitest';
import { websocketService } from '../../services/websocketService';
import { useAppStore } from '../../store/appStore';

describe('websocketService message handlers', () => {
  it('handles set_auto_drift_correction broadcast', () => {
    useAppStore.setState({ autoDriftCorrectionEnabled: false } as unknown as Parameters<typeof useAppStore.setState>[0]);
    // @ts-expect-error private
    websocketService['handleMessage']({ type: 'set_auto_drift_correction', payload: { enabled: true } });
    expect((useAppStore.getState() as unknown as { autoDriftCorrectionEnabled: boolean }).autoDriftCorrectionEnabled).toBe(true);
  });

  it('handles sync_play storing timeDomain and schedule', () => {
    useAppStore.setState({ setSyncPlay: (cmd: unknown) => useAppStore.setState({ syncPlay: cmd as { commandId: string; scheduledTime: number; videoTime: number; videoUrl: string; timeDomain?: 'client'|'server' } }) } as unknown as Parameters<typeof useAppStore.setState>[0]);
    const payload = { commandId: 'c', scheduledTime: Date.now(), videoTime: 3.2, videoUrl: '/api/media/x.mp4', timeDomain: 'server' as const };
    // @ts-expect-error private
    websocketService['handleMessage']({ type: 'sync_play', payload });
    expect(useAppStore.getState().syncPlay).toEqual(payload);
  });
});


