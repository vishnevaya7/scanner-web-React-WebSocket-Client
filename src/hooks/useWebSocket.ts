import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { auth } from '../services/auth';
import { useAuth } from '../context/AuthContext'; // Импортируем наш контекст

const getSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
};

export interface UseWebSocketProps {
    maxRetries?: number;
    autoReconnect?: boolean;
    onMessage?: (data: any) => void;
}

export function useWebSocket({ maxRetries = 50, autoReconnect = true, onMessage }: UseWebSocketProps = {}) {
    const wsRef = useRef<WebSocket | null>(null);
    const retriesRef = useRef(0);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closedByUserRef = useRef(false);

    const [isConnected, setIsConnected] = useState(false);
    const { setFullName } = useAuth(); // Извлекаем функцию обновления из контекста

    const url = useMemo(() => getSocketUrl(), []);

    // Используем ref для onMessage, чтобы не пересоздавать функции в зависимостях
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

    const cleanup = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.onopen = null;
            wsRef.current.onclose = null;
            wsRef.current.onmessage = null;
            wsRef.current.onerror = null;
            if (wsRef.current.readyState !== WebSocket.CLOSED) {
                wsRef.current.close();
            }
            wsRef.current = null;
        }
    }, []);

    const connect = useCallback(() => {
        const token = auth.getToken();

        // 1. Проверка авторизации
        if (!token) {
            setIsConnected(false);
            return;
        }

        // 2. ВАЖНО: Если сокет уже в процессе открытия или открыт — просто выходим.
        // Это предотвращает дублирование соединений в React Strict Mode.
        if (wsRef.current) {
            if (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN) {
                return;
            }
        }

        // Сбрасываем флаг ручного закрытия перед новым подключением
        closedByUserRef.current = false;

        try {
            // Создаем новое соединение
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log(`[WS] Connected to ${url}`);
                setIsConnected(true);
                retriesRef.current = 0; // Сброс попыток реконнекта

                // Автоматическая регистрация
                ws.send(JSON.stringify({
                    event: 'register',
                    token: token,
                    type: 'READER'
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Обработка успешной регистрации и обновление Full Name
                    if (data.event === 'register_success' || data.fullname) {
                        if (data.login) auth.setLogin(data.login);

                        if (data.fullname) {
                            // Обновляем контекст, чтобы Header мгновенно изменился
                            setFullName(data.fullname);
                        }
                    }

                    // Передаем данные во внешний колбэк, если он есть
                    onMessageRef.current?.(data);
                } catch (e) {
                    console.error('[WS Parse error]:', e);
                }
            };

            ws.onclose = (e) => {
                setIsConnected(false);

                // Удаляем ссылку на закрытый сокет
                wsRef.current = null;

                // Логика реконнекта: только если закрыто не юзером и включен autoReconnect
                if (!closedByUserRef.current && autoReconnect && e.code !== 1000) {
                    if (retriesRef.current < maxRetries) {
                        const delay = Math.min(30000, 1000 * Math.pow(2, retriesRef.current));
                        console.log(`[WS] Reconnecting in ${delay}ms...`);

                        retriesRef.current += 1;
                        reconnectTimerRef.current = setTimeout(connect, delay);
                    }
                }
            };

            ws.onerror = (err) => {
                // Ошибки обычно сопровождаются событием onclose,
                // поэтому логику реконнекта оставляем в onclose
                console.error('[WS Error]:', err);
            };

        } catch (e) {
            console.error("[WS Connection error]:", e);
        }
    }, [url, maxRetries, autoReconnect, setFullName]);

    const disconnect = useCallback(() => {
        closedByUserRef.current = true;
        cleanup();
        setIsConnected(false);
    }, [cleanup]);

    useEffect(() => {
        connect();
        return () => {
            closedByUserRef.current = true;
            cleanup();
        };
    }, [connect, cleanup]);

    return {
        isConnected,
        sendJson: useCallback((payload: any) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify(payload));
            }
        }, []),
        reconnect: connect,
        disconnect
    };
}
