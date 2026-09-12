/**
 * Storage Module for ADHD PDF Reader
 * Manages persistence for settings, themes, reading progress, notes, checklists, and gamification.
 */

const STORAGE_KEYS = {
  SETTINGS: 'adhd_reader_settings',
  NOTES: 'adhd_reader_notes',
  CHECKLIST: 'adhd_reader_checklist',
  GAMIFICATION: 'adhd_reader_gamification',
  BOOKMARKS: 'adhd_reader_bookmarks',
  RECENT_FILES: 'adhd_reader_recent'
};

const DEFAULT_SETTINGS = {
  theme: 'cream', // 'cream', 'dark-velvet', 'forest-calm', 'lavender-soft', 'high-contrast'
  fontFamily: 'lexend', // 'lexend', 'atkinson', 'opendyslexic', 'inter'
  fontSize: 18, // px
  lineHeight: 1.8, // multiplier
  letterSpacing: 0.5, // px
  bionicReading: false,
  bionicFixation: 2, // 1, 2, 3 chars
  readingRuler: false,
  rulerHeight: 52, // px
  rulerMode: 'mask', // 'mask' (spotlight) or 'line' (laser bar)
  ttsRate: 1.0,
  ttsPitch: 1.0,
  ttsVoice: null,
  focusTimerDuration: 20, // minutes
  breakTimerDuration: 5, // minutes
  soundVolumes: {
    brown: 0,
    pink: 0,
    binaural40: 0,
    binaural10: 0,
    rain: 0
  },
  adhdPreset: 'custom' // 'inattentive', 'hyperactive', 'combined', 'custom'
};

export class StorageManager {
  static getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
      console.warn('Failed to load settings from localStorage', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  }

  static updateSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this.saveSettings(settings);
    return settings;
  }

  static getNotes(docId = 'default') {
    try {
      const allNotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '{}');
      return allNotes[docId] || [];
    } catch (e) {
      return [];
    }
  }

  static saveNotes(docId = 'default', notes = []) {
    try {
      const allNotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '{}');
      allNotes[docId] = notes;
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(allNotes));
    } catch (e) {
      console.warn('Failed to save notes', e);
    }
  }

  static getChecklist(docId = 'default') {
    try {
      const allChecklists = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHECKLIST) || '{}');
      return allChecklists[docId] || [
        { id: '1', text: 'Read Introduction & Problem Statement', priority: 'high', completed: false },
        { id: '2', text: 'Highlight key takeaways on ADHD types', priority: 'medium', completed: false },
        { id: '3', text: 'Take a 5-minute movement break', priority: 'high', completed: false },
        { id: '4', text: 'Summarize actionable software features', priority: 'low', completed: false }
      ];
    } catch (e) {
      return [];
    }
  }

  static saveChecklist(docId = 'default', items = []) {
    try {
      const allChecklists = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHECKLIST) || '{}');
      allChecklists[docId] = items;
      localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(allChecklists));
    } catch (e) {
      console.warn('Failed to save checklist', e);
    }
  }

  static getGamification() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GAMIFICATION);
      return data ? JSON.parse(data) : {
        xp: 120,
        streak: 3,
        lastActiveDate: new Date().toDateString(),
        pagesRead: 6,
        focusMinutes: 45,
        badges: ['first_read', 'streak_starter']
      };
    } catch (e) {
      return { xp: 0, streak: 1, lastActiveDate: new Date().toDateString(), pagesRead: 0, focusMinutes: 0, badges: [] };
    }
  }

  static saveGamification(data) {
    try {
      localStorage.setItem(STORAGE_KEYS.GAMIFICATION, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save gamification data', e);
    }
  }

  static getAIKey() {
    try {
      return localStorage.getItem('focusflow_ai_apikey') || '';
    } catch (e) {
      console.warn('Failed to load AI API key', e);
      return '';
    }
  }

  static exportAllData() {
    try {
      const data = {
        settings: this.getSettings(),
        notes: localStorage.getItem(STORAGE_KEYS.NOTES),
        checklist: localStorage.getItem(STORAGE_KEYS.CHECKLIST),
        gamification: localStorage.getItem(STORAGE_KEYS.GAMIFICATION),
        bookmarks: localStorage.getItem(STORAGE_KEYS.BOOKMARKS),
        recentFiles: localStorage.getItem(STORAGE_KEYS.RECENT_FILES),
        aiApiKey: localStorage.getItem('focusflow_ai_apikey'),
        exportedAt: new Date().toISOString()
      };
      return JSON.stringify(data, null, 2);
    } catch (e) {
      console.error('Export failed', e);
      throw e;
    }
  }

  static importAllData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.saveSettings(data.settings);
      if (data.notes) localStorage.setItem(STORAGE_KEYS.NOTES, data.notes);
      if (data.checklist) localStorage.setItem(STORAGE_KEYS.CHECKLIST, data.checklist);
      if (data.gamification) localStorage.setItem(STORAGE_KEYS.GAMIFICATION, data.gamification);
      if (data.bookmarks) localStorage.setItem(STORAGE_KEYS.BOOKMARKS, data.bookmarks);
      if (data.recentFiles) localStorage.setItem(STORAGE_KEYS.RECENT_FILES, data.recentFiles);
      if (data.aiApiKey) localStorage.setItem('focusflow_ai_apikey', data.aiApiKey);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      throw e;
    }
  }
}
