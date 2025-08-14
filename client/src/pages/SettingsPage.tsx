import React, { useEffect, useState } from 'react';
import { Navigation } from '../components/Navigation';
import { Input } from '../components/ui/Input';
import { useAppStore } from '../store/appStore';
import PlayerScreenManager from '../components/KjController/PlayerScreenManager';

const SettingsPage: React.FC = () => {
  // Media library
  const [mediaDir, setMediaDir] = useState('');
  const [mediaExtensions, setMediaExtensions] = useState<string>('.mp4,.webm,.avi,.mov,.mp3,.m4a,.wav,.flac,.ogg,.mkv');
  const [mediaUseCache, setMediaUseCache] = useState(true);
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null);

  // Filler music
  const [fillerDir, setFillerDir] = useState('');
  const [fillerFiles, setFillerFiles] = useState<string[]>([]);
  const [selectedFiller, setSelectedFiller] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // YouTube downloads
  const [ytCacheDir, setYtCacheDir] = useState('');
  const [ytQuality, setYtQuality] = useState('best[height<=720]/best');
  const [ytFilenamePattern, setYtFilenamePattern] = useState<'paren' | 'dash'>('paren');
  const qualityOptions = [
    { label: 'Auto best ≤720p (default)', value: 'best[height<=720]/best' },
    { label: 'Best available', value: 'best' },
    { label: '1080p video + best audio (fallback best)', value: 'bestvideo[height<=1080]+bestaudio/best' },
    { label: '720p video + best audio (fallback best)', value: 'bestvideo[height<=720]+bestaudio/best' },
    { label: '480p or lower (data saver)', value: 'best[height<=480]/best' },
  ];

  // Ticker
  const { tickerText, updateTicker } = useAppStore();
  const [newTickerText, setNewTickerText] = useState(tickerText);
  const waitingTitle = useAppStore((s) => s.waitingTitle || 'KJ-Nomad Ready');
  const waitingSubtitle = useAppStore((s) => s.waitingSubtitle || 'Waiting for the next performance...');
  const waitingImageUrl = useAppStore((s) => s.waitingImageUrl || null);
  const [newWaitingTitle, setNewWaitingTitle] = useState(waitingTitle);
  const [newWaitingSubtitle, setNewWaitingSubtitle] = useState(waitingSubtitle);
  const [brandMsg, setBrandMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await fetch('/api/setup/config').then(r => r.json());
        if (cfg?.success && cfg.data) {
          setMediaDir(cfg.data.mediaDirectory || '');
          if (Array.isArray(cfg.data.mediaScanExtensions)) setMediaExtensions(cfg.data.mediaScanExtensions.join(','));
          if (typeof cfg.data.mediaUseCachedIndex === 'boolean') setMediaUseCache(Boolean(cfg.data.mediaUseCachedIndex));
        }
      } catch { /* ignore */ }
      try {
        const f = await fetch('/api/filler/settings').then(r => r.json());
        if (f?.success && f.data) {
          setFillerDir(f.data.directory || '');
          // filler volume now controlled per screen; keep directory only
        }
      } catch { /* ignore */ }
      try {
        const y = await fetch('/api/youtube/settings').then(r => r.json());
        if (y?.success && y.data) {
          setYtCacheDir(y.data.cacheDirectory || '');
          setYtQuality(y.data.qualityFormat || 'best[height<=720]/best');
          setYtFilenamePattern((y.data.filenamePattern as 'paren' | 'dash') || 'paren');
        }
      } catch { /* ignore */ }
      try {
        const l = await fetch('/api/filler/list').then(r => r.json());
        if (l?.success) {
          setFillerFiles(l.data || []);
          if (l.data?.length) setSelectedFiller(l.data[0]);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <h1 className="text-2xl font-semibold">Settings</h1>

          {/* Player Screens */}
          <PlayerScreenManager />

          {/* Ticker Message */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Ticker Message</h2>
            <div className="space-y-4">
              <Input
                label="Current Message"
                value={newTickerText}
                onChange={(e) => setNewTickerText(e.target.value)}
                placeholder="Enter ticker message..."
                hint="This message will scroll across the bottom of the player screen"
                data-testid="ticker-input"
              />
              <button
                onClick={() => updateTicker(newTickerText)}
                className="btn-primary w-full"
                data-testid="update-ticker-button"
              >
                Update Ticker
              </button>
            </div>
          </div>

          {/* Media Library */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Media Library</h2>
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <input className="input flex-1 font-mono" placeholder="/absolute/path/to/your/karaoke/library" value={mediaDir} onChange={(e) => setMediaDir(e.target.value)} />
                <button className="btn" onClick={async () => {
                  setLibraryMessage(null);
                  if (!mediaDir.trim()) { setLibraryMessage('Enter a folder path'); return; }
                  try {
                    const v = await fetch('/api/setup/validate-media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: mediaDir.trim() }) });
                    const j = await v.json();
                    if (!j?.success || !j.data?.valid) { setLibraryMessage(j?.data?.error || 'Folder invalid'); return; }
                    await fetch('/api/setup/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...j.data, mediaDirectory: mediaDir.trim(), mediaScanExtensions: mediaExtensions.split(',').map(s => s.trim()).filter(Boolean), mediaUseCachedIndex: mediaUseCache }) });
                    const scan = await fetch('/api/setup/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force: false }) });
                    const sj = await scan.json();
                    setLibraryMessage(sj?.success ? `Scan complete. Songs found: ${sj.data?.songCount ?? 0}` : (sj?.error || 'Scan failed'));
                  } catch { setLibraryMessage('Failed to update library'); }
                }}>Set & Rescan</button>
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-sm opacity-80">Extensions</label>
                <input className="input flex-1 font-mono" placeholder=".mp4,.mkv,.webm" value={mediaExtensions} onChange={(e) => setMediaExtensions(e.target.value)} />
                <label className="text-sm opacity-80 flex items-center gap-2"><input type="checkbox" checked={mediaUseCache} onChange={(e) => setMediaUseCache(e.target.checked)} /> Use cached index when available</label>
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={async () => {
                  try { const r = await fetch('/api/setup/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force: true }) }); const j = await r.json(); setLibraryMessage(j?.success ? `Rescanned. Songs: ${j.data?.songCount ?? 0}` : (j?.error || 'Scan failed')); } catch { setLibraryMessage('Scan failed'); }
                }}>Rescan Library</button>
                <button className="btn-tertiary" onClick={async () => { try { await fetch('/api/setup/reset', { method: 'POST' }); location.reload(); } catch { /* ignore */ } }}>Reset Setup</button>
              </div>
              {libraryMessage && <div className="text-sm opacity-80">{libraryMessage}</div>}
              <div className="text-xs opacity-70">Tip: You can leave this blank to run with YouTube-only requests.</div>
            </div>
          </div>

          {/* Waiting Screen */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Waiting Screen</h2>
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <input className="input flex-1" placeholder="Title" value={newWaitingTitle} onChange={(e) => setNewWaitingTitle(e.target.value)} />
                <input className="input flex-1" placeholder="Subtitle" value={newWaitingSubtitle} onChange={(e) => setNewWaitingSubtitle(e.target.value)} />
                <button className="btn" onClick={async () => {
                  try { await fetch('/api/waiting-screen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newWaitingTitle, subtitle: newWaitingSubtitle }) }); setBrandMsg('Saved'); setTimeout(()=>setBrandMsg(null),1500); } catch { setBrandMsg('Save failed'); }
                }}>Save</button>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm opacity-80">Custom image (optional)</label>
                <input type="file" accept="image/*" onChange={async (e) => {
                  if (!e.target.files || e.target.files.length === 0) return;
                  const form = new FormData(); form.append('file', e.target.files[0]);
                  try { const r = await fetch('/api/waiting-screen/upload', { method: 'POST', body: form }); const j = await r.json(); setBrandMsg(j?.success ? 'Uploaded' : (j?.error || 'Upload failed')); } catch { setBrandMsg('Upload failed'); }
                }} />
              </div>
              {waitingImageUrl && (
                <div className="text-xs opacity-80">Current image:
                  <img src={waitingImageUrl} alt="waiting" className="mt-2 h-16 object-contain" />
                </div>
              )}
              {brandMsg && <div className="text-sm opacity-80">{brandMsg}</div>}
            </div>
          </div>

          {/* Filler Music */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Filler Music</h2>
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <input className="input flex-1" placeholder="Filler directory" value={fillerDir} onChange={(e) => setFillerDir(e.target.value)} />
                <button className="btn-secondary" onClick={async () => {
                  // Volume is now per-screen; only persist directory
                  await fetch('/api/filler/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ directory: fillerDir }) });
                  const resp = await fetch('/api/filler/list'); const data = await resp.json(); if (data?.success) { setFillerFiles(data.data || []); if (data.data?.length) setSelectedFiller(data.data[0]); }
                }}>Save</button>
              </div>
              {/* Volume moved to per-screen controls below */}
              <div className="flex items-center gap-2">
                <input type="file" accept="video/*,audio/*" onChange={async (e) => {
                  if (!e.target.files || e.target.files.length === 0) return;
                  const file = e.target.files[0];
                  const form = new FormData(); form.append('file', file);
                  setUploading(true);
                  try { await fetch('/api/filler/upload', { method: 'POST', body: form }); const r = await fetch('/api/filler/list'); const j = await r.json(); if (j?.success) { setFillerFiles(j.data || []); if (j.data?.length) setSelectedFiller(j.data[0]); } } finally { setUploading(false); }
                }} />
                {uploading && <span className="text-sm opacity-80">Uploading...</span>}
              </div>
              {fillerFiles.length > 0 && (
                <div className="flex items-center gap-2">
                  <select className="input" value={selectedFiller} onChange={(e) => setSelectedFiller(e.target.value)}>
                    {fillerFiles.map(f => (<option key={f} value={f}>{f}</option>))}
                  </select>
                  <button className="btn-tertiary" onClick={async () => { const r = await fetch('/api/filler/list'); const j = await r.json(); if (j?.success) setFillerFiles(j.data || []); }}>Refresh</button>
                  <button className="btn" onClick={async () => { if (selectedFiller) await fetch('/api/filler/play', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: selectedFiller }) }); }}>Play Selected</button>
                  <button className="btn-tertiary" onClick={() => { fetch('/api/filler/stop', { method: 'POST' }); }}>Stop</button>
                </div>
              )}
            </div>
          </div>

          {/* YouTube Downloads */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">YouTube Downloads</h2>
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <input className="input flex-1 font-mono" placeholder="/path/to/youtube/cache" value={ytCacheDir} onChange={(e) => setYtCacheDir(e.target.value)} />
                <select className="input" value={ytQuality} onChange={(e) => setYtQuality(e.target.value)}>
                  {qualityOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                </select>
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-sm opacity-80">Filename</label>
                <select className="input" value={ytFilenamePattern} onChange={(e) => setYtFilenamePattern((e.target.value as 'paren' | 'dash'))}>
                  <option value="paren">Title (Channel).mp4</option>
                  <option value="dash">Title - Channel.mp4</option>
                </select>
                <button className="btn-secondary" onClick={async () => {
                  await fetch('/api/youtube/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cacheDirectory: ytCacheDir, qualityFormat: ytQuality, filenamePattern: ytFilenamePattern }) });
                }}>Save</button>
              </div>
              <div className="flex gap-2">
                <button className="btn-tertiary" onClick={async () => {
                  await fetch('/api/youtube/cache', { method: 'DELETE' });
                }}>Delete All Downloads</button>
              </div>
              <div className="text-xs opacity-70">If you don't configure a local media library, KJ‑Nomad will still work by downloading songs from YouTube on demand.</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;


