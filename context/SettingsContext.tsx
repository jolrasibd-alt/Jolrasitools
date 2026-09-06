
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface Settings {
  businessName: string;
  website: string;
  facebookPage: string;
  phone: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  businessName: '',
  website: '',
  facebookPage: '',
  phone: '',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export const useSettings = () => useContext(SettingsContext);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const savedSettings = localStorage.getItem('ecomBuzzSettings');
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    } catch (error) {
      console.error("Failed to parse settings from localStorage", error);
      return defaultSettings;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ecomBuzzSettings', JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings to localStorage", error);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
