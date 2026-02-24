import { createContext, useContext, useEffect, useState } from 'react';

interface Config {
  companyName: string;
  redirectUrl: string;
}

const defaultConfig: Config = { companyName: 'Company', redirectUrl: '/' };
const ConfigContext = createContext<Config>(defaultConfig);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config>(defaultConfig);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  return useContext(ConfigContext);
}
