(function () {
    if (!window.React || !window.ReactDOM) {
        return;
    }

    const { useEffect, useRef, useState } = React;
    const h = React.createElement;

    const DEFAULTS = Object.freeze({
        work: 25,
        shortBreak: 5,
        longBreak: 15,
        cycles: 4,
    });

    const ROUTES = new Set(["/", "/auth/", "/regist/", "/person/"]);

    const MODE_META = {
        work: {
            label: "🔴 Работа",
            badgeBackground: "#EEF2FF",
            badgeColor: "#4F46E5",
        },
        shortBreak: {
            label: "🟢 Отдых",
            badgeBackground: "#E8F5E9",
            badgeColor: "#2E7D32",
        },
        longBreak: {
            label: "🔵 Большой перерыв",
            badgeBackground: "#E3F2FD",
            badgeColor: "#1565C0",
        },
    };

    const SETTINGS_FIELDS = [
        {
            key: "work",
            label: "Работа (мин)",
            iconClass: "fa-regular fa-clock",
            min: 1,
            max: 60,
            fallback: DEFAULTS.work,
        },
        {
            key: "shortBreak",
            label: "Отдых (мин)",
            iconClass: "fa-regular fa-mug-saucer",
            min: 1,
            max: 30,
            fallback: DEFAULTS.shortBreak,
        },
        {
            key: "longBreak",
            label: "Большой перерыв (мин)",
            iconClass: "fa-regular fa-sun",
            min: 1,
            max: 60,
            fallback: DEFAULTS.longBreak,
        },
        {
            key: "cyclesBeforeLongBreak",
            label: "Циклов до большого",
            iconClass: "fa-solid fa-rotate-right",
            min: 1,
            max: 10,
            fallback: DEFAULTS.cycles,
        },
    ];

    const INFO_CARDS = [
        {
            iconClass: "fa-solid fa-tomato info-icon",
            title: "Метод помидора",
            text: "Работа дробится на короткие сфокусированные отрезки. После каждого идёт отдых, а после серии циклов наступает длинная пауза.",
        },
        {
            iconClass: "fa-solid fa-brain info-icon",
            title: "Почему помогает",
            text: "Так проще начать сложную задачу, меньше усталости, выше устойчивость внимания. Ритм становится понятным и измеримым.",
        },
        {
            iconClass: "fa-solid fa-chart-simple info-icon",
            title: "Статистика в Django",
            text: "Если войти в аккаунт, завершённые рабочие циклы сохраняются на бекенде, а в профиле появляются реальные показатели за день, неделю и месяц.",
        },
    ];

    const AVATARS = [
        { icon: "fa-dog", emoji: "🐶" },
        { icon: "fa-cat", emoji: "🐱" },
        { icon: "fa-fish", emoji: "🐟" },
        { icon: "fa-dove", emoji: "🐦" },
        { icon: "fa-otter", emoji: "🦦" },
        { icon: "fa-frog", emoji: "🐸" },
    ];

    function icon(className) {
        return h("i", { className, "aria-hidden": "true" });
    }

    function normalizePath(pathname) {
        if (!pathname || pathname === "/") {
            return "/";
        }

        const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
        return ROUTES.has(normalized) ? normalized : "/";
    }

    function clamp(value, min, max, fallback) {
        const parsedValue = Number.parseInt(value, 10);

        if (Number.isNaN(parsedValue)) {
            return fallback;
        }

        return Math.min(max, Math.max(min, parsedValue));
    }

    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    function formatMinutes(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}ч ${minutes}м`;
    }

    function formatDate(value) {
        if (!value) {
            return "Не указана";
        }

        return new Date(value).toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    function loadStoredSettings() {
        try {
            const savedSettings = JSON.parse(window.localStorage.getItem("pomodoro-settings") || "{}");
            return {
                work: clamp(savedSettings.work, 1, 60, DEFAULTS.work),
                shortBreak: clamp(savedSettings.shortBreak, 1, 30, DEFAULTS.shortBreak),
                longBreak: clamp(savedSettings.longBreak, 1, 60, DEFAULTS.longBreak),
                cyclesBeforeLongBreak: clamp(savedSettings.cyclesBeforeLongBreak, 1, 10, DEFAULTS.cycles),
            };
        } catch (error) {
            return {
                work: DEFAULTS.work,
                shortBreak: DEFAULTS.shortBreak,
                longBreak: DEFAULTS.longBreak,
                cyclesBeforeLongBreak: DEFAULTS.cycles,
            };
        }
    }

    function getModeDuration(mode, settings) {
        if (mode === "work") {
            return settings.work * 60;
        }

        if (mode === "shortBreak") {
            return settings.shortBreak * 60;
        }

        return settings.longBreak * 60;
    }

    function getNextMode(mode, completedCycles, settings) {
        if (mode === "work") {
            const nextCompletedCycles = completedCycles + 1;
            return {
                mode: nextCompletedCycles % settings.cyclesBeforeLongBreak === 0 ? "longBreak" : "shortBreak",
                workCyclesCompleted: nextCompletedCycles,
            };
        }

        return {
            mode: "work",
            workCyclesCompleted: completedCycles,
        };
    }

    function getNextModeLabel(mode, completedCycles, settings) {
        if (mode !== "work") {
            return "работа";
        }

        return (completedCycles + 1) % settings.cyclesBeforeLongBreak === 0 ? "большой перерыв" : "отдых";
    }

    function getCookie(name) {
        const cookieValue = document.cookie
            .split(";")
            .map(function trimCookiePart(part) {
                return part.trim();
            })
            .find(function findCookie(part) {
                return part.startsWith(`${name}=`);
            });

        return cookieValue ? decodeURIComponent(cookieValue.split("=").slice(1).join("=")) : "";
    }

    function flattenErrors(errors) {
        if (!errors) {
            return "Произошла ошибка";
        }

        if (typeof errors === "string") {
            return errors;
        }

        if (Array.isArray(errors)) {
            return errors.join(" ");
        }

        return Object.keys(errors)
            .map(function mapField(key) {
                return flattenErrors(errors[key]);
            })
            .join(" ");
    }

    async function apiRequest(path, options) {
        const requestOptions = Object.assign({ method: "GET" }, options || {});
        const method = String(requestOptions.method || "GET").toUpperCase();
        const headers = new Headers(requestOptions.headers || {});

        requestOptions.credentials = "same-origin";

        if (requestOptions.body && !(requestOptions.body instanceof FormData)) {
            headers.set("Content-Type", "application/json");
            requestOptions.body = JSON.stringify(requestOptions.body);
        }

        if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
            headers.set("X-CSRFToken", getCookie("csrftoken"));
        }

        requestOptions.headers = headers;

        const response = await fetch(path, requestOptions);
        let data = null;

        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }

        if (!response.ok) {
            const requestError = new Error("Request failed");
            requestError.status = response.status;
            requestError.data = data;
            throw requestError;
        }

        return data;
    }

    function createLink(to, className, onNavigate, content, extraProps) {
        const props = Object.assign(
            {
                href: to,
                className,
                onClick: function handleClick(event) {
                    event.preventDefault();
                    onNavigate(to);
                },
            },
            extraProps || {}
        );

        return h("a", props, content);
    }

    function SettingItem(props) {
        const { field, value, onChange } = props;

        return h(
            "div",
            { className: "setting-item" },
            h(
                "label",
                null,
                icon(field.iconClass),
                " ",
                field.label
            ),
            h(
                "div",
                { className: "slider-container" },
                h("input", {
                    type: "range",
                    className: "slider",
                    min: field.min,
                    max: field.max,
                    step: 1,
                    value,
                    onChange: function handleSliderChange(event) {
                        onChange(field.key, event.target.value);
                    },
                }),
                h("input", {
                    type: "number",
                    className: "number-input",
                    min: field.min,
                    max: field.max,
                    step: 1,
                    value,
                    onChange: function handleInputChange(event) {
                        onChange(field.key, event.target.value);
                    },
                })
            )
        );
    }

    function Feedback(props) {
        if (!props.message) {
            return null;
        }

        return h("div", { className: `feedback ${props.kind || "info"}` }, props.message);
    }

    function PasswordField(props) {
        const [visible, setVisible] = useState(false);

        return h(
            "div",
            { className: "field-group" },
            h("label", { htmlFor: props.id }, props.label),
            h(
                "div",
                { className: "password-row" },
                h("input", {
                    id: props.id,
                    className: "field-input",
                    type: visible ? "text" : "password",
                    value: props.value,
                    placeholder: props.placeholder,
                    minLength: props.minLength,
                    onChange: props.onChange,
                    autoComplete: props.autoComplete,
                }),
                h(
                    "button",
                    {
                        type: "button",
                        className: "password-toggle",
                        onClick: function togglePasswordVisibility() {
                            setVisible(function updateVisibility(previous) {
                                return !previous;
                            });
                        },
                    },
                    icon(visible ? "fa-regular fa-eye-slash" : "fa-regular fa-eye")
                )
            )
        );
    }

    function HomePage(props) {
        const [settings, setSettings] = useState(loadStoredSettings);
        const [currentMode, setCurrentMode] = useState("work");
        const [timeLeft, setTimeLeft] = useState(function getInitialTime() {
            return getModeDuration("work", loadStoredSettings());
        });
        const [isRunning, setIsRunning] = useState(false);
        const [workCyclesCompleted, setWorkCyclesCompleted] = useState(0);
        const [isAlarmVisible, setIsAlarmVisible] = useState(false);
        const [feedback, setFeedback] = useState(null);

        const audioRef = useRef(null);
        const settingsRef = useRef(settings);
        const modeRef = useRef(currentMode);
        const workCyclesCompletedRef = useRef(workCyclesCompleted);
        const feedbackTimeoutRef = useRef(null);

        useEffect(function syncSettingsRef() {
            settingsRef.current = settings;
            window.localStorage.setItem("pomodoro-settings", JSON.stringify(settings));
        }, [settings]);

        useEffect(function syncModeRef() {
            modeRef.current = currentMode;
        }, [currentMode]);

        useEffect(function syncCyclesRef() {
            workCyclesCompletedRef.current = workCyclesCompleted;
        }, [workCyclesCompleted]);

        useEffect(function updateTitle() {
            document.title = isRunning ? `🍅 ${formatTime(timeLeft)} - FocusCorgi` : "FocusCorgi";
        }, [isRunning, timeLeft]);

        useEffect(function tickTimer() {
            if (!isRunning) {
                return undefined;
            }

            const intervalId = window.setInterval(function onTick() {
                setTimeLeft(function updateTime(previousValue) {
                    return Math.max(previousValue - 1, 0);
                });
            }, 1000);

            return function cleanupTimer() {
                window.clearInterval(intervalId);
            };
        }, [isRunning]);

        useEffect(function handleCompletion() {
            if (!isRunning || timeLeft !== 0) {
                return;
            }

            const completedMode = modeRef.current;
            const completedSettings = settingsRef.current;
            const completedCycles = workCyclesCompletedRef.current;

            playAlarmAndNotify(completedMode, completedCycles, completedSettings);

            if (completedMode === "work" && props.currentUser) {
                props.onWorkSessionComplete(completedSettings.work)
                    .then(function onSaved() {
                        setFeedback({ kind: "success", message: "Рабочая сессия сохранена в Django." });
                    })
                    .catch(function onSaveError() {
                        setFeedback({ kind: "error", message: "Сессию не удалось сохранить на сервере." });
                    });
            }

            const nextState = getNextMode(completedMode, completedCycles, completedSettings);

            setWorkCyclesCompleted(nextState.workCyclesCompleted);
            setCurrentMode(nextState.mode);
            setTimeLeft(getModeDuration(nextState.mode, completedSettings));
        }, [isRunning, timeLeft, props]);

        useEffect(function autoHideFeedback() {
            if (!feedback) {
                return undefined;
            }

            window.clearTimeout(feedbackTimeoutRef.current);
            feedbackTimeoutRef.current = window.setTimeout(function clearFeedback() {
                setFeedback(null);
            }, 2600);

            return function cleanupFeedback() {
                window.clearTimeout(feedbackTimeoutRef.current);
            };
        }, [feedback]);

        useEffect(function cleanupOnUnmount() {
            return function teardown() {
                stopAlarm();
                window.clearTimeout(feedbackTimeoutRef.current);
            };
        }, []);

        function stopAlarm() {
            const audio = audioRef.current;

            if (audio) {
                audio.pause();
                audio.currentTime = 0;
                audio.loop = false;
            }

            setIsAlarmVisible(false);
        }

        function playAlarmAndNotify(mode, completedCycles, currentSettings) {
            const audio = audioRef.current;

            if (audio) {
                audio.loop = true;
                audio.volume = 1;
                audio.play().catch(function ignorePlaybackError() {
                    return undefined;
                });
            }

            setIsAlarmVisible(true);

            if ("Notification" in window) {
                if (Notification.permission === "granted") {
                    const notification = new Notification("⏰ FocusCorgi", {
                        body: `${MODE_META[mode].label} завершена. Следующее: ${getNextModeLabel(mode, completedCycles, currentSettings)}.`,
                        icon: "https://cdn-icons-png.flaticon.com/512/564/564619.png",
                        requireInteraction: true,
                        silent: true,
                    });

                    notification.onclick = function handleNotificationClick() {
                        stopAlarm();
                        window.focus();
                    };
                } else if (Notification.permission === "default") {
                    Notification.requestPermission().catch(function ignorePermissionError() {
                        return undefined;
                    });
                }
            }

            if (navigator.vibrate) {
                navigator.vibrate([500, 200, 500]);
            }
        }

        function updateSetting(key, rawValue) {
            const field = SETTINGS_FIELDS.find(function findField(item) {
                return item.key === key;
            });

            if (!field) {
                return;
            }

            const nextValue = clamp(rawValue, field.min, field.max, field.fallback);

            setSettings(function updatePreviousSettings(previousSettings) {
                const nextSettings = Object.assign({}, previousSettings, { [key]: nextValue });

                if (!isRunning) {
                    setTimeLeft(getModeDuration(modeRef.current, nextSettings));
                }

                return nextSettings;
            });
        }

        function resetSettings() {
            const nextSettings = {
                work: DEFAULTS.work,
                shortBreak: DEFAULTS.shortBreak,
                longBreak: DEFAULTS.longBreak,
                cyclesBeforeLongBreak: DEFAULTS.cycles,
            };

            setSettings(nextSettings);

            if (!isRunning) {
                setTimeLeft(getModeDuration(modeRef.current, nextSettings));
            }
        }

        function handleStart() {
            stopAlarm();

            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission().catch(function ignorePermissionError() {
                    return undefined;
                });
            }

            setWorkCyclesCompleted(0);
            setCurrentMode("work");
            setTimeLeft(settings.work * 60);
            setIsRunning(true);
            setFeedback(null);
        }

        function handlePause() {
            setIsRunning(false);
        }

        function handleReset() {
            stopAlarm();
            setIsRunning(false);
            setWorkCyclesCompleted(0);
            setCurrentMode("work");
            setTimeLeft(settings.work * 60);
            setFeedback(null);
        }

        const modeMeta = MODE_META[currentMode];
        const cycleText = currentMode === "work"
            ? `Цикл ${workCyclesCompleted + 1}/${settings.cyclesBeforeLongBreak}`
            : `Перерыв · Циклов: ${workCyclesCompleted}`;

        return h(
            "div",
            { className: "page-stack" },
            h(
                "section",
                { className: "hero" },
                h(
                    "div",
                    { className: "hero-copy" },
                    h("h1", null, "React-фронт для реального Django-бекенда"),
                    h(
                        "p",
                        null,
                        "Таймер, авторизация, профиль и статистика работают через единое SPA. Интерфейс живёт в React, а состояние пользователя и сохранённые сессии обслуживает Django API."
                    )
                ),
                h(
                    "aside",
                    { className: "hero-aside" },
                    h("h3", null, props.currentUser ? `Привет, ${props.currentUser.username}` : "Что уже работает"),
                    h(
                        "ul",
                        null,
                        h("li", null, props.currentUser ? "Учётка и профиль синхронизированы с Django." : "Регистрация и вход сохраняют сессию на сервере."),
                        h("li", null, "Завершённые рабочие интервалы пишутся в базу как FocusSession."),
                        h("li", null, "Профиль собирает реальную статистику за день, неделю и месяц.")
                    )
                )
            ),
            props.currentUser
                ? h("div", { className: "callout" }, "После завершения рабочего цикла статистика обновится в профиле автоматически.")
                : h(
                    "div",
                    { className: "callout" },
                    "Сейчас таймер доступен всем, но сохранение прогресса на Django-бекенде включается после входа в аккаунт."
                ),
            Feedback(feedback || {}),
            h(
                "div",
                { className: "container" },
                isAlarmVisible
                    ? h(
                        "div",
                        {
                            className: "sound-panel",
                            role: "button",
                            tabIndex: 0,
                            onClick: stopAlarm,
                            onKeyDown: function handleSoundPanelKeyDown(event) {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    stopAlarm();
                                }
                            },
                        },
                        h(
                            "div",
                            { className: "sound-content" },
                            icon("fa-solid fa-bell fa-shake"),
                            h("span", null, "Время вышло. Нажми сюда, чтобы выключить звук.")
                        )
                    )
                    : null,
                h(
                    "div",
                    { className: "timer-card" },
                    h(
                        "div",
                        { className: "timer-status" },
                        h(
                            "span",
                            {
                                className: "mode-badge",
                                style: {
                                    background: modeMeta.badgeBackground,
                                    color: modeMeta.badgeColor,
                                },
                            },
                            modeMeta.label
                        ),
                        h("span", { className: "cycle-counter" }, cycleText)
                    ),
                    h(
                        "div",
                        { className: "timer-circle" },
                        h("div", { className: "timer-display" }, formatTime(timeLeft))
                    ),
                    h(
                        "div",
                        { className: "timer-controls" },
                        h(
                            "button",
                            {
                                type: "button",
                                className: "control-btn primary",
                                onClick: handleStart,
                            },
                            icon("fa-solid fa-play"),
                            " Старт"
                        ),
                        h(
                            "button",
                            {
                                type: "button",
                                className: "control-btn",
                                onClick: handlePause,
                            },
                            icon("fa-solid fa-pause"),
                            " Пауза"
                        ),
                        h(
                            "button",
                            {
                                type: "button",
                                className: "control-btn",
                                onClick: handleReset,
                            },
                            icon("fa-solid fa-stop"),
                            " Сброс"
                        )
                    )
                ),
                h(
                    "div",
                    { className: "settings-section" },
                    h(
                        "h3",
                        null,
                        icon("fa-solid fa-sliders"),
                        " Настройки времени"
                    ),
                    h(
                        "div",
                        { className: "settings-grid" },
                        SETTINGS_FIELDS.map(function renderField(field) {
                            return h(SettingItem, {
                                key: field.key,
                                field,
                                value: settings[field.key],
                                onChange: updateSetting,
                            });
                        })
                    ),
                    h(
                        "button",
                        {
                            type: "button",
                            className: "reset-settings-btn",
                            onClick: resetSettings,
                        },
                        icon("fa-solid fa-undo"),
                        " Сбросить на 25/5/15"
                    )
                ),
                h(
                    "div",
                    { className: "info-section" },
                    h("h2", null, "🍅 Как теперь устроен проект"),
                    h(
                        "div",
                        { className: "info-grid" },
                        INFO_CARDS.map(function renderCard(card) {
                            return h(
                                "div",
                                { key: card.title, className: "info-card" },
                                icon(card.iconClass),
                                h("h3", null, card.title),
                                h("p", null, card.text)
                            );
                        })
                    )
                )
            ),
            h(
                "audio",
                {
                    ref: audioRef,
                    preload: "auto",
                },
                h("source", {
                    src: "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg",
                    type: "audio/ogg",
                }),
                h("source", {
                    src: "https://actions.google.com/sounds/v1/alarms/alarm_clock.mp3",
                    type: "audio/mpeg",
                })
            )
        );
    }

    function LoginPage(props) {
        const [form, setForm] = useState({ login: "", password: "" });
        const [feedback, setFeedback] = useState(null);
        const [submitting, setSubmitting] = useState(false);

        function updateField(key, value) {
            setForm(function updatePrevious(previous) {
                return Object.assign({}, previous, { [key]: value });
            });
        }

        async function handleSubmit(event) {
            event.preventDefault();
            setSubmitting(true);
            setFeedback(null);

            try {
                const data = await apiRequest("/api/login/", {
                    method: "POST",
                    body: form,
                });

                props.onAuth(data.user);
                setFeedback({ kind: "success", message: "Вход выполнен." });
                props.onNavigate("/person/", true);
            } catch (error) {
                setFeedback({ kind: "error", message: flattenErrors(error.data && (error.data.errors || error.data)) });
            } finally {
                setSubmitting(false);
            }
        }

        return h(
            "div",
            { className: "auth-page" },
            h(
                "div",
                { className: "auth-card" },
                h("h1", null, "Вход"),
                h("p", { className: "auth-subtitle" }, "Сессия хранится в Django, а не в localStorage."),
                Feedback(feedback || {}),
                h(
                    "form",
                    { className: "form-stack", onSubmit: handleSubmit },
                    h(
                        "div",
                        { className: "field-group" },
                        h("label", { htmlFor: "login-field" }, "Email или имя пользователя"),
                        h("input", {
                            id: "login-field",
                            className: "field-input",
                            type: "text",
                            value: form.login,
                            placeholder: "corgi_lover или hello@focuscorgi.com",
                            autoComplete: "username",
                            onChange: function handleChange(event) {
                                updateField("login", event.target.value);
                            },
                        })
                    ),
                    h(PasswordField, {
                        id: "login-password-field",
                        label: "Пароль",
                        value: form.password,
                        autoComplete: "current-password",
                        placeholder: "••••••••",
                        onChange: function handlePasswordChange(event) {
                            updateField("password", event.target.value);
                        },
                    }),
                    h(
                        "div",
                        { className: "button-row" },
                        h(
                            "button",
                            { type: "submit", className: "primary-btn", disabled: submitting },
                            submitting ? "Входим..." : "Войти"
                        ),
                        createLink(
                            "/regist/",
                            "route-link",
                            props.onNavigate,
                            "Нужен новый аккаунт?"
                        )
                    )
                )
            )
        );
    }

    function RegisterPage(props) {
        const [form, setForm] = useState({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        });
        const [feedback, setFeedback] = useState(null);
        const [submitting, setSubmitting] = useState(false);

        function updateField(key, value) {
            setForm(function updatePrevious(previous) {
                return Object.assign({}, previous, { [key]: value });
            });
        }

        async function handleSubmit(event) {
            event.preventDefault();

            if (form.password !== form.confirmPassword) {
                setFeedback({ kind: "error", message: "Пароли не совпадают." });
                return;
            }

            setSubmitting(true);
            setFeedback(null);

            try {
                const data = await apiRequest("/api/register/", {
                    method: "POST",
                    body: {
                        username: form.username,
                        email: form.email,
                        password: form.password,
                    },
                });

                props.onAuth(data.user);
                setFeedback({ kind: "success", message: "Аккаунт создан." });
                props.onNavigate("/person/", true);
            } catch (error) {
                setFeedback({ kind: "error", message: flattenErrors(error.data && (error.data.errors || error.data)) });
            } finally {
                setSubmitting(false);
            }
        }

        return h(
            "div",
            { className: "auth-page" },
            h(
                "div",
                { className: "auth-card" },
                h("h1", null, "Регистрация"),
                h("p", { className: "auth-subtitle" }, "После регистрации Django сразу создаст серверную сессию."),
                Feedback(feedback || {}),
                h(
                    "form",
                    { className: "form-stack", onSubmit: handleSubmit },
                    h(
                        "div",
                        { className: "field-group" },
                        h("label", { htmlFor: "register-username" }, "Имя пользователя"),
                        h("input", {
                            id: "register-username",
                            className: "field-input",
                            type: "text",
                            value: form.username,
                            placeholder: "corgi_lover",
                            autoComplete: "username",
                            onChange: function handleChange(event) {
                                updateField("username", event.target.value);
                            },
                        })
                    ),
                    h(
                        "div",
                        { className: "field-group" },
                        h("label", { htmlFor: "register-email" }, "Email"),
                        h("input", {
                            id: "register-email",
                            className: "field-input",
                            type: "email",
                            value: form.email,
                            placeholder: "hello@focuscorgi.com",
                            autoComplete: "email",
                            onChange: function handleEmailChange(event) {
                                updateField("email", event.target.value);
                            },
                        })
                    ),
                    h(PasswordField, {
                        id: "register-password",
                        label: "Пароль",
                        value: form.password,
                        placeholder: "Минимум 8 символов",
                        minLength: 8,
                        autoComplete: "new-password",
                        onChange: function handlePasswordChange(event) {
                            updateField("password", event.target.value);
                        },
                    }),
                    h(PasswordField, {
                        id: "register-confirm-password",
                        label: "Повторите пароль",
                        value: form.confirmPassword,
                        placeholder: "Ещё раз пароль",
                        minLength: 8,
                        autoComplete: "new-password",
                        onChange: function handleConfirmPasswordChange(event) {
                            updateField("confirmPassword", event.target.value);
                        },
                    }),
                    h(
                        "div",
                        { className: "button-row" },
                        h(
                            "button",
                            { type: "submit", className: "primary-btn", disabled: submitting },
                            submitting ? "Создаём..." : "Создать аккаунт"
                        ),
                        createLink("/auth/", "route-link", props.onNavigate, "Уже есть аккаунт?")
                    )
                )
            )
        );
    }

    function ProfilePage(props) {
        const [form, setForm] = useState({
            birthdate: props.user ? props.user.birthdate || "" : "",
            avatar: props.user ? props.user.avatar || "fa-dog" : "fa-dog",
        });
        const [stats, setStats] = useState({
            today_minutes: 0,
            week_minutes: 0,
            month_minutes: 0,
            total_sessions: 0,
        });
        const [statsLoading, setStatsLoading] = useState(true);
        const [feedback, setFeedback] = useState(null);
        const [passwordModalOpen, setPasswordModalOpen] = useState(false);
        const [passwords, setPasswords] = useState({
            current_password: "",
            new_password: "",
        });

        useEffect(function syncForm() {
            if (!props.user) {
                return;
            }

            setForm({
                birthdate: props.user.birthdate || "",
                avatar: props.user.avatar || "fa-dog",
            });
        }, [props.user]);

        useEffect(function redirectIfLoggedOut() {
            if (!props.authLoading && !props.user) {
                props.onNavigate("/auth/", true);
            }
        }, [props.authLoading, props.user, props]);

        useEffect(function loadStats() {
            if (!props.user) {
                setStatsLoading(false);
                return;
            }

            setStatsLoading(true);

            apiRequest("/api/pomodoro/stats/")
                .then(function onStatsLoaded(data) {
                    setStats(data);
                })
                .catch(function onStatsError() {
                    setFeedback({ kind: "error", message: "Статистику не удалось загрузить." });
                })
                .finally(function onStatsSettled() {
                    setStatsLoading(false);
                });
        }, [props.user]);

        if (props.authLoading) {
            return h("div", { className: "app-loader" }, "Загружаем профиль...");
        }

        if (!props.user) {
            return h("div", { className: "app-loader" }, "Перенаправляем на страницу входа...");
        }

        function updateForm(key, value) {
            setForm(function updatePrevious(previous) {
                return Object.assign({}, previous, { [key]: value });
            });
        }

        async function handleSaveProfile() {
            setFeedback(null);

            try {
                const data = await apiRequest("/api/profile/", {
                    method: "PATCH",
                    body: form,
                });

                props.onUserUpdated(data.user);
                setFeedback({ kind: "success", message: "Профиль обновлён." });
            } catch (error) {
                setFeedback({ kind: "error", message: flattenErrors(error.data && (error.data.errors || error.data)) });
            }
        }

        async function handlePasswordSubmit(event) {
            event.preventDefault();
            setFeedback(null);

            try {
                await apiRequest("/api/change-password/", {
                    method: "POST",
                    body: passwords,
                });

                setPasswordModalOpen(false);
                setPasswords({ current_password: "", new_password: "" });
                setFeedback({ kind: "success", message: "Пароль обновлён." });
            } catch (error) {
                setFeedback({ kind: "error", message: flattenErrors(error.data && (error.data.errors || error.data)) });
            }
        }

        async function handleLogout() {
            await props.onLogout();
            props.onNavigate("/", true);
        }

        return h(
            "div",
            { className: "profile-grid" },
            h(
                "section",
                { className: "profile-card profile-summary" },
                h("h1", null, "Профиль"),
                h("p", { className: "profile-subtitle" }, "Профиль редактируется через Django API, а не локально в браузере."),
                Feedback(feedback || {}),
                h(
                    "div",
                    { className: "profile-badge" },
                    icon(`fa-solid ${form.avatar}`),
                    h("span", null, props.user.username)
                ),
                h(
                    "div",
                    { className: "profile-form" },
                    h(
                        "div",
                        { className: "field-group" },
                        h("label", { htmlFor: "profile-username" }, "Имя пользователя"),
                        h("input", {
                            id: "profile-username",
                            className: "field-input",
                            type: "text",
                            value: props.user.username,
                            readOnly: true,
                        })
                    ),
                    h(
                        "div",
                        { className: "field-group" },
                        h("label", { htmlFor: "profile-email" }, "Email"),
                        h("input", {
                            id: "profile-email",
                            className: "field-input",
                            type: "email",
                            value: props.user.email,
                            readOnly: true,
                        })
                    ),
                    h(
                        "div",
                        { className: "field-group" },
                        h("label", { htmlFor: "profile-date-joined" }, "Дата регистрации"),
                        h("input", {
                            id: "profile-date-joined",
                            className: "field-input",
                            type: "text",
                            value: formatDate(props.user.date_joined),
                            readOnly: true,
                        })
                    ),
                    h(
                        "div",
                        { className: "field-group" },
                        h("label", { htmlFor: "profile-birthdate" }, "Дата рождения"),
                        h("input", {
                            id: "profile-birthdate",
                            className: "field-input",
                            type: "date",
                            value: form.birthdate,
                            onChange: function handleBirthdateChange(event) {
                                updateForm("birthdate", event.target.value);
                            },
                        })
                    ),
                    h(
                        "div",
                        { className: "field-group" },
                        h("label", null, "Аватар"),
                        h(
                            "div",
                            { className: "avatar-grid" },
                            AVATARS.map(function renderAvatar(avatar) {
                                return h(
                                    "button",
                                    {
                                        key: avatar.icon,
                                        type: "button",
                                        className: `avatar-option${form.avatar === avatar.icon ? " active" : ""}`,
                                        onClick: function handleAvatarSelect() {
                                            updateForm("avatar", avatar.icon);
                                        },
                                    },
                                    avatar.emoji
                                );
                            })
                        )
                    ),
                    h(
                        "div",
                        { className: "button-row" },
                        h(
                            "button",
                            { type: "button", className: "primary-btn", onClick: handleSaveProfile },
                            "Сохранить"
                        ),
                        h(
                            "button",
                            {
                                type: "button",
                                className: "secondary-btn",
                                onClick: function openPasswordModal() {
                                    setPasswordModalOpen(true);
                                },
                            },
                            "Сменить пароль"
                        ),
                        h(
                            "button",
                            { type: "button", className: "danger-btn", onClick: handleLogout },
                            "Выйти"
                        )
                    )
                )
            ),
            h(
                "aside",
                { className: "profile-side-card" },
                h("h2", null, "Статистика"),
                statsLoading
                    ? h("p", { className: "muted-text" }, "Загружаем значения...")
                    : h(
                        "div",
                        { className: "stats-grid-react" },
                        h(
                            "div",
                            { className: "stat-card-react" },
                            h("div", { className: "stat-value" }, formatMinutes(stats.today_minutes)),
                            h("div", { className: "stat-label" }, "Сегодня")
                        ),
                        h(
                            "div",
                            { className: "stat-card-react" },
                            h("div", { className: "stat-value" }, formatMinutes(stats.week_minutes)),
                            h("div", { className: "stat-label" }, "За 7 дней")
                        ),
                        h(
                            "div",
                            { className: "stat-card-react" },
                            h("div", { className: "stat-value" }, formatMinutes(stats.month_minutes)),
                            h("div", { className: "stat-label" }, "За месяц")
                        )
                    ),
                h("p", { className: "muted-text" }, `Всего завершённых сессий: ${stats.total_sessions}`)
            ),
            passwordModalOpen
                ? h(
                    "div",
                    {
                        className: "modal-overlay",
                        onClick: function handleOverlayClick() {
                            setPasswordModalOpen(false);
                        },
                    },
                    h(
                        "div",
                        {
                            className: "modal-card",
                            onClick: function stopPropagation(event) {
                                event.stopPropagation();
                            },
                        },
                        h("h2", null, "Смена пароля"),
                        h(
                            "form",
                            { className: "modal-form", onSubmit: handlePasswordSubmit },
                            h(PasswordField, {
                                id: "current-password",
                                label: "Текущий пароль",
                                value: passwords.current_password,
                                autoComplete: "current-password",
                                placeholder: "••••••••",
                                onChange: function handleCurrentPasswordChange(event) {
                                    setPasswords(function updatePasswords(previous) {
                                        return Object.assign({}, previous, {
                                            current_password: event.target.value,
                                        });
                                    });
                                },
                            }),
                            h(PasswordField, {
                                id: "new-password",
                                label: "Новый пароль",
                                value: passwords.new_password,
                                autoComplete: "new-password",
                                placeholder: "Минимум 8 символов",
                                minLength: 8,
                                onChange: function handleNewPasswordChange(event) {
                                    setPasswords(function updatePasswords(previous) {
                                        return Object.assign({}, previous, {
                                            new_password: event.target.value,
                                        });
                                    });
                                },
                            }),
                            h(
                                "div",
                                { className: "button-row" },
                                h("button", { type: "submit", className: "primary-btn" }, "Сохранить"),
                                h(
                                    "button",
                                    {
                                        type: "button",
                                        className: "ghost-btn",
                                        onClick: function closeModal() {
                                            setPasswordModalOpen(false);
                                        },
                                    },
                                    "Отмена"
                                )
                            )
                        )
                    )
                )
                : null
        );
    }

    function App() {
        const [currentPath, setCurrentPath] = useState(normalizePath(window.location.pathname));
        const [theme, setTheme] = useState(function getInitialTheme() {
            return window.localStorage.getItem("theme") === "dark" ? "dark" : "light";
        });
        const [currentUser, setCurrentUser] = useState(null);
        const [authLoading, setAuthLoading] = useState(true);

        useEffect(function mountTheme() {
            if (theme === "dark") {
                document.documentElement.setAttribute("data-theme", "dark");
            } else {
                document.documentElement.removeAttribute("data-theme");
            }

            window.localStorage.setItem("theme", theme);
        }, [theme]);

        useEffect(function subscribeToPopState() {
            function handlePopState() {
                setCurrentPath(normalizePath(window.location.pathname));
            }

            window.addEventListener("popstate", handlePopState);
            return function cleanupPopState() {
                window.removeEventListener("popstate", handlePopState);
            };
        }, []);

        useEffect(function loadUser() {
            refreshUser();
        }, []);

        async function refreshUser() {
            setAuthLoading(true);

            try {
                const data = await apiRequest("/api/me/");
                setCurrentUser(data.authenticated ? data.user : null);
            } catch (error) {
                setCurrentUser(null);
            } finally {
                setAuthLoading(false);
            }
        }

        function navigate(nextPath, replace) {
            const normalized = normalizePath(nextPath);
            const currentNormalized = normalizePath(window.location.pathname);

            if (normalized === currentNormalized) {
                setCurrentPath(normalized);
                return;
            }

            const historyMethod = replace ? "replaceState" : "pushState";
            window.history[historyMethod]({}, "", normalized);
            window.scrollTo({ top: 0, behavior: "smooth" });
            setCurrentPath(normalized);
        }

        async function handleLogout() {
            try {
                await apiRequest("/api/logout/", { method: "POST" });
            } catch (error) {
                return undefined;
            } finally {
                setCurrentUser(null);
            }
        }

        async function handleWorkSessionComplete(durationMinutes) {
            await apiRequest("/api/pomodoro/sessions/", {
                method: "POST",
                body: { duration_minutes: durationMinutes },
            });
        }

        let page;
        if (currentPath === "/auth/") {
            page = h(LoginPage, {
                onAuth: setCurrentUser,
                onNavigate: navigate,
            });
        } else if (currentPath === "/regist/") {
            page = h(RegisterPage, {
                onAuth: setCurrentUser,
                onNavigate: navigate,
            });
        } else if (currentPath === "/person/") {
            page = h(ProfilePage, {
                user: currentUser,
                authLoading,
                onNavigate: navigate,
                onUserUpdated: setCurrentUser,
                onLogout: handleLogout,
            });
        } else {
            page = h(HomePage, {
                currentUser,
                onWorkSessionComplete: handleWorkSessionComplete,
            });
        }

        return h(
            "div",
            { className: "app-shell" },
            h(
                "header",
                { className: "header" },
                h(
                    "div",
                    { className: "header-content" },
                    createLink(
                        "/",
                        "logo",
                        navigate,
                        [
                            icon("fa-solid fa-paw"),
                            h("span", { key: "label" }, "FocusCorgi"),
                        ]
                    ),
                    h(
                        "nav",
                        { className: "nav" },
                        createLink(
                            "/",
                            `nav-link${currentPath === "/" ? " active" : ""}`,
                            navigate,
                            [
                                icon("fa-solid fa-house"),
                                h("span", { key: "home-label" }, "Главная"),
                            ]
                        ),
                        createLink(
                            currentUser ? "/person/" : "/auth/",
                            `nav-link${currentPath === "/auth/" || currentPath === "/person/" ? " active" : ""}`,
                            navigate,
                            [
                                icon(currentUser ? "fa-solid fa-user" : "fa-solid fa-right-to-bracket"),
                                h(
                                    "span",
                                    { key: "auth-label" },
                                    authLoading ? "..." : currentUser ? "Личный кабинет" : "Авторизация"
                                ),
                            ]
                        )
                    ),
                    h(
                        "button",
                        {
                            type: "button",
                            className: `theme-toggle${theme === "dark" ? " dark" : ""}`,
                            "aria-label": "Переключить тему",
                            onClick: function toggleTheme() {
                                setTheme(function updateTheme(previousTheme) {
                                    return previousTheme === "dark" ? "light" : "dark";
                                });
                            },
                        },
                        icon("fa-solid fa-moon"),
                        icon("fa-solid fa-sun")
                    )
                )
            ),
            h(
                "main",
                { className: "main app-main" },
                page
            )
        );
    }

    const rootElement = document.getElementById("react-pomodoro-root");
    if (!rootElement) {
        return;
    }

    if (ReactDOM.createRoot) {
        ReactDOM.createRoot(rootElement).render(h(App));
    } else {
        ReactDOM.render(h(App), rootElement);
    }
}());
