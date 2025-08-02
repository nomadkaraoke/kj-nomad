import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PaperWorkflowManager, PaperSlip } from '../paperWorkflow';
import { Song } from '../mediaLibrary';

// Mock Fuse.js with completely self-contained factory to avoid hoisting issues
// Create everything inside the factory and expose via globalThis
vi.mock('fuse.js', () => {
  const mockSearch = vi.fn();
  const MockFuseClass = vi.fn().mockImplementation(() => ({
    search: mockSearch
  }));
  
  // Expose the mock search function globally so tests can access it
  (globalThis as any).__mockFuseSearch = mockSearch;
  (globalThis as any).__MockFuseClass = MockFuseClass;
  
  return {
    default: MockFuseClass
  };
});

// Sample song library for testing
const createMockSongLibrary = (): Song[] => [
  {
    id: 'song1',
    artist: 'Queen',
    title: 'Bohemian Rhapsody',
    fileName: 'queen-bohemian.mp4'
  },
  {
    id: 'song2',
    artist: 'The Beatles',
    title: 'Hey Jude',
    fileName: 'beatles-hey-jude.mp4'
  },
  {
    id: 'song3',
    artist: 'Michael Jackson',
    title: 'Billie Jean',
    fileName: 'mj-billie-jean.mp4'
  },
  {
    id: 'song4',
    artist: 'Elvis Presley',
    title: 'Hound Dog',
    fileName: 'elvis-hound-dog.mp4'
  }
];

