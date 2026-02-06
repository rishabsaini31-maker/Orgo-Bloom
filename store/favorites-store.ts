import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoriteItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  weight: string;
  imageUrl?: string;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (item) => {
        const { favorites } = get();
        const exists = favorites.find((f) => f.productId === item.productId);

        if (!exists) {
          set({ favorites: [...favorites, item] });
        }
      },

      removeFavorite: (productId) => {
        set({
          favorites: get().favorites.filter((f) => f.productId !== productId),
        });
      },

      isFavorite: (productId) => {
        return get().favorites.some((f) => f.productId === productId);
      },

      clearFavorites: () => {
        set({ favorites: [] });
      },
    }),
    {
      name: "favorites-storage",
    },
  ),
);
