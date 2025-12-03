

type Props = {
  total: number
  items: any[]
  onRefresh?: () => void
}

export default function ScannerInfo({ total, items, onRefresh }: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Сканеры</div>
        <div className="card-badge">{total}</div>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>
        Подключено сканеров: {total}
      </div>
      {items?.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((s, i) => (
            <div key={i} className="chip" style={{ width: 'fit-content' }}>
              {typeof s === 'string' ? s : JSON.stringify(s)}
            </div>
          ))}
        </div>
      )}
      <div className="footer">
        <span>Обновляйте для актуального списка</span>
        <button className="btn" onClick={onRefresh}>Обновить</button>
      </div>
    </div>
  )}
