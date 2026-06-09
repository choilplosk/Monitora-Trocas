// src/hooks/useAnalise.js
import { useState, useCallback, useEffect } from 'react'
import Papa from 'papaparse'
import { runAnalysis, computeScores } from '../lib/engine.js'
import { api } from '../lib/api.js'

export function useAnalise() {
  const [gerData, setGerData] = useState(null)
  const [trocasData, setTrocasData] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastAnalysis, setLastAnalysis] = useState(null)
  const [saveError, setSaveError] = useState(null)

  // Ao montar: carrega alertas da última análise salva no banco
  useEffect(() => {
    api.alertas()
      .then(rows => {
        if (rows && rows.length > 0) {
          // Normaliza campos do banco para o formato do frontend
          const normalizados = rows.map(r => ({
            ...r,
            id: r.id,
            loja: r.loja,
            data: r.data_ocorrencia
              ? new Date(r.data_ocorrencia).toLocaleDateString('pt-BR')
              : '',
            tipo: r.tipo,
            gerVal: Number(r.ger_val || 0),
            fiscVal: Number(r.fisc_val || 0),
            diverg: Number(r.divergencia || 0),
            status: r.status || 'pendente',
            aiInsight: r.ai_insight || null,
          }))
          setAlertas(normalizados)
          setScores(computeScores(normalizados))
          // Busca data da análise mais recente
          api.historico().then(hist => {
            if (hist && hist.length > 0) {
              setLastAnalysis(new Date(hist[0].realizada_em))
            }
          }).catch(() => {})
        }
      })
      .catch(() => {
        // Silencioso: se o backend estiver adormecido, começa vazio
      })
  }, [])

  const loadCSV = useCallback((file, type) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: type === 'trocas' ? 'ISO-8859-1' : 'UTF-8',
        complete: (r) => {
          if (type === 'ger') setGerData(r.data)
          else setTrocasData(r.data)
          resolve(r.data)
        },
        error: reject
      })
    })
  }, [])

  const analyze = useCallback(async (config = {}, operador = 'comprador') => {
    if (!gerData || !trocasData) {
      setError('Carregue os dois arquivos antes de analisar.')
      return
    }
    setLoading(true)
    setError(null)
    setSaveError(null)
    try {
      const novosAlertas = runAnalysis(gerData, trocasData, config)
      const novosScores = computeScores(novosAlertas)
      setAlertas(novosAlertas)
      setScores(novosScores)
      setLastAnalysis(new Date())

      // Persiste no Neon — avisa se falhar
      try {
        await api.salvarAnalise(novosAlertas, operador)
      } catch (saveErr) {
        setSaveError('Análise concluída, mas não foi salva no servidor: ' + saveErr.message)
      }
    } catch (e) {
      setError('Erro na análise: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [gerData, trocasData])

  const updateStatus = useCallback(async (localId, status) => {
    setAlertas(prev => prev.map(a => a.id === localId ? { ...a, status } : a))
  }, [])

  const getInsight = useCallback(async (alerta) => {
    if (alerta.aiInsight) return alerta.aiInsight
    const { insight } = await api.getInsight(alerta)
    setAlertas(prev => prev.map(a => a.id === alerta.id ? { ...a, aiInsight: insight } : a))
    return insight
  }, [])

  return {
    gerData, trocasData, alertas, scores, loading, error, saveError, lastAnalysis,
    loadCSV, analyze, updateStatus, getInsight,
    hasData: gerData !== null && trocasData !== null
  }
}
