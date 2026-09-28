import { apiFetch } from './api';
import { SearchResult } from '../types';

export const searchService = {
  async search(query: string, lat?: number, lng?: number): Promise<SearchResult[]> {
    let url = `/api/v1/search?q=${encodeURIComponent(query)}`;
    if (lat !== undefined && lng !== undefined) {
      url += `&lat=${lat}&lng=${lng}`;
    }
    return apiFetch<SearchResult[]>(url);
  },

  async reverseGeocode(lat: number, lng: number): Promise<SearchResult> {
    return apiFetch<SearchResult>(`/api/v1/search/reverse?lat=${lat}&lng=${lng}`);
  },
};
