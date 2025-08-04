import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { useAppStore } from '../store/appStore';

// Mock fetch
global.fetch = vi.fn();

const initialState = useAppStore.getState();

describe('appStore device actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store state before each test
    useAppStore.setState(initialState, true);
  });

  it('fetchDevices updates the devices state on successful fetch', async () => {
    const mockDevices = [{ id: 'device-1', ip: '192.168.1.100' }];
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockDevices }),
    });

    await useAppStore.getState().fetchDevices();

    expect(useAppStore.getState().devices).toEqual(mockDevices);
  });

  it('toggleDeviceAudio calls the correct endpoint and refetches devices', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    await useAppStore.getState().toggleDeviceAudio('device-1');

    expect(fetch).toHaveBeenCalledWith('/api/devices/device-1/toggle-audio', { method: 'POST' });
    expect(fetch).toHaveBeenCalledTimes(2); // toggle + fetch
  });

  it('toggleDeviceTicker calls the correct endpoint and refetches devices', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    await useAppStore.getState().toggleDeviceTicker('device-1');

    expect(fetch).toHaveBeenCalledWith('/api/devices/device-1/toggle-ticker', { method: 'POST' });
    expect(fetch).toHaveBeenCalledTimes(2); // toggle + fetch
  });

  it('toggleDeviceSidebar calls the correct endpoint and refetches devices', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    await useAppStore.getState().toggleDeviceSidebar('device-1');

    expect(fetch).toHaveBeenCalledWith('/api/devices/device-1/toggle-sidebar', { method: 'POST' });
    expect(fetch).toHaveBeenCalledTimes(2); // toggle + fetch
  });
});
