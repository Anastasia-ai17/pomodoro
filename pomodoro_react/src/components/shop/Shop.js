import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/shop.css';

// Звуки для магазина (Web Audio API)
const playShopSound = (type) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    switch(type) {
      case 'default':
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.type = 'sine';
        osc1.frequency.value = 880;
        gain1.gain.value = 0.3;
        osc1.start();
        gain1.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.8);
        setTimeout(() => audioContext.close(), 800);
        break;
      case 'trill':
        const playNote = (freq, duration, delay) => {
          setTimeout(() => {
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
        };
        playNote(880, 0.15, 0);
        playNote(1046.50, 0.15, 150);
        playNote(880, 0.15, 300);
        playNote(1046.50, 0.15, 450);
        playNote(880, 0.2, 600);
        playNote(1046.50, 0.3, 800);
        setTimeout(() => audioContext.close(), 1200);
        break;
      case 'chime':
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        osc3.connect(gain3);
        gain3.connect(audioContext.destination);
        osc3.type = 'sine';
        osc3.frequency.value = 523.25;
        gain3.gain.value = 0.3;
        osc3.start();
        setTimeout(() => { osc3.frequency.value = 659.25; }, 150);
        setTimeout(() => { osc3.frequency.value = 783.99; }, 300);
        gain3.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.8);
        setTimeout(() => audioContext.close(), 800);
        break;
      case 'digital':
        const osc4 = audioContext.createOscillator();
        const gain4 = audioContext.createGain();
        osc4.connect(gain4);
        gain4.connect(audioContext.destination);
        osc4.type = 'square';
        osc4.frequency.value = 440;
        gain4.gain.value = 0.3;
        osc4.start();
        setTimeout(() => { osc4.frequency.value = 880; }, 100);
        setTimeout(() => { osc4.frequency.value = 440; }, 200);
        gain4.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.6);
        setTimeout(() => audioContext.close(), 600);
        break;
      default: audioContext.close();
    }
  } catch (e) { console.log('Audio error:', e); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
};

// Доступные звуки
const AVAILABLE_SOUNDS = {
  default: { name: '🔔 Стандартный', type: 'default', icon: 'fa-bell', play: () => playShopSound('default') },
  trill: { name: '🎵 Трель', type: 'trill', price: 200, icon: 'fa-music', play: () => playShopSound('trill') },
  chime: { name: '✨ Нежный звон', type: 'chime', price: 200, icon: 'fa-bell', play: () => playShopSound('chime') },
  digital: { name: '📱 Цифровой сигнал', type: 'digital', price: 200, icon: 'fa-microchip', play: () => playShopSound('digital') }
};

