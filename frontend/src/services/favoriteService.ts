import { apiFetch } from './api';
import { FavoriteItem } from '../types';

export const favoriteService = {
  async getFavorites(): Promise<FavoriteItem[]> {
    return apiFetch<FavoriteItem[]>('/api/v1/favorites');
  },

  async addFavorite(placeId: number, customName?: string, tag?: string): Promise<FavoriteItem> {
    return apiFetch<FavoriteItem>('/api/v1/favorites', {
      method: 'POST',
      body: JSON.stringify({ placeId, customName, tag }),
    });
  },

  async removeFavorite(placeId: number): Promise<void> {
    return apiFetch<void>(`/api/v1/favorites/${placeId}`, {
      method: 'DELETE',
    });
  },
};
