import fs from 'fs';
import { getDataPath, ensureDataDirExists } from './dataPath.js';

export interface SingerProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  favoriteGenres: string[];
  favoriteSongs: string[];
  totalSongsPerformed: number;
  averageRating?: number;
  lastPerformance?: Date;
  notes: string;
  vipStatus: boolean;
  preferredKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceRecord {
  id: string;
  singerId: string;
  songId: string;
  songTitle: string;
  artist: string;
  performedAt: Date;
  rating?: number; // 1-5 stars
  notes?: string;
  sessionId?: string;
  venue?: string;
}

export interface SingerStats {
  totalPerformances: number;
  favoriteGenres: { genre: string; count: number }[];
  topSongs: { title: string; artist: string; count: number }[];
  averageRating: number;
  lastSeen: Date;
  performanceHistory: PerformanceRecord[];
}

class SingerProfileManager {
  private profiles: Map<string, SingerProfile> = new Map();
  private performances: Map<string, PerformanceRecord> = new Map();
  private profilesFile: string;
  private performancesFile: string;

  constructor() {
    this.profilesFile = getDataPath('singer-profiles.json');
    this.performancesFile = getDataPath('performance-records.json');
    this.ensureDataDirectory();
    this.loadData();
  }

  /**
   * Create or update a singer profile
   */
  public createProfile(profileData: Omit<SingerProfile, 'id' | 'createdAt' | 'updatedAt'>): SingerProfile {
    const id = this.generateId();
    const now = new Date();
    
    const profile: SingerProfile = {
      id,
      ...profileData,
      createdAt: now,
      updatedAt: now
    };

    this.profiles.set(id, profile);
    this.saveProfiles();
    
    console.log(`[SingerProfiles] Created profile for ${profile.name} (${id})`);
    return profile;
  }

  /**
   * Update an existing singer profile
   */
  public updateProfile(id: string, updates: Partial<Omit<SingerProfile, 'id' | 'createdAt'>>): SingerProfile | null {
    const profile = this.profiles.get(id);
    if (!profile) {
      return null;
    }

    const updatedProfile: SingerProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date()
    };

    this.profiles.set(id, updatedProfile);
    this.saveProfiles();
    