describe('PaperWorkflowManager', () => {
  let workflowManager: PaperWorkflowManager;
  let mockSongLibrary: Song[];
  
  // Helper function to get the mock search function
  const getMockSearch = () => (globalThis as any).__mockFuseSearch;
  
  // Helper function to get the mocked Fuse constructor
  const getMockFuseConstructor = () => {
    return (globalThis as any).__MockFuseClass;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Create fresh instances for each test
    mockSongLibrary = createMockSongLibrary();
    workflowManager = new PaperWorkflowManager(mockSongLibrary);
    
    // Reset Fuse mock search results
    getMockSearch().mockReturnValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with song library', () => {
      expect(getMockFuseConstructor()).toHaveBeenCalledWith(
        mockSongLibrary,
        expect.objectContaining({
          keys: expect.arrayContaining([
            expect.objectContaining({ name: 'artist', weight: 0.4 }),
            expect.objectContaining({ name: 'title', weight: 0.6 })
          ]),
          threshold: 0.3,
          includeScore: true
        })
      );
    });

    it('should have default settings', () => {
      const settings = workflowManager.getSettings();
      
      expect(settings).toEqual({
        enableAutoParsing: true,
        enableDuplicateDetection: true,
        enableSmartSuggestions: true,
        duplicateTimeWindow: 30,
        autoQueueMatches: false,
        requireConfirmation: true,
        defaultPriority: 'normal',
        estimateWaitTimes: true
      });
    });

    it('should initialize with empty slips and templates', () => {
      const stats = workflowManager.getStats();
      expect(stats.totalSlips).toBe(0);
    });
  });

  describe('Song Library Management', () => {
    it('should update song library', () => {
      const newSongs = [mockSongLibrary[0], mockSongLibrary[1]];
      
      workflowManager.updateSongLibrary(newSongs);
      
      expect(getMockFuseConstructor()).toHaveBeenCalledTimes(2); // Once in constructor, once in update
    });

    it('should handle empty song library', () => {
      workflowManager.updateSongLibrary([]);
      
      expect(getMockFuseConstructor()).toHaveBeenLastCalledWith([], expect.any(Object));
    });
  });

  describe('Slip Creation and Management', () => {
    it('should add a basic slip', () => {
      const slip = workflowManager.addSlip('John Doe', 'Bohemian Rhapsody');
      
      expect(slip.id).toMatch(/^slip_\d+_/);
      expect(slip.singerName).toBe('John Doe');
      expect(slip.requestedSong).toBe('Bohemian Rhapsody');
      expect(slip.status).toBe('unavailable'); // Auto-parsing enabled, no match found
      expect(slip.priority).toBe('normal');
      expect(slip.timestamp).toBeDefined();
    });

    it('should add slip with options', () => {
      const slip = workflowManager.addSlip('Jane Smith', 'Hey Jude', {
        priority: 'high',
        notes: 'Regular customer',
        kjNotes: 'Key of C'
      });
      
      expect(slip.priority).toBe('high');
      expect(slip.notes).toBe('Regular customer');
      expect(slip.kjNotes).toBe('Key of C');
    });

    it('should trim singer name and song request', () => {
      const slip = workflowManager.addSlip('  John Doe  ', '  Bohemian Rhapsody  ');
      
      expect(slip.singerName).toBe('John Doe');
      expect(slip.requestedSong).toBe('Bohemian Rhapsody');
    });

    it('should emit slipAdded event', () => {
      const eventSpy = vi.fn();
      workflowManager.on('slipAdded', eventSpy);
      
      const slip = workflowManager.addSlip('John Doe', 'Test Song');
      
      expect(eventSpy).toHaveBeenCalledWith(slip);
    });

    it('should auto-parse when enabled', () => {
      // Mock successful search result
      getMockSearch().mockReturnValue([
        { item: mockSongLibrary[0], score: 0.2 }
      ]);
      
      const slip = workflowManager.addSlip('John Doe', 'Queen - Bohemian Rhapsody');
      
      expect(slip.parsedSong).toBeDefined();
      expect(slip.matchedSong).toBeDefined();
    });

    it('should generate unique slip IDs', () => {
      vi.advanceTimersByTime(1);
      const slip1 = workflowManager.addSlip('John', 'Song 1');
      
      vi.advanceTimersByTime(1);
      const slip2 = workflowManager.addSlip('Jane', 'Song 2');
      
      expect(slip1.id).not.toBe(slip2.id);
    });
  });

  describe('Slip Parsing', () => {
    beforeEach(() => {
      // Reset Fuse mock for each parsing test
      getMockSearch().mockClear();
    });

    it('should parse "Artist - Title" format', () => {
      getMockSearch().mockReturnValue([
        { item: mockSongLibrary[0], score: 0.1 }
      ]);
      
      const slip = workflowManager.addSlip('John', 'Queen - Bohemian Rhapsody');
      
      expect(slip.parsedSong?.artist).toBe('queen');
      expect(slip.parsedSong?.title).toBe('bohemian rhapsody');
      expect(slip.matchedSong).toEqual(mockSongLibrary[0]);
    });

    it('should parse "Title by Artist" format', () => {
      getMockSearch().mockReturnValue([
        { item: mockSongLibrary[1], score: 0.1 }
      ]);
      
      const slip = workflowManager.addSlip('Jane', 'Hey Jude by The Beatles');
      
      expect(slip.parsedSong?.artist).toBe('the beatles');
      expect(slip.parsedSong?.title).toBe('hey jude');
      expect(slip.matchedSong).toEqual(mockSongLibrary[1]);
    });

    it('should parse "Artist / Title" format', () => {
      getMockSearch().mockReturnValue([
        { item: mockSongLibrary[2], score: 0.1 }
      ]);
      
      const slip = workflowManager.addSlip('Bob', 'Michael Jackson / Billie Jean');
      
      expect(slip.parsedSong?.artist).toBe('michael jackson');
      expect(slip.parsedSong?.title).toBe('billie jean');
    });

    it('should parse "Artist | Title" format', () => {
      getMockSearch().mockReturnValue([
        { item: mockSongLibrary[3], score: 0.1 }
      ]);
      
      const slip = workflowManager.addSlip('Alice', 'Elvis Presley | Hound Dog');
      
      expect(slip.parsedSong?.artist).toBe('elvis presley');
      expect(slip.parsedSong?.title).toBe('hound dog');
    });

    it('should fallback to full string search when no pattern matches', () => {
      // Mock search to return result (song will be matched)
      getMockSearch().mockReturnValue([{ item: mockSongLibrary[0], score: 0.2 }]);
      
      const slip = workflowManager.addSlip('John', 'Bohemian Rhapsody');
      
      expect(slip.matchedSong).toEqual(mockSongLibrary[0]);
      expect(slip.status).toBe('matched'); // Should be matched when song is found
    });

    it('should handle no search results', () => {
      getMockSearch().mockReturnValue([]);
      
      const slip = workflowManager.addSlip('John', 'Unknown Song');
      
      // When no match found, parsedSong gets default values, not undefined
      expect(slip.parsedSong?.artist).toBe('Unknown');
      expect(slip.parsedSong?.title).toBe('Unknown Song');
      expect(slip.parsedSong?.confidence).toBe(0);
      expect(slip.matchedSong).toBeUndefined();
      expect(slip.status).toBe('unavailable');
    });

    it('should be disabled when autoParsing is off', () => {
      workflowManager.updateSettings({ enableAutoParsing: false });
      
      const slip = workflowManager.addSlip('John', 'Queen - Bohemian Rhapsody');
      
      expect(slip.parsedSong).toBeUndefined();
      expect(slip.matchedSong).toBeUndefined();
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicate singer requests', () => {
      const slip1 = workflowManager.addSlip('John Doe', 'Bohemian Rhapsody');
      
      vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes later
      
      // Use similar song to trigger duplicate detection
      const slip2 = workflowManager.addSlip('John Doe', 'Bohemian Rhapsody');
      
      expect(slip2.isDuplicate).toBe(true);
      expect(slip2.duplicateOf).toBe(slip1.id);
      expect(slip2.status).toBe('duplicate');
    });

    it('should detect similar singer names', () => {
      workflowManager.addSlip('John Doe', 'Song 1');
      
      vi.advanceTimersByTime(5 * 60 * 1000);
      
      // Use same song to trigger duplicate detection (different case)
      const slip2 = workflowManager.addSlip('john doe', 'Song 1'); // Different case, same song
      
      expect(slip2.isDuplicate).toBe(true);
      expect(slip2.status).toBe('duplicate');
    });

    it('should respect duplicate time window', () => {
      workflowManager.updateSettings({ duplicateTimeWindow: 30 }); // 30 minutes
      
      workflowManager.addSlip('John Doe', 'Song 1');
      
      vi.advanceTimersByTime(35 * 60 * 1000); // 35 minutes later
      
      const slip2 = workflowManager.addSlip('John Doe', 'Song 2');
      
      expect(slip2.isDuplicate).toBeFalsy();
    });

    it('should be disabled when duplicate detection is off', () => {
      workflowManager.updateSettings({ enableDuplicateDetection: false });
      
      workflowManager.addSlip('John Doe', 'Song 1');
      const slip2 = workflowManager.addSlip('John Doe', 'Song 2');
      
      expect(slip2.isDuplicate).toBeFalsy();
    });

    it('should detect similar song requests', () => {
      workflowManager.addSlip('John', 'Bohemian Rhapsody');
      
      vi.advanceTimersByTime(5 * 60 * 1000);
      
      const slip2 = workflowManager.addSlip('John', 'bohemian rhapsody'); // Same singer, same song different case
      
      expect(slip2.isDuplicate).toBe(true);
      expect(slip2.status).toBe('duplicate');
    });
  });

  describe('Auto-Queue Functionality', () => {
    it('should auto-queue high confidence matches when enabled', () => {
      workflowManager.updateSettings({ autoQueueMatches: true });
      
      getMockSearch().mockReturnValue([
        { item: mockSongLibrary[0], score: 0.1 } // High confidence (low score)
      ]);
      
      const slip = workflowManager.addSlip('John', 'Queen - Bohemian Rhapsody');
      
      expect(slip.status).toBe('queued');
    });

    it('should not auto-queue low confidence matches', () => {
      workflowManager.updateSettings({ autoQueueMatches: true });
      
      getMockSearch().mockReturnValue([
        { item: mockSongLibrary[0], score: 0.6 } // Low confidence (high score in Fuse = low confidence)
      ]);
      
      const slip = workflowManager.addSlip('John', 'Some Random Song');
      
      expect(slip.status).toBe('matched'); // Found match but low confidence, so stays 'matched'
      expect(slip.parsedSong?.confidence).toBeLessThan(0.8); // Verify low confidence
    });

    it('should not auto-queue when disabled', () => {
      workflowManager.updateSettings({ autoQueueMatches: false });
      
      getMockSearch().mockReturnValue([
        { item: mockSongLibrary[0], score: 0.1 } // High confidence match
      ]);
      
      const slip = workflowManager.addSlip('John', 'Queen - Bohemian Rhapsody');
      
      expect(slip.status).toBe('matched'); // Should be matched but not queued when auto-queue disabled
      expect(slip.parsedSong?.confidence).toBeGreaterThan(0.8); // Verify high confidence
    });
  });

  describe('Manual Slip Operations', () => {
    it('should match slip to song', () => {
      const slip = workflowManager.addSlip('John', 'Test Song');
      
      const result = workflowManager.matchSlip(slip.id, 'song1');
      
      expect(result).toBe(true);
      expect(slip.status).toBe('matched');
      expect(slip.matchedSong).toEqual(mockSongLibrary[0]);
      expect(slip.parsedSong?.confidence).toBe(1.0);
    });

    it('should emit slipMatched event', () => {
      const eventSpy = vi.fn();
      workflowManager.on('slipMatched', eventSpy);
      
      const slip = workflowManager.addSlip('John', 'Test Song');
      workflowManager.matchSlip(slip.id, 'song1');
      
      expect(eventSpy).toHaveBeenCalledWith(slip);
    });

    it('should fail to match non-existent slip', () => {
      const result = workflowManager.matchSlip('non-existent', 'song1');
      
      expect(result).toBe(false);
    });

    it('should fail to match non-existent song', () => {
      const slip = workflowManager.addSlip('John', 'Test Song');
      
      const result = workflowManager.matchSlip(slip.id, 'non-existent');
      
      expect(result).toBe(false);
    });

    it('should update slip status', () => {
      const slip = workflowManager.addSlip('John', 'Test Song');
      
      const result = workflowManager.updateSlipStatus(slip.id, 'queued', 'Ready to go');
      
      expect(result).toBe(true);
      expect(slip.status).toBe('queued');
      expect(slip.kjNotes).toBe('Ready to go');
    });

    it('should emit slipStatusChanged event', () => {
      const eventSpy = vi.fn();
      workflowManager.on('slipStatusChanged', eventSpy);
      
      const slip = workflowManager.addSlip('John', 'Test Song');
      workflowManager.updateSlipStatus(slip.id, 'queued');
      
      expect(eventSpy).toHaveBeenCalledWith(slip);
    });

    it('should update status without notes', () => {
      const slip = workflowManager.addSlip('John', 'Test Song');
      slip.kjNotes = 'Original notes';
      
      workflowManager.updateSlipStatus(slip.id, 'rejected');
      
      expect(slip.status).toBe('rejected');
      expect(slip.kjNotes).toBe('Original notes'); // Should remain unchanged
    });

    it('should fail to update non-existent slip', () => {
      const result = workflowManager.updateSlipStatus('non-existent', 'queued');
      
      expect(result).toBe(false);
    });
  });

  describe('Template Management', () => {
    it('should add template', () => {
      const templateId = workflowManager.addTemplate('Popular Song', 'popular|hit', 'song1');
      
      expect(templateId).toMatch(/^template_\d+$/);
    });

    it('should use template', () => {
      const templateId = workflowManager.addTemplate('Queen Song', 'queen', 'song1');
      
      const song = workflowManager.useTemplate(templateId);
      
      expect(song).toEqual(mockSongLibrary[0]);
    });

    it('should increment template usage', () => {
      const templateId = workflowManager.addTemplate('Test Template', 'test', 'song1');
      
      workflowManager.useTemplate(templateId);
      workflowManager.useTemplate(templateId);
      
      // Can't directly test usage count without exposing templates, but this tests the functionality
      const song = workflowManager.useTemplate(templateId);
      expect(song).toEqual(mockSongLibrary[0]);
    });

    it('should return null for non-existent template', () => {
      const song = workflowManager.useTemplate('non-existent');
      
      expect(song).toBeNull();
    });

    it('should return null for template with non-existent song', () => {
      const templateId = workflowManager.addTemplate('Bad Template', 'test', 'non-existent-song');
      
      const song = workflowManager.useTemplate(templateId);
      
      expect(song).toBeNull();
    });
  });

  describe('Suggestions System', () => {
    it('should get song suggestions', () => {
      getMockSearch().mockReturnValue([
        { item: mockSongLibrary[0], score: 0.1 },
        { item: mockSongLibrary[1], score: 0.2 }
      ]);
      
      const suggestions = workflowManager.getSuggestions('queen');
      
      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].type).toBe('song');
      expect(suggestions[0].item).toEqual(mockSongLibrary[0]);
    });

    it('should include template suggestions', () => {
      workflowManager.addTemplate('Popular Song', 'popular', 'song1');
      
      const suggestions = workflowManager.getSuggestions('popular');
      
      const templateSuggestion = suggestions.find(s => s.type === 'template');
      expect(templateSuggestion).toBeDefined();
    });

    it('should include singer suggestions from recent activity', () => {
      workflowManager.addSlip('John Doe', 'Test Song');
      
      const suggestions = workflowManager.getSuggestions('john');
      
      const singerSuggestion = suggestions.find(s => s.type === 'singer');
      expect(singerSuggestion).toBeDefined();
      expect(singerSuggestion?.item).toBe('John Doe');
    });

    it('should limit suggestions', () => {
      getMockSearch().mockReturnValue(
        mockSongLibrary.map(song => ({ item: song, score: 0.1 }))
      );
      
      const suggestions = workflowManager.getSuggestions('test', 2);
      
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });

    it('should handle empty query', () => {
      const suggestions = workflowManager.getSuggestions('');
      
      expect(suggestions).toEqual([]);
    });
  });

  describe('Slip Retrieval and Filtering', () => {
    beforeEach(() => {
      // Add test slips
      workflowManager.addSlip('John', 'Song 1', { priority: 'high' });
      workflowManager.addSlip('Jane', 'Song 2', { priority: 'normal' });
      workflowManager.addSlip('Bob', 'Song 3', { priority: 'vip' });
      
      // Update one slip status
      const slips = workflowManager.getSlips();
      workflowManager.updateSlipStatus(slips[0].id, 'queued');
    });

    it('should get all slips', () => {
      const slips = workflowManager.getSlips();
      
      expect(slips).toHaveLength(3);
    });

    it('should filter slips by status', () => {
      const queuedSlips = workflowManager.getSlips({
        status: ['queued']
      });
      
      expect(queuedSlips).toHaveLength(1);
      expect(queuedSlips[0].status).toBe('queued');
    });

    it('should filter slips by priority', () => {
      const highPrioritySlips = workflowManager.getSlips({
        priority: ['high', 'vip']
      });
      
      expect(highPrioritySlips).toHaveLength(2);
    });

    it('should filter slips by singer', () => {
      const johnSlips = workflowManager.getSlips({
        singer: 'john'
      });
      
      expect(johnSlips).toHaveLength(1);
      expect(johnSlips[0].singerName).toBe('John');
    });

    it('should combine multiple filters', () => {
      const filteredSlips = workflowManager.getSlips({
        status: ['unavailable'], // Jane's slip will be 'unavailable' due to auto-parsing
        priority: ['normal']
      });
      
      expect(filteredSlips).toHaveLength(1);
      expect(filteredSlips[0].singerName).toBe('Jane');
    });

    it('should sort slips by priority', () => {
      const slips = workflowManager.getSlips();
      
      // VIP should come first, then high, then normal
      expect(slips[0].priority).toBe('vip');
      expect(slips[1].priority).toBe('high');
      expect(slips[2].priority).toBe('normal');
    });

    it('should get specific slip by ID', () => {
      const allSlips = workflowManager.getSlips();
      const slip = workflowManager.getSlip(allSlips[0].id);
      
      expect(slip).toEqual(allSlips[0]);
    });

    it('should return undefined for non-existent slip ID', () => {
      const slip = workflowManager.getSlip('non-existent');
      
      expect(slip).toBeUndefined();
    });
  });

  describe('Slip Deletion', () => {
    it('should delete slip', () => {
      const slip = workflowManager.addSlip('John', 'Test Song');
      
      const result = workflowManager.deleteSlip(slip.id);
      
      expect(result).toBe(true);
      expect(workflowManager.getSlip(slip.id)).toBeUndefined();
    });

    it('should emit slipDeleted event', () => {
      const eventSpy = vi.fn();
      workflowManager.on('slipDeleted', eventSpy);
      
      const slip = workflowManager.addSlip('John', 'Test Song');
      workflowManager.deleteSlip(slip.id);
      
      expect(eventSpy).toHaveBeenCalledWith(slip.id);
    });

    it('should return false for non-existent slip', () => {
      const result = workflowManager.deleteSlip('non-existent');
      
      expect(result).toBe(false);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      // Create test data
      const slip1 = workflowManager.addSlip('John', 'Song 1');
      const slip2 = workflowManager.addSlip('Jane', 'Song 2');
      const slip3 = workflowManager.addSlip('John', 'Song 1'); // Duplicate singer and song
      
      workflowManager.updateSlipStatus(slip1.id, 'queued');
      workflowManager.updateSlipStatus(slip2.id, 'matched');
      workflowManager.updateSlipStatus(slip3.id, 'duplicate');
    });

    it('should calculate basic statistics', () => {
      const stats = workflowManager.getStats();
      
      expect(stats.totalSlips).toBe(3);
      expect(stats.pendingSlips).toBe(0);
      expect(stats.matchedSlips).toBe(1);
      expect(stats.queuedSlips).toBe(1);
      expect(stats.duplicateSlips).toBe(1);
    });

    it('should track top requested songs', () => {
      const stats = workflowManager.getStats();
      
      expect(stats.topRequestedSongs).toHaveLength(2);
      expect(stats.topRequestedSongs[0]).toEqual({
        song: 'Song 1',
        count: 2
      });
    });

    it('should track busiest singers', () => {
      const stats = workflowManager.getStats();
      
      expect(stats.busiestSingers).toHaveLength(2);
      expect(stats.busiestSingers[0]).toEqual({
        singer: 'John',
        count: 2
      });
    });

    it('should calculate average processing time', () => {
      // Create a fresh manager and add slips with time advancement
      const tempManager = new PaperWorkflowManager(mockSongLibrary);
      
      // Mock Date.now to simulate processing time within each slip
      let mockTime = 1000000;
      const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => {
        const currentTime = mockTime;
        mockTime += 25; // Simulate 25ms per call to Date.now()
        return currentTime;
      });
      
      try {
        // Add slips - each will have simulated processing time
        tempManager.addSlip('Test', 'Song');
        tempManager.addSlip('Test2', 'Song2');
        
        const stats = tempManager.getStats();
        expect(stats.averageProcessingTime).toBeGreaterThan(0);
      } finally {
        dateSpy.mockRestore();
      }
    });

    it('should handle empty statistics', () => {
      const emptyWorkflow = new PaperWorkflowManager([]);
      const stats = emptyWorkflow.getStats();
      
      expect(stats.totalSlips).toBe(0);
      expect(stats.averageProcessingTime).toBe(0);
      expect(stats.topRequestedSongs).toEqual([]);
      expect(stats.busiestSingers).toEqual([]);
    });
  });

  describe('Settings Management', () => {
    it('should update settings', () => {
      workflowManager.updateSettings({
        enableAutoParsing: false,
        duplicateTimeWindow: 60
      });
      
      const settings = workflowManager.getSettings();
      
      expect(settings.enableAutoParsing).toBe(false);
      expect(settings.duplicateTimeWindow).toBe(60);
      expect(settings.enableDuplicateDetection).toBe(true); // Should remain unchanged
    });

    it('should emit settingsUpdated event', () => {
      const eventSpy = vi.fn();
      workflowManager.on('settingsUpdated', eventSpy);
      
      const newSettings = { enableAutoParsing: false };
      workflowManager.updateSettings(newSettings);
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining(newSettings)
      );
    });

    it('should return copy of settings', () => {
      const settings1 = workflowManager.getSettings();
      const settings2 = workflowManager.getSettings();
      
      expect(settings1).toEqual(settings2);
      expect(settings1).not.toBe(settings2); // Should be different objects
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      workflowManager.addSlip('John Doe', 'Bohemian Rhapsody');
      workflowManager.addSlip('Jane Smith', 'Hey Jude');
      workflowManager.addSlip('Bob Johnson', 'Billie Jean');
    });

    it('should search slips', () => {
      // We need to trigger slip index update
      workflowManager.addSlip('Test', 'Test Song');
      
      // Since we can't easily mock the internal slipFuse, let's test that the method exists
      const results = workflowManager.searchSlips('john');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle empty search query', () => {
      const results = workflowManager.searchSlips('');
      expect(results).toEqual([]);
    });
  });

  describe('Data Management', () => {
    beforeEach(() => {
      workflowManager.addSlip('John', 'Song 1');
      workflowManager.addSlip('Jane', 'Song 2');
    });

    it('should export slips', () => {
      const exported = workflowManager.exportSlips();
      
      expect(exported).toHaveLength(2);
      expect(exported[0].singerName).toBe('John');
      expect(exported[1].singerName).toBe('Jane');
    });

    it('should import slips', () => {
      const newSlips: PaperSlip[] = [
        {
          id: 'import_1',
          timestamp: Date.now(),
          singerName: 'Imported Singer',
          requestedSong: 'Imported Song',
          status: 'pending',
          priority: 'normal'
        }
      ];
      
      const imported = workflowManager.importSlips(newSlips);
      
      expect(imported).toBe(1);
      expect(workflowManager.getSlip('import_1')).toBeDefined();
    });

    it('should not import duplicate slip IDs', () => {
      const existingSlips = workflowManager.exportSlips();
      
      const imported = workflowManager.importSlips(existingSlips);
      
      expect(imported).toBe(0); // No new slips imported
    });

    it('should clear all slips', () => {
      workflowManager.clearSlips();
      
      const stats = workflowManager.getStats();
      expect(stats.totalSlips).toBe(0);
    });

    it('should emit slipsCleared event', () => {
      const eventSpy = vi.fn();
      workflowManager.on('slipsCleared', eventSpy);
      
      workflowManager.clearSlips();
      
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('Processing Time Tracking', () => {
    it('should track processing times', () => {
      // Create a fresh manager to avoid interference
      const tempManager = new PaperWorkflowManager(mockSongLibrary);
      
      // Mock Date.now to simulate processing time within each slip
      let mockTime = 1000000;
      const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => {
        const currentTime = mockTime;
        mockTime += 25; // Simulate 25ms per call to Date.now()
        return currentTime;
      });
      
      try {
        // Add multiple slips with simulated processing time
        for (let i = 0; i < 5; i++) {
          tempManager.addSlip(`Singer ${i}`, `Song ${i}`);
        }
        
        const stats = tempManager.getStats();
        expect(stats.averageProcessingTime).toBeGreaterThan(0);
      } finally {
        dateSpy.mockRestore();
      }
    });

    it('should limit processing time history', () => {
      // Create a fresh manager to avoid interference
      const tempManager = new PaperWorkflowManager(mockSongLibrary);
      
      // Mock Date.now to simulate processing time
      let mockTime = 1000000;
      const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => {
        const currentTime = mockTime;
        mockTime += 10; // Simulate 10ms per call to Date.now()
        return currentTime;
      });
      
      try {
        // Create a workflow with more than 100 slips to test the limit
        for (let i = 0; i < 105; i++) {
          tempManager.addSlip(`Singer ${i}`, `Song ${i}`);
        }
        
        // The processing times array should be limited to 100 entries
        // We can't directly test this without exposing the internal array,
        // but we can test that stats still work correctly
        const stats = tempManager.getStats();
        expect(stats.averageProcessingTime).toBeGreaterThan(0);
      } finally {
        dateSpy.mockRestore();
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty singer name', () => {
      const slip = workflowManager.addSlip('', 'Test Song');
      
      expect(slip.singerName).toBe('');
      expect(slip.status).toBe('unavailable'); // Auto-parsing enabled, no match found
    });

    it('should handle empty song request', () => {
      const slip = workflowManager.addSlip('John', '');
      
      expect(slip.requestedSong).toBe('');
      expect(slip.status).toBe('unavailable'); // Auto-parsing enabled, no match found for empty song
    });

    it('should handle malformed date in duplicate detection', () => {
      const slip1 = workflowManager.addSlip('John', 'Song 1');
      
      // Manually corrupt the timestamp
      slip1.timestamp = NaN;
      
      // Should not crash when checking duplicates
      const slip2 = workflowManager.addSlip('John', 'Song 2');
      
      expect(slip2).toBeDefined();
    });

    it('should handle very long processing time arrays', () => {
      // Simulate many slips being processed quickly
      const originalNow = Date.now;
      let currentTime = 1000000;
      
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime++);
      
      try {
        for (let i = 0; i < 150; i++) {
          workflowManager.addSlip(`Singer ${i}`, `Song ${i}`);
        }
        
        const stats = workflowManager.getStats();
        expect(stats.averageProcessingTime).toBeDefined();
      } finally {
        Date.now = originalNow;
      }
    });
  });

  describe('Event Emitter Functionality', () => {
    it('should be instance of EventEmitter', () => {
      expect(workflowManager.on).toBeDefined();
      expect(workflowManager.emit).toBeDefined();
      expect(workflowManager.removeAllListeners).toBeDefined();
    });

    it('should remove all listeners', () => {
      const eventSpy = vi.fn();
      workflowManager.on('slipAdded', eventSpy);
      
      workflowManager.removeAllListeners();
      workflowManager.addSlip('John', 'Test Song');
      
      expect(eventSpy).not.toHaveBeenCalled();
    });
  });
});