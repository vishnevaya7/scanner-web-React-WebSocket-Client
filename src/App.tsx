import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WSProvider } from './context/WSContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import HistoryPage from './pages/HistoryPage';
import './index.css';
import ProtectedLayout from "./ProtectedLayout.tsx";

function LoginRedirect() {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />;
}

export default function App() {
    return (
        <AuthProvider>
            <WSProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<LoginRedirect />} />
                        <Route path="/dashboard" element={<ProtectedLayout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="history" element={<HistoryPage />} />
                            <Route path="devices" element={<Devices />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Router>
            </WSProvider>
        </AuthProvider>
    );
}
