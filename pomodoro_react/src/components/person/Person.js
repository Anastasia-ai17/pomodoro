// src/components/person/Person.js
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, pomodoroAPI } from '../../services/api';
import '../../styles/person.css';

function Person() {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    
    const [birthdate, setBirthdate] = useState('');
    const [birthdateDay, setBirthdateDay] = useState('');
    const [birthdateMonth, setBirthdateMonth] = useState('');
    const [birthdateYear, setBirthdateYear] = useState('');
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
    
    // Доступные аватары (стандартные + купленные в магазине)
    const [availableAvatars, setAvailableAvatars] = useState([
        { icon: 'fa-dog', emoji: '🐶', name: 'Корги' },
        { icon: 'fa-cat', emoji: '🐱', name: 'Кот' },
        { icon: 'fa-fish', emoji: '🐟', name: 'Рыбка' },
        { icon: 'fa-dove', emoji: '🐦', name: 'Голубь' },
        { icon: 'fa-otter', emoji: '🦦', name: 'Выдра' },
        { icon: 'fa-frog', emoji: '🐸', name: 'Лягушка' }
    ]);
    
    // Все возможные аватары из магазина
    const shopAvatars = [
        { icon: 'fa-fox', emoji: '🦊', name: 'Лисёнок', price: 300 },
        { icon: 'fa-panda', emoji: '🐼', name: 'Панда', price: 350 },
        { icon: 'fa-penguin', emoji: '🐧', name: 'Пингвин', price: 300 }
    ];
    
    // Флаг для отслеживания первой загрузки
    const isFirstLoad = useRef(true);
    // Флаг для предотвращения перезагрузки после выбора аватара
    const shouldReload = useRef(true);
    
    // Генерация списка дней (1-31)
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    
    // Генерация списка месяцев
    const months = [
        { value: 1, name: 'Январь' },
        { value: 2, name: 'Февраль' },
        { value: 3, name: 'Март' },
        { value: 4, name: 'Апрель' },
        { value: 5, name: 'Май' },
        { value: 6, name: 'Июнь' },
        { value: 7, name: 'Июль' },
        { value: 8, name: 'Август' },
        { value: 9, name: 'Сентябрь' },
        { value: 10, name: 'Октябрь' },
        { value: 11, name: 'Ноябрь' },
        { value: 12, name: 'Декабрь' }
    ];
    
    // Генерация списка годов (1900 - текущий год)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
    
    // Загрузка купленных аватаров из localStorage
    const loadPurchasedAvatars = useCallback(() => {
        const purchased = localStorage.getItem('purchasedAvatars');
        if (purchased) {
            const purchasedIds = JSON.parse(purchased);
            // Добавляем купленные аватары из магазина
            const additionalAvatars = shopAvatars.filter(av => purchasedIds.includes(av.icon));
            setAvailableAvatars(prev => {
                // Проверяем, чтобы не дублировать
                const currentIcons = prev.map(av => av.icon);
                const newAvatars = additionalAvatars.filter(av => !currentIcons.includes(av.icon));
                return [...prev, ...newAvatars];
            });
        }
    }, []);
    
    const loadUserData = useCallback(async () => {
        // Если не нужно перезагружать (пользователь сам выбрал аватар), пропускаем
        if (!shouldReload.current) {
            console.log('Skipping reload - user selected avatar manually');
            return;
        }
        
        try {
            const response = await authAPI.getProfile();
            const userData = response.data.user || response.data;
            const birthdateStr = userData.birthdate || '';
            setBirthdate(birthdateStr);
            
            // Разбираем дату для селектов
            if (birthdateStr) {
                const date = new Date(birthdateStr);
                if (!isNaN(date.getTime())) {
                    setBirthdateDay(date.getDate().toString());
                    setBirthdateMonth((date.getMonth() + 1).toString());
                    setBirthdateYear(date.getFullYear().toString());
                }
            }
            
            // Только при первой загрузке устанавливаем аватар с сервера
            if (isFirstLoad.current && userData.avatar) {
                console.log('First load - setting avatar from server:', userData.avatar);
                setSelectedAvatar(userData.avatar);
                isFirstLoad.current = false;
            }
            
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
        loadPurchasedAvatars();
        loadUserData();
        loadStats();
    }, [loadStats, loadUserData, navigate, user, loadPurchasedAvatars]);
    
    const formatTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours}ч ${mins}м`;
        return `${mins}м`;
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Не указано';
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    // Объединение выбранных дня, месяца и года в дату
    const combineBirthdate = () => {
        if (birthdateDay && birthdateMonth && birthdateYear) {
            const year = parseInt(birthdateYear);
            const month = parseInt(birthdateMonth);
            const day = parseInt(birthdateDay);
            
            const testDate = new Date(year, month - 1, day);
            if (testDate.getFullYear() === year && 
                testDate.getMonth() === month - 1 && 
                testDate.getDate() === day) {
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
        return '';
    };
    
    // Обработчик изменения дня
    const handleDayChange = (e) => {
        const day = e.target.value;
        setBirthdateDay(day);
        
        if (day && birthdateMonth && birthdateYear) {
            const year = parseInt(birthdateYear);
            const month = parseInt(birthdateMonth);
            const dayNum = parseInt(day);
            const testDate = new Date(year, month - 1, dayNum);
            if (testDate.getFullYear() === year && 
                testDate.getMonth() === month - 1 && 
                testDate.getDate() === dayNum) {
                setBirthdate(combineBirthdate());
            }
        } else if (day && birthdateMonth && birthdateYear) {
            setBirthdate(combineBirthdate());
        }
    };
    
    // Обработчик изменения месяца
    const handleMonthChange = (e) => {
        const month = e.target.value;
        setBirthdateMonth(month);
        
        if (birthdateDay && month && birthdateYear) {
            const year = parseInt(birthdateYear);
            const monthNum = parseInt(month);
            const dayNum = parseInt(birthdateDay);
            const lastDayOfMonth = new Date(year, monthNum, 0).getDate();
            
            if (dayNum > lastDayOfMonth) {
                setBirthdateDay(lastDayOfMonth.toString());
                setBirthdate(combineBirthdate());
            } else if (dayNum && monthNum && year) {
                setBirthdate(combineBirthdate());
            }
        } else if (birthdateDay && month && birthdateYear) {
            setBirthdate(combineBirthdate());
        }
    };
    
    // Обработчик изменения года
    const handleYearChange = (e) => {
        const year = e.target.value;
        setBirthdateYear(year);
        
        if (birthdateDay && birthdateMonth && year) {
            const monthNum = parseInt(birthdateMonth);
            const dayNum = parseInt(birthdateDay);
            const yearNum = parseInt(year);
            const lastDayOfMonth = new Date(yearNum, monthNum, 0).getDate();
            
            if (dayNum > lastDayOfMonth) {
                setBirthdateDay(lastDayOfMonth.toString());
                setBirthdate(combineBirthdate());
            } else {
                setBirthdate(combineBirthdate());
            }
        } else if (birthdateDay && birthdateMonth && year) {
            setBirthdate(combineBirthdate());
        }
    };
    
    // Обработчик выбора аватара
    const handleAvatarSelect = (avatarIcon) => {
        console.log('Selected avatar:', avatarIcon);
        // Отключаем перезагрузку при выборе аватара
        shouldReload.current = false;
        // Устанавливаем выбранный аватар
        setSelectedAvatar(avatarIcon);
    };
    
    const saveProfile = async () => {
        try {
            const finalBirthdate = combineBirthdate();
            console.log('Saving profile with avatar:', selectedAvatar);
            
            await authAPI.updateProfile({
                birthdate: finalBirthdate,
                avatar: selectedAvatar
            });
            
            // Обновляем локального пользователя
            updateUser({ birthdate: finalBirthdate, avatar: selectedAvatar });
            setBirthdate(finalBirthdate);
            
            // Включаем перезагрузку обратно после сохранения
            shouldReload.current = true;
            
            alert('✅ Изменения сохранены!');
        } catch (error) {
            console.error('Save error:', error);
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
                            {availableAvatars.map(av => (
                                <div
                                    key={av.icon}
                                    className={`avatar-option ${selectedAvatar === av.icon ? 'selected' : ''}`}
                                    onClick={() => handleAvatarSelect(av.icon)}
                                    title={av.name}
                                >
                                    {av.emoji}
                                </div>
                            ))}
                        </div>
                        <p className="avatar-hint">
                            <i className="fa-solid fa-store"></i> 
                            Новые аватары можно купить в магазине
                        </p>
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
                            <div className="birthdate-selectors">
                                <select 
                                    value={birthdateDay} 
                                    onChange={handleDayChange}
                                    className="birthdate-select"
                                >
                                    <option value="">День</option>
                                    {days.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                                
                                <select 
                                    value={birthdateMonth} 
                                    onChange={handleMonthChange}
                                    className="birthdate-select"
                                >
                                    <option value="">Месяц</option>
                                    {months.map(month => (
                                        <option key={month.value} value={month.value}>{month.name}</option>
                                    ))}
                                </select>
                                
                                <select 
                                    value={birthdateYear} 
                                    onChange={handleYearChange}
                                    className="birthdate-select"
                                >
                                    <option value="">Год</option>
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
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