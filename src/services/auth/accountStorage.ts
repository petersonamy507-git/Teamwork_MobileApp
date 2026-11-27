import * as SecureStore from 'expo-secure-store';

/** One signed-in Crewdesk account kept on this device (token stays in the keychain/keystore). */
export type StoredAccount = { userId: number; name: string; email: string; color?: string | null; role?: string; token: string };

const KEY = 'crewdesk_accounts';

export const accountStorage = {
  async list(): Promise<StoredAccount[]> {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      const parsed = raw ? (JSON.parse(raw) as StoredAccount[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  async save(list: StoredAccount[]) {
    if (list.length) await SecureStore.setItemAsync(KEY, JSON.stringify(list));
    else await SecureStore.deleteItemAsync(KEY);
  },
  async upsert(a: StoredAccount) {
    const list = (await this.list()).filter((x) => x.userId !== a.userId);
    await this.save([...list, a]);
  },
  async remove(userId: number) {
    await this.save((await this.list()).filter((x) => x.userId !== userId));
  },
};
