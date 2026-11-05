import { Platform } from 'react-native';

// In development:
// - Android Studio Emulator uses 10.0.2.2 to connect directly to host machine
// - Web / iOS Simulator uses localhost:5080
// - Physical device over Wi-Fi can override via EXPO_PUBLIC_API_URL (e.g. http://192.168.31.231:5080/api)
const DEV_HOST = Platform.select({
  android: 'http://10.0.2.2:5080',
  default: 'http://localhost:5080',
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `${DEV_HOST}/api`;

