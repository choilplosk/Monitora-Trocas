// src/lib/api.js
const BASE = '/api'

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`)
  return res.json()
}

export const api = {
  salvarAnalise: (alertas, operador) => req('POST', '/analise', { alertas, operador }),
  historico: () => req('GET', '/historico'),
  alertas: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
    return req('GET', '/alertas' + (qs ? '?' + qs : ''))
  },
  atualizarStatus: (id, status) => req('PATCH', `/alertas/${id}/status`, { status }),
  salvarInsight: (id, insight) => req('PATCH', `/alertas/${id}/insight`, { insight }),
  getInsight: (alerta) => req('POST', '/ia/insight', { alerta }),
  getRelatorio: (loja, alertas, score, valorRisco) => req('POST', '/ia/relatorio', { loja, alertas, score, valorRisco })
}
