/**
 * Storage utility for managing profile data in Chrome storage
 */

const StorageManager = {
    /**
     * Get profile data from Chrome storage
     * @returns {Promise<UserProfile|null>}
     */
    async getProfile() {
        try {
            const result = await chrome.storage.local.get(STORAGE_KEYS.profile);
            return result[STORAGE_KEYS.profile] || null;
        } catch (error) {
            console.error('Error getting profile from storage:', error);
            return null;
        }
    },

    /**
     * Save profile data to Chrome storage
     * @param {UserProfile} profile
     * @returns {Promise<boolean>}
     */
    async saveProfile(profile) {
        try {
            await chrome.storage.local.set({
                [STORAGE_KEYS.profile]: profile,
                [STORAGE_KEYS.lastSync]: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('Error saving profile to storage:', error);
            return false;
        }
    },

    /**
     * Sync profile from dashboard's localStorage
     * This requires the dashboard to be open in a tab
     * @returns {Promise<UserProfile|null>}
     */
    async syncFromDashboard() {
        try {
            // Find the dashboard tab
            const tabs = await chrome.tabs.query({ url: 'http://localhost:3000/*' });

            if (tabs.length === 0) {
                throw new Error('Dashboard not found. Please open the dashboard at http://localhost:3000');
            }

            // Execute script in dashboard tab to get localStorage data
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    const profileData = localStorage.getItem('jobAutofillProfile');
                    return profileData ? JSON.parse(profileData) : null;
                }
            });

            const profile = results[0]?.result;

            if (profile) {
                await this.saveProfile(profile);
                return profile;
            }

            return null;
        } catch (error) {
            console.error('Error syncing from dashboard:', error);
            throw error;
        }
    },

    /**
     * Get settings from Chrome storage
     * @returns {Promise<Object>}
     */
    async getSettings() {
        try {
            const result = await chrome.storage.local.get(STORAGE_KEYS.settings);
            return result[STORAGE_KEYS.settings] || DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Error getting settings:', error);
            return DEFAULT_SETTINGS;
        }
    },

    /**
     * Save settings to Chrome storage
     * @param {Object} settings
     * @returns {Promise<boolean>}
     */
    async saveSettings(settings) {
        try {
            await chrome.storage.local.set({
                [STORAGE_KEYS.settings]: settings
            });
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    },

    /**
     * Get last sync timestamp
     * @returns {Promise<string|null>}
     */
    async getLastSync() {
        try {
            const result = await chrome.storage.local.get(STORAGE_KEYS.lastSync);
            return result[STORAGE_KEYS.lastSync] || null;
        } catch (error) {
            console.error('Error getting last sync time:', error);
            return null;
        }
    },

    /**
     * Clear all stored data
     * @returns {Promise<boolean>}
     */
    async clearAll() {
        try {
            await chrome.storage.local.clear();
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    },

    /**
     * Export profile as JSON string
     * @returns {Promise<string|null>}
     */
    async exportProfile() {
        try {
            const profile = await this.getProfile();
            return profile ? JSON.stringify(profile, null, 2) : null;
        } catch (error) {
            console.error('Error exporting profile:', error);
            return null;
        }
    },

    /**
     * Import profile from JSON string
     * @param {string} jsonString
     * @returns {Promise<boolean>}
     */
    async importProfile(jsonString) {
        try {
            const profile = JSON.parse(jsonString);
            return await this.saveProfile(profile);
        } catch (error) {
            console.error('Error importing profile:', error);
            return false;
        }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
