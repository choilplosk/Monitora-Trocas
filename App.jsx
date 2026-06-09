// src/App.jsx
import React, { useState } from 'react'
import { useAnalise } from './hooks/useAnalise.js'
import Upload from './pages/Upload.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Alertas from './pages/Alertas.jsx'
import LojaDetail from './pages/LojaDetail.jsx'
import Historico from './pages/Historico.jsx'

const TABS = [
  { id: 'upload', label: 'Arquivos', icon: 'ti-upload' },
  { id: 'dashboard', label: 'Dashboard', icon: 'ti-chart-bar' },
  { id: 'alertas', label: 'Alertas', icon: 'ti-alert-triangle' },
  { id: 'lojas', label: 'Por loja', icon: 'ti-building-store' },
  { id: 'historico', label: 'Histórico', icon: 'ti-history' }
]

export default function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const ctx = useAnalise()
  const { alertas, scores, updateStatus, getInsight, lastAnalysis } = ctx

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
    </div>
  )
}
