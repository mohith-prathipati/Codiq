import Uploader from '../components/Uploader'
import Preview from '../components/Preview'

// Manual mode: just upload — workspace opens immediately with empty codebook
export default function ManualUpload({ onUpload, fileData, onStart, onReplace }) {
  return (
    <div style={S.root}>
      <div style={S.header}>
        <span style={S.badge}>✍️ Manual Coding</span>
        <p style={S.sub}>Upload your response file. You'll build the codebook and assign codes directly inside the workspace as you read each response.</p>
      </div>

      {!fileData ? (
        <div style={S.center}><Uploader onUpload={onUpload} /></div>
      ) : (
        <div style={S.layout}>
          <Preview data={fileData} onReplace={onReplace} />
          <div style={S.right}>
            <div style={S.readyCard}>
              <div style={S.readyIcon}>✓</div>
              <div style={S.readyTitle}>File ready</div>
              <div style={S.readyDesc}>
                {fileData.total?.toLocaleString()} responses loaded.<br />
                Open the workspace to start reading and coding.
              </div>
              <button style={S.btn} onClick={onStart}>
                Open Coding Workspace →
              </button>
              <ul style={S.tips}>
                <li style={S.tip}>Read each response in the centre panel</li>
                <li style={S.tip}>Create themes on the right as you discover them</li>
                <li style={S.tip}>Click a theme to assign it instantly</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  root:      { display: 'flex', flexDirection: 'column', gap: '1.75rem' },
  header:    { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  badge:     { alignSelf: 'flex-start', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--lime)', background: 'var(--lime-dim)', border: '1px solid var(--lime-border)', borderRadius: 100, padding: '0.25rem 0.75rem' },
  sub:       { fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 520 },
  center:    { display: 'flex', justifyContent: 'center', paddingTop: '2rem' },
  layout:    { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' },
  right:     { position: 'sticky', top: '4.5rem' },
  readyCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', alignItems: 'flex-start' },
  readyIcon: { width: 36, height: 36, borderRadius: '50%', background: 'var(--lime-dim)', border: '1px solid var(--lime-border)', color: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' },
  readyTitle:{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' },
  readyDesc: { fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 },
  btn:       { width: '100%', background: 'var(--lime)', color: '#0d0d0d', border: 'none', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', padding: '0.75rem', cursor: 'pointer', letterSpacing: '-0.01em' },
  tips:      { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem', width: '100%' },
  tip:       { fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '0.1rem' },
}