/**
 * Helper utility to manage VitalIQ onboarding and dashboard preferences.
 * Handles both guests (via localStorage 'vitaliq_onboarding') and logged-in users.
 */

/**
 * Checks if the current session is a guest session.
 * A session is considered a guest if there is no logged-in user,
 * or if the stored user is explicitly marked as a guest, demo, or mock google.
 * 
 * @returns {boolean}
 */
export const isGuestSession = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('vitaliq_user') || 'null');
    if (!storedUser) return true;
    return (
      storedUser.isGuest ||
      storedUser.role === 'guest' ||
      storedUser.isMockGoogle ||
      storedUser.role === 'demo'
    );
  } catch (error) {
    return true;
  }
};

/**
 * Gets the current preferences.
 * 
 * @returns {Object} preferences
 */
export const getVitaliqPreferences = () => {
  try {
    if (isGuestSession()) {
      return JSON.parse(localStorage.getItem('vitaliq_onboarding') || '{}');
    } else {
      const storedUser = JSON.parse(localStorage.getItem('vitaliq_user') || '{}');
      return storedUser.preferences || {};
    }
  } catch (error) {
    console.error('Error reading preferences:', error);
    return {};
  }
};

/**
 * Saves preferences locally.
 * NOTE: For logged-in users, this updates the local cache. The calling function
 * should also make a backend API request to update the database.
 * 
 * @param {Object} preferences 
 */
export const saveVitaliqPreferences = (preferences) => {
  try {
    if (isGuestSession()) {
      localStorage.setItem('vitaliq_onboarding', JSON.stringify(preferences));
    } else {
      const storedUser = JSON.parse(localStorage.getItem('vitaliq_user') || '{}');
      storedUser.preferences = preferences;
      localStorage.setItem('vitaliq_user', JSON.stringify(storedUser));
    }
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
};

/**
 * Clears preferences.
 */
export const clearVitaliqPreferences = () => {
  try {
    localStorage.removeItem('vitaliq_onboarding');
    const storedUser = JSON.parse(localStorage.getItem('vitaliq_user') || 'null');
    if (storedUser) {
      storedUser.preferences = {};
      localStorage.setItem('vitaliq_user', JSON.stringify(storedUser));
    }
  } catch (error) {
    console.error('Error clearing preferences:', error);
  }
};

/**
 * Merges updates into current preferences and saves.
 * 
 * @param {Object} updates 
 * @returns {Object} merged preferences
 */
export const mergeVitaliqPreferences = (updates) => {
  const current = getVitaliqPreferences();
  const merged = { ...current, ...updates };
  saveVitaliqPreferences(merged);
  return merged;
};
