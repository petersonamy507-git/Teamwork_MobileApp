import Constants from 'expo-constants';

/**
 * Base URL of the existing Crewdesk backend, including the `/api` prefix.
 * Set EXPO_PUBLIC_API_URL in mobile/.env (see .env.example). Never hardcode localhost:
 * an Android emulator, an iOS simulator and a physical phone all reach the backend differently.
 */
const raw = process.env.EXPO_PUBLIC_API_URL ?? (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? '';

export const API_URL = raw.replace(/\/+$/, '');
export const API_TIMEOUT_MS = 20_000;
export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
