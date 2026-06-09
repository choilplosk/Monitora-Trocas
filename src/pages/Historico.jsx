// src/pages/Historico.jsx
import React, { useState, useEffect, useRef } from 'react'
import { Card, SectionTitle } from '../components/UI.jsx'
import { api } from '../lib/api.js'

export default function Historico() {
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const chartRef = useRef()
  const chartInstance = useRef()

  useEffect(() => {
    api.historico()
      .then(rows => { setLog(rows); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!log.length || typeof window.Chart === 'undefined') return
    const recent = [...log].reverse().slice(-12)
    if (chartInstance.current) chartInstance.current.destroy()
    if (chartRef.current) {
      chartInstance.current = new window.Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: recent.map(l => new Date(l.realizada_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
          datasets: [{
            label: 'Alertas',
            data: recent.map(l => l.total_alertas),
            borderColor: '#185FA5', backgroundColor: '#E6F1FB', fill: true, tension: .3
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      })
    }
    return () => chartInstance.current?.destroy()
  }, [log])

  return (
    <div>
      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <SectionTitle style={{ marginBottom: 0 }}>Registro de análises</SectionTitle>
          <span style={{ fontSize: 13, color: '#6b7280' }}>{log.length} análises realizadas</span>
        </div>

        {loading && <p style={{ color: '#9ca3af', fontSize: 13 }}>Carregando...</p>}

        {!loading && !log.length && (
          <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '1.5rem 0' }}>
            Nenhuma análise registrada ainda.
          </p>
        )}

        {[...log].reverse().slice(0, 30).map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #e5e7eb', fontSize: 13 }}>
            <i className="ti ti-chart-bar" style={{ fontSize: 16, color: '#9ca3af' }} aria-hidden="true" />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#111827', fontWeight: 500 }}>
                {new Date(l.realizada_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {l.lojas_afetadas} lojas · R$ {Number(l.valor_risco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em risco
              </div>
            </div>
            <span style={{ background: '#FCEBEB', color: '#791F1F', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
              {l.total_alertas} alertas
            </span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{l.operador}</span>
          </div>
        ))}
      </Card>

      <Card>
        <SectionTitle>Evolução de alertas ao longo do tempo</SectionTitle>
        <div style={{ position: 'relative', height: 200 }}>
          <canvas ref={chartRef} role="img" aria-label="Evolução histórica de alertas" />
        </div>
      </Card>
    </div>
  )
}
