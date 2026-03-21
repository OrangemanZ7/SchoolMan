'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  systemName: string;
  lowInventoryThreshold: number;
  enableEmailNotifications: boolean;
}

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  systemName: 'EduSupply Chain',
  lowInventoryThreshold: 50,
  enableEmailNotifications: true,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          systemName: data.systemName || 'EduSupply Chain',
          lowInventoryThreshold: data.lowInventoryThreshold || 50,
          enableEmailNotifications: data.enableEmailNotifications ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
