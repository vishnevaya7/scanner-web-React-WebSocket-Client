import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/auth';
import './styles/Header.css';

type Props = {
    title: string;
    onToggleSidebar?: () => void;
    rightContent?: React.ReactNode;
    onLogout?: () => void; // Добавляем опциональный проп для доп. действий (например, disconnect сокета)
};

export default function Header({ title, onToggleSidebar, rightContent, onLogout }: Props) {
    const navigate = useNavigate();
    const { setIsAuthenticated } = useAuth();

    const handleLogout = () => {
        // Если передана внешняя функция выхода (с очисткой сокетов), вызываем её
        if (onLogout) {
            onLogout();
        } else {
            // Иначе просто дефолтный выход
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

            <h1 className="header-title">{title}</h1>

            <div className="header-actions">
                {rightContent}
                <button className="header-logout-btn" onClick={handleLogout}>
                    Выйти
                </button>
            </div>
        </header>
    );
}
