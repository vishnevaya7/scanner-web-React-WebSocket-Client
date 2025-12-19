// src/App.tsx
import React, { useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useWebSocket } from './hooks/useWebSocket';
import { auth } from './services/auth';

function Login() {
    const { setIsAuthenticated } = useAuth();
    const [loginInput, setLoginInput] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await auth.login(loginInput);
        setIsLoading(false);
        if (!result) {
            setError('Ошибка аутентификации. Проверьте логин и консоль для деталей.');
            return;
        }
        setIsAuthenticated(true);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-4">Вход</h2>
                <input
                    type="text"
                    placeholder="Логин"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                    required
                    disabled={isLoading}
                />
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50"
                >
                    {isLoading ? 'Вход...' : 'Войти'}
                </button>
            </form>
        </div>
    );
}

function ProtectedApp() {
    const { isAuthenticated, login } = useAuth();
    // Memoize onMessage — стабильная функция, deps не меняются
    const onMessage = useCallback((data: unknown) => {
        console.log('App received:', data);
    }, []); // [] — не зависит от рендера

    const { isConnected, lastMessage, sendJson } = useWebSocket({
        autoReconnect: true,
        onMessage, // Теперь стабильная
    });

    const handleLogout = () => {
        auth.logout();
        window.location.reload();
    };

    if (!isAuthenticated || !auth.getToken()) {
        return <Login />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <button onClick={handleLogout} className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded">
                Выйти ({login || 'Неизвестно'})
            </button>
            <div className="fixed top-4 left-4 p-2 bg-green-500 text-white rounded">
                {isConnected ? 'Подключено' : 'Отключено'}
            </div>
            <div className="p-4">
                <h1>Основной контент (защищённый)</h1>
                <p>Логин: {login}</p>
                <p>Последнее сообщение: {JSON.stringify(lastMessage)}</p>
                <button onClick={() => sendJson({ event: 'test', data: 'hello' })} className="bg-blue-500 text-white p-2 rounded">
                    Отправить тест
                </button>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

function AppContent() {
    const { isAuthenticated } = useAuth();
    return (
        <>
            {isAuthenticated ? <ProtectedApp /> : <Login />}
        </>
    );
}