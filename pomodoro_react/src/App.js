import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Base from './components/base/Base';
import Index from './components/index/Index';
import Auth from './components/auth/Auth';
import Regist from './components/regist/Regist';
import Person from './components/person/Person';
import Shop from './components/shop/Shop';
import { useAuth } from './context/AuthContext';
import './styles/global.css';

function App() {
    const { loading } = useAuth();

    // Применение кастомной темы при загрузке
    useEffect(() => {
        const savedTheme = localStorage.getItem('activeTheme');
        const body = document.body;
        
        // Удаляем все темы
        const themes = ['default', 'forest', 'twilight', 'dream'];
        themes.forEach(theme => body.classList.remove(`theme-${theme}`));
        
        // Применяем сохранённую тему
        if (savedTheme && savedTheme !== 'default') {
            body.classList.add(`theme-${savedTheme}`);
        } else {
            body.classList.add('theme-default');
        }
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px' }}>
                🌊 Загрузка FocusFlow...
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<Base />}>
                <Route index element={<Index />} />
                <Route path="auth" element={<Auth />} />
                <Route path="regist" element={<Regist />} />
                <Route path="person" element={<Person />} />
                <Route path="shop" element={<Shop />} />
            </Route>
        </Routes>
    );
}

export default App;