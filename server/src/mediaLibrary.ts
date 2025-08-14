import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Fuse from 'fuse.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Song {
  id: string;
  artist: string; // kept for backward-compat; will be empty string
  title: string;  // kept for backward-compat; will mirror fileName
  fileName: string;
}

let songLibrary: Song[] = [];
let fuse: Fuse<Song>;

const mediaDir = path.join(__dirname, '../media');

// Legacy parser removed: we do not infer artist/title from filenames anymore.

const INDEX_FILE_NAME = 'kj-nomad.index.json';

function normalizeExtensions(exts?: string[]): Set<string> {
  if (!exts || exts.length === 0) {
    return new Set(['.mp4', '.webm', '.avi', '.mov', '.mp3', '.m4a', '.wav', '.flac', '.ogg', '.mkv']);
  }
  return new Set(exts.map(e => (e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`)));
}

function buildIndexFromFiles(files: string[]): Song[] {
  return files.map((file, index) => ({
    id: `${index}`,
    artist: '',
    title: file,
    fileName: file,
  }));
}

function writeCache(scanDir: string, files: string[]): void {
  try {
    const cachePath = path.join(scanDir, INDEX_FILE_NAME);
    fs.writeFileSync(cachePath, JSON.stringify({ version: 1, files }, null, 2));
  } catch (err) {
    console.warn('[MediaLibrary] Failed to write cache index:', err);
  }
}

function tryLoadCache(scanDir: string): string[] | null {
  try {
    const cachePath = path.join(scanDir, INDEX_FILE_NAME);
    if (!fs.existsSync(cachePath)) return null;
    const raw = fs.readFileSync(cachePath, 'utf8');
    const data = JSON.parse(raw) as { version?: number; files?: string[] };
    if (Array.isArray(data.files)) return data.files;
    return null;
  } catch {
    return null;
  }
}

function recursivelyListFiles(rootDir: string): string[] {
  const stack: string[] = ['']; // relative paths from rootDir
  const collected: string[] = [];
  while (stack.length) {
    const rel = stack.pop() as string;
    const current = path.join(rootDir, rel);
    let entries: Array<fs.Dirent | string> = [];
    try {
      // Use withFileTypes when available. In tests, readdirSync may be mocked to return string[] only.
      entries = fs.readdirSync(current, { withFileTypes: true } as unknown as { withFileTypes: true }) as Array<fs.Dirent | string>;
    } catch (err) {
      // If the root directory can't be read, propagate the error to match tests' expectations
      if (rel === '') {
        throw err instanceof Error ? err : new Error(String(err));
      }
      console.warn('[MediaLibrary] Failed to read directory:', current, err);
      continue;
    }
    for (const entry of entries) {
      const name = typeof entry === 'string' ? entry : entry.name;
      if (name === '.' || name === '..') continue;
      const childRel = rel ? path.join(rel, name) : name;
      if (typeof entry === 'object' && typeof (entry as fs.Dirent).isDirectory === 'function') {
        if ((entry as fs.Dirent).isDirectory()) {
          stack.push(childRel);
        } else if ((entry as fs.Dirent).isFile()) {
          collected.push(childRel);
        } else {
          // Fallback: treat as file entry
          collected.push(childRel);
        }
      } else {
        // Entry is a string (from mocked fs) – treat as file at this level
        collected.push(childRel);
      }
    }
  }
  return collected;
}

export const scanMediaLibrary = (
  customDirectory?: string,
  options?: { allowedExtensions?: string[]; useCache?: boolean }
): Song[] => {
  const scanDir = customDirectory || mediaDir;
  console.log(`Scanning media library in: ${scanDir}`);
  
  try {
    // Ensure directory exists
    if (!fs.existsSync(scanDir)) {
      // Throw an error that can be caught by the API layer
      throw new Error(`Media directory not found: ${scanDir}`);
    }

    const allowed = normalizeExtensions(options?.allowedExtensions);

    // Load from cache if requested and available
    if (options?.useCache) {
      const cached = tryLoadCache(scanDir);
      if (cached) {
        const filtered = cached.filter(file => allowed.has(path.extname(file).toLowerCase()));
        songLibrary = buildIndexFromFiles(filtered);
        fuse = new Fuse(songLibrary, { keys: ['fileName'], threshold: 0.3, ignoreLocation: true, distance: 200, minMatchCharLength: 1 });
        console.log(`[MediaLibrary] Loaded ${songLibrary.length} files from cache`);
        return songLibrary;
      }
    }

    // Recursively walk the directory tree
    const allFiles = recursivelyListFiles(scanDir);
    const filtered = allFiles
      .filter(file => allowed.has(path.extname(file).toLowerCase()));

    songLibrary = buildIndexFromFiles(filtered);
    // Persist cache for next time
    writeCache(scanDir, filtered);

    // Build a simple Fuse index on fileName only for potential fuzzy matching, but we will also support substring matching
    fuse = new Fuse(songLibrary, {
      keys: ['fileName'],
      threshold: 0.3,
      ignoreLocation: true,
      distance: 200,
      minMatchCharLength: 1,
    });
    console.log(`Scan complete. Found ${songLibrary.length} songs.`);
    return songLibrary;
  } catch (error) {
    console.error('Error scanning media library:', error);
    songLibrary = [];
    fuse = new Fuse(songLibrary, {
      keys: ['fileName'],
      threshold: 0.3,
    });
    // Re-throw the error to be handled by the caller
    throw error;
  }
};

export const loadMediaLibraryFromCache = (customDirectory?: string): boolean => {
  const scanDir = customDirectory || mediaDir;
  try {
    const cached = tryLoadCache(scanDir);
    if (!cached) return false;
    const allowed = normalizeExtensions();
    const filtered = cached.filter(file => allowed.has(path.extname(file).toLowerCase()));
    songLibrary = buildIndexFromFiles(filtered);
    fuse = new Fuse(songLibrary, { keys: ['fileName'], threshold: 0.3, ignoreLocation: true, distance: 200, minMatchCharLength: 1 });
    console.log(`[MediaLibrary] Loaded ${songLibrary.length} files from cache at startup`);
    return true;
  } catch {
    return false;
  }
};

export const searchSongs = (query: string): Song[] => {
  if (!query || !query.trim()) {
    return songLibrary;
  }
  const q = query.toLowerCase();
  // Prefer fast substring match on filename; fall back to Fuse for fuzzy matches if needed
  const direct = songLibrary.filter(s => s.fileName.toLowerCase().includes(q));
  if (direct.length > 0) return direct;
  return fuse.search(query).map(result => result.item);
};

export const getSongById = (id: string): Song | undefined => {
  return songLibrary.find(song => song.id === id);
};

// Helper function for testing
export const resetMediaLibrary = () => {
  songLibrary = [];
};
