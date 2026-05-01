import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Centered API Configuration
 * 
 * In development (Expo Go), we dynamically detect the host's IP address.
 * For web, we use localhost.
 * Manual fallback is provided for cases where detection fails.
 */

// Your computer's local IP address (Update this if it changes and detection fails)
const MANUAL_FALLBACK_IP = '192.168.8.184'; 
const PORT = '5000';

const getBaseUrl = () => {
  // 1. If running on web, always use localhost
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}`;
  }

  // 2. Try to get the host IP from Expo Constants (Debugger host)
  // This usually works for Expo Go on physical devices and emulators
  const debuggerHost = Constants.expoConfig?.hostUri;
  const detectedIP = debuggerHost?.split(':').shift();

  if (detectedIP) {
    console.log(`[API] Detected host IP: ${detectedIP}`);
    return `http://${detectedIP}:${PORT}`;
  }

  // 3. Fallback to manually specified IP for physical devices if detection fails
  console.warn(`[API] Failed to detect host IP, falling back to ${MANUAL_FALLBACK_IP}`);
  return `http://${MANUAL_FALLBACK_IP}:${PORT}`;
};

export const API_BASE_URL = getBaseUrl();

export default {
    API_BASE_URL,
};
