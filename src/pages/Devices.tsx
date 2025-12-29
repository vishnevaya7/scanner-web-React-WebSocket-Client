import { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
import { api } from '../services/api';
import './styles/Devices.css';

interface Scanner {
    login: string;
    input_count: number;
    output_count: number;
    current_platform: number;
    input_ids: number[];
    output_ids: number[];
}

export default function Devices() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<Scanner[]>([]);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getScanners();
            setItems(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setError(e?.message || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    return (
        <div className="devices-page">
            <Header title="Устройства" />

            <div className="card">
                <div className="card-header">
                    <div className="card-title">Активные сессии</div>
                    <div className="card-badge">{items.length}</div>
                </div>
                <div className="device-card-footer">
                    <button className="btn" onClick={load} disabled={loading}>
                        {loading ? 'Обновление...' : 'Обновить список'}
                    </button>
                    {error && <span className="device-error-text">{error}</span>}
                </div>
            </div>

            <div className="devices-grid">
                {items.map((it, idx) => (
                    <div key={it.login + idx} className="card">
                        <div className="card-header">
                            <div className="card-title">👤 {it.login}</div>
                            <div className="card-badge">Текущая платформа: {it.current_platform}</div>
                        </div>

                        <div className="device-info-body">
                            <div className="info-row">
                                <span>Входных каналов: <strong>{it.input_count}</strong></span>
                                <span>Выходных каналов: <strong>{it.output_count}</strong></span>
                            </div>

                            <div className="id-container">
                                <span className="id-label">Output IDs:</span>
                                <div className="id-list">
                                    {it.output_ids.map(id => (
                                        <div key={id} className="device-status-info id-tag">{id}</div>
                                    ))}
                                </div>
                            </div>

                            {it.input_ids.length > 0 && (
                                <div className="id-container">
                                    <span className="id-label">Input IDs:</span>
                                    <div className="id-list">
                                        {it.input_ids.map(id => (
                                            <div key={id} className="device-status-info id-tag">{id}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
