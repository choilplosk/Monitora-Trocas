// src/hooks/useAnalise.js
import { useState, useCallback } from 'react'
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
    try {
      const novosAlertas = runAnalysis(gerData, trocasData, config)
      const novosScores = computeScores(novosAlertas)
      setAlertas(novosAlertas)
      setScores(novosScores)
      setLastAnalysis(new Date())

      // Persiste no Neon
      await api.salvarAnalise(novosAlertas, operador)
    } catch (e) {
      setError('Erro na análise: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [gerData, trocasData])

  const updateStatus = useCallback(async (localId, status) => {
    setAlertas(prev => prev.map(a => a.id === localId ? { ...a, status } : a))
    // Busca o id real no banco (se já foi salvo) — aqui usamos índice por ora
    // Em produção, o id do banco retorna do salvarAnalise e pode ser mapeado
  }, [])

  const getInsight = useCallback(async (alerta) => {
    if (alerta.aiInsight) return alerta.aiInsight
    const { insight } = await api.getInsight(alerta)
    setAlertas(prev => prev.map(a => a.id === alerta.id ? { ...a, aiInsight: insight } : a))
    return insight
  }, [])

  return {
    gerData, trocasData, alertas, scores, loading, error, lastAnalysis,
    loadCSV, analyze, updateStatus, getInsight,
    hasData: gerData !== null && trocasData !== null
  }
}
