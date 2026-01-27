import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
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
    const [options, setOptions] = useState({ platforms: [] as any[], users: [] as string[] });

    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        platform: '',
        login: ''
    });

    // Рефы для открытия календаря при клике
    const dateFromRef = useRef<HTMLInputElement>(null);
    const dateToRef = useRef<HTMLInputElement>(null);

    // 1. Функция загрузки данных (мемоизирована, чтобы не создавать циклов)
    const loadAnalytics = useCallback(async (f: typeof filters) => {
        setLoading(true);
        try {
            const params: any = {
                date_from: f.date_from || undefined,
                date_to: f.date_to || undefined,
                platform: f.platform ? Number(f.platform) : undefined,
                login: f.login || undefined
            };

            const res = await api.getGraphics(params);
            setData(res);

            // Инициализация списков фильтров только один раз при первом успехе
            if (options.users.length === 0 && res.by_user) {
                setOptions({
                    platforms: res.by_platform?.map((p: any) => p.platform).sort((a: any, b: any) => a - b) || [],
                    users: res.by_user?.map((u: any) => u.login).sort() || []
                });
            }
        } catch (error) {
            console.error("Analytics Load Error:", error);
        } finally {
            setLoading(false);
        }
    }, [options.users.length]);

    // Первая загрузка при монтировании
    useEffect(() => {
        loadAnalytics(filters);
    }, [loadAnalytics]);

    // Обработчик изменений фильтров
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const nextFilters = { ...filters, [name]: value };
        setFilters(nextFilters);
        loadAnalytics(nextFilters);
    };

    // Сброс фильтров
    const resetFilters = () => {
        const cleared = { date_from: '', date_to: '', platform: '', login: '' };
        setFilters(cleared);
        loadAnalytics(cleared);
    };

    // 2. Использование useMemo для подготовки данных графика (сортировка)
    const chartData = useMemo(() => {
        if (!data?.by_date) return [];
        return [...data.by_date].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    }, [data]);

    // Программное открытие нативного календаря
    const triggerPicker = (ref: React.RefObject<HTMLInputElement>) => {
        if (ref.current && 'showPicker' in ref.current) {
            ref.current.showPicker();
        }
    };

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <h1 className="history-title">Аналитика системы</h1>

                <div className="filter-panel">
                    <div className="filter-group">
                        <label>Период</label>
                        <div className="date-range-combined" onClick={() => triggerPicker(dateFromRef)}>
                            <input
                                type="date"
                                name="date_from"
                                ref={dateFromRef}
                                value={filters.date_from}
                                onChange={handleFilterChange}
                            />
                            <span className="date-separator">→</span>
                            <input
                                type="date"
                                name="date_to"
                                ref={dateToRef}
                                value={filters.date_to}
                                onChange={handleFilterChange}
                                onClick={(e) => { e.stopPropagation(); triggerPicker(dateToRef); }}
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>Сотрудник</label>
                        <select name="login" value={filters.login} onChange={handleFilterChange}>
                            <option value="">Все сотрудники</option>
                            {options.users.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Платформа</label>
                        <select name="platform" value={filters.platform} onChange={handleFilterChange}>
                            <option value="">Все платформы</option>
                            {options.platforms.map(p => <option key={p} value={String(p)}>Платформа {p}</option>)}
                        </select>
                    </div>

                    <button className="reset-filter-btn" onClick={resetFilters}>✕</button>
                </div>
            </div>

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

            <div className={`charts-grid ${loading ? 'opacity-low' : ''}`}>
                <div className="chart-box main-chart">
                    <h3>Динамика активности</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis dataKey="date" stroke="#555" fontSize={10} />
                            <YAxis stroke="#555" fontSize={10} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
                            <Area type="monotone" dataKey="count" stroke="#4fc3f7" fill="#4fc3f722" connectNulls />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-box">
                    <h3>Доля в сканах</h3>
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
                                {(data?.by_user || []).map((_: any, i: number) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-box full-width">
                    <h3>Нагрузка на платформы</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data?.by_platform || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis dataKey="platform" tickFormatter={(v) => `Пл. ${v}`} stroke="#555" fontSize={10} />
                            <YAxis stroke="#555" fontSize={10} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                {(data?.by_platform || []).map((_: any, i: number) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
