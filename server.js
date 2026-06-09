// server.js — backend Node.js (Express)
// Rode com: node server.js
// Requer: npm install express cors @anthropic-ai/sdk postgres dotenv

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import postgres from 'postgres'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' })

// ─── Inicializa tabelas no Neon ───────────────────────────────────────────────
async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS analises (
      id SERIAL PRIMARY KEY,
      realizada_em TIMESTAMPTZ DEFAULT NOW(),
      total_alertas INT,
      lojas_afetadas INT,
      valor_risco NUMERIC(12,2),
      operador TEXT DEFAULT 'comprador'
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS alertas (
      id SERIAL PRIMARY KEY,
      analise_id INT REFERENCES analises(id) ON DELETE CASCADE,
      loja TEXT,
      data_ocorrencia DATE,
      tipo TEXT,
      ger_val NUMERIC(12,2),
      fisc_val NUMERIC(12,2),
      divergencia NUMERIC(12,2),
      extra TEXT,
      status TEXT DEFAULT 'pendente',
      ai_insight TEXT,
      criado_em TIMESTAMPTZ DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `
  console.log('✓ Tabelas prontas no Neon')
}
initDB().catch(console.error)

// ─── Salvar resultado de uma análise completa ─────────────────────────────────
app.post('/api/analise', async (req, res) => {
  try {
    const { alertas, operador = 'comprador' } = req.body
    const lojas = [...new Set(alertas.map(a => a.loja))].length
    const valorRisco = alertas
      .filter(a => a.tipo === 'sem_nf' || a.tipo === 'divergencia')
      .reduce((s, a) => s + Math.abs(a.diverg || 0), 0)

    const [analise] = await sql`
      INSERT INTO analises (total_alertas, lojas_afetadas, valor_risco, operador)
      VALUES (${alertas.length}, ${lojas}, ${valorRisco.toFixed(2)}, ${operador})
      RETURNING id
    `

    if (alertas.length > 0) {
      await sql`
        INSERT INTO alertas ${sql(alertas.map(a => ({
          analise_id: analise.id,
          loja: a.loja,
          data_ocorrencia: a.data.split('/').reverse().join('-'),
          tipo: a.tipo,
          ger_val: a.gerVal || 0,
          fisc_val: a.fiscVal || 0,
          divergencia: a.diverg || 0,
          extra: a.extra || null,
          status: a.status || 'pendente'
        })))}
      `
    }

    res.json({ ok: true, analiseId: analise.id })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

// ─── Buscar histórico de análises ────────────────────────────────────────────
app.get('/api/historico', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM analises ORDER BY realizada_em DESC LIMIT 50
    `
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Buscar alertas (com filtros opcionais) ───────────────────────────────────
app.get('/api/alertas', async (req, res) => {
  try {
    const { analise_id, loja, tipo, status } = req.query
    let rows

    if (analise_id) {
      rows = await sql`SELECT * FROM alertas WHERE analise_id = ${analise_id} ORDER BY divergencia DESC`
    } else {
      // Retorna alertas da análise mais recente
      const [ultima] = await sql`SELECT id FROM analises ORDER BY realizada_em DESC LIMIT 1`
      if (!ultima) return res.json([])
      rows = await sql`SELECT * FROM alertas WHERE analise_id = ${ultima.id} ORDER BY divergencia DESC`
    }

    if (loja) rows = rows.filter(r => r.loja === loja)
    if (tipo) rows = rows.filter(r => r.tipo === tipo)
    if (status) rows = rows.filter(r => r.status === status)

    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Atualizar status de um alerta ───────────────────────────────────────────
app.patch('/api/alertas/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    await sql`
      UPDATE alertas SET status = ${status}, atualizado_em = NOW()
      WHERE id = ${req.params.id}
    `
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Salvar insight de IA em um alerta ───────────────────────────────────────
app.patch('/api/alertas/:id/insight', async (req, res) => {
  try {
    const { insight } = req.body
    await sql`
      UPDATE alertas SET ai_insight = ${insight}, atualizado_em = NOW()
      WHERE id = ${req.params.id}
    `
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Diagnóstico de IA por alerta ────────────────────────────────────────────
app.post('/api/ia/insight', async (req, res) => {
  try {
    const { alerta } = req.body
    const tipoLabel = {
      sem_nf: 'Sem NF fiscal',
      divergencia: 'Divergência de valor',
      nf_erro: 'NF com erro',
      nf_cancelada: 'NF cancelada'
    }
    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Você é um analista fiscal de varejo. Analise este alerta e escreva em 2-3 frases curtas um diagnóstico e recomendação de ação para o comprador.

Tipo: ${tipoLabel[alerta.tipo] || alerta.tipo}
Loja: ${alerta.loja}
Data: ${alerta.data_ocorrencia || alerta.data}
Valor gerencial: R$ ${Number(alerta.ger_val || alerta.gerVal || 0).toFixed(2)}
Valor fiscal: R$ ${Number(alerta.fisc_val || alerta.fiscVal || 0).toFixed(2)}
Divergência: R$ ${Number(alerta.divergencia || alerta.diverg || 0).toFixed(2)}
${alerta.extra ? 'Detalhe: ' + alerta.extra : ''}

Responda de forma direta, sem saudações.`
      }]
    })
    const insight = msg.content[0].text
    res.json({ insight })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Relatório narrativo por loja (para PDF) ─────────────────────────────────
app.post('/api/ia/relatorio', async (req, res) => {
  try {
    const { loja, alertas, score, valorRisco } = req.body
    const tipoLabel = {
      sem_nf: 'Sem NF fiscal',
      divergencia: 'Divergência de valor',
      nf_erro: 'NF com erro',
      nf_cancelada: 'NF cancelada'
    }
    const resumo = alertas
      .map(a => `- ${a.data_ocorrencia || a.data} | ${tipoLabel[a.tipo] || a.tipo} | Divergência: R$ ${Number(a.divergencia || a.diverg || 0).toFixed(2)} | Status: ${a.status}`)
      .join('\n')

    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Você é um analista fiscal sênior. Gere um relatório gerencial em português sobre conformidade fiscal de trocas.

Loja: ${loja}
Score de conformidade: ${score}/100
Valor total em risco: R$ ${Number(valorRisco).toFixed(2)}
Total de alertas: ${alertas.length}

Alertas:
${resumo}

Gere um relatório executivo com:
1. Sumário executivo (2-3 frases)
2. Principais problemas identificados
3. Recomendações de ação imediata
4. Conclusão e próximos passos

Tom: formal, objetivo, orientado a ação.`
      }]
    })
    res.json({ relatorio: msg.content[0].text })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`✓ Servidor rodando na porta ${PORT}`))
