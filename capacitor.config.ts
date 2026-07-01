import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neerugam.app',
  appName: 'NeerUgam',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  }
};

export default config;
