import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, pomodoroAPI } from '../../services/api';
import '../../styles/person.css';

function Person() {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    
    const [birthdate, setBirthdate] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('fa-dog');
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [stats, setStats] = useState({
        today: 0,
        week: 0,
        month: 0
    });
    
    const avatars = [
        { icon: 'fa-dog', emoji: '🐶' },
        { icon: 'fa-cat', emoji: '🐱' },
        { icon: 'fa-fish', emoji: '🐟' },
        { icon: 'fa-dove', emoji: '🐦' },
        { icon: 'fa-otter', emoji: '🦦' },
        { icon: 'fa-frog', emoji: '🐸' }
    ];
    
    const loadUserData = useCallback(async () => {
        try {
            const response = await authAPI.getProfile();
            const userData = response.data.user || response.data;
            setBirthdate(userData.birthdate || '');
            setSelectedAvatar(userData.avatar || 'fa-dog');
            updateUser(userData);
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setLoading(false);
        }
    }, [updateUser]);

    const loadStats = useCallback(async () => {
        try {
            const response = await pomodoroAPI.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error loading stats:', error);
            setStats({ today: 180, week: 900, month: 3600 });
        }
    }, []);

    useEffect(() => {
        if (!user) {
            navigate('/auth');
            return;
        }
        loadUserData();
        loadStats();
    }, [loadStats, loadUserData, navigate, user]);
    
    const formatTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours}ч ${mins}м`;
        return `${mins}м`;
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    const saveProfile = async () => {
        try {
            await authAPI.updateProfile({
                birthdate: birthdate,
                avatar: selectedAvatar
            });
            updateUser({ birthdate, avatar: selectedAvatar });
            alert('✅ Изменения сохранены!');
        } catch (error) {
            alert('❌ Ошибка сохранения');
        }
    };
    
    const changePassword = async () => {
        if (passwordData.new.length < 6) {
            alert('❌ Пароль должен быть минимум 6 символов');
            return;
        }
        if (passwordData.new !== passwordData.confirm) {
            alert('❌ Пароли не совпадают');
            return;
        }
        
        try {
            await authAPI.changePassword({
                current_password: passwordData.current,
                new_password: passwordData.new
            });
            alert('✅ Пароль успешно изменён!');
            setShowPasswordModal(false);
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (error) {
            alert('❌ Неверный текущий пароль');
        }
    };
    
    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>;
    }
    
    return (
        <div className="container">
            <div className="card">
                <h2 className="card-title">
                    <i className="fa-solid fa-circle-user"></i>
                    Профиль пользователя
                </h2>
                
                <div className="profile-section">
                    <div className="avatar-section">
                        <div className="avatar">
                            <i className={`fa-solid ${selectedAvatar}`}></i>
                        </div>
                        <div className="avatar-selector">
                            {avatars.map(av => (
                                <div
                                    key={av.icon}
                                    className={`avatar-option ${selectedAvatar === av.icon ? 'selected' : ''}`}
                                    onClick={() => setSelectedAvatar(av.icon)}
                                >
                                    {av.emoji}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="profile-form">
                        <div className="form-group">
                            <label>Имя пользователя</label>
                            <input type="text" value={user?.username || ''} readOnly />
                        </div>
                        
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={user?.email || ''} readOnly />
                        </div>
                        
                        <div className="form-group">
                            <label>Дата регистрации</label>
                            <input type="text" value={formatDate(user?.date_joined || user?.registration_date)} readOnly />
                        </div>
                        
                        <div className="form-group">
                            <label>Дата рождения</label>
                            <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
                        </div>
                        
                        <div className="form-group">
                            <label>Пароль</label>
                            <div className="password-group">
                                <input type="password" value="········" readOnly />
                                <button className="change-password-btn" onClick={() => setShowPasswordModal(true)}>
                                    <i className="fa-solid fa-key"></i> Сменить
                                </button>
                            </div>
                        </div>
                        
                        <div className="button-group">
                            <button className="save-btn" onClick={saveProfile}>
                                <i className="fa-solid fa-check"></i> Сохранить изменения
                            </button>
                            <button className="logout-btn" onClick={logout}>
                                <i className="fa-solid fa-sign-out-alt"></i> Выйти из аккаунта
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="card">
                <h2 className="card-title">
                    <i className="fa-solid fa-chart-simple"></i>
                    Статистика
                </h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon"><i className="fa-solid fa-sun"></i></div>
                        <div className="stat-value">{formatTime(stats.today || 0)}</div>
                        <div className="stat-label">Сегодня</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><i className="fa-solid fa-calendar-week"></i></div>
                        <div className="stat-value">{formatTime(stats.week || 0)}</div>
                        <div className="stat-label">За неделю</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><i className="fa-solid fa-calendar-alt"></i></div>
                        <div className="stat-value">{formatTime(stats.month || 0)}</div>
                        <div className="stat-label">За месяц</div>
                    </div>
                </div>
            </div>
            
            {/* Модальное окно смены пароля */}
            <div className={`modal ${showPasswordModal ? 'active' : ''}`}>
                <div className="modal-content">
                    <h3 className="modal-title">Смена пароля</h3>
                    <div className="form-group">
                        <label>Текущий пароль</label>
                        <input
                            type="password"
                            value={passwordData.current}
                            onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="form-group">
                        <label>Новый пароль</label>
                        <input
                            type="password"
                            value={passwordData.new}
                            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="form-group">
                        <label>Подтвердите новый пароль</label>
                        <input
                            type="password"
                            value={passwordData.confirm}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="modal-actions">
                        <button className="modal-btn secondary" onClick={() => setShowPasswordModal(false)}>
                            Отмена
                        </button>
                        <button className="modal-btn primary" onClick={changePassword}>
                            Сохранить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Person;
