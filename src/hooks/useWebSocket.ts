import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { auth } from '../services/auth';


const getSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
};

export interface UseWebSocketProps {
    maxRetries?: number;
    autoReconnect?: boolean;
    onMessage?: (data: unknown) => void;
}

export function useWebSocket({ maxRetries = 50, autoReconnect = true, onMessage }: UseWebSocketProps = {}) {
    const wsRef = useRef<WebSocket | null>(null);
    const retriesRef = useRef(0);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closedByUserRef = useRef(false);
    const [isConnected, setIsConnected] = useState(false);

    // Вычисляем URL один раз при инициализации
    const url = useMemo(() => getSocketUrl(), []);

    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

    const cleanup = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        if (wsRef.current) {
            // Убираем слушатели, чтобы не вызывать колбэки на мертвом сокете
            wsRef.current.onopen = null;
            wsRef.current.onclose = null;
            wsRef.current.onmessage = null;
            wsRef.current.onerror = null;
            try {
                if (wsRef.current.readyState !== WebSocket.CLOSED) {
                    wsRef.current.close();
                }
            } catch (e) { /* ignore */ }
            wsRef.current = null;
        }
    }, []);

    const connect = useCallback(() => {
        const token = auth.getToken();
        if (!token) {
            setIsConnected(false);
            return;
        }

        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        cleanup();
        closedByUserRef.current = false;

        try {
            console.log(`[WS] Connecting to ${url}...`); // Лог для отладки
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log(`[WS] Connected to ${url}`);
                setIsConnected(true);
                retriesRef.current = 0;
                onMessageRef.current?.({ event: 'register_start' });
                ws.send(JSON.stringify({ event: 'register', token, type: 'READER' }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Логирование можно убрать в проде или сделать по уровню
                    // console.log(`[WS Receive][${new Date().toLocaleTimeString()}]:`, data);

                    if (data.token && data.login) {
                        auth.setToken(data.token);
                        auth.setLogin(data.login);
                    }
                    onMessageRef.current?.(data);
                } catch (e) {
                    console.error('[WS Parse error]:', e, 'Raw data:', event.data);
                }
            };

            ws.onclose = (e) => {
                setIsConnected(false);
                // Игнорируем ошибки при нормальном закрытии (1000) или обновлении страницы
                if (e.code !== 1000) {
                     console.warn(`[WS Close]: Code ${e.code}, Reason: ${e.reason || 'no reason'}`);
                }

                if (!closedByUserRef.current && autoReconnect && retriesRef.current < maxRetries) {
                    const timeout = Math.min(30000, 1000 * Math.pow(2, retriesRef.current));
                    console.log(`[WS] Reconnecting in ${timeout}ms... (Attempt ${retriesRef.current + 1})`);
                    retriesRef.current += 1;
                    reconnectTimerRef.current = setTimeout(connect, timeout);
                }
            };

            ws.onerror = (err) => {
                // WebSocket error event обычно пустой в JS из соображений безопасности,
                // поэтому просто логируем факт ошибки
                console.error('[WS Error] Connection failed');
            };
        } catch (e) {
            console.error("[WS Connection error]:", e);
        }
    }, [cleanup, maxRetries, autoReconnect, url]);

    const disconnect = useCallback(() => {
        console.log('[WS] Manual disconnect triggered');
        closedByUserRef.current = true;
        cleanup();
        setIsConnected(false);
    }, [cleanup]);

    useEffect(() => {
        connect();
        // Cleanup при размонтировании компонента
        return () => {
            closedByUserRef.current = true; // предотвращаем реконнект
            cleanup();
        };
    }, [connect, cleanup]);

    return {
        isConnected,
        sendJson: (p: unknown) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                // console.log('[WS Send]:', p);
                wsRef.current.send(JSON.stringify(p));
            } else {
                console.warn('[WS Send failed]: Socket not open');
            }
        },
        reconnect: connect,
        disconnect,
        url
    };
}
