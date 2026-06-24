import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionUser } from './api';

export interface StoreInfo {
  id: string;
  name: string;
  brandId?: string;
  address?: string;
  isActive?: boolean;
  contactName?: string;
  updatedAt?: string;
}

interface AppState {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;

  currentStore: StoreInfo | null;
  setCurrentStore: (store: StoreInfo | null) => void;

  stores: StoreInfo[];
  setStores: (stores: StoreInfo[]) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  clearAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),

      currentStore: null,
      setCurrentStore: (currentStore) => set({ currentStore }),

      stores: [],
      setStores: (stores) => set({ stores }),

      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      clearAll: () => set({
        user: null,
        currentStore: null,
        stores: [],
      }),
    }),
    {
      name: 'fastfood-kitchen-storage',
      partialize: (state) => ({
        currentStore: state.currentStore,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

export function useCurrentStoreId(): string | undefined {
  return useAppStore((state) => state.currentStore?.id);
}

export function useHasRole(roles: string[]): boolean {
  const user = useAppStore((state) => state.user);
  if (!user) return false;
  return roles.includes(user.role);
}
