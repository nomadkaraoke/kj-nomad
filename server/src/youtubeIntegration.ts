import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { Song } from './mediaLibrary.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface YouTubeVideo {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  url: string;
  quality: string;
}

export interface DownloadProgress {
  id: string;
  videoId: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  speed?: string;
  eta?: string;
  fileName?: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

export interface YouTubeSearchResult {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  url: string;
  viewCount?: number;
  uploadDate?: string;
}

export interface HybridSearchResult {
  local: Song[];
  youtube: YouTubeSearchResult[];
  totalResults: number;
}

class YouTubeIntegration {
  private downloadQueue: Map<string, DownloadProgress> = new Map();
  private activeDownloads: Map<string, ChildProcess> = new Map();
  private cacheDirectory: string;
  private maxCacheSize: number = 10 * 1024 * 1024 * 1024; // 10GB default
  private maxConcurrentDownloads: number = 3;
  private downloadCallbacks: Map<string, (progress: DownloadProgress) => void> = new Map();

  constructor(cacheDirectory?: string) {
    this.cacheDirectory = cacheDirectory || path.join(__dirname, '../youtube-cache');
    this.ensureCacheDirectory();
  }

  /**
   * Initialize the YouTube integration system
   */
  public async initialize(): Promise<boolean> {
    try {
      // Check if yt-dlp is available
      const ytDlpAvailable = await this.checkYtDlpAvailability();
      if (!ytDlpAvailable) {
        console.error('[YouTube] yt-dlp not found. Please install yt-dlp to enable YouTube integration.');
        return false;
      }

      // Clean up any incomplete downloads from previous sessions
      await this.cleanupIncompleteDownloads();
      
      console.log('[YouTube] Integration initialized successfully');
      return true;
    } catch (error) {
      console.error('[YouTube] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Search YouTube for videos matching the query
   */
  public async searchYouTube(query: string, maxResults: number = 20): Promise<YouTubeSearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const searchResults = await this.executeYtDlp([
        '--flat-playlist',
        '--dump-json',
        '--no-warnings',
        '--playlist-end', maxResults.toString(),
        `ytsearch${maxResults}:${query} karaoke`
      ]);

      const results: YouTubeSearchResult[] = [];
      const lines = searchResults.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.id && data.title) {
            results.push({
              id: data.id,
              title: this.cleanTitle(data.title),
              artist: this.extractArtist(data.title),
              duration: data.duration || 0,
              thumbnail: data.thumbnail || '',
              url: `https://www.youtube.com/watch?v=${data.id}`,
              viewCount: data.view_count,
              uploadDate: data.upload_date
            });
          }
        } catch {
          // Skip invalid JSON lines
          continue;
        }
      }

