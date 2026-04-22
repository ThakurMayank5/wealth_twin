import { Platform } from 'react-native';

// For Android emulator, localhost maps to 10.0.2.2
// For iOS simulator, localhost works
// For physical device, use your machine's IP
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:42069';
  }
  return 'http://localhost:42069';
};

export const API_BASE_URL = getBaseUrl();
export const API_V1 = `${API_BASE_URL}/api/v1`;
