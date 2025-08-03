/**
 * Paper Workflow Manager
 * Optimizes traditional paper slip workflow for maximum KJ efficiency
 */

import { EventEmitter } from 'events';
import Fuse from 'fuse.js';
import { Song } from './mediaLibrary.js';

export interface PaperSlip {
  id: string;
  timestamp: number;
  singerName: string;
  requestedSong: string;
  parsedSong?: {
    artist: string;
    title: string;
    confidence: number; // 0-1 match confidence
  };
  matchedSong?: Song;
  status: 'pending' | 'matched' | 'queued' | 'duplicate' | 'unavailable' | 'rejected';
  notes?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
  priority: 'normal' | 'high' | 'vip';
  estimatedTime?: number; // When they might be called up
  kjNotes?: string;
}

export interface QuickEntryTemplate {
  id: string;
  name: string;
  pattern: string; // Regex pattern for quick recognition
  songId: string;
  usage: number;
}

export interface WorkflowStats {
  totalSlips: number;
  pendingSlips: number;
  matchedSlips: number;
  queuedSlips: number;
  duplicateSlips: number;
  averageProcessingTime: number; // seconds
  topRequestedSongs: Array<{ song: string; count: number }>;
  busiestSingers: Array<{ singer: string; count: number }>;
}

export interface WorkflowSettings {
  enableAutoParsing: boolean;
  enableDuplicateDetection: boolean;
  enableSmartSuggestions: boolean;
  duplicateTimeWindow: number; // minutes
  autoQueueMatches: boolean;
  requireConfirmation: boolean;
  defaultPriority: 'normal' | 'high' | 'vip';
  estimateWaitTimes: boolean;
}

export class PaperWorkflowManager extends EventEmitter {
  private slips: Map<string, PaperSlip> = new Map();
  private templates: Map<string, QuickEntryTemplate> = new Map();
  private songLibrary: Song[] = [];
  private songFuse: Fuse<Song> | null = null;
  private slipFuse: Fuse<PaperSlip> | null = null;
  private processingTimes: number[] = [];
  private settings: WorkflowSettings = {
    enableAutoParsing: true,
    enableDuplicateDetection: true,
    enableSmartSuggestions: true,
    duplicateTimeWindow: 30, // 30 minutes
    autoQueueMatches: false,
    requireConfirmation: true,
    defaultPriority: 'normal',
    estimateWaitTimes: true
  };

  constructor(songLibrary: Song[]) {
    super();
    this.updateSongLibrary(songLibrary);
    this.initializeTemplates();
  }

  /**
   * Update song library for matching
   */
  updateSongLibrary(songs: Song[]): void {
    this.songLibrary = songs;
    this.songFuse = new Fuse(songs, {
      keys: [
        { name: 'artist', weight: 0.4 },
        { name: 'title', weight: 0.6 }
      ],
      threshold: 0.3,
      includeScore: true
    });

    console.log(`[PaperWorkflow] Updated song library with ${songs.length} songs`);
  }

