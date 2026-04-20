import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { themeAPI } from '../services/api';

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');

    // Применение темы к body
    const applyTheme = useCallback((newTheme) => {
        if (newTheme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
    }, []);

    // Загрузка темы с сервера и из localStorage
    const loadThemeFromServer = useCallback(async () => {
        const token = localStorage.getItem('access_token');
        const savedTheme = localStorage.getItem('theme');
        
        // Сначала применяем сохранённую тему из localStorage
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            setTheme(savedTheme);
            applyTheme(savedTheme);
        }
        
        try {
            const response = token ? await themeAPI.getUserTheme() : await themeAPI.getGuestTheme();
            if (response.data.theme && (response.data.theme === 'light' || response.data.theme === 'dark')) {
                setTheme(response.data.theme);
                applyTheme(response.data.theme);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        }
    }, [applyTheme]);

    useEffect(() => { loadThemeFromServer(); }, [loadThemeFromServer]);

    const toggleTheme = useCallback(async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
        const token = localStorage.getItem('access_token');
        try {
            if (token) await themeAPI.setUserTheme(newTheme);
            else await themeAPI.setGuestTheme(newTheme);
        } catch (error) { console.error('Failed to save theme:', error); }
    }, [theme, applyTheme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};