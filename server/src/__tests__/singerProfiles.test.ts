import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import { singerProfileManager } from '../singerProfiles.js';

// Mock fs module
vi.mock('fs');
const mockFs = vi.mocked(fs);

describe('SingerProfiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fs functions
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.readFileSync.mockReturnValue('[]');
    mockFs.writeFileSync.mockReturnValue(undefined);
  });

  describe('Profile Management', () => {
    it('should create a singer profile with required fields', () => {
      const profileData = {
        name: 'Test Singer',
        favoriteGenres: ['Rock'],
        favoriteSongs: [],
        totalSongsPerformed: 0,
        notes: 'Test notes',
        vipStatus: false
      };

      const profile = singerProfileManager.createProfile(profileData);

      expect(profile.id).toBeDefined();
      expect(profile.name).toBe('Test Singer');
      expect(profile.favoriteGenres).toEqual(['Rock']);
      expect(profile.vipStatus).toBe(false);
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.updatedAt).toBeInstanceOf(Date);
    });

    it('should update an existing profile', () => {
      const profile = singerProfileManager.createProfile({
        name: 'Original Name',
        favoriteGenres: [],
        favoriteSongs: [],
        totalSongsPerformed: 0,
        notes: '',
        vipStatus: false
      });

      const updated = singerProfileManager.updateProfile(profile.id, {
        name: 'Updated Name',
        vipStatus: true
      });

      expect(updated).toBeTruthy();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.vipStatus).toBe(true);
    });

    it('should return null when updating non-existent profile', () => {
      const result = singerProfileManager.updateProfile('non-existent', { name: 'Test' });
      expect(result).toBeNull();
    });

    it('should delete a profile', () => {
      const profile = singerProfileManager.createProfile({
        name: 'To Delete',
        favoriteGenres: [],
        favoriteSongs: [],
        totalSongsPerformed: 0,
        notes: '',
        vipStatus: false
      });

      const deleted = singerProfileManager.deleteProfile(profile.id);
      expect(deleted).toBe(true);

      const retrieved = singerProfileManager.getProfile(profile.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Performance Recording', () => {
    it('should record a performance', () => {
      const profile = singerProfileManager.createProfile({
        name: 'Performer',
        favoriteGenres: [],
        favoriteSongs: [],
        totalSongsPerformed: 0,
        notes: '',
        vipStatus: false
      });

      const performance = singerProfileManager.recordPerformance({
        singerId: profile.id,
        songId: 'song-1',
        songTitle: 'Test Song',
        artist: 'Test Artist',
        rating: 5
      });

      expect(performance.id).toBeDefined();
      expect(performance.songTitle).toBe('Test Song');
      expect(performance.rating).toBe(5);
      expect(performance.performedAt).toBeInstanceOf(Date);
    });

    it('should update profile stats when recording performance', () => {
      const profile = singerProfileManager.createProfile({
        name: 'Stats Test',
        favoriteGenres: [],
        favoriteSongs: [],
        totalSongsPerformed: 0,
        notes: '',
        vipStatus: false
      });

      singerProfileManager.recordPerformance({
        singerId: profile.id,
        songId: 'song-1',
        songTitle: 'Test Song',
        artist: 'Test Artist',
        rating: 4
      });

      const updated = singerProfileManager.getProfile(profile.id);
      expect(updated?.totalSongsPerformed).toBe(1);
      expect(updated?.averageRating).toBe(4);
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(() => {
      // Create test profiles
      singerProfileManager.createProfile({
        name: 'VIP Singer',
        favoriteGenres: ['Rock'],
        favoriteSongs: [],
        totalSongsPerformed: 10,
        notes: '',
        vipStatus: true
      });

      singerProfileManager.createProfile({
        name: 'Regular Singer',
        favoriteGenres: ['Pop'],
        favoriteSongs: [],
        totalSongsPerformed: 3,
        notes: '',
        vipStatus: false
      });
    });

    it('should find profiles by name', () => {
      const results = singerProfileManager.findProfilesByName('VIP');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('VIP');
    });

    it('should get VIP singers only', () => {
      const vipSingers = singerProfileManager.getVipSingers();
      expect(vipSingers.every(p => p.vipStatus)).toBe(true);
    });

    it('should search by criteria', () => {
      const results = singerProfileManager.searchSingers({ vipOnly: true });
      expect(results.every(p => p.vipStatus)).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should generate singer stats', () => {
      const profile = singerProfileManager.createProfile({
        name: 'Stats Singer',
        favoriteGenres: [],
        favoriteSongs: [],
        totalSongsPerformed: 0,
        notes: '',
        vipStatus: false
      });

      // Record some performances
      singerProfileManager.recordPerformance({
        singerId: profile.id,
        songId: 'song-1',
        songTitle: 'Rock Song',
        artist: 'Rock Band',
        rating: 5
      });

      singerProfileManager.recordPerformance({
        singerId: profile.id,
        songId: 'song-2',
        songTitle: 'Pop Song',
        artist: 'Pop Artist',
        rating: 4
      });

      const stats = singerProfileManager.getSingerStats(profile.id);
      expect(stats).toBeTruthy();
      expect(stats?.totalPerformances).toBe(2);
      expect(stats?.averageRating).toBeCloseTo(4.5);
    });

    it('should return null for non-existent singer stats', () => {
      const stats = singerProfileManager.getSingerStats('non-existent');
      expect(stats).toBeNull();
    });
  });

  describe('Data Export/Import', () => {
    it('should export data', () => {
      singerProfileManager.createProfile({
        name: 'Export Test',
        favoriteGenres: ['Rock'],
        favoriteSongs: [],
        totalSongsPerformed: 0,
        notes: '',
        vipStatus: false
      });

      const exportData = singerProfileManager.exportData();
      expect(exportData.profiles).toBeDefined();
      expect(exportData.performances).toBeDefined();
      expect(Array.isArray(exportData.profiles)).toBe(true);
      expect(Array.isArray(exportData.performances)).toBe(true);
    });

    it('should import data', () => {
      const now = new Date();
      const importData = {
        profiles: [{
          id: 'imported-1',
          name: 'Imported Singer',
          favoriteGenres: ['Jazz'],
          favoriteSongs: [],
          totalSongsPerformed: 5,
          notes: 'Imported',
          vipStatus: true,
          createdAt: now,
          updatedAt: now
        }],
        performances: []
      };

      singerProfileManager.importData(importData);
      const imported = singerProfileManager.getProfile('imported-1');
      expect(imported?.name).toBe('Imported Singer');
    });
  });
});