  /**
   * Add a new paper slip
   */
  addSlip(singerName: string, requestedSong: string, options?: {
    priority?: PaperSlip['priority'];
    notes?: string;
    kjNotes?: string;
  }): PaperSlip {
    const startTime = Date.now();
    const slip: PaperSlip = {
      id: `slip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      singerName: singerName.trim(),
      requestedSong: requestedSong.trim(),
      status: 'pending',
      priority: options?.priority || this.settings.defaultPriority,
      notes: options?.notes,
      kjNotes: options?.kjNotes
    };

    // Auto-parse if enabled
    if (this.settings.enableAutoParsing) {
      this.parseSlip(slip);
    }

    // Check for duplicates if enabled
    if (this.settings.enableDuplicateDetection) {
      this.checkForDuplicates(slip);
    }

    // Auto-queue if high confidence match and setting enabled
    if (this.settings.autoQueueMatches && slip.matchedSong && slip.parsedSong?.confidence && slip.parsedSong.confidence > 0.8) {
      slip.status = 'queued';
    }

    this.slips.set(slip.id, slip);
    
    // Track processing time
    const processingTime = (Date.now() - startTime) / 1000;
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift(); // Keep only last 100
    }

    // Update slip search index
    this.updateSlipIndex();

    console.log(`[PaperWorkflow] Added slip: ${singerName} - ${requestedSong} (${slip.status})`);
    this.emit('slipAdded', slip);

    return slip;
  }

  /**
   * Parse a slip to extract artist and title
   */
  private parseSlip(slip: PaperSlip): void {
    const request = slip.requestedSong.toLowerCase();
    
    // Try common patterns
    const patterns = [
      /(.+?)\s*-\s*(.+)/, // "Artist - Title"
      /(.+?)\s+by\s+(.+)/, // "Title by Artist"
      /(.+?)\s*\/\s*(.+)/, // "Artist / Title"
      /(.+?)\s*\|\s*(.+)/, // "Artist | Title"
    ];

    let artist = '';
    let title = '';
    let bestMatch: { item: Song; score?: number } | null = null;

    for (const pattern of patterns) {
      const match = request.match(pattern);
      if (match) {
        if (pattern.source.includes('by')) {
          // "Title by Artist" format
          title = match[1].trim();
          artist = match[2].trim();
        } else {
          // "Artist - Title" format
          artist = match[1].trim();
          title = match[2].trim();
        }

        // Try to match against song library
        if (this.songFuse) {
          const searchResults = this.songFuse.search(`${artist} ${title}`);
          if (searchResults.length > 0) {
            bestMatch = searchResults[0];
            break;
          }
        }
      }
    }

    // If no pattern match, try searching the whole string
    if (!bestMatch && this.songFuse) {
      const searchResults = this.songFuse.search(slip.requestedSong);
      if (searchResults.length > 0) {
        bestMatch = searchResults[0];
        const song = bestMatch.item;
        artist = song.artist;
        title = song.title;
      }
    }

    if (bestMatch) {
      slip.parsedSong = {
        artist,
        title,
        confidence: 1 - (bestMatch.score || 0) // Convert Fuse score to confidence
      };
      slip.matchedSong = bestMatch.item;
      slip.status = 'matched';
    } else {
      // No good match found
      slip.parsedSong = {
        artist: artist || 'Unknown',
        title: title || slip.requestedSong,
        confidence: 0
      };
      slip.status = 'unavailable';
    }
  }

  /**
   * Check for duplicate requests
   */
  private checkForDuplicates(slip: PaperSlip): void {
    const timeWindow = this.settings.duplicateTimeWindow * 60 * 1000; // Convert to ms
    const cutoffTime = slip.timestamp - timeWindow;

    for (const existingSlip of this.slips.values()) {
      if (existingSlip.id === slip.id || existingSlip.timestamp < cutoffTime) continue;

      // Check for same singer with same song
      if (existingSlip.singerName.toLowerCase() === slip.singerName.toLowerCase()) {
        if (this.songsAreSimilar(existingSlip.requestedSong, slip.requestedSong) ||
            (existingSlip.matchedSong && slip.matchedSong && existingSlip.matchedSong.id === slip.matchedSong.id)) {
          slip.isDuplicate = true;
          slip.duplicateOf = existingSlip.id;
          slip.status = 'duplicate';
          console.log(`[PaperWorkflow] Duplicate detected: ${slip.singerName} - ${slip.requestedSong}`);
          break;
        }
      }
    }
  }

  /**
   * Check if two song requests are similar
   */
  private songsAreSimilar(song1: string, song2: string): boolean {
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const norm1 = normalize(song1);
    const norm2 = normalize(song2);
    
    // Exact match
    if (norm1 === norm2) return true;
    
    // Length difference too large
    if (Math.abs(norm1.length - norm2.length) > 5) return false;
    
    // Simple similarity check
    const shorter = norm1.length < norm2.length ? norm1 : norm2;
    const longer = norm1.length >= norm2.length ? norm1 : norm2;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) {
        matches++;
      }
    }
    
    return (matches / shorter.length) > 0.8;
  }

  /**
   * Manually match a slip to a song
   */
  matchSlip(slipId: string, songId: string): boolean {
    const slip = this.slips.get(slipId);
    const song = this.songLibrary.find(s => s.id === songId);
    
    if (!slip || !song) return false;

    slip.matchedSong = song;
    slip.parsedSong = {
      artist: song.artist,
      title: song.title,
      confidence: 1.0
    };
    slip.status = 'matched';

    this.emit('slipMatched', slip);
    return true;
  }

  /**
   * Update slip status
   */
  updateSlipStatus(slipId: string, status: PaperSlip['status'], notes?: string): boolean {
    const slip = this.slips.get(slipId);
    if (!slip) return false;

    const oldStatus = slip.status;
    slip.status = status;
    
    if (notes) {
      slip.kjNotes = notes;
    }

    console.log(`[PaperWorkflow] Updated slip ${slipId}: ${oldStatus} -> ${status}`);
    this.emit('slipStatusChanged', slip);
    
    return true;
  }

  /**
   * Add or update quick entry template
   */
  addTemplate(name: string, pattern: string, songId: string): string {
    const templateId = `template_${Date.now()}`;
    const template: QuickEntryTemplate = {
      id: templateId,
      name,
      pattern,
      songId,
      usage: 0
    };

    this.templates.set(templateId, template);
    console.log(`[PaperWorkflow] Added template: ${name}`);
    
    return templateId;
  }

  /**
   * Use quick entry template
   */
  useTemplate(templateId: string): Song | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    template.usage++;
    const song = this.songLibrary.find(s => s.id === template.songId);
    return song || null;
  }

  /**
   * Get suggestions for partial input
   */
  getSuggestions(query: string, limit: number = 10): Array<{
    type: 'song' | 'singer' | 'template';
    item: Song | string | QuickEntryTemplate;
    confidence: number;
  }> {
    const suggestions: Array<{ type: 'song' | 'singer' | 'template'; item: Song | string | QuickEntryTemplate; confidence: number }> = [];

    // Song suggestions
    if (this.songFuse) {
      const songResults = this.songFuse.search(query, { limit: limit / 2 });
      for (const result of songResults) {
        suggestions.push({
          type: 'song',
          item: result.item,
          confidence: 1 - (result.score || 0)
        });
      }
    }

    // Template suggestions
    for (const template of this.templates.values()) {
      const regex = new RegExp(template.pattern, 'i');
      if (regex.test(query)) {
        suggestions.push({
          type: 'template',
          item: template,
          confidence: 0.9
        });
      }
    }

    // Singer name suggestions (from recent slips)
    const recentSingers = new Set<string>();
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
    
    for (const slip of this.slips.values()) {
      if (slip.timestamp > cutoffTime) {
        recentSingers.add(slip.singerName);
      }
    }

    for (const singer of recentSingers) {
      if (singer.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          type: 'singer',
          item: singer,
          confidence: 0.8
        });
      }
    }

    // Sort by confidence and limit
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * Get all slips with optional filtering
   */
  getSlips(filter?: {
    status?: PaperSlip['status'][];
    priority?: PaperSlip['priority'][];
    singer?: string;
    limit?: number;
  }): PaperSlip[] {
    let slips = Array.from(this.slips.values());

    if (filter) {
      if (filter.status && Array.isArray(filter.status)) {
        const statusArray = filter.status;
        slips = slips.filter(s => statusArray.includes(s.status));
      }
      if (filter.priority && Array.isArray(filter.priority)) {
        const priorityArray = filter.priority;
        slips = slips.filter(s => priorityArray.includes(s.priority));
      }
      if (filter.singer) {
        const query = filter.singer.toLowerCase();
        slips = slips.filter(s => s.singerName.toLowerCase().includes(query));
      }
    }

    // Sort by priority, then timestamp
    slips.sort((a, b) => {
      const priorityOrder = { vip: 3, high: 2, normal: 1 };
      const aPriority = priorityOrder[a.priority] || 1;
      const bPriority = priorityOrder[b.priority] || 1;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      return a.timestamp - b.timestamp; // Earlier timestamp first
    });

    return filter?.limit ? slips.slice(0, filter.limit) : slips;
  }

  /**
   * Get slip by ID
   */
  getSlip(id: string): PaperSlip | undefined {
    return this.slips.get(id);
  }

  /**
   * Delete a slip
   */
  deleteSlip(slipId: string): boolean {
    const deleted = this.slips.delete(slipId);
    if (deleted) {
      this.updateSlipIndex();
      this.emit('slipDeleted', slipId);
    }
    return deleted;
  }

  /**
   * Get workflow statistics
   */
  getStats(): WorkflowStats {
    const slips = Array.from(this.slips.values());
    const songCounts = new Map<string, number>();
    const singerCounts = new Map<string, number>();

    for (const slip of slips) {
      // Count songs
      const songKey = slip.matchedSong ? 
        `${slip.matchedSong.artist} - ${slip.matchedSong.title}` : 
        slip.requestedSong;
      songCounts.set(songKey, (songCounts.get(songKey) || 0) + 1);

      // Count singers
      singerCounts.set(slip.singerName, (singerCounts.get(slip.singerName) || 0) + 1);
    }

    const topRequestedSongs = Array.from(songCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([song, count]) => ({ song, count }));

    const busiestSingers = Array.from(singerCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([singer, count]) => ({ singer, count }));

    const averageProcessingTime = this.processingTimes.length > 0 
      ? this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length
      : 0;

    return {
      totalSlips: slips.length,
      pendingSlips: slips.filter(s => s.status === 'pending').length,
      matchedSlips: slips.filter(s => s.status === 'matched').length,
      queuedSlips: slips.filter(s => s.status === 'queued').length,
      duplicateSlips: slips.filter(s => s.status === 'duplicate').length,
      averageProcessingTime,
      topRequestedSongs,
      busiestSingers
    };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<WorkflowSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('[PaperWorkflow] Settings updated');
    this.emit('settingsUpdated', this.settings);
  }

  /**
   * Get current settings
   */
  getSettings(): WorkflowSettings {
    return { ...this.settings };
  }

  /**
   * Initialize default templates
   */
  private initializeTemplates(): void {
    // Add some common quick entry patterns
    this.addTemplate('Popular Classic', 'dont stop|believer|livin|prayer', 'popular_song_id');
    this.addTemplate('Karaoke Staples', 'sweet caroline|piano man|friends', 'staple_song_id');
  }

  /**
   * Update slip search index
   */
  private updateSlipIndex(): void {
    const slips = Array.from(this.slips.values());
    this.slipFuse = new Fuse(slips, {
      keys: ['singerName', 'requestedSong', 'notes'],
      threshold: 0.3
    });
  }

  /**
   * Search slips
   */
  searchSlips(query: string): PaperSlip[] {
    if (!this.slipFuse) {
      this.updateSlipIndex();
    }
    
    return this.slipFuse ? 
      this.slipFuse.search(query).map(result => result.item) : 
      [];
  }

  /**
   * Clear all slips (for new session)
   */
  clearSlips(): void {
    this.slips.clear();
    this.updateSlipIndex();
    console.log('[PaperWorkflow] All slips cleared');
    this.emit('slipsCleared');
  }

  /**
   * Export slips data
   */
  exportSlips(): PaperSlip[] {
    return Array.from(this.slips.values());
  }

  /**
   * Import slips data
   */
  importSlips(slips: PaperSlip[]): number {
    let imported = 0;
    for (const slip of slips) {
      if (!this.slips.has(slip.id)) {
        this.slips.set(slip.id, slip);
        imported++;
      }
    }
    
    this.updateSlipIndex();
    console.log(`[PaperWorkflow] Imported ${imported} slips`);
    
    return imported;
  }
}

// Export singleton instance
export const paperWorkflow = new PaperWorkflowManager([]);
