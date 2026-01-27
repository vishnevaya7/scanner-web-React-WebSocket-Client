import { useEffect, useState, useRef } from 'react';
import PairList from '../components/PairList';
import { useWS } from '../context/WSContext';
import type { PlatformId, ProductScan } from '../types';
import './styles/Dashboard.css';

interface MoveAlert {
    id: number;
    product: number;
    from: number;
    to: number;
}

export default function Dashboard() {
    const { messages, historyToday, isLoadingHistory } = useWS();
    const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | null>(null);
    const [products, setProducts] = useState<ProductScan[]>([]);
    const [moveAlerts, setMoveAlerts] = useState<MoveAlert[]>([]);

    const platformRef = useRef<PlatformId | null>(null);

    useEffect(() => {
        platformRef.current = selectedPlatform;
    }, [selectedPlatform]);

    const removeAlert = (id: number) => {
        setMoveAlerts(prev => prev.filter(a => a.id !== id));
    };

    // 1. СИНХРОНИЗАЦИЯ С ИСТОРИЕЙ
    useEffect(() => {
        if (historyToday) {
            const activeItems = historyToday.filter(item => !item.is_overwritten);
            const mapped: ProductScan[] = activeItems.map(item => ({
                product: item.product,
                scanId: item.id,
                timestamp: 0,
                isOverwrite: false
            }));
            setProducts(mapped);
            if (historyToday.length > 0) {
                const firstPlatform = historyToday[0].platform as PlatformId;
                if (firstPlatform) setSelectedPlatform(firstPlatform);
            }
        }
    }, [historyToday]);

    // 2. ОБРАБОТКА WS СОБЫТИЙ
    useEffect(() => {
        if (messages.length === 0) return;

        const latestMsg = messages[messages.length - 1] as any;
        const type = latestMsg.type || latestMsg.event;
        const payload = latestMsg.data || latestMsg;

        console.log(`📥 [WS] Тип: ${type}`, payload);

        // А) Регистрация или смена платформы
        if (type === 'change_platform' || type === 'register_success') {
            const newPid = payload.platform || payload.current_platform;
            if (newPid) {
                console.log(`📍 Dashboard: Установлена Платформа №${newPid}`);
                setSelectedPlatform(newPid as PlatformId);
            }
            return;
        }

        // Б) Новый пик или дубль (new_pair)
        if (type === 'new_pair') {
            const msgPlatform = Number(payload.platform);
            const currentP = Number(platformRef.current);

            if (msgPlatform === currentP) {
                const rawProduct = payload.product;
                const productValue = typeof rawProduct === 'object' && rawProduct !== null
                    ? rawProduct.id
                    : rawProduct;
                const isOverwrite = !!payload.is_overwritten;

                if (productValue) {
                    // ЕСЛИ ПЕРЕЗАПИСЬ — показываем уведомление прямо здесь
                    if (isOverwrite) {
                        const newAlert: MoveAlert = {
                            id: Date.now() + Math.random(),
                            product: productValue,
                            from: 0, // Указываем 0, так как в new_pair нет данных о прошлой платформе
                            to: msgPlatform
                        };
                        setMoveAlerts(prev => [newAlert, ...prev]);
                        setTimeout(() => removeAlert(newAlert.id), 5000);
                    }

                    setProducts(prev => {
                        const filtered = isOverwrite ? prev.filter(p => p.product !== productValue) : prev;
                        return [{
                            product: productValue,
                            scanId: payload.scanId || payload.id,
                            timestamp: Date.now(),
                            isOverwrite: isOverwrite
                        }, ...filtered];
                    });
                }
            }
        }

        // В) ПЕРЕМЕЩЕНИЕ (product_moved)
        if (type === 'product_moved') {
            const fromP = Number(payload.from_platform);
            const toP = Number(payload.to_platform);
            const productId = Number(payload.product);
            const currentP = Number(platformRef.current);

            console.log(`🔄 Перемещение: Прод ${productId} | Из ${fromP} -> В ${toP} | Я на ${currentP}`);

            // 1. Анимация удаления
            if (fromP === currentP) {
                setProducts(prev => prev.map(p =>
                    p.product === productId ? { ...p, isMovingOut: true } : p
                ));
                setTimeout(() => {
                    setProducts(prev => prev.filter(p => p.product !== productId));
                }, 2000);
            }

            // 2. Уведомление
            if (fromP === currentP || toP === currentP) {
                const newAlert: MoveAlert = {
                    id: Date.now() + Math.random(),
                    product: productId,
                    from: fromP,
                    to: toP
                };
                setMoveAlerts(prev => [newAlert, ...prev]);
                setTimeout(() => removeAlert(newAlert.id), 5000);
            }
        }
    }, [messages.length]);

    return (
        <div className="dashboard-page">
            {/* Контейнер уведомлений (Move Alerts) */}
            <div className="move-alerts-container">
                {moveAlerts.map(alert => (
                    <div key={alert.id} className="move-alert-card">
                        <div className="alert-icon-box">🔄</div>
                        <div className="alert-content">
                            <span className="alert-title">ПЕРЕМЕЩЕНИЕ</span>
                            <p>
                                Продукт <b>{alert.product}</b>:<br/>
                                {alert.from > 0 ? `${alert.from} → ${alert.to}` : `Задублирован на платформе ${alert.to}`}
                            </p>
                        </div>
                        <button className="alert-close" onClick={() => removeAlert(alert.id)}>×</button>
                    </div>
                ))}
            </div>

            {isLoadingHistory && (
                <div className="dashboard-status-info">
                <span className="sync-loader">
                    Синхронизация истории...
                </span>
                </div>
            )}

            <PairList platform={selectedPlatform} products={products} />
        </div>
    )
}
