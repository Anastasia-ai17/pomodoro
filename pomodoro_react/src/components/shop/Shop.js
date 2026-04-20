// src/components/shop/Shop.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/shop.css';

// Доступные звуки
const AVAILABLE_SOUNDS = {
  default: {
    name: '🔔 Стандартный',
    url: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'
  },
  bell: {
    name: '🔔 Колокольчик',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8f7b3c8.mp3'
  },
  chime: {
    name: '✨ Нежный звон',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_dd6f2b9c8a.mp3'
  },
  digital: {
    name: '📱 Цифровой сигнал',
    url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_3e6b5c8f4a.mp3'
  }
};

// Доступные темы (CSS классы)
const AVAILABLE_THEMES = {
  default: {
    name: '🌙 Стандартная',
    lightBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    darkBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
  },
  forest: {
    name: '🌲 Лесная',
    lightBg: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)',
    darkBg: 'linear-gradient(135deg, #0a2f1f 0%, #051a0f 100%)'
  },
  ocean: {
    name: '🌊 Океан',
    lightBg: 'linear-gradient(135deg, #0f5b82 0%, #0a3a52 100%)',
    darkBg: 'linear-gradient(135deg, #062c40 0%, #031a26 100%)'
  },
  sunset: {
    name: '🌅 Закат',
    lightBg: 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)',
    darkBg: 'linear-gradient(135deg, #5a1e0a 0%, #3a1205 100%)'
  }
};

// Доступные аватары
const AVAILABLE_AVATARS = [
  { id: 'fa-dog', name: '🐶 Корги', emoji: '🐶', default: true },
  { id: 'fa-cat', name: '🐱 Кот', emoji: '🐱', default: true },
  { id: 'fa-fish', name: '🐟 Рыбка', emoji: '🐟', default: true },
  { id: 'fa-dove', name: '🐦 Голубь', emoji: '🐦', default: true },
  { id: 'fa-otter', name: '🦦 Выдра', emoji: '🦦', default: true },
  { id: 'fa-frog', name: '🐸 Лягушка', emoji: '🐸', default: true },
  { id: 'fa-fox', name: '🦊 Лисёнок', emoji: '🦊', price: 300 },
  { id: 'fa-panda', name: '🐼 Панда', emoji: '🐼', price: 350 },
  { id: 'fa-penguin', name: '🐧 Пингвин', emoji: '🐧', price: 300 }
];

