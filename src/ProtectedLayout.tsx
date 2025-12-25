import React, { useState, useCallback, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import {useAuth} from "./context/AuthContext.tsx";
import {useWS} from "./context/WSContext.tsx";
import {useWebSocket} from "./hooks/useWebSocket.ts";
import Sidebar from "./components/Sidebar.tsx";
import Header from "./components/Header.tsx";
import ScannerStatus from "./components/ScannerStatus.tsx";
import {auth} from "./services/auth.ts";

export default function ProtectedLayout() {
    const { isAuthenticated, login } = useAuth();
    const { addMessage, hasScannerConnection } = useWS();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const globalOnMessage = useCallback((data: unknown) => {
        addMessage(data);
    }, [addMessage]);

    const { isConnected, url, reconnect } = useWebSocket({ onMessage: globalOnMessage });

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 769);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        const timer = setTimeout(() => setIsLoading(false), 200);
        return () => {
            window.removeEventListener('resize', checkMobile);
            clearTimeout(timer);
        };
    }, []);

    if (!isAuthenticated) return <Navigate to="/" replace />;
    if (isLoading) return <div className="loading-screen">🔄 Инициализация...</div>;

    const currentScannerStatus = !isConnected ? 'refused' : hasScannerConnection ? 'connected' : 'unknown';

    return (
        <div className={`app ${isMobile ? 'mobile' : 'desktop'}`}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="main-container">
                <header className="header">
                    <div className="header-content">
                        <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            {isSidebarOpen ? '×' : '☰'}
                        </button>
                        <Header title={`Сканер пар — ${login}`} />
                        <ScannerStatus scannerStatus={currentScannerStatus} url={url} onReconnect={reconnect} />
                        <button className="btn logout-btn" onClick={() => auth.clear()}>Выйти</button>
                    </div>
                </header>
                <main className="main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
