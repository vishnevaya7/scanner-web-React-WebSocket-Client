import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { auth } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import './styles/Login.css';

export default function Login() {
    const [login, setLogin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const { isAuthenticated, setIsAuthenticated } = useAuth();

    // Если уже залогинены — сразу на дашборд
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            const res = await api.login({ login });

            if (res.token) {
                auth.setToken(res.token);
                auth.setLogin(res.login);
                setIsAuthenticated(true);
                navigate('/dashboard', { replace: true });
            }
        } catch (err: any) {
            setError(err?.message || 'Ошибка авторизации');
        } finally {
            setLoading(false);
        }
    }

    if (isAuthenticated) return null;

    return (
        <div className="login-page">
            <div className="card login-card">
                <div className="card-header">
                    <h2 className="card-title">Вход в систему</h2>
                </div>
                <form onSubmit={onSubmit} className="login-form">
                    <div className="login-field">
                        <label className="login-label">Логин</label>
                        <input
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            placeholder="Введите ваш логин"
                            required
                            className="login-input"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <button className="login-submit-btn" type="submit" disabled={loading}>
                        {loading ? 'Входим...' : 'Войти'}
                    </button>

                    {error && <div className="login-error">{error}</div>}
                </form>
            </div>
        </div>
    );
}
