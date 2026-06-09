// src/components/UI.jsx
import React from 'react'

export function Badge({ type = 'gray', children }) {
  const styles = {
    red: { background: '#FCEBEB', color: '#791F1F' },
    amber: { background: '#FAEEDA', color: '#633806' },
    green: { background: '#EAF3DE', color: '#27500A' },
    blue: { background: '#E6F1FB', color: '#0C447C' },
    gray: { background: '#F1EFE8', color: '#444441' }
  }
  return (
    <span style={{
      ...styles[type],
      display: 'inline-block', padding: '2px 8px',
      borderRadius: 4, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap'
    }}>
      {children}
    </span>
  )
}

export function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', border: '0.5px solid #e5e7eb',
      borderRadius: 12, padding: '1rem 1.25rem', ...style
    }}>
      {children}
    </div>
  )
}

export function MetricCard({ label, value, color }) {
  return (
    <div style={{
      background: '#f9fafb', borderRadius: 8, padding: '14px 16px'
    }}>
      <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: color || '#111827' }}>
        {value}
      </div>
    </div>
  )
}

export function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 500, color: '#6b7280',
      textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12
    }}>
      {children}
    </p>
  )
}

export function Btn({ children, onClick, variant = 'default', disabled, style }) {
  const variants = {
    default: { background: '#fff', color: '#111827', border: '0.5px solid #d1d5db' },
    primary: { background: '#185FA5', color: '#fff', border: '1px solid #185FA5' },
    danger: { background: '#A32D2D', color: '#fff', border: '1px solid #A32D2D' }
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        padding: '7px 14px', borderRadius: 8, fontSize: 13,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        opacity: disabled ? .6 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', ...style
      }}
    >
      {children}
    </button>
  )
}

export function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 14, height: 14,
      border: '2px solid #e5e7eb', borderTopColor: '#185FA5',
      borderRadius: '50%', animation: 'spin .7s linear infinite'
    }} />
  )
}

export function scoreColor(s) {
  return s >= 70 ? '#3B6D11' : s >= 40 ? '#854F0B' : '#A32D2D'
}

export function scoreBg(s) {
  return s >= 70 ? '#EAF3DE' : s >= 40 ? '#FAEEDA' : '#FCEBEB'
}

export function tipoBadge(tipo) {
  const map = {
    sem_nf: 'red', divergencia: 'amber', nf_erro: 'blue', nf_cancelada: 'gray'
  }
  return map[tipo] || 'gray'
}

export function statusBadge(status) {
  const map = {
    pendente: 'amber', apurando: 'blue', resolvido: 'green', sem_resposta: 'red'
  }
  return map[status] || 'gray'
}
