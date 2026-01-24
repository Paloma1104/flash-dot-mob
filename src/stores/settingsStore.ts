import { create } from 'zustand';

interface SettingsState {
  // App settings
  hapticFeedbackEnabled: boolean;
  notificationsEnabled: boolean;
  showClusterCounts: boolean;
  mapStyle: 'dark' | 'light' | 'satellite';
  
  // Feature flags (can be updated remotely)
  featureFlags: {
    arModeEnabled: boolean;
    backgroundGeofencingEnabled: boolean;
    pushNotificationsEnabled: boolean;
  };
  
  // Actions
  setHapticFeedback: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setShowClusterCounts: (enabled: boolean) => void;
  setMapStyle: (style: 'dark' | 'light' | 'satellite') => void;
  setFeatureFlags: (flags: Partial<SettingsState['featureFlags']>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  // Initial state
  hapticFeedbackEnabled: true,
  notificationsEnabled: true,
  showClusterCounts: true,
  mapStyle: 'dark',
  featureFlags: {
    arModeEnabled: false,
    backgroundGeofencingEnabled: false,
    pushNotificationsEnabled: false,
  },

  // Actions
  setHapticFeedback: (enabled) => set({ hapticFeedbackEnabled: enabled }),
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  setShowClusterCounts: (enabled) => set({ showClusterCounts: enabled }),
  setMapStyle: (style) => set({ mapStyle: style }),
  setFeatureFlags: (flags) =>
    set((state) => ({
      featureFlags: { ...state.featureFlags, ...flags },
    })),
}));
