import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '../types';
import { Rol } from '../types';

interface AuthState {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string, telefono?: string) => Promise<void>;
  logout: () => void;
}

// ─── Mock users for development (remove when backend is ready) ───
const MOCK_USERS: Record<string, { password: string; user: Usuario }> = {
  'admin@travell.com': {
    password: 'admin123',
    user: { id: '1', nombre: 'Jorge Montenegro', email: 'admin@travell.com', rol: Rol.ADMINISTRADOR, activo: true },
  },
  'taquilla@travell.com': {
    password: 'taquilla123',
    user: { id: '2', nombre: 'Carla Gutiérrez', email: 'taquilla@travell.com', rol: Rol.TAQUILLA, activo: true },
  },
  'bodega@travell.com': {
    password: 'bodega123',
    user: { id: '3', nombre: 'Edwin Mamani', email: 'bodega@travell.com', rol: Rol.BODEGA, activo: true },
  },
  'rosa@email.com': {
    password: 'rosa123',
    user: { id: '4', nombre: 'Rosa Méndez S.', email: 'rosa@email.com', rol: Rol.USUARIO, activo: true, telefono: '+591 7234-8821' },
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // TODO: Replace with real GraphQL mutation
        await new Promise((resolve) => setTimeout(resolve, 800));

        const mockEntry = MOCK_USERS[email];
        if (!mockEntry || mockEntry.password !== password) {
          throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
        }

        set({
          user: mockEntry.user,
          token: 'mock-jwt-token-' + mockEntry.user.id,
          isAuthenticated: true,
        });
      },

      register: async (nombre: string, email: string, _password: string, telefono?: string) => {
        // TODO: Replace with real GraphQL mutation
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (MOCK_USERS[email]) {
          throw new Error('Ya existe una cuenta con este correo electrónico.');
        }

        const newUser: Usuario = {
          id: 'new-' + Date.now(),
          nombre,
          email,
          rol: Rol.USUARIO,
          activo: true,
          telefono,
        };

        // In real app, the backend would create the user and return a token
        set({
          user: newUser,
          token: 'mock-jwt-token-' + newUser.id,
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
