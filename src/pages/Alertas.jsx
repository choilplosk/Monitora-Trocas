// src/pages/Alertas.jsx
import React, { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { Badge, Card, Btn, SectionTitle, tipoBadge, statusBadge } from '../components/UI.jsx'
import { TIPO_LABEL, STATUS_LABEL, fmtBRL } from '../lib/engine.js'
import { api } from '../lib/api.js'

function InsightPanel({ alerta, onInsight }) {
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState(alerta.aiInsight || null)
  const [open, setOpen] = useState(!!alerta.aiInsight)

  async function fetch() {
    if (text) { setOpen(o => !o); return }
    setLoading(true)
    try {
      const insight = await onInsight(alerta)
      setText(insight)
      setOpen(true)
    } finally { setLoading(false) }
  }

  return (
    <>
      <button onClick={fetch} disabled={loading} style={{
        padding: '4px 8px', borderRadius: 4, border: '0.5px solid #d1d5db',
        background: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12,
        display: 'inline-flex', alignItems: 'center', gap: 4
      }}>
        {loading
          ? <span style={{ width: 12, height: 12, border: '2px solid #e5e7eb', borderTopColor: '#185FA5', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
          : <i className={`ti ${text ? 'ti-brain' : 'ti-sparkles'}`} style={{ fontSize: 13 }} aria-hidden="true" />
        }
      </button>
      {open && text && (
        <div style={{ gridColumn: '1 / -1', background: '#E6F1FB', borderLeft: '3px solid #185FA5', borderRadius: '0 6px 6px 0', padding: '10px 14px', fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>
          <div style={{ fontSize: 10, color: '#185FA5', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>
            <i className="ti ti-sparkles" aria-hidden="true" /> Análise IA
          </div>
          {text}
        </div>
      )}
    </>
  )
}

export default function Alertas({ alertas, onStatusChange, onInsight }) {
  const [filterLoja, setFilterLoja] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const lojas = useMemo(() => [...new Set(alertas.map(a => a.loja))].sort(), [alertas])

  const filtered = useMemo(() => alertas.filter(a =>
    (!filterLoja || a.loja === filterLoja) &&
    (!filterTipo || a.tipo === filterTipo) &&
    (!filterStatus || a.status === filterStatus)
  ), [alertas, filterLoja, filterTipo, filterStatus])

  function exportXLSX() {
    const data = filtered.map(a => ({
      'Data': a.data,
      'Loja': a.loja,
      'Tipo': TIPO_LABEL[a.tipo],
      'Gerencial (R$)': a.gerVal || '',
      'Fiscal (R$)': a.fiscVal || '',
      'Divergência (R$)': typeof a.diverg === 'number' ? a.diverg : '',
      'Status': STATUS_LABEL[a.status]
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Alertas')
    XLSX.writeFile(wb, 'alertas_fiscais.xlsx')
  }

  if (!alertas.length) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
        <i className="ti ti-alert-triangle" style={{ fontSize: 40 }} aria-hidden="true" />
        <p style={{ marginTop: 12 }}>Nenhum alerta — rode uma análise primeiro</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterLoja} onChange={e => setFilterLoja(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: '0.5px solid #d1d5db', background: '#fff', fontSize: 13 }}>
          <option value="">Todas as lojas</option>
          {lojas.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: '0.5px solid #d1d5db', background: '#fff', fontSize: 13 }}>
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: '0.5px solid #d1d5db', background: '#fff', fontSize: 13 }}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <Btn onClick={exportXLSX}>
          <i className="ti ti-download" aria-hidden="true" /> Exportar XLS
        </Btn>
        <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 'auto' }}>{filtered.length} alertas</span>
      </div>

      <Card style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid #e5e7eb' }}>
              {['Data', 'Loja', 'Tipo', 'Gerencial', 'Fiscal', 'Divergência', 'Status', 'IA'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => {
              const isDiverg = a.tipo === 'divergencia' || a.tipo === 'sem_nf'
              const dvColor = isDiverg ? (Math.abs(a.diverg) > 500 ? '#A32D2D' : Math.abs(a.diverg) > 100 ? '#854F0B' : '#3B6D11') : undefined
              return (
                <React.Fragment key={a.id}>
                  <tr style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{a.data}</td>
                    <td style={{ padding: '8px 12px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.loja}>
                      {a.loja.split(' ').slice(0, 3).join(' ')}
                    </td>
                    <td style={{ padding: '8px 12px' }}><Badge type={tipoBadge(a.tipo)}>{TIPO_LABEL[a.tipo]}</Badge></td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{isDiverg ? `R$ ${fmtBRL(a.gerVal)}` : '-'}</td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{isDiverg ? `R$ ${fmtBRL(a.fiscVal)}` : '-'}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 500, color: dvColor, whiteSpace: 'nowrap' }}>
                      {isDiverg ? `R$ ${fmtBRL(Math.abs(a.diverg))}` : (a.extra || a.diverg)}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <select
                        value={a.status}
                        onChange={e => onStatusChange(a.id, e.target.value)}
                        style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, border: '0.5px solid #d1d5db', background: '#fff' }}
                      >
                        {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <InsightPanel alerta={a} onInsight={onInsight} />
                    </td>
                  </tr>
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </Card>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
