import React, { useState } from 'react';
import { useTimer } from '../../context/TimerContext';
import '../../styles/index.css';

function Index() {
    const {
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
        stopAlarm
    } = useTimer();

    const [showSoundPanel, setShowSoundPanel] = useState(false);

    // Подписка на окончание таймера для показа панели
    React.useEffect(() => {
        const handleTimeEnd = () => {
            setShowSoundPanel(true);
        };
        window.addEventListener('timerEnd', handleTimeEnd);
        return () => window.removeEventListener('timerEnd', handleTimeEnd);
    }, []);

    const handleStopAlarm = () => {
        stopAlarm();
        setShowSoundPanel(false);
    };

    return (
        <div className="container">
            {showSoundPanel && (
                <div className="sound-panel" onClick={handleStopAlarm}>
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
                    <button className="control-btn primary" onClick={startTimer} disabled={isRunning}>
                        <i className="fa-solid fa-play"></i> Старт
                    </button>
                    <button className="control-btn" onClick={pauseTimer} disabled={!isRunning}>
                        <i className="fa-solid fa-pause"></i> Пауза
                    </button>
                    <button className="control-btn" onClick={resetTimer}>
                        <i className="fa-solid fa-stop"></i> Сброс
                    </button>
                </div>
            </div>
            <div className="settings-section">
                <h3><i className="fa-solid fa-sliders"></i> Настройки времени</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label><i className="fa-regular fa-clock"></i> Работа (мин)</label>
                        <div className="slider-container">
                            <input 
                                type="range" 
                                className="slider" 
                                min="1" 
                                max="60" 
                                value={settings.work} 
                                onChange={(e) => updateSetting('work', parseInt(e.target.value, 10))} 
                            />
                            <span className="value-display">{settings.work} мин</span>
                        </div>
                    </div>
                    <div className="setting-item">
                        <label><i className="fa-solid fa-mug-hot"></i> Отдых (мин)</label>
                        <div className="slider-container">
                            <input 
                                type="range" 
                                className="slider" 
                                min="1" 
                                max="30" 
                                value={settings.shortBreak} 
                                onChange={(e) => updateSetting('shortBreak', parseInt(e.target.value, 10))} 
                            />
                            <span className="value-display">{settings.shortBreak} мин</span>
                        </div>
                    </div>
                    <div className="setting-item">
                        <label><i className="fa-regular fa-sun"></i> Большой перерыв (мин)</label>
                        <div className="slider-container">
                            <input 
                                type="range" 
                                className="slider" 
                                min="1" 
                                max="60" 
                                value={settings.longBreak} 
                                onChange={(e) => updateSetting('longBreak', parseInt(e.target.value, 10))} 
                            />
                            <span className="value-display">{settings.longBreak} мин</span>
                        </div>
                    </div>
                    <div className="setting-item">
                        <label><i className="fa-solid fa-rotate-right"></i> Циклов до большого перерыва</label>
                        <div className="slider-container">
                            <input 
                                type="range" 
                                className="slider" 
                                min="1" 
                                max="10" 
                                value={settings.cyclesBeforeLongBreak} 
                                onChange={(e) => updateSetting('cyclesBeforeLongBreak', parseInt(e.target.value, 10))} 
                            />
                            <span className="value-display">{settings.cyclesBeforeLongBreak}</span>
                        </div>
                    </div>
                </div>
                <button className="reset-settings-btn" onClick={resetToDefaults}>
                    <i className="fa-solid fa-undo"></i> Сбросить на 25/5/15
                </button>
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
        </div>
    );
}

export default Index;