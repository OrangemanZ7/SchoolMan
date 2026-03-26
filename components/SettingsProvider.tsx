'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Role {
  id: string;
  name: string;
}

interface Settings {
  systemName: string;
  logoUrl?: string;
  lowInventoryThreshold: number;
  enableEmailNotifications: boolean;
  rolePermissions: Record<string, Record<string, { access: boolean; create: boolean; read: boolean; update: boolean; delete: boolean }>>;
  roles: Role[];
}

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  systemName: 'Prof. João Florentino',
  logoUrl: '',
  lowInventoryThreshold: 50,
  enableEmailNotifications: true,
  rolePermissions: {},
  roles: [
    { id: 'admin', name: 'Administrador' },
    { id: 'manager', name: 'Gerente' },
    { id: 'purchaser', name: 'Comprador' },
    { id: 'warehouse', name: 'Almoxarifado' },
    { id: 'dependency', name: 'Dependência' }
  ],
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
          systemName: data.systemName || 'Prof. João Florentino',
          logoUrl: data.logoUrl || '',
          lowInventoryThreshold: data.lowInventoryThreshold || 50,
          enableEmailNotifications: data.enableEmailNotifications ?? true,
          rolePermissions: data.rolePermissions || {},
          roles: data.roles || defaultSettings.roles,
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
