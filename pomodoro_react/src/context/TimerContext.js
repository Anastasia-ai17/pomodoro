import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { pomodoroAPI } from '../services/api';
import { useAuth } from './AuthContext';

const TimerContext = createContext();

export const useTimer = () => useContext(TimerContext);

export const TimerProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    
    const [currentMode, setCurrentMode] = useState('work');
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [workCyclesCompleted, setWorkCyclesCompleted] = useState(0);
    
    const [settings, setSettings] = useState({
        work: 25,
        shortBreak: 5,
        longBreak: 15,
        cyclesBeforeLongBreak: 4
    });
    
    const timerRef = useRef(null);
    const isEndingRef = useRef(false);
    const audioStopRef = useRef(null);

    // Загрузка настроек и состояния из localStorage
    useEffect(() => {
        const savedSettings = {
            work: parseInt(localStorage.getItem('workTime'), 10) || 25,
            shortBreak: parseInt(localStorage.getItem('shortBreakTime'), 10) || 5,
            longBreak: parseInt(localStorage.getItem('longBreakTime'), 10) || 15,
            cyclesBeforeLongBreak: parseInt(localStorage.getItem('cyclesCount'), 10) || 4
        };
        setSettings(savedSettings);
        
        // Восстановление состояния таймера
        const savedMode = localStorage.getItem('timerMode');
        const savedTimeLeft = localStorage.getItem('timerTimeLeft');
        const savedCycles = localStorage.getItem('timerCycles');
        const savedRunning = localStorage.getItem('timerRunning');
        
        if (savedMode) setCurrentMode(savedMode);
        if (savedCycles) setWorkCyclesCompleted(parseInt(savedCycles, 10));
        if (savedTimeLeft && !savedRunning === 'true') {
            setTimeLeft(parseInt(savedTimeLeft, 10));
        }
    }, []);

    // Сохранение состояния таймера в localStorage
    useEffect(() => {
        localStorage.setItem('timerMode', currentMode);
        localStorage.setItem('timerCycles', workCyclesCompleted.toString());
        if (!isRunning) {
            localStorage.setItem('timerTimeLeft', timeLeft.toString());
        }
        localStorage.setItem('timerRunning', isRunning ? 'true' : 'false');
    }, [currentMode, workCyclesCompleted, timeLeft, isRunning]);

    // Обновление времени при смене режима (только если таймер не на паузе)
    useEffect(() => {
        if (!isRunning) {
            if (currentMode === 'work') setTimeLeft(settings.work * 60);
            else if (currentMode === 'shortBreak') setTimeLeft(settings.shortBreak * 60);
            else setTimeLeft(settings.longBreak * 60);
            localStorage.setItem('timerTimeLeft', timeLeft.toString());
        }
    }, [currentMode, settings, isRunning]);

    const stopAlarm = useCallback(() => {
        if (audioStopRef.current) {
            audioStopRef.current();
            audioStopRef.current = null;
        }
    }, []);

    const playAlarm = useCallback(() => {
        const soundType = localStorage.getItem('customAlarmSoundType') || 'default';
        
        let repeatCount = 0;
        let isStopped = false;
        let timeouts = [];
        let currentAudioContext = null;
        
        audioStopRef.current = () => {
            isStopped = true;
            timeouts.forEach(tid => clearTimeout(tid));
            timeouts = [];
            if (currentAudioContext) {
                currentAudioContext.close();
                currentAudioContext = null;
            }
        };
        
        const playSoundOnce = (callback) => {
            if (isStopped) {
                if (callback) callback();
                return;
            }
            
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                currentAudioContext = audioContext;
                if (audioContext.state === 'suspended') audioContext.resume();
                
                if (soundType === 'default') {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.type = 'sine';
                    osc.frequency.value = 880;
                    gain.gain.value = 0.3;
                    osc.start();
                    gain.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.8);
                    osc.stop(audioContext.currentTime + 0.8);
                    const tid = setTimeout(() => {
                        if (currentAudioContext === audioContext) {
                            audioContext.close();
                            currentAudioContext = null;
                        }
                        if (callback && !isStopped) callback();
                    }, 800);
                    timeouts.push(tid);
                } else if (soundType === 'trill') {
                    const playNote = (freq, duration, delay) => {
                        const tid = setTimeout(() => {
                            if (isStopped) return;
                            const osc = audioContext.createOscillator();
                            const gain = audioContext.createGain();
                            osc.connect(gain);
                            gain.connect(audioContext.destination);
                            osc.type = 'sine';
                            osc.frequency.value = freq;
                            gain.gain.setValueAtTime(0.3, audioContext.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
                            osc.start();
                            osc.stop(audioContext.currentTime + duration);
                        }, delay);
                        timeouts.push(tid);
                    };
                    playNote(880, 0.15, 0);
                    playNote(1046.50, 0.15, 150);
                    playNote(880, 0.15, 300);
                    playNote(1046.50, 0.15, 450);
                    playNote(880, 0.2, 600);
                    playNote(1046.50, 0.3, 800);
                    const tid = setTimeout(() => {
                        if (currentAudioContext === audioContext) {
                            audioContext.close();
                            currentAudioContext = null;
                        }
                        if (callback && !isStopped) callback();
                    }, 1200);
                    timeouts.push(tid);
                } else if (soundType === 'chime') {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.type = 'sine';
                    osc.frequency.value = 523.25;
                    gain.gain.value = 0.3;
                    osc.start();
                    const tid1 = setTimeout(() => { if (osc && !isStopped) osc.frequency.value = 659.25; }, 150);
                    const tid2 = setTimeout(() => { if (osc && !isStopped) osc.frequency.value = 783.99; }, 300);
                    gain.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.8);
                    osc.stop(audioContext.currentTime + 0.8);
                    timeouts.push(tid1, tid2);
                    const tid = setTimeout(() => {
                        if (currentAudioContext === audioContext) {
                            audioContext.close();
                            currentAudioContext = null;
                        }
                        if (callback && !isStopped) callback();
                    }, 800);
                    timeouts.push(tid);
                } else if (soundType === 'digital') {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.type = 'square';
                    osc.frequency.value = 440;
                    gain.gain.value = 0.3;
                    osc.start();
                    const tid1 = setTimeout(() => { if (osc && !isStopped) osc.frequency.value = 880; }, 100);
                    const tid2 = setTimeout(() => { if (osc && !isStopped) osc.frequency.value = 440; }, 200);
                    gain.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.6);
                    osc.stop(audioContext.currentTime + 0.6);
                    timeouts.push(tid1, tid2);
                    const tid = setTimeout(() => {
                        if (currentAudioContext === audioContext) {
                            audioContext.close();
                            currentAudioContext = null;
                        }
                        if (callback && !isStopped) callback();
                    }, 600);
                    timeouts.push(tid);
                }
            } catch (e) { if (callback) callback(); }
        };
        
        const playRepeat = () => {
            if (isStopped) return;
            if (repeatCount >= 20) return;
            repeatCount++;
            playSoundOnce(() => {
                if (!isStopped && repeatCount < 20) {
                    const tid = setTimeout(playRepeat, 500);
                    timeouts.push(tid);
                }
            });
        };
        
        playRepeat();
        
        if (Notification.permission === 'granted') {
            const modeText = currentMode === 'work' ? 'Работа' : (currentMode === 'shortBreak' ? 'Отдых' : 'Большой перерыв');
            new Notification('⏰ FocusFlow', {
                body: `${modeText} завершена!`,
                icon: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
                requireInteraction: true,
                silent: true
            });
        } else if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
    }, [currentMode]);

    const saveSessionToServer = useCallback(async (duration) => {
        if (isAuthenticated) {
            try {
                await pomodoroAPI.saveSession({ duration_minutes: duration });
                // После сохранения сессии обновляем монетки пользователя
                const coinsResponse = await pomodoroAPI.getCoins();
                const userCoins = coinsResponse.data?.coins;
                if (userCoins !== undefined) {
                    localStorage.setItem('userCoins', userCoins);
                }
                return true;
            } catch (error) {
                console.error('Failed to save session:', error);
                return false;
            }
        }
        return false;
    }, [isAuthenticated]);

    const handleTimeEnd = useCallback(async () => {
        if (isEndingRef.current) return;
        isEndingRef.current = true;
        
        setIsRunning(false);
        stopAlarm();
        playAlarm();
        
        const duration = currentMode === 'work' ? settings.work : (currentMode === 'shortBreak' ? settings.shortBreak : settings.longBreak);
        
        if (currentMode === 'work') {
            await saveSessionToServer(duration);
            
            const newCycles = workCyclesCompleted + 1;
            setWorkCyclesCompleted(newCycles);
            if (newCycles % settings.cyclesBeforeLongBreak === 0) {
                setCurrentMode('longBreak');
            } else {
                setCurrentMode('shortBreak');
            }
        } else {
            setCurrentMode('work');
        }
        
        setTimeout(() => { isEndingRef.current = false; }, 1000);
    }, [currentMode, settings, workCyclesCompleted, playAlarm, saveSessionToServer, stopAlarm]);

    // Основной цикл таймера
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleTimeEnd();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [isRunning, handleTimeEnd]);

    const startTimer = useCallback(() => { 
        if (!isRunning) setIsRunning(true); 
    }, [isRunning]);

    const pauseTimer = useCallback(() => { 
        setIsRunning(false); 
    }, []);

    const resetTimer = useCallback(() => { 
        stopAlarm();
        setIsRunning(false); 
        setWorkCyclesCompleted(0); 
        setCurrentMode('work');
        setTimeLeft(settings.work * 60);
        localStorage.setItem('timerTimeLeft', (settings.work * 60).toString());
        localStorage.setItem('timerMode', 'work');
        localStorage.setItem('timerCycles', '0');
        localStorage.setItem('timerRunning', 'false');
    }, [settings, stopAlarm]);

    const updateSetting = useCallback((key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        if (key === 'cyclesBeforeLongBreak') {
            localStorage.setItem('cyclesCount', value);
        } else {
            localStorage.setItem(`${key}Time`, value);
        }
        if (!isRunning) {
            if (currentMode === 'work') setTimeLeft(newSettings.work * 60);
            else if (currentMode === 'shortBreak') setTimeLeft(newSettings.shortBreak * 60);
            else if (currentMode === 'longBreak') setTimeLeft(newSettings.longBreak * 60);
        }
    }, [settings, isRunning, currentMode]);

    const resetToDefaults = useCallback(() => {
        stopAlarm();
        setIsRunning(false);
        setWorkCyclesCompleted(0);
        setCurrentMode('work');
        const defaultSettings = { work: 25, shortBreak: 5, longBreak: 15, cyclesBeforeLongBreak: 4 };
        setSettings(defaultSettings);
        localStorage.setItem('workTime', 25);
        localStorage.setItem('shortBreakTime', 5);
        localStorage.setItem('longBreakTime', 15);
        localStorage.setItem('cyclesCount', 4);
        setTimeLeft(25 * 60);
        localStorage.setItem('timerTimeLeft', (25 * 60).toString());
        localStorage.setItem('timerMode', 'work');
        localStorage.setItem('timerCycles', '0');
        localStorage.setItem('timerRunning', 'false');
    }, [stopAlarm]);

    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const getModeText = useCallback(() => {
        switch(currentMode) {
            case 'work': return '🔴 Работа';
            case 'shortBreak': return '🟢 Отдых';
            case 'longBreak': return '🔵 Большой перерыв';
            default: return 'Работа';
        }
    }, [currentMode]);

    const getCycleText = useCallback(() => {
        if (currentMode === 'work') return `Цикл ${workCyclesCompleted + 1}/${settings.cyclesBeforeLongBreak}`;
        return `Перерыв · Циклов: ${workCyclesCompleted}`;
    }, [currentMode, workCyclesCompleted, settings.cyclesBeforeLongBreak]);

    return (
        <TimerContext.Provider value={{
            currentMode,
            timeLeft,
            isRunning,
            workCyclesCompleted,
            settings,
            startTimer,
            pauseTimer,
            resetTimer,
            updateSetting,
            resetToDefaults,
            formatTime,
            getModeText,
            getCycleText,
            setCurrentMode,
            setWorkCyclesCompleted,
            setTimeLeft,
            setIsRunning,
            stopAlarm
        }}>
            {children}
        </TimerContext.Provider>
    );
};