import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { HistoryResponse, HistoryItem } from "../types";
import { api } from "../services/api";
import './styles/HistoryPage.css';

type SortField = 'id' | 'login' | 'platform' | 'product' | 'scan_date' | 'legacy_synced' | 'is_overwrite';

interface Filters {
    date_from: string;
    date_to: string;
    login: string;
    product: string | number;
    platform: string | number;
    legacy_synced: string | number;
    is_overwrite: string;
    sort: SortField;
    order: 'asc' | 'desc';
    page: number;
    size: number;
    id: string | number;
}

const HistoryPage: React.FC = () => {
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    const [history, setHistory] = useState<HistoryResponse>({
        items: [], total: 0, page: 1, size: 100, pages: 0
    });
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState<Filters>({
        page: 1,
        size: 100,
        date_from: todayStr,
        date_to: todayStr,
        login: '',
        product: '',
        platform: '',
        legacy_synced: '',
        is_overwrite: '',
        sort: 'scan_date',
        order: 'desc',
        id: ''
    });

    const loadHistory = useCallback(async (f: Filters) => {
        setLoading(true);
        try {
            const apiParams: any = {
                page: f.page,
                size: f.size,
                id: f.id !== '' ? f.id : undefined,
                date_from: f.id === '' ? f.date_from : undefined,
                date_to: f.id === '' ? f.date_to : undefined,
                login: f.login !== '' ? f.login : undefined,
                product: f.product !== '' ? f.product : undefined,
                platform: f.platform !== '' ? f.platform : undefined,
                legacy_synced: f.legacy_synced === '' ? undefined : Number(f.legacy_synced),
                is_overwrite: f.is_overwrite === 'true' ? true : f.is_overwrite === 'false' ? false : undefined,
                sort: `${f.sort},${f.order}`
            };
            const data = await api.getHistory(apiParams);
            setHistory(data);
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory(filters);
    }, [filters, loadHistory]);

    const updateFilter = (key: keyof Filters, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === null ? '' : value,
            page: 1
        }));
    };

    const handleSort = (field: SortField) => {
        setFilters(prev => {
            let nextOrder: 'asc' | 'desc' | 'default' = 'desc';
            if (prev.sort === field) {
                if (prev.order === 'desc') nextOrder = 'asc';
                else if (prev.order === 'asc') nextOrder = 'default';
            }
            if (nextOrder === 'default') {
                return { ...prev, sort: 'scan_date', order: 'desc', page: 1 };
            }
            return { ...prev, sort: field, order: nextOrder as 'asc' | 'desc', page: 1 };
        });
    };

    const renderSortIcon = (field: SortField) => {
        const isActive = filters.sort === field;
        if (!isActive) return <span className="sort-icon inactive">↕</span>;
        return <span className="sort-icon active">{filters.order === 'desc' ? '↓' : '↑'}</span>;
    };

    const getStatusBadge = (status: any) => {
        const s = Number(status);
        if (s === 1) return <span className="status-badge status-success">✅ Успешно</span>;
        if (s === 0) return <span className="status-badge status-warning">⏳ В очереди</span>;
        if (s === -1) return <span className="status-badge status-error">❌ Ошибка</span>;
        return <span className="status-badge">—</span>;
    };

    return (
        <div className="history-container">
            <div className="history-header">
                <h1 className="history-title">История сканирований</h1>
                <div className="history-stats">Найдено записей: <strong>{history.total}</strong></div>
            </div>

            <div className="history-controls">
                <button
                    className={`history-btn ${showFilters ? 'active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    {showFilters ? '✕ Скрыть панель' : '🔧 Настроить фильтры'}
                </button>

                <div className="date-range-combined">
                    <input type="date" value={filters.date_from} onChange={e => updateFilter('date_from', e.target.value)} />
                    <span className="date-separator">→</span>
                    <input type="date" value={filters.date_to} onChange={e => updateFilter('date_to', e.target.value)} />
                </div>

                {history.pages > 1 && (
                    <div className="pagination-mini">
                        <button disabled={filters.page === 1} onClick={() => updateFilter('page', filters.page - 1)}>←</button>
                        <span>{filters.page} / {history.pages}</span>
                        <button disabled={filters.page === history.pages} onClick={() => updateFilter('page', filters.page + 1)}>→</button>
                    </div>
                )}
            </div>

            {showFilters && (
                <div className="filters-panel animated-fade-in">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>ID записи</label>
                            <input type="text" className="history-input" placeholder="#403" value={filters.id} onChange={e => updateFilter('id', e.target.value)} />
                        </div>
                        <div className="filter-group">
                            <label>Пользователь</label>
                            <input type="text" className="history-input" placeholder="Логин..." value={filters.login} onChange={e => updateFilter('login', e.target.value)} />
                        </div>
                        <div className="filter-group">
                            <label>Тип записи</label>
                            <select className="history-select" value={filters.is_overwrite} onChange={e => updateFilter('is_overwrite', e.target.value)}>
                                <option value="">🆕 Все типы</option>
                                <option value="false">🆕 Только новые</option>
                                <option value="true">🔄 Перемещения</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Статус Legacy</label>
                            <select className="history-select" value={filters.legacy_synced} onChange={e => updateFilter('legacy_synced', e.target.value)}>
                                <option value="">Любой статус</option>
                                <option value="1">✅ Успешно</option>
                                <option value="0">⏳ Ожидание</option>
                                <option value="-1">❌ Ошибка</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>ID Продукта</label>
                            <input type="text" className="history-input" placeholder="Штрихкод" value={filters.product} onChange={e => updateFilter('product', e.target.value)} />
                        </div>
                        <div className="filter-group">
                            <label>ID Платформы</label>
                            <input type="text" className="history-input" placeholder="Номер..." value={filters.platform} onChange={e => updateFilter('platform', e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            <div className="history-table-container">
                <table className="history-table">
                    <thead>
                    <tr>
                        <th onClick={() => handleSort('id')} className="history-th sortable">ID {renderSortIcon('id')}</th>
                        <th onClick={() => handleSort('login')} className="history-th sortable">Логин {renderSortIcon('login')}</th>
                        <th onClick={() => handleSort('product')} className="history-th sortable">Продукт {renderSortIcon('product')}</th>
                        <th onClick={() => handleSort('platform')} className="history-th sortable">Платформа {renderSortIcon('platform')}</th>
                        <th onClick={() => handleSort('legacy_synced')} className="history-th sortable">Статус {renderSortIcon('legacy_synced')}</th>
                        <th onClick={() => handleSort('scan_date')} className="history-th sortable">Время {renderSortIcon('scan_date')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan={6} className="loading-state">Загрузка данных...</td></tr>
                    ) : history.items.length === 0 ? (
                        <tr><td colSpan={6} className="empty-state">Записей не найдено</td></tr>
                    ) : (
                        history.items.map((item: HistoryItem) => (
                            <tr key={item.id} className={item.is_overwrite ? 'row-overwrite' : ''}>
                                <td className="history-td font-mono">#{item.id}</td>
                                <td className="history-td">{item.login}</td>
                                <td className="history-td font-mono">{item.product}</td>
                                <td className="history-td"><span className="platform-badge">{item.platform}</span></td>
                                <td className="history-td">{getStatusBadge(item.legacy_synced)}</td>
                                <td className="history-td time-cell">{new Date(item.timestamp).toLocaleString('ru-RU')}</td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HistoryPage;
