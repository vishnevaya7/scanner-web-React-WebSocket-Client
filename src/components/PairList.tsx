import type { PlatformId, PlatformMap, ProductId } from '../types'

type Props = {
  pairs: PlatformMap
  latest?: { platform: PlatformId; product: ProductId } | null
}

export default function PairList({ pairs, latest }: Props) {
  const platforms = Object.keys(pairs)
    .map(Number)
    .sort((a, b) => a - b)

  if (platforms.length === 0) {
    return <div className="card">Пока нет данных. Ожидаем события или обновление.</div>
  }

  return (
    <div className="grid">
      {platforms.map(platform => {
        const prods = [...(pairs[platform] || [])].sort((a, b) => a - b)
        return (
          <div className="card" key={platform}>
            <div className="card-header">
              <div className="card-title">Платформа #{platform}</div>
              <div className="card-badge">{prods.length} шт.</div>
            </div>
            <div className="products">
              {prods.map(p => {
                const isLatest = latest && latest.platform === platform && latest.product === p
                return (
                  <span
                    key={p}
                    className="chip"
                    style={isLatest ? { outline: '2px solid var(--accent)', boxShadow: '0 0 18px rgba(110,168,254,0.5)' } : undefined}
                  >
                    {p}
                  </span>
                )
              })}
            </div>
            <div className="footer">
              <span>Последнее обновление платформы — {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
