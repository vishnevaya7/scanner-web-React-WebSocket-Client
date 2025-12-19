// src/hooks/useWebSocket.ts
import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import type { DependencyList } from 'react';
import { auth } from '../services/auth';

const BACKEND_WS_URL = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:8000';

export interface UseWebSocketProps {
    maxRetries?: number;
    autoReconnect?: boolean;
    onMessage?: (data: unknown) => void;
}

export function useWebSocket({
                                 maxRetries = 10,
                                 autoReconnect = true,
                                 onMessage,
                             }: UseWebSocketProps = {}) {
    const wsRef = useRef<WebSocket | null>(null);
    const retriesRef = useRef(0);
    const closedByUserRef = useRef(false);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<unknown>(null);

    const url = useMemo(() => BACKEND_WS_URL + '/ws', []);

    const cleanup = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.onopen = null;
            wsRef.current.onclose = null;
            wsRef.current.onmessage = null;
            wsRef.current.onerror = null;
            try { wsRef.current.close(); } catch {}
            wsRef.current = null;
        }
    }, []);

    const connect = useCallback(() => {
        const token = auth.getToken();
        console.log('Attempt connect: token present?', !!token);
        if (!token) {
            console.warn('No token — skip WS connect');
            setIsConnected(false);
            return;
        }

        // Guard: Если уже подключено — не дублируй
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log('Already connected — skip');
            return;
        }

        cleanup();
        closedByUserRef.current = false;
        console.log('Creating WS to', url);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WS opened — sending register');
            setIsConnected(true);
            retriesRef.current = 0;
            const registerMsg = {
                event: 'register',
                token: token,
                is_input: false,
            };
            ws.send(JSON.stringify(registerMsg));
            console.log('Sent register with token:', registerMsg);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log(`Received: ${JSON.stringify(data)}`);
                setLastMessage(data);
                onMessage?.(data);
            } catch (e) {
                console.error('Parse error:', e);
            }
        };

        ws.onerror = (event) => {
            console.error('WS error:', event);
        };

        ws.onclose = (event) => {
            console.log('WS closed:', { code: event.code, reason: event.reason, wasClean: event.wasClean });
            setIsConnected(false);
            if (!closedByUserRef.current && autoReconnect) {
                const attempt = retriesRef.current;
                if (attempt < maxRetries) {
                    const timeout = Math.min(30000, 1000 * Math.pow(2, attempt));
                    console.log(`Reconnect #${attempt + 1} in ${timeout}ms (code: ${event.code})`);
                    retriesRef.current += 1;
                    setTimeout(() => connect(), timeout);
                } else {
                    console.error('Max retries — WS failed');
                }
            }
        };
    }, [cleanup, maxRetries, autoReconnect, url]); // Убрал onMessage из deps (стабильный колбэк)

    const disconnect = useCallback(() => {
        closedByUserRef.current = true;
        cleanup();
        setIsConnected(false);
    }, [cleanup]);

    const sendJson = useCallback((payload: unknown) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload));
            return true;
        }
        return false;
    }, []);

    useEffect(() => {
        const timer = setTimeout(connect, 500); // Задержка для стабильности
        return () => {
            clearTimeout(timer);
            disconnect();
        };
    }, [connect, disconnect] as DependencyList);

    return {
        isConnected,
        lastMessage,
        sendJson,
        reconnect: connect,
        disconnect,
        url
    };
}