function Shop() {
  const { user, updateUser } = useAuth();
  const [coins, setCoins] = useState(0);
  const [purchasedAvatars, setPurchasedAvatars] = useState([]);
  const [purchasedThemes, setPurchasedThemes] = useState([]);
  const [purchasedSounds, setPurchasedSounds] = useState([]);
  const [activeTheme, setActiveTheme] = useState('default');
  const [activeSound, setActiveSound] = useState('default');
  const [loading, setLoading] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const previewAudioRef = useRef(null);

  // Загрузка данных из localStorage
  useEffect(() => {
    // Монеты
    const savedCoins = localStorage.getItem('userCoins');
    if (savedCoins) {
      setCoins(parseInt(savedCoins));
    } else {
      setCoins(300);
      localStorage.setItem('userCoins', 300);
    }
    
    // Купленные аватары
    const savedAvatars = localStorage.getItem('purchasedAvatars');
    if (savedAvatars) {
      setPurchasedAvatars(JSON.parse(savedAvatars));
    } else {
      // По умолчанию есть стандартные аватары
      const defaultAvatars = AVAILABLE_AVATARS.filter(a => a.default).map(a => a.id);
      setPurchasedAvatars(defaultAvatars);
      localStorage.setItem('purchasedAvatars', JSON.stringify(defaultAvatars));
    }
    
    // Купленные темы
    const savedThemes = localStorage.getItem('purchasedThemes');
    if (savedThemes) {
      setPurchasedThemes(JSON.parse(savedThemes));
    } else {
      setPurchasedThemes(['default']);
      localStorage.setItem('purchasedThemes', JSON.stringify(['default']));
    }
    
    // Купленные звуки
    const savedSounds = localStorage.getItem('purchasedSounds');
    if (savedSounds) {
      setPurchasedSounds(JSON.parse(savedSounds));
    } else {
      setPurchasedSounds(['default']);
      localStorage.setItem('purchasedSounds', JSON.stringify(['default']));
    }
    
    // Активная тема
    const savedTheme = localStorage.getItem('activeTheme');
    if (savedTheme && savedTheme !== 'default') {
      setActiveTheme(savedTheme);
      applyTheme(savedTheme);
    }
    
    // Активный звук
    const savedSound = localStorage.getItem('activeSound');
    if (savedSound) {
      setActiveSound(savedSound);
    }
  }, []);

  // Применение темы
  const applyTheme = (themeId) => {
    const body = document.body;
    // Удаляем все классы тем
    Object.keys(AVAILABLE_THEMES).forEach(theme => {
      body.classList.remove(`theme-${theme}`);
    });
    if (themeId !== 'default') {
      body.classList.add(`theme-${themeId}`);
    }
    setActiveTheme(themeId);
    localStorage.setItem('activeTheme', themeId);
  };

  // Воспроизведение звука для предпросмотра
  const playPreviewSound = (soundId) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    const sound = AVAILABLE_SOUNDS[soundId];
    if (sound && sound.url) {
      previewAudioRef.current = new Audio(sound.url);
      previewAudioRef.current.volume = 0.3;
      previewAudioRef.current.play().catch(e => console.log('Preview error:', e));
    }
  };

  // Покупка аватара
  const purchaseAvatar = (avatar) => {
    if (purchasedAvatars.includes(avatar.id)) {
      showMessage(`❌ У вас уже есть этот аватар!`);
      return;
    }
    
    if (coins < avatar.price) {
      showMessage(`❌ Не хватает монет! Нужно ${avatar.price} 🪙`);
      return;
    }
    
    setCoins(prev => {
      const newCoins = prev - avatar.price;
      localStorage.setItem('userCoins', newCoins);
      return newCoins;
    });
    
    const newPurchased = [...purchasedAvatars, avatar.id];
    setPurchasedAvatars(newPurchased);
    localStorage.setItem('purchasedAvatars', JSON.stringify(newPurchased));
    
    showMessage(`✅ Куплен аватар ${avatar.name}! Теперь выберите его в профиле 🎉`);
  };

  // Покупка темы
  const purchaseTheme = (themeId, themeName, price) => {
    if (purchasedThemes.includes(themeId)) {
      applyTheme(themeId);
      showMessage(`🎨 Тема "${themeName}" применена!`);
      return;
    }
    
    if (coins < price) {
      showMessage(`❌ Не хватает монет! Нужно ${price} 🪙`);
      return;
    }
    
    setCoins(prev => {
      const newCoins = prev - price;
      localStorage.setItem('userCoins', newCoins);
      return newCoins;
    });
    
    const newPurchased = [...purchasedThemes, themeId];
    setPurchasedThemes(newPurchased);
    localStorage.setItem('purchasedThemes', JSON.stringify(newPurchased));
    
    applyTheme(themeId);
    showMessage(`✅ Куплена и применена тема "${themeName}"! 🎨`);
  };

  // Покупка звука
  const purchaseSound = (soundId, soundName, price) => {
    if (purchasedSounds.includes(soundId)) {
      setActiveSound(soundId);
      localStorage.setItem('activeSound', soundId);
      localStorage.setItem('customAlarmSound', AVAILABLE_SOUNDS[soundId].url);
      playPreviewSound(soundId);
      showMessage(`🔊 Звук "${soundName}" применён!`);
      return;
    }
    
    if (coins < price) {
      showMessage(`❌ Не хватает монет! Нужно ${price} 🪙`);
      return;
    }
    
    setCoins(prev => {
      const newCoins = prev - price;
      localStorage.setItem('userCoins', newCoins);
      return newCoins;
    });
    
    const newPurchased = [...purchasedSounds, soundId];
    setPurchasedSounds(newPurchased);
    localStorage.setItem('purchasedSounds', JSON.stringify(newPurchased));
    
    setActiveSound(soundId);
    localStorage.setItem('activeSound', soundId);
    localStorage.setItem('customAlarmSound', AVAILABLE_SOUNDS[soundId].url);
    playPreviewSound(soundId);
    showMessage(`✅ Куплен и применён звук "${soundName}"! 🔔`);
  };

  const showMessage = (msg) => {
    setPurchaseMessage(msg);
    setTimeout(() => setPurchaseMessage(''), 3000);
  };

  const getDailyBonus = () => {
    const lastBonus = localStorage.getItem('lastBonusDate');
    const today = new Date().toDateString();
    
    if (lastBonus === today) {
      showMessage('❌ Сегодня вы уже получали бонус! Возвращайтесь завтра');
      return;
    }
    
    const bonus = 100;
    setCoins(prev => {
      const newCoins = prev + bonus;
      localStorage.setItem('userCoins', newCoins);
      return newCoins;
    });
    localStorage.setItem('lastBonusDate', today);
    showMessage(`🎁 Вы получили ${bonus} 🪙 бонусных монет!`);
  };

  const addTestCoins = () => {
    setCoins(prev => {
      const newCoins = prev + 10000;
      localStorage.setItem('userCoins', newCoins);
      return newCoins;
    });
    showMessage(`💰 +10000 монет! Теперь у вас ${coins + 10000} 🪙`);
  };

  const resetTheme = () => {
    applyTheme('default');
    showMessage('🎨 Тема сброшена до стандартной');
  };

  const resetSound = () => {
    setActiveSound('default');
    localStorage.setItem('activeSound', 'default');
    localStorage.removeItem('customAlarmSound');
    showMessage('🔔 Звук сброшен до стандартного');
  };

  const resetAll = () => {
    applyTheme('default');
    setActiveSound('default');
    localStorage.setItem('activeSound', 'default');
    localStorage.removeItem('customAlarmSound');
    showMessage('✨ Все настройки сброшены до стандартных!');
  };

  return (
    <div className="container">
      {purchaseMessage && (
        <div className="shop-notification">{purchaseMessage}</div>
      )}
      
      <div className="shop-header-card">
        <div className="shop-balance">
          <i className="fa-solid fa-coins"></i>
          <span className="balance-value">{coins}</span>
          <span className="balance-label">монет</span>
        </div>
        <div className="shop-actions">
          <button className="daily-bonus-btn" onClick={getDailyBonus}>
            <i className="fa-solid fa-gift"></i>
            Ежедневный бонус
          </button>
          <button className="test-coins-btn" onClick={addTestCoins}>
            <i className="fa-solid fa-flask"></i>
            +10000 монет
          </button>
        </div>
      </div>

      {/* Темы */}
      <div className="shop-category">
        <h2 className="category-title">
          <i className="fa-solid fa-palette"></i>
          Темы оформления
        </h2>
        <div className="shop-grid">
          {Object.entries(AVAILABLE_THEMES).map(([id, theme]) => {
            const isPurchased = purchasedThemes.includes(id);
            const isActive = activeTheme === id;
            const price = id === 'default' ? 0 : 500;
            
            return (
              <div key={id} className="shop-item theme-item">
                <div className="theme-preview-box">
                  <div className="theme-preview-gradient" style={{
                    background: document.body.classList.contains('dark') ? theme.darkBg : theme.lightBg
                  }}>
                    <div className="theme-preview-content">
                      <i className="fa-solid fa-palette"></i>
                      <span>{theme.name}</span>
                    </div>
                  </div>
                </div>
                <h3 className="shop-item-name">{theme.name}</h3>
                <p className="shop-item-description">
                  {id === 'default' ? 'Стандартная тема по умолчанию' : 'Уникальное цветовое оформление'}
                </p>
                {id !== 'default' && (
                  <div className="shop-item-price">
                    <i className="fa-solid fa-coins"></i>
                    {price}
                  </div>
                )}
                <button 
                  className={`shop-item-btn ${isActive ? 'active' : ''}`}
                  onClick={() => purchaseTheme(id, theme.name, price)}
                  disabled={loading}
                >
                  {isActive ? (
                    <><i className="fa-solid fa-check"></i> Применено</>
                  ) : isPurchased ? (
                    <><i className="fa-solid fa-check-double"></i> Применить</>
                  ) : (
                    <><i className="fa-solid fa-cart-shopping"></i> Купить</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Звуки */}
      <div className="shop-category">
        <h2 className="category-title">
          <i className="fa-solid fa-music"></i>
          Звуки уведомлений
        </h2>
        <div className="shop-grid">
          {Object.entries(AVAILABLE_SOUNDS).map(([id, sound]) => {
            const isPurchased = purchasedSounds.includes(id);
            const isActive = activeSound === id;
            const price = id === 'default' ? 0 : 200;
            
            return (
              <div key={id} className="shop-item">
                <div className="shop-item-icon">
                  <i className={`fa-solid ${id === 'default' ? 'fa-bell' : id === 'bell' ? 'fa-bell' : id === 'chime' ? 'fa-music' : 'fa-digital-tiling'}`}></i>
                </div>
                <h3 className="shop-item-name">{sound.name}</h3>
                <p className="shop-item-description">
                  {id === 'default' ? 'Стандартный звук будильника' : 'Приятный звук окончания таймера'}
                </p>
                {id !== 'default' && (
                  <div className="shop-item-price">
                    <i className="fa-solid fa-coins"></i>
                    {price}
                  </div>
                )}
                <div className="sound-buttons">
                  <button 
                    className="preview-sound-btn"
                    onClick={() => playPreviewSound(id)}
                  >
                    <i className="fa-solid fa-play"></i> Прослушать
                  </button>
                  <button 
                    className={`shop-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => purchaseSound(id, sound.name, price)}
                    disabled={loading}
                  >
                    {isActive ? (
                      <><i className="fa-solid fa-check"></i> Применено</>
                    ) : isPurchased ? (
                      <><i className="fa-solid fa-check-double"></i> Применить</>
                    ) : (
                      <><i className="fa-solid fa-cart-shopping"></i> Купить</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Аватары - только для информации, покупка здесь, применение в профиле */}
      <div className="shop-category">
        <h2 className="category-title">
          <i className="fa-solid fa-user-astronaut"></i>
          Аватары
        </h2>
        <p className="category-description">Купите аватар, затем выберите его в профиле</p>
        <div className="shop-grid">
          {AVAILABLE_AVATARS.filter(a => !a.default).map(avatar => {
            const isPurchased = purchasedAvatars.includes(avatar.id);
            
            return (
              <div key={avatar.id} className="shop-item">
                <div className="shop-item-icon avatar-preview-icon">
                  <i className={`fa-solid ${avatar.id}`}></i>
                  <span className="avatar-emoji-badge">{avatar.emoji}</span>
                </div>
                <h3 className="shop-item-name">{avatar.name}</h3>
                <p className="shop-item-description">Уникальный аватар для вашего профиля</p>
                <div className="shop-item-price">
                  <i className="fa-solid fa-coins"></i>
                  {avatar.price}
                </div>
                {isPurchased ? (
                  <button className="shop-item-btn purchased" disabled>
                    <i className="fa-solid fa-check"></i> Куплено
                  </button>
                ) : (
                  <button 
                    className="shop-item-btn"
                    onClick={() => purchaseAvatar(avatar)}
                    disabled={loading}
                  >
                    <i className="fa-solid fa-cart-shopping"></i> Купить
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Сброс настроек */}
      <div className="reset-section">
        <h3 className="reset-title">
          <i className="fa-solid fa-arrow-rotate-left"></i>
          Сброс настроек
        </h3>
        <div className="reset-buttons">
          <button className="reset-btn theme-reset" onClick={resetTheme}>
            <i className="fa-solid fa-palette"></i> Сбросить тему
          </button>
          <button className="reset-btn sound-reset" onClick={resetSound}>
            <i className="fa-solid fa-bell"></i> Сбросить звук
          </button>
          <button className="reset-btn all-reset" onClick={resetAll}>
            <i className="fa-solid fa-rotate-left"></i> Сбросить всё
          </button>
        </div>
      </div>

      <div className="shop-info-card">
        <h3><i className="fa-solid fa-circle-info"></i> Как заработать монеты?</h3>
        <div className="info-list">
          <div className="info-item">
            <i className="fa-solid fa-hourglass-half"></i>
            <span>Завершённый цикл работы — <strong>10 монет</strong></span>
          </div>
          <div className="info-item">
            <i className="fa-solid fa-calendar-day"></i>
            <span>Ежедневный бонус — <strong>100 монет</strong></span>
          </div>
          <div className="info-item">
            <i className="fa-solid fa-trophy"></i>
            <span>Достижения — <strong>от 50 до 500 монет</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Shop;