      return results;
    } catch (error) {
      console.error('[YouTube] Search failed:', error);
      return [];
    }
  }

  /**
   * Perform hybrid search combining local library and YouTube results
   */
  public async hybridSearch(
    query: string, 
    localSongs: Song[], 
    maxYouTubeResults: number = 10
  ): Promise<HybridSearchResult> {
    // Filter local songs based on query
    const localResults = localSongs.filter(song => 
      song.title.toLowerCase().includes(query.toLowerCase()) ||
      song.artist.toLowerCase().includes(query.toLowerCase())
    );

    // Search YouTube
    const youtubeResults = await this.searchYouTube(query, maxYouTubeResults);

    return {
      local: localResults,
      youtube: youtubeResults,
      totalResults: localResults.length + youtubeResults.length
    };
  }

  /**
   * Download a YouTube video
   */
  public async downloadVideo(
    videoId: string, 
    title?: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    const downloadId = randomUUID();
    const fileName = this.generateFileName(videoId, title);
    const filePath = path.join(this.cacheDirectory, fileName);

    // Check if already downloaded
    if (fs.existsSync(filePath)) {
      console.log(`[YouTube] Video already cached: ${fileName}`);
      return fileName;
    }

    // Check if already downloading
    const existingDownload = Array.from(this.downloadQueue.values())
      .find(d => d.videoId === videoId && d.status === 'downloading');
    
    if (existingDownload) {
      console.log(`[YouTube] Video already downloading: ${videoId}`);
      if (onProgress) {
        this.downloadCallbacks.set(existingDownload.id, onProgress);
      }
      return new Promise((resolve, reject) => {
        const checkStatus = () => {
          const download = this.downloadQueue.get(existingDownload.id);
          if (download?.status === 'completed' && download.fileName) {
            resolve(download.fileName);
          } else if (download?.status === 'failed') {
            reject(new Error(download.error || 'Download failed'));
          } else {
            setTimeout(checkStatus, 1000);
          }
        };
        checkStatus();
      });
    }

    // Check concurrent download limit
    const activeCount = Array.from(this.downloadQueue.values())
      .filter(d => d.status === 'downloading').length;
    
    if (activeCount >= this.maxConcurrentDownloads) {
      throw new Error('Maximum concurrent downloads reached. Please try again later.');
    }

    // Initialize download progress
    const progress: DownloadProgress = {
      id: downloadId,
      videoId,
      status: 'pending',
      progress: 0,
      startedAt: Date.now()
    };

    this.downloadQueue.set(downloadId, progress);
    if (onProgress) {
      this.downloadCallbacks.set(downloadId, onProgress);
    }

    try {
      // Start download
      await this.startDownload(downloadId, videoId, fileName);
      return fileName;
    } catch (error) {
      this.updateDownloadProgress(downloadId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get download progress for a specific download
   */
  public getDownloadProgress(downloadId: string): DownloadProgress | undefined {
    return this.downloadQueue.get(downloadId);
  }

  /**
   * Get all active downloads
   */
  public getActiveDownloads(): DownloadProgress[] {
    return Array.from(this.downloadQueue.values())
      .filter(d => d.status === 'downloading' || d.status === 'pending');
  }

  /**
   * Cancel a download
   */
  public cancelDownload(downloadId: string): boolean {
    const download = this.downloadQueue.get(downloadId);
    if (!download) {
      return false;
    }

    const process = this.activeDownloads.get(downloadId);
    if (process) {
      process.kill('SIGTERM');
      this.activeDownloads.delete(downloadId);
    }

    this.updateDownloadProgress(downloadId, {
      status: 'cancelled'
    });

    return true;
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    totalFiles: number;
    totalSize: number;
    availableSpace: number;
    oldestFile?: { name: string; date: Date };
    newestFile?: { name: string; date: Date };
  } {
    try {
      const files = fs.readdirSync(this.cacheDirectory);
      const videoFiles = files.filter(f => f.endsWith('.mp4') || f.endsWith('.webm'));
      
      let totalSize = 0;
      let oldestFile: { name: string; date: Date } | undefined;
      let newestFile: { name: string; date: Date } | undefined;

      for (const file of videoFiles) {
        const filePath = path.join(this.cacheDirectory, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;

        if (!oldestFile || stats.mtime < oldestFile.date) {
          oldestFile = { name: file, date: stats.mtime };
        }
        if (!newestFile || stats.mtime > newestFile.date) {
          newestFile = { name: file, date: stats.mtime };
        }
      }

      return {
        totalFiles: videoFiles.length,
        totalSize,
        availableSpace: this.maxCacheSize - totalSize,
        oldestFile,
        newestFile
      };
    } catch (error) {
      console.error('[YouTube] Failed to get cache stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        availableSpace: this.maxCacheSize
      };
    }
  }

  /**
   * Clean up old cached files to free space
   */
  public async cleanupCache(targetFreeSpace?: number): Promise<number> {
    const stats = this.getCacheStats();
    const freeSpaceNeeded = targetFreeSpace || (this.maxCacheSize * 0.2); // 20% free space
    
    if (stats.availableSpace >= freeSpaceNeeded) {
      return 0; // No cleanup needed
    }

    try {
      const files = fs.readdirSync(this.cacheDirectory);
      const videoFiles = files
        .filter(f => f.endsWith('.mp4') || f.endsWith('.webm'))
        .map(f => {
          const filePath = path.join(this.cacheDirectory, f);
          const fileStats = fs.statSync(filePath);
          return {
            name: f,
            path: filePath,
            size: fileStats.size,
            mtime: fileStats.mtime
          };
        })
        .sort((a, b) => a.mtime.getTime() - b.mtime.getTime()); // Oldest first

      let freedSpace = 0;
      let filesDeleted = 0;

      for (const file of videoFiles) {
        if (freedSpace >= freeSpaceNeeded) {
          break;
        }

        try {
          fs.unlinkSync(file.path);
          freedSpace += file.size;
          filesDeleted++;
          console.log(`[YouTube] Deleted cached file: ${file.name} (${this.formatBytes(file.size)})`);
        } catch (error) {
          console.error(`[YouTube] Failed to delete ${file.name}:`, error);
        }
      }

      console.log(`[YouTube] Cache cleanup completed: ${filesDeleted} files deleted, ${this.formatBytes(freedSpace)} freed`);
      return filesDeleted;
    } catch (error) {
      console.error('[YouTube] Cache cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Set cache configuration
   */
  public setCacheConfig(maxSize: number, maxConcurrentDownloads: number): void {
    this.maxCacheSize = maxSize;
    this.maxConcurrentDownloads = maxConcurrentDownloads;
  }

  // Private methods

  private ensureCacheDirectory(): void {
    if (!fs.existsSync(this.cacheDirectory)) {
      fs.mkdirSync(this.cacheDirectory, { recursive: true });
    }
  }

  private async checkYtDlpAvailability(): Promise<boolean> {
    try {
      await this.executeYtDlp(['--version']);
      return true;
    } catch {
      return false;
    }
  }

  private async executeYtDlp(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn('yt-dlp', args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`yt-dlp failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async startDownload(downloadId: string, videoId: string, fileName: string): Promise<void> {
    const filePath = path.join(this.cacheDirectory, fileName);
    
    // Ensure we have enough space
    const stats = this.getCacheStats();
    const estimatedSize = 50 * 1024 * 1024; // Estimate 50MB per video
    
    if (stats.availableSpace < estimatedSize) {
      await this.cleanupCache(estimatedSize);
    }

    this.updateDownloadProgress(downloadId, {
      status: 'downloading',
      fileName
    });

    return new Promise((resolve, reject) => {
      const args = [
        '--format', 'best[height<=720]/best', // Prefer 720p or lower
        '--output', filePath,
        '--no-warnings',
        '--progress',
        `https://www.youtube.com/watch?v=${videoId}`
      ];

      const process = spawn('yt-dlp', args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.activeDownloads.set(downloadId, process);

      let stderr = '';

      process.stdout?.on('data', (data) => {
        const output = data.toString();
        this.parseDownloadProgress(downloadId, output);
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
        this.parseDownloadProgress(downloadId, data.toString());
      });

      process.on('close', (code) => {
        this.activeDownloads.delete(downloadId);
        
        if (code === 0) {
          this.updateDownloadProgress(downloadId, {
            status: 'completed',
            progress: 100,
            completedAt: Date.now()
          });
          resolve();
        } else {
          this.updateDownloadProgress(downloadId, {
            status: 'failed',
            error: `Download failed with code ${code}: ${stderr}`
          });
          reject(new Error(`Download failed with code ${code}`));
        }
      });

      process.on('error', (error) => {
        this.activeDownloads.delete(downloadId);
        this.updateDownloadProgress(downloadId, {
          status: 'failed',
          error: error.message
        });
        reject(error);
      });
    });
  }

  private parseDownloadProgress(downloadId: string, output: string): void {
    // Parse yt-dlp progress output
    const progressMatch = output.match(/(\d+\.?\d*)%/);
    const speedMatch = output.match(/(\d+\.?\d*\w+\/s)/);
    const etaMatch = output.match(/ETA (\d+:\d+)/);

    if (progressMatch) {
      const progress = parseFloat(progressMatch[1]);
      const updates: Partial<DownloadProgress> = { progress };
      
      if (speedMatch) {
        updates.speed = speedMatch[1];
      }
      
      if (etaMatch) {
        updates.eta = etaMatch[1];
      }

      this.updateDownloadProgress(downloadId, updates);
    }
  }

  private updateDownloadProgress(downloadId: string, updates: Partial<DownloadProgress>): void {
    const current = this.downloadQueue.get(downloadId);
    if (!current) return;

    const updated = { ...current, ...updates };
    this.downloadQueue.set(downloadId, updated);

    // Call progress callback if registered
    const callback = this.downloadCallbacks.get(downloadId);
    if (callback) {
      callback(updated);
    }
  }

  private generateFileName(videoId: string, title?: string): string {
    const sanitizedTitle = title 
      ? title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
      : videoId;
    return `youtube_${videoId}_${sanitizedTitle}.mp4`;
  }

  private cleanTitle(title: string): string {
    // Remove common karaoke-related suffixes and prefixes
    return title
      .replace(/\s*\(karaoke\)/gi, '')
      .replace(/\s*karaoke\s*/gi, ' ')
      .replace(/\s*\[.*?\]\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractArtist(title: string): string {
    // Try to extract artist from common patterns
    const patterns = [
      /^(.+?)\s*-\s*(.+)$/, // "Artist - Title"
      /^(.+?)\s*by\s*(.+)$/i, // "Title by Artist"
      /^(.+?)\s*\|\s*(.+)$/ // "Artist | Title"
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'Unknown Artist';
  }

  private async cleanupIncompleteDownloads(): Promise<void> {
    try {
      const files = fs.readdirSync(this.cacheDirectory);
      const partFiles = files.filter(f => f.endsWith('.part') || f.endsWith('.tmp'));
      
      for (const file of partFiles) {
        const filePath = path.join(this.cacheDirectory, file);
        fs.unlinkSync(filePath);
        console.log(`[YouTube] Cleaned up incomplete download: ${file}`);
      }
    } catch {
      console.error('[YouTube] Failed to cleanup incomplete downloads');
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

// Export singleton instance
export const youtubeIntegration = new YouTubeIntegration();
