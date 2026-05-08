import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '../types';
import { Rol } from '../types';
import client from '../graphql/client';
import { LOGIN_MUTATION, REGISTER_CLIENT_MUTATION } from '../graphql/mutations';

interface AuthState {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string, telefono?: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const { data } = await client.mutate<{ login: { accessToken: string; user: Usuario } }>({
            mutation: LOGIN_MUTATION,
            variables: {
              input: { email, password }
            }
          });

          if (!data) throw new Error("No data returned");
          const { accessToken, user } = data.login;

          set({
            user: user,
            token: accessToken,
            isAuthenticated: true,
          });
          
          // Clear apollo cache on login
          client.resetStore();
        } catch (error: any) {
          throw new Error(error.message || 'Credenciales inválidas o error en el servidor.');
        }
      },

      register: async (nombre: string, email: string, password: string, telefono?: string) => {
        try {
          const { data } = await client.mutate<{ registerCliente: { accessToken: string; user: Usuario } }>({
            mutation: REGISTER_CLIENT_MUTATION,
            variables: {
              input: {
                nombre,
                email,
                password,
              }
            }
          });

          if (!data) throw new Error("No data returned");
          const { accessToken, user } = data.registerCliente;

          set({
            user: user,
            token: accessToken,
            isAuthenticated: true,
          });
          
          // Clear apollo cache on login
          client.resetStore();
        } catch (error: any) {
          throw new Error(error.message || 'Error al registrar el usuario.');
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        client.resetStore();
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
