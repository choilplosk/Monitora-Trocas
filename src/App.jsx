// src/App.jsx
import React, { useState, useEffect } from 'react'
import { useAnalise } from './hooks/useAnalise.js'
import Upload from './pages/Upload.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Alertas from './pages/Alertas.jsx'
import LojaDetail from './pages/LojaDetail.jsx'
import Historico from './pages/Historico.jsx'

const AGREGADOR_URL = 'https://agregador-boti.vercel.app'
const TABS = [
  { id: 'upload', label: 'Arquivos', icon: 'ti-upload' },
  { id: 'dashboard', label: 'Dashboard', icon: 'ti-chart-bar' },
  { id: 'alertas', label: 'Alertas', icon: 'ti-alert-triangle' },
  { id: 'lojas', label: 'Por loja', icon: 'ti-building-store' },
  { id: 'historico', label: 'Histórico', icon: 'ti-history' }
]

export default function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const [ssoStatus, setSsoStatus] = useState('checking') // 'checking' | 'ok' | 'blocked'
  const ctx = useAnalise()
  const { alertas, scores, updateStatus, getInsight, lastAnalysis } = ctx

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('sso')
    if (!token) { setSsoStatus('blocked'); return }
    fetch(`${AGREGADOR_URL}/api/sso/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          window.history.replaceState({}, '', window.location.pathname)
          setSsoStatus('ok')
        } else {
          setSsoStatus('blocked')
        }
      })
      .catch(() => setSsoStatus('blocked'))
  }, [])

  if (ssoStatus === 'checking') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Verificando acesso...</p>
      </div>
    )
  }

  if (ssoStatus === 'blocked') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <i className="ti ti-lock" style={{ fontSize: 36, color: '#185FA5' }} />
        <p style={{ color: '#374151', fontSize: 15, fontWeight: 600 }}>Acesso restrito</p>
        <p style={{ color: '#6b7280', fontSize: 13 }}>Este sistema só pode ser acessado pelo portal O Boticário Niterói.</p>
        <a href={AGREGADOR_URL} style={{ marginTop: 8, fontSize: 13, color: '#185FA5', textDecoration: 'none' }}>Ir para o portal →</a>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #e5e7eb', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="ti ti-shield-check" style={{ fontSize: 20, color: '#185FA5' }} aria-hidden="true" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>Monitor Fiscal de Trocas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {lastAnalysis && (
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                Última análise: {lastAnalysis.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {alertas.length > 0 && (
              <button
                onClick={() => setActiveTab('alertas')}
                style={{ background: '#FCEBEB', color: '#791F1F', border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
              >
                {alertas.length} alertas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #e5e7eb', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 2 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '12px 16px', border: 'none', background: 'transparent',
                borderBottom: `2px solid ${activeTab === t.id ? '#185FA5' : 'transparent'}`,
                color: activeTab === t.id ? '#185FA5' : '#6b7280',
                fontWeight: activeTab === t.id ? 500 : 400,
                cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                transition: 'color .15s', fontFamily: 'inherit'
              }}
            >
              <i className={`ti ${t.icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 24px' }}>
        {activeTab === 'upload' && <Upload ctx={ctx} />}
        {activeTab === 'dashboard' && <Dashboard alertas={alertas} scores={scores} />}
        {activeTab === 'alertas' && (
          <Alertas
            alertas={alertas}
            onStatusChange={updateStatus}
            onInsight={getInsight}
          />
        )}
        {activeTab === 'lojas' && <LojaDetail alertas={alertas} scores={scores} />}
        {activeTab === 'historico' && <Historico />}
      </div>

      {/* Chart.js CDN */}
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    </div>
  )
}
