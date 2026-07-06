import { useState, useRef } from 'react'

export default function Uploader({ onUpload }) {
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()

  const handleFile = async (file) => {
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls)$/i)) { alert('Please upload an .xlsx or .xls file'); return }
    setUploading(true)
    await onUpload(file)
    setUploading(false)
  }

  return (
    <div
      style={{ ...S.zone, ...(dragging ? S.dragging : {}) }}
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
    >
      <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])} />

      {uploading ? (
        <>
          <div style={S.spinner}>◌</div>
          <div style={S.title}>Reading file…</div>
        </>
      ) : (
        <>
          <div style={S.iconWrap}>
            <span style={S.iconEmoji}>📂</span>
          </div>
          <div style={S.title}>Drop your Excel file here</div>
          <div style={S.sub}>or click to browse</div>
          <div style={S.chip}>.xlsx · .xls</div>
        </>
      )}
    </div>
  )
}

const S = {
  zone: {
    width: '100%', maxWidth: 460,
    border: '2px dashed var(--border-md)', borderRadius: 'var(--r-xl)',
    padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.55rem', cursor: 'pointer', background: 'var(--bg-card)',
    transition: 'border-color 0.2s, background 0.2s', userSelect: 'none',
  },
  dragging: { borderColor: 'var(--lime)', background: 'var(--bg-selected)' },
  iconWrap: { width: 52, height: 52, borderRadius: 'var(--r-lg)', background: 'var(--bg-input)', border: '1px solid var(--border-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' },
  iconEmoji:{ fontSize: '1.5rem' },
  title:    { fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' },
  sub:      { fontSize: '0.8rem', color: 'var(--text-muted)' },
  chip:     { marginTop: '0.35rem', padding: '0.2rem 0.65rem', background: 'var(--bg-input)', border: '1px solid var(--border-md)', borderRadius: 100, fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' },
  spinner:  { fontSize: '2rem', color: 'var(--lime)', animation: 'spin 1s linear infinite' },
}