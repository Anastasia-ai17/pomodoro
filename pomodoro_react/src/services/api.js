import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Добавление токена в заголовки
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// Обновление токена при 401 ошибке
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/token/refresh/`, { refresh: refreshToken });
                    localStorage.setItem('access_token', response.data.access);
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                    window.location.href = '/auth';
                }
            }
        }
        return Promise.reject(error);
    }
);

// API аутентификации
export const authAPI = {
    register: (data) => api.post('/register/', data),
    login: (data) => api.post('/login/', data),
    getMe: () => api.get('/me/'),
    getProfile: () => api.get('/profile/'),
    updateProfile: (data) => api.patch('/profile/', data),
    changePassword: (data) => api.post('/change-password/', data),
    logout: () => api.post('/logout/'),
};

// API помидоро таймера
export const pomodoroAPI = {
    getStats: () => api.get('/pomodoro/stats/'),
    saveSession: (data) => api.post('/pomodoro/sessions/', data),
};

// API темы оформления
export const themeAPI = {
    getUserTheme: () => api.get('/theme/'),
    setUserTheme: (theme) => api.put('/theme/', { theme }),
    getGuestTheme: () => api.get('/theme/guest/'),
    setGuestTheme: (theme) => api.post('/theme/guest/', { theme }),
};

export default api;