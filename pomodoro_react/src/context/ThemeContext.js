import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { themeAPI } from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const loadThemeFromServer = useCallback(async () => {
        const token = localStorage.getItem('access_token');

        try {
            const response = token
                ? await themeAPI.getUserTheme()
                : await themeAPI.getGuestTheme();

            if (response.data.theme) {
                setTheme(response.data.theme);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        }
    }, []);

    useEffect(() => {
        loadThemeFromServer();
    }, [loadThemeFromServer]);

    const toggleTheme = useCallback(async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);

        const token = localStorage.getItem('access_token');
        try {
            if (token) {
                await themeAPI.setUserTheme(newTheme);
            } else {
                await themeAPI.setGuestTheme(newTheme);
            }
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
