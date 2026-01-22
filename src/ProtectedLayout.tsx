import { useState, useCallback } from 'react';
import {Navigate, Outlet, useNavigate} from 'react-router-dom';
import { useAuth } from "./context/AuthContext.tsx";
import { useWS } from "./context/WSContext.tsx";
import { useWebSocket } from "./hooks/useWebSocket.ts";
import Sidebar from "./components/Sidebar.tsx";
import Header from "./components/Header.tsx";
import ScannerStatus from "./components/ScannerStatus.tsx";
import { auth } from "./services/auth.ts";

export default function ProtectedLayout() {
    const { isAuthenticated, login, isLoading: isAuthLoading } = useAuth();
    const { addMessage, hasScannerConnection, historyToday, isLoadingHistory } = useWS();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { setIsAuthenticated } = useAuth(); // Получите сеттер из контекста
    const navigate = useNavigate();
    const globalOnMessage = useCallback((data: unknown) => {
        addMessage(data);
    }, [addMessage]);

    // Хук вызывается здесь. Сокет будет жить до закрытия вкладки или Logout.
    const { isConnected, url, reconnect, disconnect } = useWebSocket({
        onMessage: globalOnMessage,
        maxRetries: 100, // Позволяем много попыток реконнекта
        autoReconnect: true
    });

    if (isAuthLoading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <span>Проверка доступа...</span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const currentScannerStatus = !isConnected ? 'refused' : hasScannerConnection ? 'connected' : 'unknown';

    const handleLogout = () => {
        disconnect(); // Явно закрываем WS перед выходом
        auth.clear();
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
    };

    return (
        <div className="app">
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="main-container">
                <header className="header">
                    <div className="header-content">
                        <button
                            className="btn sidebar-toggle-btn"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? '✕' : '☰'}
                        </button>

                        <Header title={`Пользователь: ${login}`} />

                        <div className="header-actions">
                            <ScannerStatus
                                scannerStatus={currentScannerStatus}
                                url={url}
                                onReconnect={reconnect}
                            />
                            <button className="btn logout-btn" onClick={handleLogout}>Выйти</button>
                        </div>
                    </div>
                </header>

                <main className="main">
                    <Outlet context={{ historyToday, isLoadingHistory }} />
                </main>
            </div>
        </div>
    );
}
