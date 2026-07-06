import Uploader from '../components/Uploader'
import Preview from '../components/Preview'

export default function AutomatedUpload({ onUpload, fileData, topic, setTopic, threshold, setThreshold, onRun, onReplace }) {
  const canRun = !!fileData && !!topic.trim()

  return (
    <div style={S.root}>
      <div style={S.header}>
        <span style={S.badge}>⚡ Automated Coding</span>
        <p style={S.headerSub}>Upload your Excel file, set a topic, and let AI discover themes and assign codes.</p>
      </div>

      {!fileData ? (
        <div style={S.center}><Uploader onUpload={onUpload} /></div>
      ) : (
        <div style={S.layout}>
          {/* Left — file preview */}
          <Preview data={fileData} onReplace={onReplace} />

          {/* Right — config */}
          <div style={S.config}>
            <div style={S.configTitle}>Configure Run</div>

            <div style={S.field}>
              <label style={S.label}>Survey Topic <span style={S.req}>*</span></label>
              <input
                style={S.input}
                placeholder="e.g. Coca-Cola Zero Sugar, Electric Vehicles"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canRun && onRun()}
              />
              <div style={S.hint}>Helps the AI understand the context of responses</div>
            </div>

            <div style={S.field}>
              <label style={S.label}>
                Min. responses per theme
                <span style={S.val}>{threshold}</span>
              </label>
              <input type="range" min={2} max={15} step={1} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                style={S.slider}
              />
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

            <div style={S.infoList}>
              {[
                ['🔍', 'Discover', 'AI reads responses and finds recurring themes'],
                ['⚡', 'Assign',   'Codes are assigned to every response'],
                ['✅', 'Review',   'Open workspace to review and edit results'],
              ].map(([icon, lbl, desc]) => (
                <div key={lbl} style={S.infoRow}>
                  <span style={S.infoIcon}>{icon}</span>
                  <div>
                    <div style={S.infoLbl}>{lbl}</div>
                    <div style={S.infoDesc}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  root:       { display: 'flex', flexDirection: 'column', gap: '1.75rem' },
  header:     { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  badge:      { alignSelf: 'flex-start', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--purple)', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 100, padding: '0.25rem 0.75rem' },
  headerSub:  { fontSize: '0.85rem', color: 'var(--text-secondary)' },
  center:     { display: 'flex', justifyContent: 'center', paddingTop: '2rem' },
  layout:     { display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' },
  config:     { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', position: 'sticky', top: '4.5rem' },
  configTitle:{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' },
  field:      { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label:      { fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' },
  req:        { color: 'var(--red)' },
  val:        { fontFamily: 'var(--font-mono)', color: 'var(--lime)', fontWeight: 700 },
  input:      { background: 'var(--bg-input)', border: '1px solid var(--border-md)', borderRadius: 'var(--r-sm)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-body)', padding: '0.6rem 0.8rem', outline: 'none' },
  hint:       { fontSize: '0.72rem', color: 'var(--text-muted)' },
  slider:     { accentColor: 'var(--lime)', cursor: 'pointer', width: '100%' },
  sliderRow:  { display: 'flex', justifyContent: 'space-between' },
  sliderLbl:  { fontSize: '0.68rem', color: 'var(--text-muted)' },
  divider:    { height: 1, background: 'var(--border)' },
  runBtn:     { background: 'var(--lime)', color: '#0d0d0d', border: 'none', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', padding: '0.8rem', cursor: 'pointer', letterSpacing: '-0.01em' },
  hint2:      { textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' },
  infoList:   { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  infoRow:    { display: 'flex', alignItems: 'flex-start', gap: '0.65rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0.6rem 0.75rem' },
  infoIcon:   { fontSize: '0.95rem', marginTop: 1 },
  infoLbl:    { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' },
  infoDesc:   { fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 1 },
}