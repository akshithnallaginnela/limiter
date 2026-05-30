import { create } from 'zustand';

interface UserProfile {
  id: string;
  email: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email) => {
    // Standard mock user sync (mirroring extension auth logic)
    const mockUserId = 'usr_' + btoa(email).replace(/=/g, '').toLowerCase().substring(0, 16);
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: mockUserId,
          email: email
        })
      });

      if (response.ok) {
        const data = await response.json();
        set({ user: { id: data.id, email: data.email }, isAuthenticated: true });
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      // Local fallback for offline demo
      set({ user: { id: mockUserId, email }, isAuthenticated: true });
      return true;
    }
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  }
}));
