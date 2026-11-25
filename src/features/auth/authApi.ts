import { apiClient } from '../../services/api';
import type { User } from '../../types/models';

export interface AuthResponse {
  token: string;
  user: User;
}

// Existing endpoints: POST /api/auth/login and GET /api/auth/me (bearer token, no refresh token).
export const authApi = {
  login: (email: string, password: string) => apiClient.post<AuthResponse>('/auth/login', { email, password }),
  me: () => apiClient.get<User>('/auth/me'),
};
