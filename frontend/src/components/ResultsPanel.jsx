const STAGES = [
  { key: 'Discovering',   label: 'Discover',   icon: '🔍' },
  { key: 'Consolidating', label: 'Consolidate',icon: '🧩' },
  { key: 'Assigning NET', label: 'Net Codes',  icon: '🏷️' },
  { key: 'Generating',    label: 'Keywords',   icon: '🗝️' },
  { key: 'Coding',        label: 'Code',       icon: '⚡' },
  { key: 'Validating',    label: 'Validate',   icon: '✅' },
  { key: 'Writing',       label: 'Export',     icon: '📤' },
]

export default function ResultsPanel({ phase, jobStatus, topic, fileData }) {
  const { stage = '', progress = 0, log = [], stats = {}, codebook = [] } = jobStatus
  const pct    = Math.round(progress * 100)
  const isDone = phase === 'done'

  const activeIdx = STAGES.findIndex(s => stage.includes(s.key))

  const grouped = codebook.reduce((acc, t) => {
    if (!acc[t.net]) acc[t.net] = { net_name: t.net_name, themes: [] }
    acc[t.net].themes.push(t)
    return acc
  }, {})

  return (
    <div style={S.root}>
      <div style={S.left}>
        {/* Header */}
        <div style={S.hdr}>
          <div>
            <div style={S.hdrTitle}>{isDone ? '✓ Pipeline Complete' : '⏳ Running Pipeline'}</div>
            <div style={S.hdrSub}>Topic: <strong style={{ color: 'var(--lime)', fontWeight: 600 }}>{topic}</strong>
              {fileData && <> · {fileData.total?.toLocaleString()} responses</>}
            </div>
          </div>
        </div>

        {/* Stage strip */}
        <div style={S.strip}>
          {STAGES.map((s, i) => {
            const state = isDone ? 'done' : i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'idle'
            return (
              <div key={s.key} style={{ ...S.stageTile, ...(state === 'active' ? S.tileActive : state === 'done' ? S.tileDone : {}) }}>
                <span style={S.tileIcon}>{s.icon}</span>
                <span style={{ ...S.tileLbl, ...(state === 'active' ? { color: 'var(--lime)' } : state === 'done' ? { color: 'var(--green)' } : {}) }}>
                  {s.label}
                </span>
                {state === 'done' && <span style={S.tileTick}>✓</span>}
                {state === 'active' && <div style={S.tileBar} />}
              </div>
            )
          })}
        </div>

        {/* Progress */}
        <div style={S.progRow}>
          <div style={S.progTrack}><div style={{ ...S.progFill, width: `${pct}%`, background: isDone ? 'var(--green)' : 'var(--lime)' }} /></div>
          <span style={S.progTxt}>{stage || 'Initialising…'}</span>
          <span style={{ ...S.progPct, color: isDone ? 'var(--green)' : 'var(--lime)' }}>{pct}%</span>
        </div>

        {/* Log terminal */}
        <div style={S.term}>
          {log.length === 0
            ? <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>Waiting…</span>
            : log.slice(-35).map((line, i) => <div key={i} style={lineStyle(line)}>{line || '\u00A0'}</div>)
          }
        </div>
      </div>

      {/* Right column */}
      <div style={S.right}>
        {isDone && Object.keys(stats).length > 0 && (
          <div style={S.statsCard}>
            <div style={S.secTitle}>Summary</div>
            <div style={S.statsGrid}>
              {[
                { v: stats.total,    l: 'Responses', c: 'var(--text-primary)' },
                { v: stats.themes,   l: 'Themes',    c: 'var(--lime)' },
                { v: stats.positive, l: 'Positive',  c: 'var(--green)' },
                { v: stats.negative, l: 'Negative',  c: 'var(--red)' },
                { v: stats.mixed,    l: 'Mixed',      c: 'var(--yellow)' },
                { v: stats.other,    l: 'Other',      c: 'var(--text-muted)' },
              ].map(({ v, l, c }) => (
                <div key={l} style={S.statBox}>
                  <div style={{ ...S.statVal, color: c }}>{v?.toLocaleString() ?? '—'}</div>
                  <div style={S.statLbl}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {codebook.length > 0 && (
          <div style={S.cbCard}>
            <div style={S.secTitle}>Codebook Preview</div>
            <div style={S.cbList}>
              {Object.entries(grouped).sort((a,b)=>Number(a[0])-Number(b[0])).map(([net,{net_name,themes}]) => (
                <div key={net}>
                  <div style={S.cbNet}>NET {net} · {net_name}</div>
                  {themes.map(t => (
                    <div key={t.code} style={S.cbRow}>
                      <span style={S.cbCode}>{t.code}</span>
                      <span style={S.cbTheme}>{t.theme}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isDone && codebook.length === 0 && (
          <div style={S.placeholder}>
            <div style={{ fontSize: '1.5rem', opacity: 0.15, marginBottom: '0.5rem' }}>⬡</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Codebook will appear here once themes are discovered
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function lineStyle(line) {
  const base = { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }
  if (line.startsWith('✓')) return { ...base, color: 'var(--green)' }
  if (line.startsWith('✗') || line.includes('Error')) return { ...base, color: 'var(--red)' }
  if (line.includes('Stage') || line.includes('stage')) return { ...base, color: 'var(--lime)' }
  if (line.startsWith('  ') || line.includes('...')) return { ...base, color: 'var(--text-secondary)' }
  return { ...base, color: 'var(--text-muted)' }
}

const S = {
  root:    { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start', paddingTop: '1rem' },
  left:    { display: 'flex', flexDirection: 'column', gap: '1rem' },
  right:   { display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '4.5rem' },
  hdr:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  hdrTitle:{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 },
  hdrSub:  { fontSize: '0.8rem', color: 'var(--text-muted)' },
  strip:   { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)' },
  stageTile:{ padding: '0.65rem 0.3rem', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', border: '1px solid transparent', position: 'relative', transition: 'background 0.3s' },
  tileActive:{ background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.15)' },
  tileDone:  { background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)' },
  tileIcon:  { fontSize: '0.95rem' },
  tileLbl:   { fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' },
  tileTick:  { fontSize: '0.58rem', color: 'var(--green)', fontWeight: 700 },
  tileBar:   { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'var(--lime)', animation: 'pulse 1.5s ease-in-out infinite' },
  progRow:   { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  progTrack: { flex: 1, height: 4, background: 'var(--bg-input)', borderRadius: 100, overflow: 'hidden', border: '1px solid var(--border)' },
  progFill:  { height: '100%', borderRadius: 100, transition: 'width 0.6s ease' },
  progTxt:   { fontSize: '0.72rem', color: 'var(--text-muted)', flex: 1 },
  progPct:   { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700 },
  term:      { background: '#080808', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0.9rem 1.1rem', minHeight: 180, maxHeight: 280, overflowY: 'auto' },
  secTitle:  { fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' },
  statsCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.1rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' },
  statBox:   { background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0.65rem 0.4rem', textAlign: 'center' },
  statVal:   { fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 },
  statLbl:   { fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '0.25rem' },
  cbCard:    { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.1rem', maxHeight: 380, overflowY: 'auto' },
  cbList:    { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  cbNet:     { fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem', paddingBottom: '0.25rem', borderBottom: '1px solid var(--border)' },
  cbRow:     { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' },
  cbCode:    { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--lime)', background: 'var(--lime-dim)', borderRadius: 4, padding: '0.1rem 0.35rem', minWidth: 32, textAlign: 'center' },
  cbTheme:   { fontSize: '0.78rem', color: 'var(--text-secondary)' },
  placeholder:{ background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 'var(--r-lg)', padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' },
}