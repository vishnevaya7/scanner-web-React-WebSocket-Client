import  { useEffect, useState, useCallback, useMemo } from 'react';
import type { HistoryResponse, HistoryItem } from "../types";
import { api } from "../services/api";
import './styles/HistoryPage.css';

type SortField = 'id' | 'login' | 'platform' | 'product' | 'scan_date' | 'legacy_synced' | 'is_overwritten';

interface Filters {
    date_from: string;
    date_to: string;
    login: string;
    product: string | number;
    platform: string | number;
    legacy_synced: string | number;
    is_overwritten: string;
    sort: SortField;
    order: 'asc' | 'desc';
    page: number;
    size: number;
    id: string | number;
}

// ТОЛЬКО ОДИН ЭКСПОРТ ЗДЕСЬ И НИГДЕ БОЛЬШЕ
export default function HistoryPage() {
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
        is_overwritten: '',
        sort: 'scan_date',
        order: 'desc',
        id: ''
    });

    const loadHistory = useCallback(async (f: Filters) => {
        setLoading(true);
        try {
            const data = await api.getHistory({
                page: f.page,
                size: f.size,
                id: f.id !== '' ? String(f.id) : undefined,
                date_from: f.id ? undefined : f.date_from,
                date_to: f.id ? undefined : f.date_to,
                login: f.login || undefined,
                product: f.product !== '' ? Number(f.product) : undefined,
                platform: f.platform !== '' ? Number(f.platform) : undefined,
                legacy_synced: f.legacy_synced === '' ? undefined : Number(f.legacy_synced),
                is_overwritten: f.is_overwritten === 'true' ? true : f.is_overwritten === 'false' ? false : undefined,
                sort: f.sort,
                order: f.order
            });
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

    // Клиентская фильтрация для связки ID + Платформа
    const displayedItems = useMemo(() => {
        return history.items.filter((item: HistoryItem) => {
            if (filters.platform !== '' && Number(item.platform) !== Number(filters.platform)) return false;
            if (filters.login !== '' && !item.login.toLowerCase().includes(filters.login.toLowerCase())) return false;
            return true;
        });
    }, [history.items, filters.platform, filters.login]);

    const updateFilter = (key: keyof Filters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value === null ? '' : value, page: 1 }));
    };

    const handleSort = (field: SortField) => {
        setFilters(prev => {
            let nextOrder: 'asc' | 'desc' = 'desc';
            if (prev.sort === field && prev.order === 'desc') nextOrder = 'asc';
            return { ...prev, sort: field, order: nextOrder, page: 1 };
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
                <div className="history-stats">Найдено: <strong>{history.total}</strong></div>
            </div>

            <div className="history-controls">
                <button className={`history-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                    {showFilters ? '✕ Скрыть' : '🔧 Фильтры'}
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
                        <div className="filter-group"><label>ID записи</label><input type="text" className="history-input" value={filters.id} onChange={e => updateFilter('id', e.target.value)} /></div>
                        <div className="filter-group"><label>Пользователь</label><input type="text" className="history-input" value={filters.login} onChange={e => updateFilter('login', e.target.value)} /></div>
                        <div className="filter-group"><label>ID Продукта</label><input type="text" className="history-input" value={filters.product} onChange={e => updateFilter('product', e.target.value)} /></div>
                        <div className="filter-group"><label>ID Платформы</label><input type="text" className="history-input" value={filters.platform} onChange={e => updateFilter('platform', e.target.value)} /></div>
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
                        <tr><td colSpan={6} className="loading-state">Загрузка...</td></tr>
                    ) : displayedItems.length === 0 ? (
                        <tr><td colSpan={6} className="empty-state">Нет данных</td></tr>
                    ) : (
                        displayedItems.map((item: HistoryItem) => (
                            <tr key={item.id} className={item.is_overwritten ? 'row-overwrite' : ''}>
                                <td className="history-td font-mono">#{item.id}</td>
                                <td className="history-td">{item.login}</td>
                                <td className="history-td font-mono">{item.product}</td>
                                <td className="history-td"><span className="platform-badge">{item.platform}</span></td>
                                <td className="history-td">{getStatusBadge(item.legacy_synced)}</td>
                                <td className="history-td time-cell">
                                    {(item as any).scan_date ? new Date((item as any).scan_date).toLocaleString('ru-RU') : '—'}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

