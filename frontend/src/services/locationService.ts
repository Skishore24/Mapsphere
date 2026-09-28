import { apiFetch } from './api';
import { ShareSession } from '../types';

export const locationService = {
  async startShare(): Promise<ShareSession> {
    return apiFetch<ShareSession>('/api/v1/location/share', { method: 'POST' });
  },

  async getTrackingSession(shareId: string): Promise<any> {
    return apiFetch<any>(`/api/v1/location/track/${shareId}`);
  },

  async stopShare(shareId: string): Promise<void> {
    return apiFetch<void>(`/api/v1/location/share/${shareId}`, { method: 'DELETE' });
  },
};
