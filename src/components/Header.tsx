import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/auth';
import './styles/Header.css';

type Props = {
    title?: string; // Сделали опциональным, так как теперь выводим имя
    onToggleSidebar?: () => void;
    rightContent?: React.ReactNode;
    onLogout?: () => void;
};

export default function Header({ onToggleSidebar, rightContent, onLogout }: Props) {
    const navigate = useNavigate();
    // Берем только fullName из контекста
    const { setIsAuthenticated, fullName } = useAuth();

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            auth.clear();
            setIsAuthenticated(false);
            navigate('/login', { replace: true });
        }
    };

    return (
        <header className="main-app-header">
            <button
                className="sidebar-toggle-btn"
                onClick={onToggleSidebar}
                aria-label="Toggle Menu"
            >
                <span className="burger-icon" />
            </button>

            {/* Теперь вместо title здесь всегда имя пользователя из WS */}
            <h1 className="header-title">
                Пользователь: {fullName || '...'}
            </h1>

            <div className="header-actions">
                {rightContent}
                <button className="header-logout-btn" onClick={handleLogout}>
                    Выйти
                </button>
            </div>
        </header>
    );
}
