// src/pages/Dashboard.jsx
import React, { useEffect, useRef } from 'react'
import { Card, MetricCard, SectionTitle, scoreColor, scoreBg } from '../components/UI.jsx'
import { TIPO_LABEL, fmtBRL } from '../lib/engine.js'

export default function Dashboard({ alertas, scores }) {
  const chartDivRef = useRef()
  const chartTiposRef = useRef()
  const chartInstances = useRef({})

  const total = alertas.length
  const semNF = alertas.filter(a => a.tipo === 'sem_nf').length
  const diverg = alertas.filter(a => a.tipo === 'divergencia').length
  const erros = alertas.filter(a => a.tipo === 'nf_erro' || a.tipo === 'nf_cancelada').length
  const valRisco = alertas
    .filter(a => a.tipo === 'sem_nf' || a.tipo === 'divergencia')
    .reduce((s, a) => s + Math.abs(a.diverg || 0), 0)

  useEffect(() => {
    if (!alertas.length || typeof window.Chart === 'undefined') return

    // Divergência por loja
    const lojaDiverg = {}
    alertas.forEach(a => {
      if (a.tipo === 'divergencia' || a.tipo === 'sem_nf') {
        lojaDiverg[a.loja] = (lojaDiverg[a.loja] || 0) + Math.abs(a.diverg || 0)
      }
    })
    const sorted = Object.entries(lojaDiverg).sort((a, b) => b[1] - a[1]).slice(0, 8)

    if (chartInstances.current.div) chartInstances.current.div.destroy()
    if (chartDivRef.current) {
      chartInstances.current.div = new window.Chart(chartDivRef.current, {
        type: 'bar',
        data: {
          labels: sorted.map(([l]) => l.split(' ')[0]),
          datasets: [{ label: 'R$ em risco', data: sorted.map(([, v]) => Math.round(v)), backgroundColor: '#B5D4F4', borderColor: '#185FA5', borderWidth: 1 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { ticks: { callback: v => 'R$' + v.toLocaleString('pt-BR') } } }
        }
      })
    }

    // Tipos
    const tipos = { sem_nf: 0, divergencia: 0, nf_erro: 0, nf_cancelada: 0 }
    alertas.forEach(a => { tipos[a.tipo] = (tipos[a.tipo] || 0) + 1 })
    if (chartInstances.current.tipos) chartInstances.current.tipos.destroy()
    if (chartTiposRef.current) {
      chartInstances.current.tipos = new window.Chart(chartTiposRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(tipos).map(k => TIPO_LABEL[k]),
          datasets: [{ data: Object.values(tipos), backgroundColor: ['#E24B4A', '#EF9F27', '#378ADD', '#888780'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 10 } } } }
      })
    }

    return () => {
      Object.values(chartInstances.current).forEach(c => c?.destroy())
    }
  }, [alertas])

  if (!alertas.length) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
        <i className="ti ti-chart-bar" style={{ fontSize: 40 }} aria-hidden="true" />
        <p style={{ marginTop: 12 }}>Rode uma análise para ver o dashboard</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
        <MetricCard label="Total de alertas" value={total} color={total > 50 ? '#A32D2D' : total > 20 ? '#854F0B' : '#111827'} />
        <MetricCard label="Dias sem NF fiscal" value={semNF} color="#A32D2D" />
        <MetricCard label="Divergências de valor" value={diverg} color="#854F0B" />
        <MetricCard label="NF com problema" value={erros} />
        <MetricCard label="Valor em risco" value={`R$ ${fmtBRL(valRisco)}`} color="#A32D2D" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <Card>
          <SectionTitle>Divergência por loja (R$)</SectionTitle>
          <div style={{ position: 'relative', height: 220 }}>
            <canvas ref={chartDivRef} role="img" aria-label="Divergência por loja" />
          </div>
        </Card>
        <Card>
          <SectionTitle>Alertas por tipo</SectionTitle>
          <div style={{ position: 'relative', height: 220 }}>
            <canvas ref={chartTiposRef} role="img" aria-label="Alertas por tipo" />
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle>Score de conformidade por loja</SectionTitle>
        {Object.entries(scores).sort((a, b) => a[1].score - b[1].score).map(([loja, v]) => (
          <div key={loja} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #e5e7eb' }}>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={loja}>{loja}</span>
            <div style={{ width: 100, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${v.score}%`, height: 6, background: scoreColor(v.score), borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: scoreColor(v.score), minWidth: 28, textAlign: 'right' }}>{v.score}</span>
            <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, background: scoreBg(v.score), color: scoreColor(v.score) }}>
              {v.score >= 70 ? 'OK' : v.score >= 40 ? 'Atenção' : 'Crítico'}
            </span>
          </div>
        ))}
      </Card>
    </div>
  )
}
