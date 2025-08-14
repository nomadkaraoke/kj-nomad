import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import type { Device } from '../../store/appStore';
import { 
  ComputerDesktopIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon, 
  TicketIcon, 
  Bars3Icon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  QrCodeIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  XCircleIcon,
  WifiIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline';
import { BugAntIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const PlayerScreenManager: React.FC = () => {
  const {
    devices,
    fetchDevices,
    toggleDeviceAudio,
    toggleDeviceTicker,
    toggleDeviceSidebar,
    toggleDeviceVideoPlayer,
    identifyDevice,
    disconnectDevice,
    serverInfo,
    checkServerInfo,
  } = useAppStore();

  const [showSyncLog, setShowSyncLog] = useState(false);
  type SyncLog = { ts: number; message: string } & Record<string, unknown>;
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const socket = useAppStore((s) => s.socket);
  const toggleDeviceDebugOverlay = useAppStore((s) => s.toggleDeviceDebugOverlay);
  const [debugAll, setDebugAll] = useState(false);

  useEffect(() => {
    // Attach WebSocket listener for sync logs
    if (!socket || typeof (socket as unknown as { addEventListener?: unknown }).addEventListener !== 'function') {
      return;
    }
    const onMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg?.type === 'sync_log' && msg.payload) {
          const payload = msg.payload as SyncLog;
          setLogs((prev) => [payload, ...prev].slice(0, 200));
        }
      } catch {
        // ignore
      }
    };
    socket.addEventListener('message', onMessage);
    return () => socket.removeEventListener('message', onMessage);
  }, [socket]);

  useEffect(() => {
    fetchDevices();
    checkServerInfo();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, [fetchDevices, checkServerInfo]);

  const playerUrl = serverInfo.localIps.length > 0 ? `http://${serverInfo.localIps[0]}:${serverInfo.port}/player` : '/player';

  return (
    <div className="card relative">
      <h2 className="text-xl font-semibold mb-4">Player Screens</h2>
      <div className="absolute top-3 right-3 flex gap-2">
        <button
          onClick={async () => {
            const next = !debugAll;
            setDebugAll(next);
            try {
              await Promise.all((devices || []).map(d => toggleDeviceDebugOverlay(d.id, next)));
            } catch { /* ignore */ }
          }}
          className="p-2 rounded-full hover:bg-brand-blue/10"
          title="Toggle debug overlay on all player screens"
        >
          <BugAntIcon className={clsx('h-5 w-5', debugAll && 'text-brand-pink')} />
        </button>
        <button
          onClick={() => setShowSyncLog(v => !v)}
          className="p-2 rounded-full hover:bg-brand-blue/10"
          title={showSyncLog ? 'Hide Sync Log' : 'Show Sync Log'}
        >
          <span className="text-xs opacity-80">log</span>
        </button>
      </div>
      {devices.length === 0 ? (
        <div className="text-center py-8 px-4">
          <ComputerDesktopIcon className="h-16 w-16 mx-auto text-text-secondary-light dark:text-text-secondary-dark opacity-50" />
          <h3 className="mt-4 text-lg font-medium">No Player Screens Connected</h3>
          <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            To show karaoke lyrics and videos, connect a display (like a TV or projector).
          </p>
          <div className="mt-6 text-left space-y-4 bg-bg-light dark:bg-bg-dark p-4 rounded-lg border border-border-light dark:border-border-dark">
            <div>
              <h4 className="font-semibold flex items-center"><ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2"/>Option 1: Use a Web Browser</h4>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">On any device with a web browser (like a Smart TV, laptop, or tablet), open the browser and go to:</p>
              <div className="mt-2">
                <a href={playerUrl} target="_blank" rel="noopener noreferrer" className="text-lg font-mono bg-card-light dark:bg-card-dark px-3 py-2 rounded-md text-brand-blue dark:text-brand-pink hover:underline">
                  {playerUrl}
                </a>
              </div>
            </div>
            <div className="border-t border-border-light dark:border-border-dark my-4"></div>
            <div>
              <h4 className="font-semibold flex items-center"><QrCodeIcon className="h-5 w-5 mr-2"/>Option 2: Use the KJ-Nomad App</h4>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">For the best performance, install and run the KJ-Nomad app on another computer, and select "Set up as Player" on launch. It will automatically find and connect to your server.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.isArray(devices) && devices.map((device: Device, index) => (
            <div key={device.id} className="flex items-center justify-between p-4 bg-bg-light dark:bg-card-dark rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {device.isOnline ? (
                    <WifiIcon className="h-8 w-8 text-green-500" />
                  ) : (
                    <SignalSlashIcon className="h-8 w-8 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">Screen {index + 1}</p>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {device.viewport.width}x{device.viewport.height} - {device.browser} on {device.os}
                  </p>
                  <p className="text-[10px] opacity-70">id: {device.id}</p>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark opacity-70">
                    {device.isApp ? 'KJ-Nomad App' : 'Web Browser'} - {device.ipAddress}
                  </p>
                  {'syncStats' in device && typeof (device as Device & { syncStats?: { lastSyncError?: number } }).syncStats?.lastSyncError === 'number' && (
                    <p className="text-xs mt-1">
                      Drift: <span className={clsx((((device as Device & { syncStats?: { lastSyncError?: number } }).syncStats?.lastSyncError ?? 0) > 100 || (((device as Device & { syncStats?: { lastSyncError?: number } }).syncStats?.lastSyncError ?? 0) < -100)) ? 'text-red-500' : 'text-green-600')}>
                        {Math.round(((device as Device & { syncStats?: { lastSyncError?: number } }).syncStats?.lastSyncError ?? 0))} ms
                      </span>
                    </p>
                  )}
                  <p className="text-xs opacity-80 mt-1">
                    Loading: {device.isVideoPlayerVisible ? 'false' : 'true'} | Playing: {device.isVideoPlayerVisible ? 'true' : 'false'} | Muted: {device.isAudioEnabled ? 'false' : 'true'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => identifyDevice(device.id)}
                  className="p-2 rounded-full hover:bg-brand-blue/10"
                  title="Identify Screen"
                >
                  <EyeIcon className="h-6 w-6" />
                </button>
                {/* Removed per-screen debug toggle; use the top-right bug icon to toggle all */}
                <button
                  onClick={() => toggleDeviceAudio(device.id)}
                  className={clsx('p-2 rounded-full hover:bg-brand-blue/10', { 'bg-brand-blue/20': device.isAudioEnabled })}
                  title={device.isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
                >
                  {device.isAudioEnabled ? (
                    <SpeakerWaveIcon className="h-6 w-6 text-brand-pink" />
                  ) : (
                    <SpeakerXMarkIcon className="h-6 w-6" />
                  )}
                </button>
                <button
                  onClick={() => toggleDeviceTicker(device.id)}
                  className={clsx('p-2 rounded-full hover:bg-brand-blue/10', { 'bg-brand-blue/20': device.isTickerVisible })}
                  title={device.isTickerVisible ? 'Hide Ticker' : 'Show Ticker'}
                >
                  <TicketIcon className={clsx("h-6 w-6", device.isTickerVisible && 'text-brand-pink')} />
                </button>
                <button
                  onClick={() => toggleDeviceSidebar(device.id)}
                  className={clsx('p-2 rounded-full hover:bg-brand-blue/10', { 'bg-brand-blue/20': device.isSidebarVisible })}
                  title={device.isSidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
                >
                  <Bars3Icon className={clsx("h-6 w-6", device.isSidebarVisible && 'text-brand-pink')} />
                </button>
                <button
                  onClick={() => toggleDeviceVideoPlayer(device.id)}
                  className={clsx('p-2 rounded-full hover:bg-brand-blue/10', { 'bg-brand-blue/20': device.isVideoPlayerVisible })}
                  title={device.isVideoPlayerVisible ? 'Hide Video Player' : 'Show Video Player'}
                >
                  {device.isVideoPlayerVisible ? (
                    <VideoCameraIcon className="h-6 w-6 text-brand-pink" />
                  ) : (
                    <VideoCameraSlashIcon className="h-6 w-6" />
                  )}
                </button>
                <button
                  onClick={() => disconnectDevice(device.id)}
                  className="p-2 rounded-full hover:bg-red-500/10"
                  title="Disconnect Screen"
                >
                  <XCircleIcon className="h-6 w-6 text-red-500" />
                </button>
              </div>
            </div>
          ))}
          {showSyncLog && (
            <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => {
                const text = logs.map(l => {
                  const extraEntries = Object.entries(l).filter(([key]) => key !== 'ts' && key !== 'message');
                  const s = extraEntries.length ? ' ' + JSON.stringify(Object.fromEntries(extraEntries)) : '';
                  const ts = new Date(l.ts).toLocaleTimeString();
                  return `[${ts}] ${l.message}${s}`;
                }).reverse().join('\n');
                navigator.clipboard.writeText(text).catch(() => {});
              }}
              className="btn-secondary"
            >Copy Log</button>
            </div>
          )}
          {showSyncLog && (
            <div className="mt-3 max-h-64 overflow-auto text-xs bg-black/30 rounded p-2">
              {logs.length === 0 && <div className="opacity-60">No sync events yet…</div>}
              {logs.map((l, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  [{new Date(l.ts).toLocaleTimeString()}] {l.message}
                  {(() => {
                    const extraEntries = Object.entries(l).filter(([key]) => key !== 'ts' && key !== 'message');
                    const s = extraEntries.length ? ' ' + JSON.stringify(Object.fromEntries(extraEntries)) : '';
                    return s;
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerScreenManager;
