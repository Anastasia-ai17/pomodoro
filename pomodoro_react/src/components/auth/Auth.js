import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/auth.css';

const getErrorMessage = (payload, fallback) => {
    if (!payload) {
        return fallback;
    }
    if (typeof payload === 'string') {
        return payload;
    }
    if (Array.isArray(payload)) {
        return payload.join(' ');
    }

    const source = payload.errors || payload.detail || payload;
    if (typeof source === 'string') {
        return source;
    }

    return Object.values(source)
        .flat()
        .map((value) => (typeof value === 'string' ? value : ''))
        .filter(Boolean)
        .join(' ') || fallback;
};

function Auth() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login: loginUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await loginUser({ login, password });
            navigate('/');
        } catch (error) {
            alert(`❌ ${getErrorMessage(error.response?.data, 'Неверное имя пользователя или пароль')}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="card">
                <div className="logo">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1 .45-1.41.81-1.41 1.36 0 .55.45.99 1 .99h.01c.55 0 1-.45 1-1 0-.17-.03-.33-.09-.48-.16-.39-.51-.71-1.01-.97-1.25-.64-1.81-1.46-1.81-2.54 0-1.38 1.06-2.5 2.5-2.5.7 0 1.32.28 1.78.74l.42-.42c.2-.2.51-.2.71 0 .2.2.2.51 0 .71l-.49.49c.24.44.38.95.38 1.48 0 1.38-1.06 2.5-2.5 2.5-.7 0-1.32-.28-1.78-.74l-.42.42c-.2.2-.51.2-.71 0-.2-.2-.2-.51 0-.71l.49-.49z" fill="#4F46E5"/>
                    </svg>
                </div>
                <h2>Добро пожаловать!</h2>
                <p className="subtitle">Войди в свой аккаунт ✨</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email или имя пользователя</label>
                        <input
                            type="text"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            placeholder="corgi_lover@mail.ru"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Пароль</label>
                        <div className="password-container">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                <p className="register-link">
                    Ещё нет аккаунта? <Link to="/regist">Создать аккаунт</Link>
                </p>
            </div>
        </div>
    );
}

export default Auth;
