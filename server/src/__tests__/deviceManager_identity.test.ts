import { describe, it, expect } from 'vitest';
import { DeviceManager } from '../deviceManager.js';

class WsMock { readyState=1; static OPEN=1; OPEN=1; send(){} }

describe('DeviceManager identity and mapping', () => {
  it('upserts by stableId and does not remove on transient close', () => {
    const dm = new DeviceManager();
    const ws1 = new WsMock() as any;
    const ws2 = new WsMock() as any;

    const info = {
      name: 'Screen',
      ipAddress: '127.0.0.1',
      userAgent: 'UA',
      viewport: { width: 800, height: 600 },
      os: 'OS',
      browser: 'Browser',
      isApp: false,
      capabilities: {}
    };

    const d1 = dm.upsertDevice('stable-1', ws1, info);
    expect(dm.getDevices()).toHaveLength(1);
    expect(d1.isOnline).toBe(true);

    // Reconnect with new ws; should reuse same device record
    const d2 = dm.upsertDevice('stable-1', ws2, info);
    expect(dm.getDevices()).toHaveLength(1);
    expect(d2.ws).toBe(ws2);

    // Simulate transient close: mark offline but do not immediate-unregister
    dm.unregisterDevice('stable-1', false);
    expect(dm.getDevices().length).toBe(1); // delayed removal
  });
});


