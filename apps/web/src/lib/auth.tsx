'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface User {
    id: string;
    email: string;
    name: string;
    createdAt?: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
}

interface AuthContextValue extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const ACCESS_TOKEN_KEY = 'suara_access_token';
const REFRESH_TOKEN_KEY = 'suara_refresh_token';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        accessToken: null,
        isLoading: true,
    });

    const setAuth = useCallback(
        (user: User, accessToken: string, refreshToken?: string) => {
            localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            if (refreshToken) {
                localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
            }
            setState({ user, accessToken, isLoading: false });
        },
        []
    );

    const clearAuth = useCallback(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        setState({ user: null, accessToken: null, isLoading: false });
    }, []);

    const login = useCallback(
        async (email: string, password: string) => {
            const response = await api<{
                user: User;
                access_token: string;
                refresh_token: string;
            }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            if (!response.success || !response.data) {
                throw new Error(response.error?.message || 'Login failed');
            }

            const { user, access_token, refresh_token } = response.data;
            setAuth(user, access_token, refresh_token);
        },
        [setAuth]
    );

    const register = useCallback(
        async (name: string, email: string, password: string) => {
            const response = await api<{
                user: User;
                access_token: string;
                refresh_token: string;
            }>('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password }),
            });

            if (!response.success || !response.data) {
                throw new Error(response.error?.message || 'Registration failed');
            }

            const { user, access_token, refresh_token } = response.data;
            setAuth(user, access_token, refresh_token);
        },
        [setAuth]
    );

    const logout = useCallback(() => {
        clearAuth();
        // Optional: Call backend logout to invalidate refresh token
    }, [clearAuth]);

    // Restore session on mount
    useEffect(() => {
        async function restoreSession() {
            const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

            if (!accessToken) {
                setState((s) => ({ ...s, isLoading: false }));
                return;
            }

            // Try /me with current access token
            const meResponse = await api<{ id: string; name: string; email: string; createdAt: string }>(
                '/auth/me',
                undefined,
                accessToken
            );

            if (meResponse.success && meResponse.data) {
                setState({ user: meResponse.data, accessToken, isLoading: false });
                return;
            }

            // If access token failed, try refresh token
            if (refreshToken) {
                const refreshResponse = await api<{ access_token: string; refresh_token: string }>(
                    '/auth/refresh',
                    {
                        method: 'POST',
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    }
                );

                if (refreshResponse.success && refreshResponse.data) {
                    const newAccess = refreshResponse.data.access_token;
                    const newRefresh = refreshResponse.data.refresh_token;

                    // Save new tokens
                    localStorage.setItem(ACCESS_TOKEN_KEY, newAccess);
                    localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);

                    // Fetch /me again
                    const retryMe = await api<{ id: string; name: string; email: string; createdAt: string }>(
                        '/auth/me',
                        undefined,
                        newAccess
                    );

                    if (retryMe.success && retryMe.data) {
                        setState({ user: retryMe.data, accessToken: newAccess, isLoading: false });
                        return;
                    }
                }
            }

            // If everything fails, clear session
            clearAuth();
        }

        restoreSession();
    }, [clearAuth]);

    return (
        <AuthContext.Provider value={{ ...state, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
