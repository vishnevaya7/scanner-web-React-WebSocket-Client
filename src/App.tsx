import { useState, useEffect } from 'react'
import './App.css'

interface Pair {
    platform: number
    product: number | null
    timestamp: string
}

interface Scanner {
    client: string
    connected_at: string
    last_heartbeat: string
    is_active: boolean
}

function App() {
    const [pairs, setPairs] = useState<Pair[]>([])
    const [isWebSocketConnected, setIsWebSocketConnected] = useState<boolean>(false)
    const [hasActiveScanners, setHasActiveScanners] = useState<boolean>(false)
    const [scanners, setScanners] = useState<Scanner[]>([])
    const [totalPairs, setTotalPairs] = useState<number>(0)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    useEffect(() => {
        // Подключение к WebSocket через прокси
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${protocol}//${window.location.host}/ws`
        const websocket = new WebSocket(wsUrl)

        websocket.onopen = () => {
            console.log('WebSocket подключен')
            setIsWebSocketConnected(true)
        }

        websocket.onmessage = (event) => {
            const message = JSON.parse(event.data)
            console.log('Получено сообщение:', message)

            if (message.type === 'initial_data') {
                setPairs(message.data)
                setTotalPairs(message.total_pairs)
                setLastUpdate(new Date())
            } else if (message.type === 'new_pair') {
                setPairs(prev => [message.data, ...prev]) // Новые пары сверху
                setTotalPairs(message.total_pairs)
                setLastUpdate(new Date())
            } else if (message.type === 'pairs_cleared') {
                setPairs([])
                setTotalPairs(0)
                setLastUpdate(new Date())
            } else if (message.type === 'scanner_status') {
                // Обновляем статус сканеров
                setScanners(message.scanners || [])
                setHasActiveScanners(message.has_active_scanners || false)
                console.log('Статус сканеров обновлен:', message.has_active_scanners)
            }
        }

        websocket.onclose = () => {
            console.log('WebSocket отключен')
            setIsWebSocketConnected(false)
            setHasActiveScanners(false)
        }

        websocket.onerror = (error) => {
            console.error('Ошибка WebSocket:', error)
            setIsWebSocketConnected(false)
            setHasActiveScanners(false)
        }

        return () => {
            websocket.close()
        }
    }, [])

    // Периодическая проверка статуса сканеров через REST API (резервный механизм)
    useEffect(() => {
        const checkScannerStatus = async () => {
            try {
                const response = await fetch('/api/scanners')
                if (response.ok) {
                    const data = await response.json()
                    setScanners(data.scanners || [])
                    const activeCount = data.scanners?.filter((s: Scanner) => s.is_active).length || 0
                    setHasActiveScanners(activeCount > 0)
                }
            } catch (error) {
                console.error('Ошибка проверки статуса сканеров:', error)
                setHasActiveScanners(false)
            }
        }

        // Проверяем статус каждые 30 секунд
        const interval = setInterval(checkScannerStatus, 30000)

        // Первая проверка сразу после подключения
        if (isWebSocketConnected) {
            checkScannerStatus()
        }

        return () => clearInterval(interval)
    }, [isWebSocketConnected])

    const clearPairs = async () => {
        try {
            const response = await fetch('/api/pairs', {
                method: 'DELETE'
            })
            if (response.ok) {
                console.log('Пары очищены')
            }
        } catch (error) {
            console.error('Ошибка очистки:', error)
        }
    }

    const formatTime = (timestamp: string | Date) => {
        return new Date(timestamp).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const formatDate = (timestamp: string | Date) => {
        return new Date(timestamp).toLocaleDateString('ru-RU')
    }

    // Определяем общий статус подключения
    const isConnected = isWebSocketConnected && hasActiveScanners

    return (
        <div className="app">
            <header className="header">
                <div className="header-content">
                    <h1>🔍 Сканер Пар</h1>
                    <div className="status-bar">
                        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                            <span className="status-dot"></span>
                            {isConnected ? 'Подключен' : 'Отключен'}
                        </div>

                        {/* Детальная информация о подключении */}
                        <div className="connection-details">
                            <span className={`detail-status ${isWebSocketConnected ? 'ok' : 'error'}`}>
                                WebSocket: {isWebSocketConnected ? '✓' : '✗'}
                            </span>
                            <span className={`detail-status ${hasActiveScanners ? 'ok' : 'error'}`}>
                                Qt App: {hasActiveScanners ? '✓' : '✗'}
                            </span>
                        </div>

                        <div className="stats">
                            <span className="counter">Всего: {totalPairs}</span>
                            {lastUpdate && (
                                <span className="last-update">
                                    Обновлено: {formatTime(lastUpdate)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="main">
                <div className="controls">
                    <button
                        onClick={clearPairs}
                        className="clear-btn"
                        disabled={!isConnected || totalPairs === 0}
                    >
                        🗑️ Очистить все ({totalPairs})
                    </button>

                    {/* Информация о сканерах */}
                    {scanners.length > 0 && (
                        <div className="scanners-info">
                            <h4>Подключенные сканеры:</h4>
                            {scanners.map((scanner, index) => (
                                <div key={index} className={`scanner-item ${scanner.is_active ? 'active' : 'inactive'}`}>
                                    <span className="scanner-name">{scanner.client}</span>
                                    <span className="scanner-status">
                                        {scanner.is_active ? '🟢 Активен' : '🔴 Неактивен'}
                                    </span>
                                    <span className="scanner-time">
                                        {formatTime(scanner.last_heartbeat)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pairs-container">
                    {pairs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📋</div>
                            <h3>Пары не найдены</h3>
                            <p>Ожидание данных от сканера...</p>
                            {!isWebSocketConnected && (
                                <p className="error-text">⚠️ Нет подключения к серверу</p>
                            )}
                            {isWebSocketConnected && !hasActiveScanners && (
                                <p className="warning-text">⚠️ Qt приложение не подключено</p>
                            )}
                        </div>
                    ) : (
                        <div className="pairs-list">
                            {pairs.map((pair, index) => (
                                <div key={`${pair.platform}-${pair.product}-${index}`} className="pair-card">
                                    <div className="pair-header">
                                        <span className="pair-index">#{pairs.length - index}</span>
                                        <span className="pair-time">{formatTime(pair.timestamp)}</span>
                                    </div>
                                    <div className="pair-content">
                                        <div className="pair-field">
                                            <label>Платформа:</label>
                                            <span className="platform-value">{pair.platform}</span>
                                        </div>
                                        <div className="pair-field">
                                            <label>Продукт:</label>
                                            <span className="product-value">
                                                {pair.product !== null ? pair.product : 'Не указан'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pair-date">
                                        {formatDate(pair.timestamp)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default App
