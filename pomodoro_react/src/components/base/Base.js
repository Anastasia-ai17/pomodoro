import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/base.css';

function Base() {
    const { isAuthenticated, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <>
            <header className="header">
                <div className="header-content">
                    <div className="logo" onClick={() => navigate('/')}>
                        <i className="fa-solid fa-water"></i> {/* Иконка потока/волны */}
                        <span>FocusFlow</span>
                    </div>
                    <nav className="nav">
                        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                            <i className="fa-solid fa-house"></i>
                            Главная
                        </Link>
                        <Link to="/shop" className={`nav-link ${location.pathname === '/shop' ? 'active' : ''}`}>
                            <i className="fa-solid fa-store"></i>
                            Магазин
                        </Link>
                        {isAuthenticated ? (
                            <Link to="/person" className={`nav-link ${location.pathname === '/person' ? 'active' : ''}`}>
                                <i className="fa-solid fa-user"></i>
                                {user?.username || 'Профиль'}
                            </Link>
                        ) : (
                            <Link to="/auth" className={`nav-link ${location.pathname === '/auth' ? 'active' : ''}`}>
                                <i className="fa-solid fa-right-to-bracket"></i>
                                Авторизация
                            </Link>
                        )}
                    </nav>
                    <button className={`theme-toggle ${theme === 'dark' ? 'dark' : ''}`} onClick={toggleTheme}>
                        <i className="fa-solid fa-moon"></i>
                        <i className="fa-solid fa-sun"></i>
                    </button>
                </div>
            </header>
            <main className="main">
                <Outlet />
            </main>
        </>
    );
}

export default Base;