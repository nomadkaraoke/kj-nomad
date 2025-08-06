import React, { useState, useEffect } from 'react';

import { Input } from '../ui/Input';

interface SingerProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  favoriteGenres: string[];
  favoriteSongs: string[];
  totalSongsPerformed: number;
  averageRating?: number;
  notes: string;
  vipStatus: boolean;
  preferredKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PerformanceRecord {
  id: string;
  singerId: string;
  songId: string;
  songTitle: string;
  artist: string;
  rating?: number;
  notes?: string;
  sessionId?: string;
  venue?: string;
  performedAt: Date;
}

interface SingerStats {
  totalPerformances: number;
  averageRating: number;
  favoriteGenres: string[];
  topSongs: Array<{ title: string; artist: string; count: number }>;
  performanceHistory: PerformanceRecord[];
}

export const SingerProfiles: React.FC = () => {
  const [profiles, setProfiles] = useState<SingerProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<SingerProfile | null>(null);
  const [stats, setStats] = useState<SingerStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state for creating new profiles
  const [newProfile, setNewProfile] = useState({
    name: '',
    email: '',
    phone: '',
    favoriteGenres: '',
    notes: '',
    vipStatus: false,
    preferredKey: ''
  });

  // Fetch all profiles
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/singers');
      const data = await response.json();
      if (data.success) {
        setProfiles(data.data);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch singer statistics
  const fetchStats = async (singerId: string) => {
    try {
      const response = await fetch(`/api/singers/${singerId}/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Create new profile
  const createProfile = async () => {
    try {
      const profileData = {
        ...newProfile,
        favoriteGenres: newProfile.favoriteGenres.split(',').map(g => g.trim()).filter(g => g)
      };

      const response = await fetch('/api/singers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      if (data.success) {
        setProfiles([...profiles, data.data]);
        setNewProfile({
          name: '',
          email: '',
          phone: '',
          favoriteGenres: '',
          notes: '',
          vipStatus: false,
          preferredKey: ''
        });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  // Search profiles
  const searchProfiles = async (query: string) => {
    if (!query.trim()) {
      fetchProfiles();
      return;
    }

    try {
      const response = await fetch(`/api/singers/search/${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setProfiles(data.data);
      }
    } catch (error) {
      console.error('Error searching profiles:', error);
    }
  };

  // Toggle VIP status
  const toggleVipStatus = async (profile: SingerProfile) => {
    try {
      const response = await fetch(`/api/singers/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vipStatus: !profile.vipStatus })
      });

      const data = await response.json();
      if (data.success) {
        setProfiles(profiles.map(p => p.id === profile.id ? data.data : p));
        if (selectedProfile?.id === profile.id) {
          setSelectedProfile(data.data);
        }
      }
    } catch (error) {
      console.error('Error updating VIP status:', error);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      fetchStats(selectedProfile.id);
    }
  }, [selectedProfile]);

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Singer Profiles</h1>
        <button onClick={() => setShowCreateForm(true)}>
          Add New Singer
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search singers..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchProfiles(e.target.value);
          }}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profiles List */}
        <div className="lg:col-span-1">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">
              Singers ({filteredProfiles.length})
            </h2>
            
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedProfile?.id === profile.id
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {profile.totalSongsPerformed} songs performed
                        </div>
                      </div>
                      {profile.vipStatus && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          VIP
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          {selectedProfile ? (
            <div className="space-y-6">
              {/* Profile Info */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedProfile.name}</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Member since {new Date(selectedProfile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleVipStatus(selectedProfile)}
                    variant={selectedProfile.vipStatus ? "primary" : "secondary"}
                  >
                    {selectedProfile.vipStatus ? 'Remove VIP' : 'Make VIP'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Contact Info</h3>
                    <p className="text-sm">Email: {selectedProfile.email || 'Not provided'}</p>
                    <p className="text-sm">Phone: {selectedProfile.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Preferences</h3>
                    <p className="text-sm">Preferred Key: {selectedProfile.preferredKey || 'None'}</p>
                    <p className="text-sm">
                      Genres: {selectedProfile.favoriteGenres.join(', ') || 'None specified'}
                    </p>
                  </div>
                </div>

                {selectedProfile.notes && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      {selectedProfile.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Statistics */}
              {stats && (
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Performance Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.totalPerformances}
                      </div>
                      <div className="text-sm text-gray-600">Total Performances</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Average Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.favoriteGenres.length}
                      </div>
                      <div className="text-sm text-gray-600">Favorite Genres</div>
                    </div>
                  </div>

                  {stats.topSongs.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Top Songs</h4>
                      <div className="space-y-2">
                        {stats.topSongs.slice(0, 5).map((song, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm">
                              {song.title} by {song.artist}
                            </span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {song.count}x
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Select a singer to view their profile and statistics
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Profile Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Add New Singer</h2>
            
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Singer Name *"
                value={newProfile.name}
                onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
              />
              
              <Input
                type="email"
                placeholder="Email"
                value={newProfile.email}
                onChange={(e) => setNewProfile({ ...newProfile, email: e.target.value })}
              />
              
              <Input
                type="tel"
                placeholder="Phone"
                value={newProfile.phone}
                onChange={(e) => setNewProfile({ ...newProfile, phone: e.target.value })}
              />
              
              <Input
                type="text"
                placeholder="Favorite Genres (comma-separated)"
                value={newProfile.favoriteGenres}
                onChange={(e) => setNewProfile({ ...newProfile, favoriteGenres: e.target.value })}
              />
              
              <Input
                type="text"
                placeholder="Preferred Key"
                value={newProfile.preferredKey}
                onChange={(e) => setNewProfile({ ...newProfile, preferredKey: e.target.value })}
              />
              
              <textarea
                className="w-full p-2 border rounded resize-none"
                placeholder="Notes"
                rows={3}
                value={newProfile.notes}
                onChange={(e) => setNewProfile({ ...newProfile, notes: e.target.value })}
              />
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newProfile.vipStatus}
                  onChange={(e) => setNewProfile({ ...newProfile, vipStatus: e.target.checked })}
                />
                <span>VIP Status</span>
              </label>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                variant="secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
              <button
                onClick={createProfile}
                disabled={!newProfile.name.trim()}
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
