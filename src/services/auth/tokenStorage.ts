import * as SecureStore from 'expo-secure-store';

// Same bearer token the web app keeps under `crewdesk_token`; on mobile it lives in the
// iOS Keychain / Android Keystore via expo-secure-store, never in plain AsyncStorage.
const KEY = 'crewdesk_token';
let cached: string | null | undefined;

export const tokenStorage = {
  async get(): Promise<string | null> {
    if (cached !== undefined) return cached;
    cached = await SecureStore.getItemAsync(KEY);
    return cached;
  },
  async set(token: string | null): Promise<void> {
    cached = token;
    if (token) await SecureStore.setItemAsync(KEY, token);
    else await SecureStore.deleteItemAsync(KEY);
  },
};
