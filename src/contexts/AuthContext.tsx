// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { auth } from '../services/auth'; // Импорт вашего auth

interface AuthContextType {
    isAuthenticated: boolean;
    setIsAuthenticated: (value: boolean) => void;
    login: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Авто-проверка localStorage при монтировании
    React.useEffect(() => {
        if (!auth || typeof auth.getToken !== 'function') {
            console.error('Auth module not loaded.');
            return;
        }
        const token = auth.getToken();
        const login = auth.getLogin();
        if (token && login) {
            console.log('Auto-auth from localStorage:', login);
            setIsAuthenticated(true);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, login: auth.getLogin() }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}