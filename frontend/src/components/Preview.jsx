export default function Preview({ data, onReplace }) {
  const { filename, size_kb, total, question, preview = [] } = data
  return (
    <div style={S.card}>
      <div style={S.fileRow}>
        <span style={S.fileIcon}>📊</span>
        <div style={S.fileInfo}>
          <div style={S.filename}>{filename}</div>
          <div style={S.meta}>
            <span style={S.badge}>{total?.toLocaleString()} responses</span>
            <span style={S.dot}>·</span>
            <span style={S.size}>{size_kb < 1024 ? `${size_kb} KB` : `${(size_kb/1024).toFixed(1)} MB`}</span>
          </div>
        </div>
        <button style={S.replaceBtn} onClick={onReplace}>Replace ↺</button>
      </div>

      {question && (
        <div style={S.qBox}>
          <div style={S.qLabel}>Survey Question</div>
          <div style={S.qText}>{question}</div>
        </div>
      )}

      <div style={S.tableWrap}>
        <div style={S.tableLabel}>Preview — first {preview.length} responses</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: 70 }}>ID</th>
              <th style={S.th}>Verbatim</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                <td style={S.tdId}>{row.respid}</td>
                <td style={S.tdVerb}>{row.verbatim}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const S = {
  card:        { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' },
  fileRow:     { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' },
  fileIcon:    { fontSize: '1.4rem' },
  fileInfo:    { flex: 1 },
  filename:    { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 3 },
  meta:        { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  badge:       { background: 'var(--lime-dim)', border: '1px solid var(--lime-border)', borderRadius: 100, padding: '0.12rem 0.55rem', fontSize: '0.68rem', fontWeight: 600, color: 'var(--lime)' },
  dot:         { color: 'var(--text-muted)', fontSize: '0.65rem' },
  size:        { fontSize: '0.72rem', color: 'var(--text-muted)' },
  replaceBtn:  { background: 'none', border: '1px solid var(--border-md)', borderRadius: 'var(--r-sm)', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '0.3rem 0.65rem', cursor: 'pointer', fontFamily: 'var(--font-body)' },
  qBox:        { padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.015)' },
  qLabel:      { fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--lime)', marginBottom: 5 },
  qText:       { fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.55 },
  tableWrap:   { overflowX: 'auto', maxHeight: 340, overflowY: 'auto' },
  tableLabel:  { padding: '0.65rem 1.25rem 0.35rem', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' },
  th:          { padding: '0.5rem 1.25rem', textAlign: 'left', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-card)', position: 'sticky', top: 0, borderBottom: '1px solid var(--border)' },
  tdId:        { padding: '0.55rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', verticalAlign: 'top' },
  tdVerb:      { padding: '0.55rem 1.25rem 0.55rem 0', color: 'var(--text-secondary)', lineHeight: 1.5, verticalAlign: 'top' },
}