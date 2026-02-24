import { useEffect, useState } from 'react';
import { getLastError, clearLastError } from '@/errorLogger';

export function ErrorOverlay() {
  const [error, setError] = useState<{ message: string; stack?: string; timestamp: string } | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    setError(getLastError());
  }, []);

  if (!import.meta.env.DEV || !error) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.85)',
        color: '#f0f0f0',
        padding: 24,
        overflow: 'auto',
        fontFamily: 'monospace',
        fontSize: 13,
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <strong style={{ color: '#f87171' }}>Последняя ошибка (до перезагрузки)</strong>
          <button
            type="button"
            onClick={() => {
              clearLastError();
              setError(null);
            }}
            style={{
              padding: '6px 12px',
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Закрыть
          </button>
        </div>
        <pre style={{ background: '#1a1a1a', padding: 16, borderRadius: 8, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
        <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>{error.timestamp}</div>
      </div>
    </div>
  );
}
