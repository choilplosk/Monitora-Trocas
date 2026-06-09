// src/pages/Upload.jsx
import React, { useState, useRef } from 'react'
import { Card, Btn, SectionTitle } from '../components/UI.jsx'

function DropZone({ label, icon, onFile, done, filename }) {
  const inputRef = useRef()
  const [drag, setDrag] = useState(false)

  function handleFile(file) {
    if (file && file.name.endsWith('.csv')) onFile(file)
  }

  if (done) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
        background: '#EAF3DE', border: '0.5px solid #a3c97a',
        borderRadius: 8, marginBottom: 10, fontSize: 13, color: '#27500A'
      }}>
        <i className="ti ti-check" aria-hidden="true" />
        {filename} carregado
      </div>
    )
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
      style={{
        border: `1.5px dashed ${drag ? '#185FA5' : '#d1d5db'}`,
        borderRadius: 12, padding: '2rem', textAlign: 'center',
        cursor: 'pointer', background: drag ? '#E6F1FB' : '#f9fafb',
        marginBottom: 10, transition: 'all .15s'
      }}
    >
      <i className={`ti ${icon}`} style={{ fontSize: 32, color: '#9ca3af' }} aria-hidden="true" />
      <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>{label}</p>
      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Clique ou arraste o arquivo CSV aqui</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  )
}

export default function Upload({ ctx }) {
  const { loadCSV, analyze, hasData, loading, error, gerData, trocasData } = ctx
  const [gerFile, setGerFile] = useState(null)
  const [trocasFile, setTrocasFile] = useState(null)
  const [threshold, setThreshold] = useState(50)
  const [tolPct, setTolPct] = useState(10)

  async function handleFile(file, type) {
    if (type === 'ger') setGerFile(file)
    else setTrocasFile(file)
    await loadCSV(file, type)
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <Card style={{ marginBottom: '1rem' }}>
        <SectionTitle>Carregar relatórios</SectionTitle>
        <DropZone
          label="Relatório Gerencial"
          icon="ti-table"
          done={!!gerData}
          filename={gerFile?.name}
          onFile={f => handleFile(f, 'ger')}
        />
        <DropZone
          label="Relatório de Trocas Emitidas"
          icon="ti-receipt"
          done={!!trocasData}
          filename={trocasFile?.name}
          onFile={f => handleFile(f, 'trocas')}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '1rem', flexWrap: 'wrap' }}>
          <Btn
            variant="primary"
            disabled={!hasData || loading}
            onClick={() => analyze({ threshold, tolerancePct: tolPct })}
          >
            {loading
              ? <><span style={{ width: 14, height: 14, border: '2px solid #fff3', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Analisando...</>
              : <><i className="ti ti-refresh" aria-hidden="true" /> Analisar agora</>
            }
          </Btn>
          {error && <span style={{ fontSize: 13, color: '#A32D2D' }}>{error}</span>}
        </div>
      </Card>

      <Card>
        <SectionTitle>Configuração de tolerância</SectionTitle>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13 }}>
            <span style={{ display: 'block', color: '#6b7280', marginBottom: 4 }}>Divergência mínima para alerta (R$)</span>
            <input
              type="number" value={threshold} min={0}
              onChange={e => setThreshold(Number(e.target.value))}
              style={{ width: 100, padding: '6px 10px', border: '0.5px solid #d1d5db', borderRadius: 8 }}
            />
          </label>
          <label style={{ fontSize: 13 }}>
            <span style={{ display: 'block', color: '#6b7280', marginBottom: 4 }}>% de tolerância por dia</span>
            <input
              type="number" value={tolPct} min={0} max={100}
              onChange={e => setTolPct(Number(e.target.value))}
              style={{ width: 80, padding: '6px 10px', border: '0.5px solid #d1d5db', borderRadius: 8 }}
            />
          </label>
        </div>
      </Card>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
