// src/lib/engine.js
// Motor de cruzamento: Gerencial x Trocas Fiscais

export function parseNum(s) {
  if (s === null || s === undefined || s === '') return 0
  return parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0
}

export function normalizeLojaName(s) {
  return String(s).replace(/^0+/, '').trim().toUpperCase().replace(/\s+/g, ' ')
}

export const TIPO_LABEL = {
  sem_nf: 'Sem NF fiscal',
  divergencia: 'Divergência de valor',
  nf_erro: 'NF com erro',
  nf_cancelada: 'NF cancelada'
}

export const STATUS_LABEL = {
  pendente: 'Pendente',
  apurando: 'Em apuração',
  resolvido: 'Resolvido',
  sem_resposta: 'Sem resposta'
}

/**
 * Cruza os dois datasets e retorna array de alertas
 * @param {Array} gerData - linhas do Relatório Gerencial
 * @param {Array} trocasData - linhas do Relatório de Trocas
 * @param {Object} config - { threshold: number, tolerancePct: number }
 */
export function runAnalysis(gerData, trocasData, config = {}) {
  const threshold = config.threshold ?? 50
  const tolPct = config.tolerancePct ?? 10

  // ── Detecta colunas do Gerencial ─────────────────────────────────────────
  const cols = Object.keys(gerData[0] || {})
  const colLoja = cols.find(k => k.toLowerCase().includes('listar') || k.toLowerCase().includes('loja')) || cols[0]
  const colData = cols.find(k => k.toLowerCase().includes('data') || k.toLowerCase().includes('quebrar')) || cols[1]
  const colTrocaVal = cols.find(k => k === 'Trocas-Trocas' || k.toLowerCase().includes('trocas-trocas'))
  const colTrocaQtd = cols.find(k => k.toLowerCase().includes('qtd de trocas'))

  // ── Indexa Gerencial por loja+data ────────────────────────────────────────
  const gerIndex = {}
  gerData.forEach(row => {
    const loja = normalizeLojaName(row[colLoja] || '')
    const data = (row[colData] || '').trim()
    const val = parseNum(row[colTrocaVal])
    const qtd = parseNum(row[colTrocaQtd])
    if (!loja || !data) return
    gerIndex[`${loja}__${data}`] = { loja, data, val, qtd }
  })

  // ── Indexa Fiscal por loja+data ───────────────────────────────────────────
  const fiscIndex = {}
  trocasData.forEach(row => {
    const loja = normalizeLojaName(row['Loja'] || '')
    const data = (row['Emissão'] || '').trim()
    const sit = (row['Situação'] || '').trim()
    const val = parseNum(row['Valor'])
    if (!loja || !data) return
    const k = `${loja}__${data}`
    if (!fiscIndex[k]) fiscIndex[k] = { loja, data, total: 0, qtd: 0, erros: 0, canceladas: 0 }
    if (sit === 'Efetivada') { fiscIndex[k].total += val; fiscIndex[k].qtd++ }
    else if (sit === 'Com Erro') { fiscIndex[k].erros++ }
    else if (sit === 'Cancelada') { fiscIndex[k].canceladas++ }
  })

  // ── Gera alertas ──────────────────────────────────────────────────────────
  const alertas = []
  let id = 0

  Object.values(gerIndex).forEach(ger => {
    if (ger.val <= 0) return
    const k = `${ger.loja}__${ger.data}`
    const fisc = fiscIndex[k]

    if (!fisc || fisc.total === 0) {
      alertas.push({
        id: id++, loja: ger.loja, data: ger.data,
        tipo: 'sem_nf', gerVal: ger.val, fiscVal: 0,
        diverg: ger.val, status: 'pendente', aiInsight: null
      })
    } else {
      const diff = ger.val - fisc.total
      const pct = Math.abs(diff) / ger.val * 100
      if (Math.abs(diff) >= threshold && pct > tolPct) {
        alertas.push({
          id: id++, loja: ger.loja, data: ger.data,
          tipo: 'divergencia', gerVal: ger.val, fiscVal: fisc.total,
          diverg: diff, status: 'pendente', aiInsight: null
        })
      }
      if (fisc.erros > 0) {
        alertas.push({
          id: id++, loja: ger.loja, data: ger.data,
          tipo: 'nf_erro', gerVal: ger.val, fiscVal: fisc.total,
          diverg: fisc.erros, status: 'pendente', aiInsight: null,
          extra: `Notas com erro: ${fisc.erros}`
        })
      }
      if (fisc.canceladas > 0) {
        alertas.push({
          id: id++, loja: ger.loja, data: ger.data,
          tipo: 'nf_cancelada', gerVal: ger.val, fiscVal: fisc.total,
          diverg: fisc.canceladas, status: 'pendente', aiInsight: null,
          extra: `Notas canceladas: ${fisc.canceladas}`
        })
      }
    }
  })

  alertas.sort((a, b) => Math.abs(b.diverg) - Math.abs(a.diverg))
  return alertas
}

/**
 * Calcula score de conformidade por loja (0-100)
 */
export function computeScores(alertas) {
  const byLoja = {}
  alertas.forEach(a => {
    if (!byLoja[a.loja]) byLoja[a.loja] = { total: 0, sem_nf: 0, divergencia: 0, nf_erro: 0, nf_cancelada: 0 }
    byLoja[a.loja].total++
    byLoja[a.loja][a.tipo] = (byLoja[a.loja][a.tipo] || 0) + 1
  })
  const scores = {}
  Object.entries(byLoja).forEach(([loja, v]) => {
    const penalty = v.sem_nf * 3 + v.divergencia * 2 + v.nf_erro * 1 + v.nf_cancelada * 1
    scores[loja] = { ...v, score: Math.max(0, 100 - penalty * 2) }
  })
  return scores
}

export function fmtBRL(v) {
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
