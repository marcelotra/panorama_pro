import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Simple styling object to keep everything contained
const styles = {
  container: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#0f172a',
    minHeight: '100vh',
    color: '#e2e8f0',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '2rem',
    maxWidth: '800px',
    width: '100%',
    marginBottom: '2rem',
    border: '1px solid #334155',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    borderBottom: '1px solid #334155',
    paddingBottom: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    margin: 0,
    background: 'linear-gradient(to right, #60a5fa, #34d399)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#0f172a',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    border: '1px solid #334155',
  },
  statusDot: (status: 'connected' | 'disconnected' | 'loading') => ({
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: status === 'connected' ? '#4ade80' : status === 'disconnected' ? '#ef4444' : '#fbbf24',
    boxShadow: status === 'connected' ? '0 0 10px #4ade80' : 'none',
    transition: 'all 0.3s ease',
  }),
  button: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  logItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem',
    borderBottom: '1px solid #334155',
    fontSize: '0.9rem',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: '#64748b',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    color: '#94a3b8',
  }
};

interface SystemLog {
  id: number;
  timestamp: string;
  message: string;
  status: string;
}

const App = () => {
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  // Check Health on Mount
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Fetch logs when status is connected
  useEffect(() => {
    if (dbStatus === 'connected') {
      fetchLogs();
    }
  }, [dbStatus]);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setDbStatus('connected');
      } else {
        setDbStatus('disconnected');
      }
    } catch (e) {
      setDbStatus('disconnected');
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error('Failed to fetch logs', e);
    }
  };

  const handleTestDb = async () => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/test-db', { method: 'POST' });
      if (res.ok) {
        await fetchLogs(); // Refresh list
        checkHealth(); // Verify connection again
      } else {
        alert('Erro ao gravar no banco. Verifique o console.');
      }
    } catch (e) {
      alert('Erro de conexão ao tentar gravar.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Painel de Controle Panorama</h1>
          
          <div style={styles.statusContainer}>
            <span style={styles.statusDot(dbStatus)}></span>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              {dbStatus === 'loading' && 'Verificando conexão...'}
              {dbStatus === 'connected' && 'PostgreSQL Conectado'}
              {dbStatus === 'disconnected' && 'Sem Conexão DB'}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc' }}>Validação de Infraestrutura</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
              Teste a latência e a persistência de dados no servidor.
            </p>
          </div>
          
          <button 
            onClick={handleTestDb} 
            disabled={isTesting || dbStatus === 'disconnected'}
            style={{
              ...styles.button,
              opacity: (isTesting || dbStatus === 'disconnected') ? 0.5 : 1,
              cursor: (isTesting || dbStatus === 'disconnected') ? 'not-allowed' : 'pointer'
            }}
          >
            {isTesting ? 'Gravando...' : 'Testar Gravação no Banco'}
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Últimos Registros (SystemLog)</h3>
          <button 
            onClick={fetchLogs}
            style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
          >
            Atualizar
          </button>
        </div>

        {logs.length === 0 ? (
          <div style={styles.emptyState}>
            {dbStatus === 'disconnected' 
              ? 'Conecte o banco de dados para ver os registros.' 
              : 'Nenhum registro encontrado. Clique em "Testar Gravação".'}
          </div>
        ) : (
          <ul style={styles.logList}>
            <li style={{ ...styles.logItem, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>ID / Status</span>
              <span>Timestamp</span>
            </li>
            {logs.map((log) => (
              <li key={log.id} style={styles.logItem}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
                    #{log.id} <span style={{ fontSize: '0.7em', backgroundColor: '#064e3b', color: '#34d399', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>{log.status}</span>
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{log.message}</span>
                </div>
                <div style={styles.code}>
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
