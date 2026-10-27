import { create } from "zustand";

export interface AuthUser {
  userId: number;
  username: string;
  fullName: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: AuthUser | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user, isInitialized: true, isLoading: false }),

  fetchUser: async () => {
    if (get().isLoading) return;

    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        set({ user: data?.user ?? null, isInitialized: true, isLoading: false });
      } else {
        set({ user: null, isInitialized: true, isLoading: false });
      }
    } catch {
      set({ user: null, isInitialized: true, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      set({ user: null, isInitialized: true, isLoading: false });
    }
  },
}));
