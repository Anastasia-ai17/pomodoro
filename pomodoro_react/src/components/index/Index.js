import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pomodoroAPI } from '../../services/api';
import '../../styles/index.css';

function Index() {
    const [currentMode, setCurrentMode] = useState('work');
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [workCyclesCompleted, setWorkCyclesCompleted] = useState(0);
    const [showSoundPanel, setShowSoundPanel] = useState(false);
    
    const [settings, setSettings] = useState({
        work: 25,
        shortBreak: 5,
        longBreak: 15,
        cyclesBeforeLongBreak: 4
    });
    
    const timerRef = useRef(null);
    const audioRef = useRef(null);
    const isEndingRef = useRef(false);
    const { isAuthenticated } = useAuth();
    
    // Загрузка настроек из localStorage
    useEffect(() => {
        const savedSettings = {
            work: parseInt(localStorage.getItem('workTime'), 10) || 25,
            shortBreak: parseInt(localStorage.getItem('shortBreakTime'), 10) || 5,
            longBreak: parseInt(localStorage.getItem('longBreakTime'), 10) || 15,
            cyclesBeforeLongBreak: parseInt(localStorage.getItem('cyclesCount'), 10) || 4
        };
        setSettings(savedSettings);
    }, []);
    
    // Обновление времени при смене режима
    useEffect(() => {
        if (currentMode === 'work') setTimeLeft(settings.work * 60);
        else if (currentMode === 'shortBreak') setTimeLeft(settings.shortBreak * 60);
        else setTimeLeft(settings.longBreak * 60);
    }, [currentMode, settings]);
    
    // Воспроизведение звука при завершении таймера (20 повторов)
    const playAlarm = useCallback(() => {
        const soundType = localStorage.getItem('customAlarmSoundType');
        
        let repeatCount = 0;
        let isStopped = false;
        let timeouts = [];
        let currentAudioContext = null;
        
        // Сохраняем функцию остановки
        window.stopAlarmSound = () => {
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
        
        setShowSoundPanel(true);
        
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
    
    const stopAlarm = () => {
        if (window.stopAlarmSound) {
            window.stopAlarmSound();
        }
        setShowSoundPanel(false);
    };
    
    const startTimer = useCallback(() => { if (!isRunning) setIsRunning(true); }, [isRunning]);
    
    // Обработка окончания времени с защитой от двойного вызова
    const handleTimeEnd = useCallback(async () => {
        if (isEndingRef.current) return;
        isEndingRef.current = true;
        
        setIsRunning(false);
        playAlarm();
        
        const duration = currentMode === 'work' ? settings.work : (currentMode === 'shortBreak' ? settings.shortBreak : settings.longBreak);
        if (isAuthenticated && currentMode === 'work') {
            try { await pomodoroAPI.saveSession({ duration_minutes: duration }); } 
            catch (error) { console.error('Failed to save session:', error); }
        }
        
        if (currentMode === 'work') {
            const newCycles = workCyclesCompleted + 1;
            setWorkCyclesCompleted(newCycles);
            if (newCycles % settings.cyclesBeforeLongBreak === 0) setCurrentMode('longBreak');
            else setCurrentMode('shortBreak');
        } else {
            setCurrentMode('work');
        }
        
        startTimer();
        
        setTimeout(() => { isEndingRef.current = false; }, 1000);
    }, [currentMode, isAuthenticated, playAlarm, settings, startTimer, workCyclesCompleted]);
    
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
    }, [handleTimeEnd, isRunning]);
    
    const pauseTimer = () => setIsRunning(false);
    const resetTimer = () => { stopAlarm(); setIsRunning(false); setWorkCyclesCompleted(0); setCurrentMode('work'); };
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    const getModeText = () => {
        switch(currentMode) {
            case 'work': return '🔴 Работа';
            case 'shortBreak': return '🟢 Отдых';
            case 'longBreak': return '🔵 Большой перерыв';
            default: return 'Работа';
        }
    };
    const getCycleText = () => {
        if (currentMode === 'work') return `Цикл ${workCyclesCompleted + 1}/${settings.cyclesBeforeLongBreak}`;
        return `Перерыв · Циклов: ${workCyclesCompleted}`;
    };
    const updateSetting = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        if (key === 'cyclesBeforeLongBreak') localStorage.setItem('cyclesCount', value);
        else localStorage.setItem(`${key}Time`, value);
        if (!isRunning) {
            if (currentMode === 'work') setTimeLeft(newSettings.work * 60);
            else if (currentMode === 'shortBreak') setTimeLeft(newSettings.shortBreak * 60);
            else if (currentMode === 'longBreak') setTimeLeft(newSettings.longBreak * 60);
        }
    };
    const resetToDefaults = () => {
        stopAlarm();
        const defaultSettings = { work: 25, shortBreak: 5, longBreak: 15, cyclesBeforeLongBreak: 4 };
        setSettings(defaultSettings);
        localStorage.setItem('workTime', 25);
        localStorage.setItem('shortBreakTime', 5);
        localStorage.setItem('longBreakTime', 15);
        localStorage.setItem('cyclesCount', 4);
        if (!isRunning) {
            if (currentMode === 'work') setTimeLeft(25 * 60);
            else if (currentMode === 'shortBreak') setTimeLeft(5 * 60);
            else if (currentMode === 'longBreak') setTimeLeft(15 * 60);
        }
    };
    
    return (
        <div className="container">
            {showSoundPanel && (
                <div className="sound-panel" onClick={stopAlarm}>
                    <div className="sound-content">
                        <i className="fa-solid fa-bell fa-shake"></i>
                        <span>⏰ Время вышло! 👆 Нажми на уведомление</span>
                    </div>
                </div>
            )}
            <div className="timer-card">
                <div className="timer-status">
                    <span className="mode-badge">{getModeText()}</span>
                    <span className="cycle-counter">{getCycleText()}</span>
                </div>
                <div className="timer-circle">
                    <div className="timer-display">{formatTime(timeLeft)}</div>
                </div>
                <div className="timer-controls">
                    <button className="control-btn primary" onClick={startTimer}><i className="fa-solid fa-play"></i> Старт</button>
                    <button className="control-btn" onClick={pauseTimer}><i className="fa-solid fa-pause"></i> Пауза</button>
                    <button className="control-btn" onClick={resetTimer}><i className="fa-solid fa-stop"></i> Сброс</button>
                </div>
            </div>
            <div className="settings-section">
                <h3><i className="fa-solid fa-sliders"></i> Настройки времени</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label><i className="fa-regular fa-clock"></i> Работа (мин)</label>
                        <div className="slider-container">
                            <input type="range" className="slider" min="1" max="60" value={settings.work} onChange={(e) => updateSetting('work', parseInt(e.target.value, 10))} />
                            <input type="number" className="number-input" min="1" max="60" value={settings.work} onChange={(e) => updateSetting('work', parseInt(e.target.value, 10))} />
                        </div>
                    </div>
                    <div className="setting-item">
                        <label><i className="fa-solid fa-mug-hot"></i> Отдых (мин)</label>
                        <div className="slider-container">
                            <input type="range" className="slider" min="1" max="30" value={settings.shortBreak} onChange={(e) => updateSetting('shortBreak', parseInt(e.target.value, 10))} />
                            <input type="number" className="number-input" min="1" max="30" value={settings.shortBreak} onChange={(e) => updateSetting('shortBreak', parseInt(e.target.value, 10))} />
                        </div>
                    </div>
                    <div className="setting-item">
                        <label><i className="fa-regular fa-sun"></i> Большой перерыв (мин)</label>
                        <div className="slider-container">
                            <input type="range" className="slider" min="1" max="60" value={settings.longBreak} onChange={(e) => updateSetting('longBreak', parseInt(e.target.value, 10))} />
                            <input type="number" className="number-input" min="1" max="60" value={settings.longBreak} onChange={(e) => updateSetting('longBreak', parseInt(e.target.value, 10))} />
                        </div>
                    </div>
                    <div className="setting-item">
                        <label><i className="fa-solid fa-rotate-right"></i> Циклов до большого перерыва</label>
                        <div className="slider-container">
                            <input type="range" className="slider" min="1" max="10" value={settings.cyclesBeforeLongBreak} onChange={(e) => updateSetting('cyclesBeforeLongBreak', parseInt(e.target.value, 10))} />
                            <input type="number" className="number-input" min="1" max="10" value={settings.cyclesBeforeLongBreak} onChange={(e) => updateSetting('cyclesBeforeLongBreak', parseInt(e.target.value, 10))} />
                        </div>
                    </div>
                </div>
                <button className="reset-settings-btn" onClick={resetToDefaults}><i className="fa-solid fa-undo"></i> Сбросить на 25/5/15</button>
            </div>
            <div className="info-section">
                <h2>🍅 Что такое Pomodoro?</h2>
                <div className="info-grid">
                    <div className="info-card">
                        <i className="fa-solid fa-stopwatch info-icon"></i>
                        <h3>Метод помидора</h3>
                        <p>Техника тайм-менеджмента, разработанная Франческо Чирилло в конце 1980-х годов. Работа разбивается на сменяющие друг друга интервалы.</p>
                    </div>
                    <div className="info-card">
                        <i className="fa-solid fa-brain info-icon"></i>
                        <h3>Почему это работает</h3>
                        <p>Короткие интервалы снижают тревожность, частые перерывы помогают сохранять свежесть внимания, а ритмичность вырабатывает привычку.</p>
                    </div>
                    <div className="info-card">
                        <i className="fa-solid fa-sliders info-icon"></i>
                        <h3>Настройте под себя</h3>
                        <p>По умолчанию таймер работает в классическом режиме: 25/5/15 после 4 циклов. Но вы можете изменить любое значение в настройках.</p>
                    </div>
                </div>
            </div>
            <audio ref={audioRef} preload="auto">
                <source src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" type="audio/ogg"/>
                <source src="https://actions.google.com/sounds/v1/alarms/alarm_clock.mp3" type="audio/mpeg"/>
            </audio>
        </div>
    );
}

export default Index;