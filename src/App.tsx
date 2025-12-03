import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import ConnectionStatus from './components/ConnectionStatus'
import PairList from './components/PairList'
import ScannerInfo from './components/ScannerInfo'
import { useWebSocket } from './hooks/useWebSocket'
import { api } from './services/api'
import type { PlatformId, PlatformMap, ProductId, WSMessage } from './types'

function mergePair(map: PlatformMap, platform: PlatformId, product: ProductId): PlatformMap {
  const arr = new Set(map[platform] || [])
  arr.add(product)
  return { ...map, [platform]: Array.from(arr) }
}

export default function App() {
  const [pairs, setPairs] = useState<PlatformMap>({})
  const [latest, setLatest] = useState<{ platform: PlatformId; product: ProductId } | null>(null)
  const [scannersTotal, setScannersTotal] = useState(0)
  const [scannerItems, setScannerItems] = useState<any[]>([])

  const handleWS = useCallback((msg: WSMessage) => {
    // поддержка разных форматов: c type и без type
    const type = (msg as any).type || undefined
    if ((msg as any).data?.platform !== undefined && (msg as any).data?.product !== undefined) {
      const { platform, product } = (msg as any).data
      setPairs(prev => mergePair(prev, platform, product))
      setLatest({ platform, product })
      return
    }
    if ((msg as any).data?.platform !== undefined && (msg as any).data?.pairs) {
      const { pairs: platformMap } = (msg as any).data
      setPairs(platformMap)
      setLatest(null)
      return
    }
    if (type === 'new_pair' && (msg as any).data) {
      const { platform, product } = (msg as any).data
      setPairs(prev => mergePair(prev, platform, product))
      setLatest({ platform, product })
      return
    }
    if (type === 'change_platform' && (msg as any).data?.pairs) {
      setPairs((msg as any).data.pairs)
      setLatest(null)
      return
    }
  }, [])

  const { isConnected, url, reconnect } = useWebSocket({ onMessage: handleWS })

  const loadPairs = useCallback(async () => {
    try {
      const data = await api.getPairs({ date: new Date().toISOString().slice(0,10) })
      setPairs(data)
    } catch (e) {
      // можно добавить тост/уведомление
      console.error('Ошибка загрузки пар', e)
    }
  }, [])

  const loadScanners = useCallback(async () => {
    try {
      const data = await api.getScanners()
      setScannersTotal(data.total_scanners)
      setScannerItems(data.scanners)
    } catch (e) {
      console.error('Ошибка загрузки сканеров', e)
    }
  }, [])

  useEffect(() => {
    // первичная загрузка
    loadPairs()
    loadScanners()
  }, [loadPairs, loadScanners])

  const headerRight = useMemo(() => (
    <>
      <button className="btn" onClick={loadPairs}>Пары за сегодня</button>
      <button className="btn" onClick={loadScanners}>Сканеры</button>
    </>
  ), [loadPairs, loadScanners])

  return (
    <div className="app">
      <Header title="Сканер пар — мониторинг" right={headerRight} />
      <ConnectionStatus connected={isConnected} url={url} onReconnect={reconnect} />
      <ScannerInfo total={scannersTotal} items={scannerItems} onRefresh={loadScanners} />
      <PairList pairs={pairs} latest={latest} />
    </div>
  )
}
