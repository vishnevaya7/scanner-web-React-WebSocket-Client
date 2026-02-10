import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { api } from '../services/api';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import './styles/Analytics.css';

const COLORS = ['#4fc3f7', '#9575cd', '#ffb74d', '#81c784', '#e57373'];

const Analytics: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        startDate: null as Date | null,
        endDate: null as Date | null,
        platform: '',
        login: ''
    });

    // 1. Загрузка данных (отправляем фильтры — получаем готовые массивы)
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                date_from: filters.startDate?.toISOString().split('T')[0],
                date_to: filters.endDate?.toISOString().split('T')[0],
                platform: filters.platform ? Number(filters.platform) : undefined,
                login: filters.login || undefined
            };
            const res = await api.getGraphics(params);
            setData(res);
        } catch (e) {
            console.error('Ошибка загрузки:', e);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // 2. Формируем списки для фильтров ПРЯМО из текущего ответа API
    const userOptions = useMemo(() =>
            data?.by_user?.map((u: any) => u.login).sort() || [],
        [data]);

    const platformOptions = useMemo(() =>
            data?.by_platform?.map((p: any) => p.platform).sort((a: any, b: any) => a - b) || [],
        [data]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <div className="title-section">
                    <h1 className="history-title">Аналитика системы</h1>
                    {loading && <div className="loading-badge">Загрузка...</div>}
                </div>

                <div className="filter-panel">
                    <div className="filter-group">
                        <label>Период</label>
                        <DatePicker
                            selectsRange
                            startDate={filters.startDate}
                            endDate={filters.endDate}
                            onChange={(update: [Date | null, Date | null]) => {
                                setFilters(prev => ({ ...prev, startDate: update[0], endDate: update[1] }));
                            }}
                            isClearable
                            placeholderText="За всё время"
                            className="custom-date-input"
                            dateFormat="dd.MM.yyyy"
                        />
                    </div>

                    <div className="filter-group">
                        <label>Сотрудник</label>
                        <select name="login" value={filters.login} onChange={handleFilterChange}>
                            <option value="">Все сотрудники</option>
                            {userOptions.map((u: string) => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Платформа</label>
                        <select name="platform" value={filters.platform} onChange={handleFilterChange}>
                            <option value="">Все платформы</option>
                            {platformOptions.map((p: number) => <option key={p} value={String(p)}>Платформа {p}</option>)}
                        </select>
                    </div>

                    <button className="reset-filter-btn" onClick={() => setFilters({startDate: null, endDate: null, platform: '', login: ''})}>✕</button>
                </div>
            </div>

            {/* Блок Summary: 145, 109, 0 и т.д. */}
            <div className="stats-cards">
                <div className="stat-card">
                    <span className="stat-label">Всего сканирований</span>
                    <div className="stat-value main">{data?.summary?.total || 0}</div>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Перезаписи</span>
                    <div className="stat-value move">{data?.summary?.overwrites || 0}</div>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Ошибки</span>
                    <div className="stat-value error">{data?.summary?.errors || 0}</div>
                </div>
            </div>

            <div className={`charts-grid ${loading ? 'grid-loading' : ''}`}>
                {/* Динамика по дням (by_date) */}
                <div className="chart-box main-chart">
                    <h3>Активность по дням</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data?.by_date || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis dataKey="date" stroke="#555" fontSize={10} />
                            <YAxis stroke="#555" fontSize={10} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
                            <Area type="monotone" dataKey="count" stroke="#4fc3f7" fill="#4fc3f722" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Распределение по юзерам (by_user) */}
                <div className="chart-box">
                    <h3>Доля сотрудников</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data?.by_user || []}
                                dataKey="count"
                                nameKey="login"
                                cx="50%" cy="50%"
                                innerRadius={60} outerRadius={80}
                                paddingAngle={5}
                            >
                                {(data?.by_user || []).map((entry: any, i: number) => (
                                    <Cell
                                        key={`cell-${i}`}
                                        fill={entry.login === filters.login ? '#4fc3f7' : COLORS[i % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Платформы (by_platform) */}
                <div className="chart-box full-width">
                    <h3>Нагрузка на платформы</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data?.by_platform || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis dataKey="platform" tickFormatter={(v) => `Пл. ${v}`} stroke="#555" fontSize={10} />
                            <YAxis stroke="#555" fontSize={10} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {(data?.by_platform || []).map((_: any, i: number) => (
                                    <Cell key={`bar-${i}`} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
