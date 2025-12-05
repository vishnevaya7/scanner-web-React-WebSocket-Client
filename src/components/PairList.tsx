import type { PlatformId, ProductScan } from '../types'

type Props = {
  platform: PlatformId | null
  products: ProductScan[]
}

export default function PairList({ platform, products }: Props) {
  if (platform === null) {
    return <div className="card">Пока нет данных. Ожидаем события или обновление.</div>
  }

  const prods = products // порядок уже задан извне: последний добавленный — первым

  return (
    <div className="grid">
      <div className="card" key={platform}>
        <div className="card-header">
          <div className="card-title">Платформа №{platform}</div>
          <div className="card-badge">{prods.length} шт.</div>
        </div>
        <div className="products">
          {prods.map(p => (
            <span key={p.scanId} className="chip">{p.product}</span>
          ))}
        </div>
        <div className="footer">
          <span>Последнее обновление платформы — {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}
