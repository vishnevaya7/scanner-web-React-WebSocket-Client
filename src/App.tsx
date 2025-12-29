import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WSProvider } from './context/WSContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import HistoryPage from './pages/HistoryPage';
import ProtectedLayout from "./ProtectedLayout.tsx";
import Analytics from './pages/Analytics';
import './App.css';

// Компонент для обработки логики входа
function AuthRedirect({ children }: { children: JSX.Element }) {
    const { isAuthenticated, isLoading  } = useAuth(); // Добавьте loading в ваш AuthContext
    const location = useLocation();

    // Если состояние загрузки еще идет, показываем спиннер, чтобы не сработал ложный редирект
    if (isLoading ) return <div>Loading...</div>;

    if (isAuthenticated) {
        // Если пользователь на странице логина или корне, отправляем на dashboard
        if (location.pathname === "/" || location.pathname === "/login") {
            return <Navigate to="/dashboard" replace />;
        }
        return children;
    }

    return <Login />;
}

export default function App() {
    return (
        <AuthProvider>
            <WSProvider>
                <Router>
                    <Routes>
                        {/* Корневой путь теперь просто рендерит AuthRedirect,
                который сам решит, оставить пользователя на месте или отправить на /dashboard */}
                        <Route path="/" element={<AuthRedirect><Navigate to="/dashboard" replace /></AuthRedirect>} />

                        <Route path="/dashboard" element={<ProtectedLayout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="history" element={<HistoryPage />} />
                            <Route path="devices" element={<Devices />} />
                            <Route path="analytics" element={<Analytics />} />
                        </Route>

                        {/* Обработка 404 и редирект только для неавторизованных путей */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Router>
            </WSProvider>
        </AuthProvider>
    );
}
