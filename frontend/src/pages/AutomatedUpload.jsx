// Automated config page — question is already uploaded in the project,
// this page only collects topic + threshold, then runs the pipeline.
export default function AutomatedUpload({ question, topic, setTopic, threshold, setThreshold, onRun, onBack }) {
  const canRun = !!question && !!topic.trim()

  if (!question) return null

  return (
    <div style={S.root}>
      <div style={S.header}>
        <span style={S.badge}>⚡ Automated Coding</span>
        <p style={S.sub}>Configure the AI run for this question.</p>
      </div>

      <div style={S.layout}>
        {/* Left — question summary */}
        <div style={S.qCard}>
          <div style={S.qTop}>
            <span style={S.qIcon}>📄</span>
            <div>
              <div style={S.qFile}>{question.filename}</div>
              <div style={S.qMeta}>
                <span style={S.metaBadge}>{question.total?.toLocaleString()} responses</span>
              </div>
            </div>
          </div>
          <div style={S.qBox}>
            <div style={S.qLabel}>Survey Question</div>
            <div style={S.qText}>{question.question || question.qid}</div>
          </div>
          <div style={S.previewLabel}>First responses</div>
          <div style={S.previewList}>
            {question.rows.slice(0, 6).map((r, i) => (
              <div key={i} style={S.previewRow}>
                <span style={S.previewId}>{r.respid}</span>
                <span style={S.previewText}>{r.verbatim.slice(0, 110)}{r.verbatim.length > 110 ? '…' : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — config */}
        <div style={S.config}>
          <div style={S.configTitle}>Configure Run</div>

          <div style={S.field}>
            <label style={S.label}>Survey Topic <span style={S.req}>*</span></label>
            <input style={S.input} placeholder="e.g. Coca-Cola Zero Sugar, Electric Vehicles"
              value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canRun && onRun()} autoFocus />
            <div style={S.hint}>Helps the AI understand the context of responses</div>
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

          <button style={{ ...S.runBtn, opacity: canRun ? 1 : 0.35, cursor: canRun ? 'pointer' : 'not-allowed' }}
            disabled={!canRun} onClick={onRun}>
            ▶  Run AI Coding
          </button>
          {!canRun && <p style={S.hint2}>Enter a survey topic to continue</p>}

          <button style={S.backBtn} onClick={onBack}>← Back to Project</button>
        </div>
      </div>
    </div>
  )
}

const S = {
  root:   { display:'flex', flexDirection:'column', gap:'1.5rem' },
  header: { display:'flex', flexDirection:'column', gap:'0.35rem' },
  badge:  { alignSelf:'flex-start', fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--purple)', background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:100, padding:'0.25rem 0.75rem' },
  sub:    { fontSize:'0.85rem', color:'var(--text-secondary)' },
  layout: { display:'grid', gridTemplateColumns:'1fr 360px', gap:'1.5rem', alignItems:'start' },

  qCard: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', overflow:'hidden' },
  qTop:  { display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' },
  qIcon: { fontSize:'1.4rem' },
  qFile: { fontFamily:'var(--font-display)', fontWeight:600, fontSize:'0.9rem', color:'var(--text-primary)', marginBottom:3 },
  qMeta: { display:'flex', gap:'0.4rem' },
  metaBadge: { fontSize:'0.68rem', fontWeight:600, color:'var(--lime)', background:'var(--lime-dim)', border:'1px solid var(--lime-border)', borderRadius:100, padding:'0.12rem 0.55rem' },
  qBox:  { padding:'0.85rem 1.25rem', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.015)' },
  qLabel:{ fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--lime)', marginBottom:5 },
  qText: { fontSize:'0.83rem', color:'var(--text-primary)', lineHeight:1.55 },
  previewLabel: { padding:'0.65rem 1.25rem 0.35rem', fontSize:'0.62rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)' },
  previewList:  { paddingBottom:'0.5rem' },
  previewRow:   { display:'flex', gap:'0.75rem', padding:'0.45rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,0.03)' },
  previewId:    { fontFamily:'var(--font-mono)', fontSize:'0.68rem', color:'var(--text-muted)', flexShrink:0, minWidth:40 },
  previewText:  { fontSize:'0.78rem', color:'var(--text-secondary)', lineHeight:1.45 },

  config:      { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'1.4rem', display:'flex', flexDirection:'column', gap:'1rem', position:'sticky', top:'4.5rem' },
  configTitle: { fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.9rem', color:'var(--text-primary)' },
  field:       { display:'flex', flexDirection:'column', gap:'0.38rem' },
  label:       { fontSize:'0.76rem', fontWeight:500, color:'var(--text-secondary)', display:'flex', justifyContent:'space-between', alignItems:'center' },
  req:         { color:'var(--red)' },
  val:         { fontFamily:'var(--font-mono)', color:'var(--lime)', fontWeight:700 },
  input:       { background:'var(--bg-input)', border:'1px solid var(--border-md)', borderRadius:'var(--r-sm)', color:'var(--text-primary)', fontSize:'0.85rem', fontFamily:'var(--font-body)', padding:'0.58rem 0.75rem', outline:'none' },
  hint:        { fontSize:'0.7rem', color:'var(--text-muted)' },
  slider:      { accentColor:'var(--lime)', cursor:'pointer', width:'100%' },
  sliderRow:   { display:'flex', justifyContent:'space-between' },
  sliderLbl:   { fontSize:'0.65rem', color:'var(--text-muted)' },
  divider:     { height:1, background:'var(--border)' },
  runBtn:      { background:'var(--lime)', color:'#0d0d0d', border:'none', borderRadius:'var(--r-md)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.88rem', padding:'0.78rem', cursor:'pointer', letterSpacing:'-0.01em' },
  hint2:       { textAlign:'center', fontSize:'0.7rem', color:'var(--text-muted)' },
  backBtn:     { background:'none', border:'1px solid var(--border-md)', borderRadius:'var(--r-sm)', color:'var(--text-secondary)', fontSize:'0.78rem', padding:'0.5rem', cursor:'pointer', fontFamily:'var(--font-body)' },
}