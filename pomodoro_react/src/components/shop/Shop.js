import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/shop.css';

function Shop() {
    const { user, updateUser } = useAuth();
    const [coins, setCoins] = useState(0);
    const [purchasedItems, setPurchasedItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [purchaseMessage, setPurchaseMessage] = useState('');

    // Товары в магазине
    const [items, setItems] = useState([
        {
            id: 1,
            name: '🐶 Корги-аватар',
            description: 'Эксклюзивный аватар с корги для профиля',
            price: 500,
            icon: 'fa-dog',
            type: 'avatar',
            value: 'fa-dog-corgi'
        },
        {
            id: 2,
            name: '🐱 Кот-аватар',
            description: 'Милый котик для твоего профиля',
            price: 400,
            icon: 'fa-cat',
            type: 'avatar',
            value: 'fa-cat'
        },
        {
            id: 3,
            name: '🦦 Выдра-аватар',
            description: 'Забавная выдра для профиля',
            price: 450,
            icon: 'fa-otter',
            type: 'avatar',
            value: 'fa-otter'
        },
        {
            id: 4,
            name: '🌈 Тема "Радуга"',
            description: 'Красочная тема для таймера',
            price: 800,
            icon: 'fa-rainbow',
            type: 'theme',
            value: 'rainbow'
        },
        {
            id: 5,
            name: '🌙 Тема "Ночь"',
            description: 'Тёмная тема с звёздами',
            price: 700,
            icon: 'fa-moon',
            type: 'theme',
            value: 'night'
        },
        {
            id: 6,
            name: '🌸 Тема "Сакура"',
            description: 'Нежная розовая тема',
            price: 750,
            icon: 'fa-tree',
            type: 'theme',
            value: 'sakura'
        },
        {
            id: 7,
            name: '⚡ Ускоритель',
            description: '+10% к продуктивности (эффект просто для настроения)',
            price: 300,
            icon: 'fa-bolt',
            type: 'boost',
            value: 'speed_boost'
        },
        {
            id: 8,
            name: '🎵 Колокольчик',
            description: 'Приятный звук окончания таймера',
            price: 200,
            icon: 'fa-bell',
            type: 'sound',
            value: 'nice_bell'
        },
        {
            id: 9,
            name: '🍅 Помидорка',
            description: 'Декоративный помидор для интерфейса',
            price: 150,
            icon: 'fa-apple-whole',
            type: 'decoration',
            value: 'tomato'
        }
    ]);

    // Загрузка монет и купленных предметов из localStorage
    useEffect(() => {
        const savedCoins = localStorage.getItem('userCoins');
        const savedPurchased = localStorage.getItem('purchasedItems');
        
        if (savedCoins) {
            setCoins(parseInt(savedCoins));
        } else {
            // Стартовый бонус для нового пользователя
            const startCoins = 300;
            setCoins(startCoins);
            localStorage.setItem('userCoins', startCoins);
        }
        
        if (savedPurchased) {
            setPurchasedItems(JSON.parse(savedPurchased));
        }
    }, []);

    // Сохранение монет при изменении
    useEffect(() => {
        localStorage.setItem('userCoins', coins);
    }, [coins]);

    // Сохранение купленных предметов
    useEffect(() => {
        localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));
    }, [purchasedItems]);

    const showMessage = (msg, isError = false) => {
        setPurchaseMessage(msg);
        setTimeout(() => setPurchaseMessage(''), 3000);
    };

    const purchaseItem = async (item) => {
        if (purchasedItems.includes(item.id)) {
            showMessage('❌ У вас уже есть этот предмет!');
            return;
        }
        
        if (coins < item.price) {
            showMessage(`❌ Не хватает монет! Нужно ${item.price} 🪙`);
            return;
        }
        
        setLoading(true);
        
        // Симуляция покупки (здесь будет API запрос)
        setTimeout(() => {
            // Списываем монеты
            setCoins(prev => prev - item.price);
            // Добавляем в купленные
            setPurchasedItems(prev => [...prev, item.id]);
            
            // Применяем эффект покупки
            if (item.type === 'avatar' && user) {
                // Если купили аватар, можно предложить его установить
                showMessage(`✅ Куплено: ${item.name}! Теперь выбери его в профиле 🎉`);
            } else {
                showMessage(`✅ Куплено: ${item.name}! Спасибо за покупку 🎉`);
            }
            
            setLoading(false);
        }, 500);
    };

    const getDailyBonus = () => {
        const lastBonus = localStorage.getItem('lastBonusDate');
        const today = new Date().toDateString();
        
        if (lastBonus === today) {
            showMessage('❌ Сегодня вы уже получали бонус! Возвращайтесь завтра');
            return;
        }
        
        const bonus = 100;
        setCoins(prev => prev + bonus);
        localStorage.setItem('lastBonusDate', today);
        showMessage(`🎁 Вы получили ${bonus} 🪙 бонусных монет!`);
    };

    return (
        <div className="container">
            {purchaseMessage && (
                <div className="shop-notification">
                    {purchaseMessage}
                </div>
            )}
            
            <div className="shop-header-card">
                <div className="shop-balance">
                    <i className="fa-solid fa-coins"></i>
                    <span className="balance-value">{coins}</span>
                    <span className="balance-label">монет</span>
                </div>
                <button className="daily-bonus-btn" onClick={getDailyBonus}>
                    <i className="fa-solid fa-gift"></i>
                    Ежедневный бонус
                </button>
            </div>
            
            <div className="shop-grid">
                {items.map(item => (
                    <div key={item.id} className="shop-item">
                        <div className="shop-item-icon">
                            <i className={`fa-solid ${item.icon}`}></i>
                        </div>
                        <h3 className="shop-item-name">{item.name}</h3>
                        <p className="shop-item-description">{item.description}</p>
                        <div className="shop-item-price">
                            <i className="fa-solid fa-coins"></i>
                            {item.price}
                        </div>
                        <button 
                            className={`shop-item-btn ${purchasedItems.includes(item.id) ? 'purchased' : ''}`}
                            onClick={() => purchaseItem(item)}
                            disabled={loading || purchasedItems.includes(item.id)}
                        >
                            {purchasedItems.includes(item.id) ? (
                                <>
                                    <i className="fa-solid fa-check"></i> Куплено
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-cart-shopping"></i> Купить
                                </>
                            )}
                        </button>
                    </div>
                ))}
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