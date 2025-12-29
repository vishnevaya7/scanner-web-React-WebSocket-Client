import { useState, useEffect } from 'react';
import './styles/ProductChip.css';

type Props = {
    product: number;
    scanId: string | number;
    isLatest: boolean;
    timestamp?: number;
    isOverwrite?: boolean;  // Флаг дубликата
    isMovingOut?: boolean;  // Флаг удаления при переезде на другую платформу
};

export default function ProductChip({
                                        product,
                                        scanId,
                                        isLatest,
                                        timestamp,
                                        isOverwrite,
                                        isMovingOut
                                    }: Props) {
    const [isRecent, setIsRecent] = useState(false);

    useEffect(() => {
        // Если timestamp > 0, значит это живое событие из WS, а не история
        const isLive = timestamp && timestamp > 0 && (Date.now() - timestamp < 3000);

        if (isLive) {
            setIsRecent(true);
            const timer = setTimeout(() => setIsRecent(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [scanId, timestamp]);

    // Собираем классы динамически
    const classNames = [
        'product-chip',
        isRecent ? 'recent-scan' : '',
        isLatest && isRecent ? 'last-scanned-peak' : '',
        isOverwrite ? 'status-overwrite' : '',
        isMovingOut ? 'animate-move-out' : ''
    ].filter(Boolean).join(' ');

    return (
        <span className={classNames}>
            <span className="product-value">{product}</span>

            {/* Дополнительные индикаторы (по желанию) */}
            {isOverwrite && !isMovingOut && (
                <span className="overwrite-icon" title="Перезаписано"> ↻</span>
            )}

            {isMovingOut && (
                <span className="moving-icon"> ➔</span>
            )}
        </span>
    );
}