    console.log(`[SingerProfiles] Updated profile for ${updatedProfile.name} (${id})`);
    return updatedProfile;
  }

  /**
   * Get a singer profile by ID
   */
  public getProfile(id: string): SingerProfile | null {
    return this.profiles.get(id) || null;
  }

  /**
   * Find singer profiles by name (fuzzy search)
   */
  public findProfilesByName(name: string): SingerProfile[] {
    const searchTerm = name.toLowerCase().trim();
    return Array.from(this.profiles.values())
      .filter(profile => 
        profile.name.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get all singer profiles
   */
  public getAllProfiles(): SingerProfile[] {
    return Array.from(this.profiles.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Delete a singer profile
   */
  public deleteProfile(id: string): boolean {
    const profile = this.profiles.get(id);
    if (!profile) {
      return false;
    }

    this.profiles.delete(id);
    
    // Also delete associated performance records
    const performancesToDelete = Array.from(this.performances.values())
      .filter(p => p.singerId === id)
      .map(p => p.id);
    
    performancesToDelete.forEach(perfId => this.performances.delete(perfId));
    
    this.saveProfiles();
    this.savePerformances();
    
    console.log(`[SingerProfiles] Deleted profile for ${profile.name} (${id}) and ${performancesToDelete.length} performance records`);
    return true;
  }

  /**
   * Record a performance for a singer
   */
  public recordPerformance(performanceData: Omit<PerformanceRecord, 'id' | 'performedAt'>): PerformanceRecord {
    const id = this.generateId();
    const performance: PerformanceRecord = {
      id,
      ...performanceData,
      performedAt: new Date()
    };

    this.performances.set(id, performance);
    
    // Update singer profile stats
    const profile = this.profiles.get(performance.singerId);
    if (profile) {
      profile.totalSongsPerformed++;
      profile.lastPerformance = performance.performedAt;
      
      // Add to favorite songs if not already there
      const songKey = `${performance.artist} - ${performance.songTitle}`;
      if (!profile.favoriteSongs.includes(songKey)) {
        profile.favoriteSongs.push(songKey);
      }
      
      // Update average rating if rating provided
      if (performance.rating) {
        const allRatings = this.getPerformanceHistory(performance.singerId)
          .map(p => p.rating)
          .filter(r => r !== undefined) as number[];
        allRatings.push(performance.rating);
        profile.averageRating = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
      }
      
      profile.updatedAt = new Date();
      this.profiles.set(profile.id, profile);
    }

    this.savePerformances();
    this.saveProfiles();
    
    console.log(`[SingerProfiles] Recorded performance: ${performance.songTitle} by ${performance.artist} for singer ${performance.singerId}`);
    return performance;
  }

  /**
   * Get performance history for a singer
   */
  public getPerformanceHistory(singerId: string): PerformanceRecord[] {
    return Array.from(this.performances.values())
      .filter(p => p.singerId === singerId)
      .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
  }

  /**
   * Get comprehensive stats for a singer
   */
  public getSingerStats(singerId: string): SingerStats | null {
    const profile = this.profiles.get(singerId);
    if (!profile) {
      return null;
    }

    const performances = this.getPerformanceHistory(singerId);
    
    // Calculate favorite genres (based on song patterns)
    const genreCounts = new Map<string, number>();
    performances.forEach(p => {
      // Simple genre detection based on artist/song patterns
      const genre = this.detectGenre(p.artist, p.songTitle);
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    });

    const favoriteGenres = Array.from(genreCounts.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate top songs
    const songCounts = new Map<string, { title: string; artist: string; count: number }>();
    performances.forEach(p => {
      const key = `${p.artist} - ${p.songTitle}`;
      const existing = songCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        songCounts.set(key, { title: p.songTitle, artist: p.artist, count: 1 });
      }
    });

    const topSongs = Array.from(songCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate average rating
    const ratings = performances
      .map(p => p.rating)
      .filter(r => r !== undefined) as number[];
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
      : 0;

    return {
      totalPerformances: performances.length,
      favoriteGenres,
      topSongs,
      averageRating,
      lastSeen: profile.lastPerformance || profile.createdAt,
      performanceHistory: performances.slice(0, 20) // Last 20 performances
    };
  }

  /**
   * Get VIP singers
   */
  public getVipSingers(): SingerProfile[] {
    return Array.from(this.profiles.values())
      .filter(p => p.vipStatus)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get singers by performance count
   */
  public getTopPerformers(limit: number = 10): SingerProfile[] {
    return Array.from(this.profiles.values())
      .sort((a, b) => b.totalSongsPerformed - a.totalSongsPerformed)
      .slice(0, limit);
  }

  /**
   * Search singers by various criteria
   */
  public searchSingers(criteria: {
    name?: string;
    vipOnly?: boolean;
    minPerformances?: number;
    favoriteGenre?: string;
  }): SingerProfile[] {
    let results = Array.from(this.profiles.values());

    if (criteria.name) {
      const searchTerm = criteria.name.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(searchTerm)
      );
    }

    if (criteria.vipOnly) {
      results = results.filter(p => p.vipStatus);
    }

    if (criteria.minPerformances !== undefined) {
      const minPerformances = criteria.minPerformances;
      results = results.filter(p => p.totalSongsPerformed >= minPerformances);
    }

    if (criteria.favoriteGenre) {
      const favoriteGenre = criteria.favoriteGenre;
      results = results.filter(p => 
        p.favoriteGenres.some(g => 
          g.toLowerCase().includes(favoriteGenre.toLowerCase())
        )
      );
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Export singer data for backup
   */
  public exportData(): { profiles: SingerProfile[]; performances: PerformanceRecord[] } {
    return {
      profiles: Array.from(this.profiles.values()),
      performances: Array.from(this.performances.values())
    };
  }

  /**
   * Import singer data from backup
   */
  public importData(data: { profiles: SingerProfile[]; performances: PerformanceRecord[] }): void {
    // Clear existing data
    this.profiles.clear();
    this.performances.clear();

    // Import profiles
    data.profiles.forEach(profile => {
      this.profiles.set(profile.id, {
        ...profile,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
        lastPerformance: profile.lastPerformance ? new Date(profile.lastPerformance) : undefined
      });
    });

    // Import performances
    data.performances.forEach(performance => {
      this.performances.set(performance.id, {
        ...performance,
        performedAt: new Date(performance.performedAt)
      });
    });

    this.saveProfiles();
    this.savePerformances();
    
    console.log(`[SingerProfiles] Imported ${data.profiles.length} profiles and ${data.performances.length} performances`);
  }

  // Private methods

  private ensureDataDirectory(): void {
    ensureDataDirExists();
  }

  private loadData(): void {
    this.loadProfiles();
    this.loadPerformances();
  }

  private loadProfiles(): void {
    try {
      if (fs.existsSync(this.profilesFile)) {
        const data = fs.readFileSync(this.profilesFile, 'utf8');
        const profiles: SingerProfile[] = JSON.parse(data);
        
        profiles.forEach(profile => {
          this.profiles.set(profile.id, {
            ...profile,
            createdAt: new Date(profile.createdAt),
            updatedAt: new Date(profile.updatedAt),
            lastPerformance: profile.lastPerformance ? new Date(profile.lastPerformance) : undefined
          });
        });
        
        console.log(`[SingerProfiles] Loaded ${profiles.length} singer profiles`);
      }
    } catch (error) {
      console.error('[SingerProfiles] Failed to load profiles:', error);
    }
  }

  private loadPerformances(): void {
    try {
      if (fs.existsSync(this.performancesFile)) {
        const data = fs.readFileSync(this.performancesFile, 'utf8');
        const performances: PerformanceRecord[] = JSON.parse(data);
        
        performances.forEach(performance => {
          this.performances.set(performance.id, {
            ...performance,
            performedAt: new Date(performance.performedAt)
          });
        });
        
        console.log(`[SingerProfiles] Loaded ${performances.length} performance records`);
      }
    } catch (error) {
      console.error('[SingerProfiles] Failed to load performances:', error);
    }
  }

  private saveProfiles(): void {
    try {
      const profiles = Array.from(this.profiles.values());
      fs.writeFileSync(this.profilesFile, JSON.stringify(profiles, null, 2));
    } catch (error) {
      console.error('[SingerProfiles] Failed to save profiles:', error);
    }
  }

  private savePerformances(): void {
    try {
      const performances = Array.from(this.performances.values());
      fs.writeFileSync(this.performancesFile, JSON.stringify(performances, null, 2));
    } catch (error) {
      console.error('[SingerProfiles] Failed to save performances:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectGenre(artist: string, title: string): string {
    const text = `${artist} ${title}`.toLowerCase();
    
    // Simple genre detection based on keywords
    if (text.includes('rock') || text.includes('metal') || text.includes('punk')) return 'Rock';
    if (text.includes('country') || text.includes('nashville')) return 'Country';
    if (text.includes('jazz') || text.includes('blues')) return 'Jazz/Blues';
    if (text.includes('pop') || text.includes('dance')) return 'Pop';
    if (text.includes('rap') || text.includes('hip hop')) return 'Hip Hop';
    if (text.includes('folk') || text.includes('acoustic')) return 'Folk';
    if (text.includes('r&b') || text.includes('soul')) return 'R&B/Soul';
    if (text.includes('classic') || text.includes('oldies')) return 'Classic';
    
    return 'Other';
  }
}

// Export singleton instance
export const singerProfileManager = new SingerProfileManager();
