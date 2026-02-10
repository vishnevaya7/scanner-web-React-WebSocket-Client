import { useEffect, useState, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import type { HistoryResponse, HistoryItem } from "../types";
import { api } from "../services/api";
import './styles/HistoryPage.css';

type SortField = 'id' | 'login' | 'platform' | 'product' | 'scan_date' | 'legacy_synced' | 'is_overwritten';

interface ExtendedHistoryItem extends HistoryItem {
    scan_date?: string;
}

interface Filters {
    startDate: Date | null;
    endDate: Date | null;
    login: string;
    product: string | number;
    platform: string | number;
    legacy_synced: string | number;
    is_overwritten: string;
    sort: SortField | null; // Разрешаем null для сброса сортировки
    order: 'asc' | 'desc' | null;
    page: number;
    size: number;
    id: string | number;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryResponse>({
        items: [], total: 0, page: 1, size: 30, pages: 0
    });
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState<Filters>({
        page: 1, size: 30, startDate: null, endDate: null,
        login: '', product: '', platform: '', legacy_synced: '',
        is_overwritten: '', sort: 'scan_date', order: 'desc', id: ''
    });

    const loadHistory = useCallback(async (f: Filters) => {
        setLoading(true);
        try {
            const data = await api.getHistory({
                page: f.page,
                size: f.size,
                id: f.id !== '' ? String(f.id) : undefined,
                date_from: f.startDate?.toISOString().split('T')[0],
                date_to: f.endDate?.toISOString().split('T')[0],
                login: f.login.trim() || undefined,
                product: f.product !== '' ? Number(f.product) : undefined,
                platform: f.platform !== '' ? Number(f.platform) : undefined,
                legacy_synced: f.legacy_synced === '' ? undefined : Number(f.legacy_synced),
                is_overwritten: f.is_overwritten === 'true' ? true : f.is_overwritten === 'false' ? false : undefined,
                sort: f.sort || undefined,
                order: f.order || undefined
            });

            // Клиентская валидация для точного соответствия фильтрам (если API игнорирует параметры при наличии ID)
            const validatedItems = data.items.filter((item: ExtendedHistoryItem) => {
                if (f.id && String(item.id) !== String(f.id)) return false;
                if (f.login && !item.login.toLowerCase().includes(f.login.toLowerCase())) return false;
                if (f.product && String(item.product) !== String(f.product)) return false;
                if (f.platform && String(item.platform) !== String(f.platform)) return false;
                return true;
            });

            setHistory({
                ...data,
                items: validatedItems,
                total: f.id ? validatedItems.length : data.total
            });
        } catch (error) {
            console.error('Ошибка загрузки:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory(filters);
    }, [filters, loadHistory]);

    const updateFilter = (key: keyof Filters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    // Логика сортировки: ASC -> DESC -> Сброс (Default)
    const handleSort = (field: SortField) => {
        setFilters(prev => {
            let nextOrder: 'asc' | 'desc' | null = 'asc';
            let nextField: SortField | null = field;

            if (prev.sort === field) {
                if (prev.order === 'asc') nextOrder = 'desc';
                else if (prev.order === 'desc') {
                    // Третий клик: сброс к значениям по умолчанию
                    nextOrder = 'desc';
                    nextField = 'scan_date';
                }
            }

            return { ...prev, sort: nextField, order: nextOrder, page: 1 };
        });
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
                <div className="title-block">
                    <h1 className="history-title">История сканирований</h1>
                    <span className="total-count">Найдено: {history.total}</span>
                </div>

                <div className="history-controls">
                    <button
                        className={`history-btn ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? '✕ Скрыть' : '🔧 Фильтры'}
                    </button>

                    <div className="date-picker-wrapper">
                        <DatePicker
                            selectsRange
                            startDate={filters.startDate}
                            endDate={filters.endDate}
                            onChange={(update: [Date | null, Date | null]) => {
                                setFilters(prev => ({ ...prev, startDate: update[0], endDate: update[1], page: 1 }));
                            }}
                            placeholderText="За всё время"
                            className="history-date-input"
                            dateFormat="dd.MM.yyyy"
                        />
                    </div>

                    {history.pages > 1 && (
                        <div className="pagination-mini">
                            <span className="pagination-range">
                                {((filters.page - 1) * filters.size) + 1}–{Math.min(filters.page * filters.size, history.total)}
                            </span>
                            <div className="pagination-nav">
                                {/* Исправленная пагинация: используем updateFilter для корректного сброса */}
                                <button
                                    disabled={filters.page <= 1}
                                    onClick={() => setFilters(p => ({...p, page: p.page - 1}))}
                                >←</button>
                                <span className="page-info">{filters.page} / {history.pages}</span>
                                <button
                                    disabled={filters.page >= history.pages}
                                    onClick={() => setFilters(p => ({...p, page: p.page + 1}))}
                                >→</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showFilters && (
                <div className="filters-panel animated-fade-in">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>ID записи</label>
                            <input
                                type="text"
                                className="history-input"
                                value={filters.id}
                                onChange={e => updateFilter('id', e.target.value.replace(/\D/g, ''))}
                                placeholder="Точный ID..."
                            />
                        </div>
                        <div className="filter-group">
                            <label>Пользователь</label>
                            <input type="text" className="history-input" value={filters.login} onChange={e => updateFilter('login', e.target.value)} />
                        </div>
                        <div className="filter-group">
                            <label>Продукт</label>
                            <input type="text" className="history-input" value={filters.product} onChange={e => updateFilter('product', e.target.value)} />
                        </div>
                        <div className="filter-group">
                            <label>Платформа</label>
                            <input type="text" className="history-input" value={filters.platform} onChange={e => updateFilter('platform', e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            <div className="history-table-container">
                <table className="history-table">
                    <thead>
                    <tr>
                        <th onClick={() => handleSort('id')} className="sortable">ID
                            <span className={`sort-icon ${filters.sort === 'id' ? 'active' : ''}`}>
                                    {filters.sort === 'id' ? (filters.order === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                                </span>
                        </th>
                        <th onClick={() => handleSort('login')} className="sortable">Логин
                            <span className={`sort-icon ${filters.sort === 'login' ? 'active' : ''}`}>
                                    {filters.sort === 'login' ? (filters.order === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                                </span>
                        </th>
                        <th onClick={() => handleSort('product')} className="sortable">Продукт
                            <span className={`sort-icon ${filters.sort === 'product' ? 'active' : ''}`}>
                                    {filters.sort === 'product' ? (filters.order === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                                </span>
                        </th>
                        <th onClick={() => handleSort('platform')} className="sortable">Платформа
                            <span className={`sort-icon ${filters.sort === 'platform' ? 'active' : ''}`}>
                                    {filters.sort === 'platform' ? (filters.order === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                                </span>
                        </th>
                        <th onClick={() => handleSort('legacy_synced')} className="sortable">Статус
                            <span className={`sort-icon ${filters.sort === 'legacy_synced' ? 'active' : ''}`}>
                                    {filters.sort === 'legacy_synced' ? (filters.order === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                                </span>
                        </th>
                        <th onClick={() => handleSort('scan_date')} className="sortable">Время
                            <span className={`sort-icon ${filters.sort === 'scan_date' ? 'active' : ''}`}>
                                    {filters.sort === 'scan_date' ? (filters.order === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                                </span>
                        </th>
                    </tr>
                    </thead>
                    <tbody className={loading ? 'table-loading' : ''}>
                    {loading ? (
                        <tr><td colSpan={6} className="loading-state">Загрузка данных...</td></tr>
                    ) : history.items.length === 0 ? (
                        <tr><td colSpan={6} className="empty-state">Записей не найдено</td></tr>
                    ) : (
                        history.items.map((item: ExtendedHistoryItem) => (
                            <tr key={item.id} className={item.is_overwritten ? 'row-overwrite' : ''}>
                                <td className="font-mono">#{item.id}</td>
                                <td>{item.login}</td>
                                <td className="font-mono">{item.product}</td>
                                <td><span className="platform-badge">{item.platform}</span></td>
                                <td>{getStatusBadge(item.legacy_synced)}</td>
                                <td className="time-cell">
                                    {item.scan_date ? new Date(item.scan_date).toLocaleString('ru-RU') : '—'}
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
