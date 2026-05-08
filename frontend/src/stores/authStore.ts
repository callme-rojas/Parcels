import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '../types';
import { Rol } from '../types';

interface AuthState {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ─── Mock users for development (remove when backend is ready) ───
const MOCK_USERS: Record<string, { password: string; user: Usuario }> = {
  'admin@travell.com': {
    password: 'admin123',
    user: {
      id: '1',
      nombre: 'Carlos Administrador',
      email: 'admin@travell.com',
      rol: Rol.ADMINISTRADOR,
      activo: true,
    },
  },
  'taquilla@travell.com': {
    password: 'taquilla123',
    user: {
      id: '2',
      nombre: 'María Taquilla',
      email: 'taquilla@travell.com',
      rol: Rol.TAQUILLA,
      activo: true,
    },
  },
  'bodega@travell.com': {
    password: 'bodega123',
    user: {
      id: '3',
      nombre: 'Pedro Bodega',
      email: 'bodega@travell.com',
      rol: Rol.BODEGA,
      activo: true,
    },
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // TODO: Replace with real GraphQL mutation when backend is ready
        // const { data } = await client.mutate({ mutation: LOGIN, variables: { email, password } });
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network

        const mockEntry = MOCK_USERS[email];
        if (!mockEntry || mockEntry.password !== password) {
          throw new Error('Credenciales inválidas');
        }

        set({
          user: mockEntry.user,
          token: 'mock-jwt-token-' + mockEntry.user.id,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'travell-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
