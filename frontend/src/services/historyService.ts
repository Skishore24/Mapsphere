import { apiFetch } from './api';
import { RouteHistoryItem, SearchHistoryItem } from '../types';

export const historyService = {
  async getSearchHistory(): Promise<SearchHistoryItem[]> {
    return apiFetch<SearchHistoryItem[]>('/api/v1/history/search');
  },

  async clearSearchHistory(): Promise<void> {
    return apiFetch<void>('/api/v1/history/search', { method: 'DELETE' });
  },

  async getRouteHistory(): Promise<RouteHistoryItem[]> {
    return apiFetch<RouteHistoryItem[]>('/api/v1/history/routes');
  },

  async clearRouteHistory(): Promise<void> {
    return apiFetch<void>('/api/v1/history/routes', { method: 'DELETE' });
  },
};
