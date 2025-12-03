type Props = {
  connected: boolean
  url: string
  onReconnect?: () => void
}

export function ConnectionStatus({ connected, url, onReconnect }: Props) {
  return (
    <div className="status" title={url}>
      <span className={"status-dot" + (connected ? ' connected' : '')} />
      <span className="status-text">{connected ? 'WS подключен' : 'WS отключен'}</span>
      {!connected && (
        <button className="btn" onClick={onReconnect} style={{ padding: '6px 10px', marginLeft: 8 }}>Повторить</button>
      )}
    </div>
  )
}

export default ConnectionStatus
