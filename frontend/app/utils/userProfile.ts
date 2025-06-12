export interface UserProfileData {
  address: string;
  username?: string;
  bio?: string;
  avatar?: string;
  social?: {
    twitter?: string;
    discord?: string;
    website?: string;
    email?: string;
  };
  preferences?: {
    theme?: 'dark' | 'light';
    notifications?: boolean;
    newsletter?: boolean;
  };
  stats?: {
    collectionsCreated: number;
    nftsOwned: number;
    totalVolume: string;
    joinedDate: string;
  };
  lastUpdated: string;
}

export interface UserActivity {
  id: string;
  type: 'mint' | 'create' | 'transfer' | 'sale' | 'list';
  timestamp: string;
  txHash?: string;
  collectionAddress?: string;
  collectionName?: string;
  tokenId?: string;
  amount?: string;
  from?: string;
  to?: string;
  description: string;
}

export class UserProfileManager {
  private static getStorageKey(address: string): string {
    return `jugiter_profile_${address.toLowerCase()}`;
  }

  private static getActivityKey(address: string): string {
    return `jugiter_activity_${address.toLowerCase()}`;
  }

  static getProfile(address: string): UserProfileData | null {
    try {
      const stored = localStorage.getItem(this.getStorageKey(address));
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  static saveProfile(profile: UserProfileData): boolean {
    try {
      profile.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.getStorageKey(profile.address), JSON.stringify(profile));
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      return false;
    }
  }

  static createDefaultProfile(address: string): UserProfileData {
    return {
      address: address.toLowerCase(),
      username: `User${address.slice(-4)}`,
      bio: '',
      avatar: '',
      social: {},
      preferences: {
        theme: 'dark',
        notifications: true,
        newsletter: false
      },
      stats: {
        collectionsCreated: 0,
        nftsOwned: 0,
        totalVolume: '0',
        joinedDate: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString()
    };
  }

  static getActivity(address: string): UserActivity[] {
    try {
      const stored = localStorage.getItem(this.getActivityKey(address));
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Error getting activity:', error);
      return [];
    }
  }

  static addActivity(address: string, activity: Omit<UserActivity, 'id' | 'timestamp'>): boolean {
    try {
      const activities = this.getActivity(address);
      const newActivity: UserActivity = {
        ...activity,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };
      
      activities.unshift(newActivity);
      
      // Keep only last 100 activities
      const limitedActivities = activities.slice(0, 100);
      
      localStorage.setItem(this.getActivityKey(address), JSON.stringify(limitedActivities));
      return true;
    } catch (error) {
      console.error('Error adding activity:', error);
      return false;
    }
  }

  static updateStats(address: string, stats: Partial<UserProfileData['stats']>): boolean {
    try {
      const profile = this.getProfile(address);
      if (profile) {
        profile.stats = { ...profile.stats, ...stats };
        return this.saveProfile(profile);
      }
      return false;
    } catch (error) {
      console.error('Error updating stats:', error);
      return false;
    }
  }

  static exportProfile(address: string): string {
    const profile = this.getProfile(address);
    const activity = this.getActivity(address);
    
    return JSON.stringify({
      profile,
      activity,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  static importProfile(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.profile && data.profile.address) {
        this.saveProfile(data.profile);
        if (data.activity) {
          localStorage.setItem(this.getActivityKey(data.profile.address), JSON.stringify(data.activity));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing profile:', error);
      return false;
    }
  }
}