import { apiFetch } from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const data = await apiFetch<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem('mapsphere_token', data.token);
    localStorage.setItem('mapsphere_user', JSON.stringify(data.user));
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await apiFetch<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('mapsphere_token', data.token);
    localStorage.setItem('mapsphere_user', JSON.stringify(data.user));
    return data;
  },

  async getProfile(): Promise<User> {
    return apiFetch<User>('/api/v1/users/me');
  },

  logout(): void {
    localStorage.removeItem('mapsphere_token');
    localStorage.removeItem('mapsphere_user');
  },

  getCurrentUser(): User | null {
    const stored = localStorage.getItem('mapsphere_user');
    return stored ? JSON.parse(stored) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('mapsphere_token');
  },
};
