import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const persistAuth = useCallback((payload) => {
        const userData = payload.user;
        const access = payload.tokens?.access;
        const refresh = payload.tokens?.refresh;

        if (access) {
            localStorage.setItem('access_token', access);
        }
        if (refresh) {
            localStorage.setItem('refresh_token', refresh);
        }
        if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setIsAuthenticated(true);
        }
        return payload;
    }, []);

    const clearAuth = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            clearAuth();
            setLoading(false);
            return;
        }

        try {
            const response = await authAPI.getMe();
            if (response.data?.authenticated && response.data.user) {
                setUser(response.data.user);
                setIsAuthenticated(true);
            } else {
                clearAuth();
            }
        } catch (error) {
            clearAuth();
        } finally {
            setLoading(false);
        }
    }, [clearAuth]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const register = useCallback(async (userData) => {
        const response = await authAPI.register(userData);
        return persistAuth(response.data);
    }, [persistAuth]);

    const login = useCallback(async (credentials) => {
        const response = await authAPI.login(credentials);
        return persistAuth(response.data);
    }, [persistAuth]);

    const logout = useCallback(async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            // Token logout is client-side only, so request failure is non-blocking.
        } finally {
            clearAuth();
        }
    }, [clearAuth]);

    const updateUser = useCallback((newData) => {
        setUser((prev) => {
            const nextUser = { ...(prev || {}), ...newData };
            localStorage.setItem('user', JSON.stringify(nextUser));
            return nextUser;
        });
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated,
                register,
                login,
                logout,
                updateUser,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
