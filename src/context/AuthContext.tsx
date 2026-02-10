import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth } from '../services/auth';

interface AuthContextType {
    isAuthenticated: boolean;
    setIsAuthenticated: (value: boolean) => void;
    login: string | null;
    fullName: string | null;
    setFullName: (name: string | null) => void; // <-- 1. ДОБАВЬТЕ ЭТУ СТРОКУ
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    // 2. Создаем состояние для реактивности
    const [fullName, setFullNameState] = useState<string | null>(auth.getFullname());

    // 3. Функция, которая обновляет и стейт (для UI), и localStorage (для памяти)
    const setFullName = (name: string | null) => {
        if (name) {
            auth.setFullname(name); // Сохраняем в localStorage для будущих сессий
        } else {
            localStorage.removeItem('user_fullName');
        }
        setFullNameState(name); // Обновляем стейт для текущего экрана
    };

    useEffect(() => {
        const token = auth.getToken();
        const login = auth.getLogin();

        if (token && login) {
            setIsAuthenticated(true);
            // Синхронизируем начальное состояние из localStorage
            setFullNameState(auth.getFullname());
        }
        setIsLoading(false);
    }, []);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            setIsAuthenticated,
            login: auth.getLogin(),
            fullName,    // значение
            setFullName, // функция обновления (теперь TS не будет ругаться)
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
