import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import './styles/Analytics.css';

const COLORS = ['#00f2ff', '#ff4757', '#ffa502', '#2ed573', '#a29bfe'];

const Analytics: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        platform: '',
        login: ''
    });

    const [availableOptions, setAvailableOptions] = useState({
        platforms: [] as any[],
        users: [] as string[]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: { date_from?: string; date_to?: string; platform?: number; login?: string } = {};

            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            if (filters.login) params.login = filters.login;

            if (filters.platform !== '') {
                params.platform = Number(filters.platform);
            }

            const res = await api.getGraphics(params);
            setData(res);

            if (availableOptions.platforms.length === 0) {
                setAvailableOptions({
                    platforms: res.by_platform.map((p: any) => p.platform),
                    users: res.by_user.map((u: any) => u.login)
                });
            }
        } catch (error) {
            console.error("Ошибка загрузки аналитики:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => setFilters({ date_from: '', date_to: '', platform: '', login: '' });

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <h1 className="history-title">Аналитика системы</h1>

                <div className="filter-panel">
                    <div className="filter-group">
                        <label>Период</label>
                        <div className="date-range-combined">
                            <input
                                type="date"
                                name="date_from"
                                value={filters.date_from}
                                onChange={handleFilterChange}
                            />
                            <span className="date-separator">→</span>
                            <input
                                type="date"
                                name="date_to"
                                value={filters.date_to}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>Пользователь</label>
                        <select name="login" value={filters.login} onChange={handleFilterChange}>
                            <option value="">Все сотрудники</option>
                            {availableOptions.users.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Платформа</label>
                        <select name="platform" value={filters.platform} onChange={handleFilterChange}>
                            <option value="">Все платформы</option>
                            {availableOptions.platforms.map(p => (
                                <option key={p} value={String(p)}>Платформа {p}</option>
                            ))}
                        </select>
                    </div>

                    <button className="reset-filter-btn" onClick={resetFilters} title="Сбросить всё">✕</button>
                </div>
            </div>

            <div className="stats-cards">
                <div className="stat-card">
                    <label>{filters.login ? `Сканов (${filters.login})` : 'Всего сканов'}</label>
                    <div className="stat-value">{data?.summary?.total || 0}</div>
                </div>
                <div className="stat-card">
                    <label>Перезаписи</label>
                    <div className="stat-value color-move">{data?.summary?.overwrites || 0}</div>
                </div>
                <div className="stat-card">
                    <label>Ошибки</label>
                    <div className="stat-value color-error">{data?.summary?.errors || 0}</div>
                </div>
            </div>

            {loading ? (
                <div className="loading-placeholder">Обновление данных...</div>
            ) : (
                <div className="charts-grid">
                    <div className="chart-box">
                        <h3>Динамика активности</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={data?.by_date || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="date" stroke="#888" fontSize={11} />
                                <YAxis stroke="#888" fontSize={11} />
                                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                                <Line type="monotone" dataKey="count" stroke="#00f2ff" strokeWidth={3} dot={{ r: 4, fill: '#00f2ff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-box">
                        <h3>{filters.login ? 'Доля в общих сканах' : 'Топ пользователей'}</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={data?.by_user || []}
                                    dataKey="count"
                                    nameKey="login"
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={85}
                                    paddingAngle={5}
                                >
                                    {(data?.by_user || []).map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-box full-width">
                        <h3>Распределение нагрузки по платформам</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data?.by_platform || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="platform" stroke="#888" />
                                <YAxis stroke="#888" />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                    {(data?.by_platform || []).map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;