// Доступные темы
const AVAILABLE_THEMES = {
  default: { name: '🌙 Стандартная', lightBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', darkBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
  forest: { name: '🌲 Лесная', lightBg: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)', darkBg: 'linear-gradient(135deg, #0a2f1f 0%, #051a0f 100%)', price: 500 },
  ocean: { name: '🌊 Океан', lightBg: 'linear-gradient(135deg, #0f5b82 0%, #0a3a52 100%)', darkBg: 'linear-gradient(135deg, #062c40 0%, #031a26 100%)', price: 500 },
  sunset: { name: '🌅 Закат', lightBg: 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)', darkBg: 'linear-gradient(135deg, #5a1e0a 0%, #3a1205 100%)', price: 500 }
};

// Доступные аватары
const AVAILABLE_AVATARS = [
  { id: 'fa-dog', name: 'Корги', emoji: '🐶', default: true },
  { id: 'fa-cat', name: 'Кот', emoji: '🐱', default: true },
  { id: 'fa-fish', name: 'Рыбка', emoji: '🐟', default: true },
  { id: 'fa-dove', name: 'Голубь', emoji: '🐦', default: true },
  { id: 'fa-otter', name: 'Выдра', emoji: '🦦', default: true },
  { id: 'fa-frog', name: 'Лягушка', emoji: '🐸', default: true },
  { id: 'fa-fox', name: 'Лисёнок', emoji: '🦊', price: 300 },
  { id: 'fa-panda', name: 'Панда', emoji: '🐼', price: 350 },
  { id: 'fa-penguin', name: 'Пингвин', emoji: '🐧', price: 300 }
];

function Shop() {
  const { isAuthenticated } = useAuth();
  const [coins, setCoins] = useState(0);
  const [purchasedAvatars, setPurchasedAvatars] = useState([]);
  const [purchasedThemes, setPurchasedThemes] = useState([]);
  const [purchasedSounds, setPurchasedSounds] = useState([]);
  const [activeTheme, setActiveTheme] = useState('default');
  const [activeSound, setActiveSound] = useState('default');
  const [purchaseMessage, setPurchaseMessage] = useState('');

  // Загрузка данных
  useEffect(() => {
    if (!isAuthenticated) {
      setCoins(0);
      return;
    }
    const savedCoins = localStorage.getItem('userCoins');
    setCoins(savedCoins ? parseInt(savedCoins) : 100);
    
    const savedAvatars = localStorage.getItem('purchasedAvatars');
    if (savedAvatars) setPurchasedAvatars(JSON.parse(savedAvatars));
    else { const defaultAvatars = AVAILABLE_AVATARS.filter(a => a.default).map(a => a.id); setPurchasedAvatars(defaultAvatars); localStorage.setItem('purchasedAvatars', JSON.stringify(defaultAvatars)); }
    
    const savedThemes = localStorage.getItem('purchasedThemes');
    if (savedThemes) setPurchasedThemes(JSON.parse(savedThemes));
    else setPurchasedThemes(['default']);
    
    const savedSounds = localStorage.getItem('purchasedSounds');
    if (savedSounds) setPurchasedSounds(JSON.parse(savedSounds));
    else setPurchasedSounds(['default']);
    
    const savedTheme = localStorage.getItem('activeTheme');
    if (savedTheme) { setActiveTheme(savedTheme); applyTheme(savedTheme); }
    
    const savedSound = localStorage.getItem('activeSound');
    if (savedSound) setActiveSound(savedSound);
  }, [isAuthenticated]);

  const applyTheme = (themeId) => {
    const body = document.body;
    Object.keys(AVAILABLE_THEMES).forEach(theme => body.classList.remove(`theme-${theme}`));
    if (themeId !== 'default') body.classList.add(`theme-${themeId}`);
    setActiveTheme(themeId);
    localStorage.setItem('activeTheme', themeId);
  };

  const purchaseAvatar = (avatar) => {
    if (!isAuthenticated) {
      setPurchaseMessage('🔒 Авторизуйтесь, чтобы покупать аватары!');
      setTimeout(() => setPurchaseMessage(''), 3000);
      return;
    }
    if (purchasedAvatars.includes(avatar.id)) { setPurchaseMessage(`❌ У вас уже есть этот аватар!`); setTimeout(() => setPurchaseMessage(''), 3000); return; }
    if (coins < avatar.price) { setPurchaseMessage(`❌ Не хватает монет! Нужно ${avatar.price} 🪙`); setTimeout(() => setPurchaseMessage(''), 3000); return; }
    const newCoins = coins - avatar.price;
    setCoins(newCoins);
    localStorage.setItem('userCoins', newCoins);
    const newPurchased = [...purchasedAvatars, avatar.id];
    setPurchasedAvatars(newPurchased);
    localStorage.setItem('purchasedAvatars', JSON.stringify(newPurchased));
    setPurchaseMessage(`✅ Куплен аватар ${avatar.name}! Теперь выберите его в профиле 🎉`);
    setTimeout(() => setPurchaseMessage(''), 3000);
  };

  const purchaseTheme = (themeId, theme) => {
    if (!isAuthenticated) {
      setPurchaseMessage('🔒 Авторизуйтесь, чтобы покупать темы!');
      setTimeout(() => setPurchaseMessage(''), 3000);
      return;
    }
    if (purchasedThemes.includes(themeId)) { applyTheme(themeId); setPurchaseMessage(`🎨 Тема "${theme.name}" применена!`); setTimeout(() => setPurchaseMessage(''), 3000); return; }
    if (coins < theme.price) { setPurchaseMessage(`❌ Не хватает монет! Нужно ${theme.price} 🪙`); setTimeout(() => setPurchaseMessage(''), 3000); return; }
    const newCoins = coins - theme.price;
    setCoins(newCoins);
    localStorage.setItem('userCoins', newCoins);
    const newPurchased = [...purchasedThemes, themeId];
    setPurchasedThemes(newPurchased);
    localStorage.setItem('purchasedThemes', JSON.stringify(newPurchased));
    applyTheme(themeId);
    setPurchaseMessage(`✅ Куплена и применена тема "${theme.name}"! 🎨`);
    setTimeout(() => setPurchaseMessage(''), 3000);
  };

  const purchaseSound = (soundId, sound) => {
    if (!isAuthenticated) {
      setPurchaseMessage('🔒 Авторизуйтесь, чтобы покупать звуки!');
      setTimeout(() => setPurchaseMessage(''), 3000);
      return;
    }
    if (purchasedSounds.includes(soundId)) { setActiveSound(soundId); localStorage.setItem('activeSound', soundId); localStorage.setItem('customAlarmSoundType', sound.type); sound.play(); setPurchaseMessage(`🔊 Звук "${sound.name}" применён!`); setTimeout(() => setPurchaseMessage(''), 3000); return; }
    if (coins < sound.price) { setPurchaseMessage(`❌ Не хватает монет! Нужно ${sound.price} 🪙`); setTimeout(() => setPurchaseMessage(''), 3000); return; }
    const newCoins = coins - sound.price;
    setCoins(newCoins);
    localStorage.setItem('userCoins', newCoins);
    const newPurchased = [...purchasedSounds, soundId];
    setPurchasedSounds(newPurchased);
    localStorage.setItem('purchasedSounds', JSON.stringify(newPurchased));
    setActiveSound(soundId);
    localStorage.setItem('activeSound', soundId);
    localStorage.setItem('customAlarmSoundType', sound.type);
    sound.play();
    setPurchaseMessage(`✅ Куплен и применён звук "${sound.name}"! 🔔`);
    setTimeout(() => setPurchaseMessage(''), 3000);
  };

  const getDailyBonus = () => {
    if (!isAuthenticated) {
      setPurchaseMessage('🔒 Авторизуйтесь, чтобы получать бонусы!');
      setTimeout(() => setPurchaseMessage(''), 3000);
      return;
    }
    const lastBonus = localStorage.getItem('lastBonusDate');
    const today = new Date().toDateString();
    if (lastBonus === today) { setPurchaseMessage('❌ Сегодня вы уже получали бонус!'); setTimeout(() => setPurchaseMessage(''), 3000); return; }
    const bonus = 50;
    const newCoins = coins + bonus;
    setCoins(newCoins);
    localStorage.setItem('userCoins', newCoins);
    localStorage.setItem('lastBonusDate', today);
    setPurchaseMessage(`🎁 Вы получили ${bonus} 🪙 бонусных монет!`);
    setTimeout(() => setPurchaseMessage(''), 3000);
  };

  const resetTheme = () => { applyTheme('default'); setPurchaseMessage('🎨 Тема сброшена до стандартной'); setTimeout(() => setPurchaseMessage(''), 3000); };
  const resetSound = () => { setActiveSound('default'); localStorage.setItem('activeSound', 'default'); localStorage.removeItem('customAlarmSoundType'); setPurchaseMessage('🔔 Звук сброшен до стандартного'); setTimeout(() => setPurchaseMessage(''), 3000); };
  const resetAll = () => { applyTheme('default'); setActiveSound('default'); localStorage.setItem('activeSound', 'default'); localStorage.removeItem('customAlarmSoundType'); setPurchaseMessage('✨ Все настройки сброшены до стандартных!'); setTimeout(() => setPurchaseMessage(''), 3000); };

  return (
    <div className="container">
      {purchaseMessage && <div className="shop-notification">{purchaseMessage}</div>}
      <div className="shop-header-card">
        <div className="shop-balance">
          <i className="fa-solid fa-coins"></i>
          <span className="balance-value">{coins}</span>
          <span className="balance-label">монет</span>
        </div>
        <div className="shop-actions">
          <button className="daily-bonus-btn" onClick={getDailyBonus}><i className="fa-solid fa-gift"></i> Ежедневный бонус</button>
        </div>
      </div>

      {/* Темы */}
      <div className="shop-category">
        <h2 className="category-title"><i className="fa-solid fa-palette"></i> Темы оформления</h2>
        <div className="shop-grid">
          {Object.entries(AVAILABLE_THEMES).map(([id, theme]) => {
            const isPurchased = purchasedThemes.includes(id);
            const isActive = activeTheme === id;
            const hasPrice = theme.price && id !== 'default';
            return (
              <div key={id} className="shop-item theme-item">
                <div className="theme-preview-box">
                  <div className="theme-preview-gradient" style={{ background: document.body.classList.contains('dark') ? theme.darkBg : theme.lightBg }}>
                    <div className="theme-preview-content"><i className="fa-solid fa-palette"></i><span>{theme.name}</span></div>
                  </div>
                </div>
                <h3 className="shop-item-name">{theme.name}</h3>
                <p className="shop-item-description">{id === 'default' ? 'Стандартная тема по умолчанию' : 'Уникальное цветовое оформление'}</p>
                {hasPrice && <div className="shop-item-price"><i className="fa-solid fa-coins"></i>{theme.price}</div>}
                <button className={`shop-item-btn ${isActive ? 'active' : ''}`} onClick={() => purchaseTheme(id, theme)}>
                  {isActive ? <><i className="fa-solid fa-check"></i> Применено</> : isPurchased ? <><i className="fa-solid fa-check-double"></i> Применить</> : <><i className="fa-solid fa-cart-shopping"></i> Купить</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Звуки */}
      <div className="shop-category">
        <h2 className="category-title"><i className="fa-solid fa-music"></i> Звуки уведомлений</h2>
        <div className="shop-grid">
          {Object.entries(AVAILABLE_SOUNDS).map(([id, sound]) => {
            const isPurchased = purchasedSounds.includes(id);
            const isActive = activeSound === id;
            const hasPrice = sound.price;
            return (
              <div key={id} className="shop-item">
                <div className="shop-item-icon"><i className={`fa-solid ${sound.icon}`}></i></div>
                <h3 className="shop-item-name">{sound.name}</h3>
                <p className="shop-item-description">{id === 'default' ? 'Стандартный звук будильника' : 'Приятный звук окончания таймера'}</p>
                {hasPrice && <div className="shop-item-price"><i className="fa-solid fa-coins"></i>{sound.price}</div>}
                <div className="sound-buttons">
                  <button className="preview-sound-btn" onClick={() => sound.play()}><i className="fa-solid fa-play"></i> Прослушать</button>
                  <button className={`shop-item-btn ${isActive ? 'active' : ''}`} onClick={() => purchaseSound(id, sound)}>
                    {isActive ? <><i className="fa-solid fa-check"></i> Применено</> : isPurchased ? <><i className="fa-solid fa-check-double"></i> Применить</> : <><i className="fa-solid fa-cart-shopping"></i> Купить</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Аватары */}
      <div className="shop-category">
        <h2 className="category-title"><i className="fa-solid fa-user-astronaut"></i> Аватары</h2>
        <p className="category-description">✨ Купите аватар, затем выберите его в профиле</p>
        <div className="shop-grid">
          {AVAILABLE_AVATARS.filter(a => !a.default).map(avatar => {
            const isPurchased = purchasedAvatars.includes(avatar.id);
            return (
              <div key={avatar.id} className="shop-item">
                <div className="shop-item-icon avatar-preview-icon"><span style={{ fontSize: '48px' }}>{avatar.emoji}</span></div>
                <h3 className="shop-item-name">{avatar.name}</h3>
                <p className="shop-item-description">Уникальный аватар для профиля</p>
                <div className="shop-item-price"><i className="fa-solid fa-coins"></i>{avatar.price}</div>
                {isPurchased ? <button className="shop-item-btn purchased" disabled><i className="fa-solid fa-check"></i> Куплено</button> : <button className="shop-item-btn" onClick={() => purchaseAvatar(avatar)}><i className="fa-solid fa-cart-shopping"></i> Купить</button>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Сброс настроек */}
      <div className="reset-section">
        <h3 className="reset-title"><i className="fa-solid fa-arrow-rotate-left"></i> Сброс настроек</h3>
        <div className="reset-buttons">
          <button className="reset-btn theme-reset" onClick={resetTheme}><i className="fa-solid fa-palette"></i> Сбросить тему</button>
          <button className="reset-btn sound-reset" onClick={resetSound}><i className="fa-solid fa-bell"></i> Сбросить звук</button>
          <button className="reset-btn all-reset" onClick={resetAll}><i className="fa-solid fa-rotate-left"></i> Сбросить всё</button>
        </div>
      </div>

      {/* Инфо */}
      <div className="shop-info-card">
        <h3><i className="fa-solid fa-circle-info"></i> Как заработать монеты?</h3>
        <div className="info-list">
          <div className="info-item"><i className="fa-solid fa-hourglass-half"></i><span>Завершённый цикл работы — <strong>10 монет</strong></span></div>
          <div className="info-item"><i className="fa-solid fa-calendar-day"></i><span>Ежедневный бонус — <strong>50 монет</strong></span></div>
          <div className="info-item"><i className="fa-solid fa-trophy"></i><span>Достижения — <strong>от 50 до 500 монет</strong></span></div>
        </div>
      </div>
    </div>
  );
}

export default Shop;