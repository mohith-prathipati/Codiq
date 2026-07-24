const MODE_META = {
  manual:    { label: 'Manual',    color: 'var(--lime)',   bg: 'var(--lime-dim)',        border: 'var(--lime-border)' },
  automated: { label: 'Automated', color: 'var(--purple)', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
}

export default function Topbar({ onHome, onProject, mode, projectName }) {
  const meta = mode ? MODE_META[mode] : null
  return (
    <header style={S.bar}>
      <div style={S.inner}>
        <div style={S.left}>
          {onHome && (
            <button style={S.back} onClick={onHome} title="Back to home">⌂</button>
          )}
          {onProject && (
            <button style={S.back} onClick={onProject} title="Back to project">←</button>
          )}
          <div style={S.logo}>
            <div style={S.mark}>⬡</div>
            <div>
              <div style={S.name}>Codiq</div>
              <div style={S.tag}>Verbatim Coding Platform</div>
            </div>
          </div>
          {meta && (
            <span style={{ ...S.badge, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
              {meta.label}
            </span>
          )}
          {projectName && (
            <span style={S.projectCrumb}>/ {projectName}</span>
          )}
        </div>
        <div style={S.pill}>
          <span style={S.dot} />
          Ollama · Mistral
        </div>
      </div>
    </header>
  )
}

const S = {
  bar:   { borderBottom: '1px solid var(--border)', background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 },
  inner: { maxWidth: 1400, margin: '0 auto', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  left:  { display: 'flex', alignItems: 'center', gap: '0.7rem' },
  back:  { width: 30, height: 30, background: 'var(--bg-input)', border: '1px solid var(--border-md)', borderRadius: 'var(--r-sm)', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 },
  logo:  { display: 'flex', alignItems: 'center', gap: '0.55rem' },
  mark:  { width: 30, height: 30, background: 'var(--lime)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#0d0d0d', fontFamily: 'var(--font-display)', flexShrink: 0 },
  name:  { fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 },
  tag:   { fontSize: '0.58rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  badge: { fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.18rem 0.6rem', borderRadius: 100 },
  projectCrumb: { fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' },
  pill:  { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.28rem 0.75rem', background: 'var(--lime-dim)', border: '1px solid var(--lime-border)', borderRadius: 100, fontSize: '0.68rem', fontWeight: 600, color: 'var(--lime)' },
  dot:   { width: 5, height: 5, borderRadius: '50%', background: 'var(--lime)', display: 'inline-block', animation: 'pulse 2s infinite' },
}