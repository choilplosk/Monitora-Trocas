// src/pages/LojaDetail.jsx
import React, { useState, useMemo } from 'react'
import { Badge, Card, MetricCard, SectionTitle, Btn, scoreColor, scoreBg, tipoBadge, statusBadge } from '../components/UI.jsx'
import { TIPO_LABEL, STATUS_LABEL, fmtBRL } from '../lib/engine.js'
import { api } from '../lib/api.js'

export default function LojaDetail({ alertas, scores }) {
  const [selectedLoja, setSelectedLoja] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)

  const lojas = useMemo(() => [...new Set(alertas.map(a => a.loja))].sort(), [alertas])
  const lojaAlerts = useMemo(() => alertas.filter(a => a.loja === selectedLoja), [alertas, selectedLoja])
  const sc = scores[selectedLoja] || { score: 100, sem_nf: 0, divergencia: 0, nf_erro: 0, nf_cancelada: 0 }
  const valRisco = lojaAlerts
    .filter(a => a.tipo === 'sem_nf' || a.tipo === 'divergencia')
    .reduce((s, a) => s + Math.abs(a.diverg || 0), 0)

  async function gerarPDF() {
    setPdfLoading(true)
    try {
      const { relatorio } = await api.getRelatorio(selectedLoja, lojaAlerts, sc.score, valRisco)
      abrirJanelaPDF(relatorio)
    } catch (e) {
      alert('Erro ao gerar relatório: ' + e.message)
    } finally {
      setPdfLoading(false)
    }
  }

  function abrirJanelaPDF(aiText) {
    const win = window.open('', '_blank')
    const now = new Date().toLocaleDateString('pt-BR')
    const col = scoreColor(sc.score)
    const bg = scoreBg(sc.score)
    const rows = lojaAlerts.map(a => `
      <tr>
        <td>${a.data}</td>
        <td>${TIPO_LABEL[a.tipo]}</td>
        <td>${(a.tipo === 'divergencia' || a.tipo === 'sem_nf') ? 'R$ ' + fmtBRL(Math.abs(a.diverg)) : (a.extra || '-')}</td>
        <td>${STATUS_LABEL[a.status]}</td>
      </tr>`).join('')

    win.document.write(`<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Relatório Fiscal — ${selectedLoja}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #222; font-size: 14px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 15px; margin: 24px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 8px; }
  .score { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 600; color: ${col}; background: ${bg}; }
  .metrics { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin: 16px 0; }
  .metric { background: #f5f5f5; padding: 12px; border-radius: 6px; }
  .metric-label { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 4px; }
  .metric-val { font-size: 18px; font-weight: bold; }
  .ai-section { background: #f0f7ff; border-left: 3px solid #185FA5; padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 16px 0; white-space: pre-wrap; line-height: 1.6; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 8px; background: #f5f5f5; font-size: 12px; border-bottom: 1px solid #ddd; }
  td { padding: 8px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
  .footer { margin-top: 32px; font-size: 11px; color: #999; }
</style>
</head><body>
  <p class="meta">RELATÓRIO FISCAL DE TROCAS — Gerado em ${now}</p>
  <h1>${selectedLoja}</h1>
  <span class="score">Score de conformidade: ${sc.score}/100</span>
  <div class="metrics">
    <div class="metric"><div class="metric-label">Total alertas</div><div class="metric-val">${lojaAlerts.length}</div></div>
    <div class="metric"><div class="metric-label">Sem NF fiscal</div><div class="metric-val" style="color:#A32D2D">${sc.sem_nf || 0}</div></div>
    <div class="metric"><div class="metric-label">Divergências</div><div class="metric-val" style="color:#854F0B">${sc.divergencia || 0}</div></div>
    <div class="metric"><div class="metric-label">Valor em risco</div><div class="metric-val" style="color:#A32D2D">R$ ${fmtBRL(valRisco)}</div></div>
  </div>
  <h2>Análise da IA</h2>
  <div class="ai-section">${aiText}</div>
  <h2>Detalhamento dos alertas</h2>
  <table>
    <thead><tr><th>Data</th><th>Tipo</th><th>Valor/Qtd</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="footer">Documento gerado automaticamente pelo Monitor Fiscal de Trocas.</p>
  <script>window.print();<\/script>
</body></html>`)
    win.document.close()
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <select
          value={selectedLoja}
          onChange={e => setSelectedLoja(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '0.5px solid #d1d5db', background: '#fff', fontSize: 13, minWidth: 280 }}
        >
          <option value="">Selecione uma loja</option>
          {lojas.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {selectedLoja && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: '1rem' }}>
            <MetricCard label="Score" value={sc.score} color={scoreColor(sc.score)} />
            <MetricCard label="Dias sem NF" value={sc.sem_nf || 0} color="#A32D2D" />
            <MetricCard label="Divergências" value={sc.divergencia || 0} color="#854F0B" />
            <MetricCard label="NF com problema" value={(sc.nf_erro || 0) + (sc.nf_cancelada || 0)} />
            <MetricCard label="Valor em risco" value={`R$ ${fmtBRL(valRisco)}`} color="#A32D2D" />
          </div>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <SectionTitle style={{ marginBottom: 0 }}>Alertas desta loja</SectionTitle>
              <Btn variant="danger" onClick={gerarPDF} disabled={pdfLoading}>
                {pdfLoading
                  ? <><span style={{ width: 14, height: 14, border: '2px solid #fff3', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Gerando...</>
                  : <><i className="ti ti-file-type-pdf" aria-hidden="true" /> Gerar relatório PDF</>
                }
              </Btn>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid #e5e7eb' }}>
                    {['Data', 'Tipo', 'Gerencial', 'Fiscal', 'Divergência', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#6b7280', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lojaAlerts.map(a => {
                    const isDiverg = a.tipo === 'divergencia' || a.tipo === 'sem_nf'
                    return (
                      <tr key={a.id} style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 10px' }}>{a.data}</td>
                        <td style={{ padding: '8px 10px' }}><Badge type={tipoBadge(a.tipo)}>{TIPO_LABEL[a.tipo]}</Badge></td>
                        <td style={{ padding: '8px 10px' }}>{isDiverg ? `R$ ${fmtBRL(a.gerVal)}` : '-'}</td>
                        <td style={{ padding: '8px 10px' }}>{isDiverg ? `R$ ${fmtBRL(a.fiscVal)}` : '-'}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 500 }}>
                          {isDiverg ? `R$ ${fmtBRL(Math.abs(a.diverg))}` : (a.extra || a.diverg)}
                        </td>
                        <td style={{ padding: '8px 10px' }}><Badge type={statusBadge(a.status)}>{STATUS_LABEL[a.status]}</Badge></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
