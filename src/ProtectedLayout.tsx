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
    const { isAuthenticated, login, isLoading: isAuthLoading, setIsAuthenticated } = useAuth();
    const { addMessage, hasScannerConnection, historyToday, isLoadingHistory } = useWS();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const globalOnMessage = useCallback((data: unknown) => {
        addMessage(data);
    }, [addMessage]);

    const { isConnected, url, reconnect, disconnect } = useWebSocket({
        onMessage: globalOnMessage,
        maxRetries: 100,
        autoReconnect: true
    });

    if (isAuthLoading) return <div className="loading-screen"><div className="spinner"></div></div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    const currentScannerStatus = !isConnected ? 'refused' : hasScannerConnection ? 'connected' : 'unknown';

    // Эту функцию мы передадим в Header (или Header сам её сделает, если там есть доступ к disconnect)
    const handleLogout = () => {
        disconnect(); // Важно: закрываем сокет
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
                {/* Используем наш компонент Header. Он теперь единственный в DOM */}
                <Header
                    title={`Пользователь: ${login}`}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    onLogout={handleLogout} // Передаем функцию, которая делает disconnect()
                    rightContent={
                        <ScannerStatus
                            scannerStatus={currentScannerStatus}
                            url={url}
                            onReconnect={reconnect}
                        />
                    }
                />

                <main className="main">
                    <Outlet context={{ historyToday, isLoadingHistory }} />
                </main>
            </div>
        </div>
    )
}
