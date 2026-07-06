export default function ConfigPanel({ topic, setTopic, threshold, setThreshold, onRun, canRun }) {
  return (
    <div style={S.card}>
      <div style={S.title}>Configure Run</div>
      <div style={S.field}>
        <label style={S.label}>Survey Topic <span style={S.req}>*</span></label>
        <input style={S.input} placeholder="e.g. Coca-Cola Zero Sugar, Electric Vehicles"
          value={topic} onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && canRun && onRun()} />
        <div style={S.hint}>Helps AI understand response context</div>
      </div>
      <div style={S.field}>
        <label style={S.label}>Min. responses per theme <span style={S.val}>{threshold}</span></label>
        <input type="range" min={2} max={15} step={1} value={threshold}
          onChange={e => setThreshold(Number(e.target.value))} style={S.slider} />
        <div style={S.sliderRow}>
          <span style={S.sliderLbl}>2 — granular</span>
          <span style={S.sliderLbl}>15 — broad</span>
        </div>
      </div>
      <div style={S.divider} />
      <button style={{ ...S.btn, opacity: canRun ? 1 : 0.35, cursor: canRun ? 'pointer' : 'not-allowed' }}
        disabled={!canRun} onClick={onRun}>▶  Run AI Coding</button>
      {!canRun && <div style={S.hint2}>Enter a topic to continue</div>}
    </div>
  )
}
const S = {
  card:      { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  title:     { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' },
  field:     { display: 'flex', flexDirection: 'column', gap: '0.38rem' },
  label:     { fontSize: '0.76rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  req:       { color: 'var(--red)' },
  val:       { fontFamily: 'var(--font-mono)', color: 'var(--lime)', fontWeight: 700 },
  input:     { background: 'var(--bg-input)', border: '1px solid var(--border-md)', borderRadius: 'var(--r-sm)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-body)', padding: '0.58rem 0.75rem', outline: 'none' },
  hint:      { fontSize: '0.7rem', color: 'var(--text-muted)' },
  slider:    { accentColor: 'var(--lime)', cursor: 'pointer', width: '100%' },
  sliderRow: { display: 'flex', justifyContent: 'space-between' },
  sliderLbl: { fontSize: '0.65rem', color: 'var(--text-muted)' },
  divider:   { height: 1, background: 'var(--border)' },
  btn:       { background: 'var(--lime)', color: '#0d0d0d', border: 'none', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', padding: '0.78rem', cursor: 'pointer', letterSpacing: '-0.01em' },
  hint2:     { textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' },
}