export default function Landing({ onSelect }) {
  return (
    <div style={S.root}>
      <div style={S.hero}>
        <div style={S.eyebrow}>Verbatim Coding Platform</div>
        <h1 style={S.title}>
          How would you like<br />
          to <span style={S.accent}>code today?</span>
        </h1>
        <p style={S.sub}>
          Choose your workflow. You can start a new session anytime from the home screen.
        </p>
      </div>

      <div style={S.cards}>
        <Card
          icon="✍️"
          label="Manual"
          title="Manual Coding"
          desc="Read responses and build your codebook on the fly. Create themes as you discover them, assign codes instantly — all in one unified workspace."
          features={['Unified read + code workspace', 'Create themes while reading', 'Click to assign codes instantly', 'Full editorial control']}
          cta="Start Manual Coding"
          accentColor="var(--lime)"
          accentBg="var(--lime-dim)"
          accentBorder="var(--lime-border)"
          onClick={() => onSelect('manual')}
        />
        <Card
          icon="⚡"
          label="AI-Powered"
          title="Automated Coding"
          desc="AI discovers themes, assigns codes, and pre-fills the codebook. Review and refine the results in the same workspace before exporting."
          features={['AI discovers themes automatically', 'Codes assigned to all responses', 'Review and edit AI results', 'Export when satisfied']}
          cta="Start Automated Coding"
          accentColor="var(--purple)"
          accentBg="rgba(167,139,250,0.08)"
          accentBorder="rgba(167,139,250,0.2)"
          onClick={() => onSelect('automated')}
        />
      </div>

      <p style={S.footnote}>Runs locally · No data leaves your machine · Powered by Ollama + Mistral</p>
    </div>
  )
}

function Card({ icon, label, title, desc, features, cta, accentColor, accentBg, accentBorder, onClick }) {
  return (
    <button style={S.card} onClick={onClick}>
      <div style={S.cardHead}>
        <div style={{ ...S.iconBox, background: accentBg, border: `1px solid ${accentBorder}` }}>
          <span style={S.icon}>{icon}</span>
        </div>
        <span style={{ ...S.labelBadge, color: accentColor, background: accentBg, border: `1px solid ${accentBorder}` }}>
          {label}
        </span>
      </div>

      <div style={S.cardTitle}>{title}</div>
      <p style={S.cardDesc}>{desc}</p>

      <ul style={S.feats}>
        {features.map(f => (
          <li key={f} style={S.feat}>
            <span style={{ ...S.tick, color: accentColor }}>✓</span>
            <span style={S.featText}>{f}</span>
          </li>
        ))}
      </ul>

      <div style={{ ...S.cta, color: accentColor }}>
        {cta} →
      </div>
    </button>
  )
}

const S = {
  root:  { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4rem', gap: '3rem' },
  hero:  { textAlign: 'center', maxWidth: 500 },
  eyebrow: { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' },
  title: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.9rem,4.5vw,2.8rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '1rem' },
  accent:{ color: 'var(--lime)' },
  sub:   { fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 },

  cards: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', maxWidth: 760 },

  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl)', padding: '1.75rem',
    display: 'flex', flexDirection: 'column', gap: '0.9rem',
    cursor: 'pointer', textAlign: 'left',
    fontFamily: 'var(--font-body)', transition: 'border-color 0.2s',
  },

  cardHead:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  iconBox:    { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  icon:       { fontSize: '1.2rem' },
  labelBadge: { fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.18rem 0.55rem', borderRadius: 100 },

  cardTitle: { fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  cardDesc:  { fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65 },

  feats: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  feat:  { display: 'flex', alignItems: 'flex-start', gap: '0.5rem' },
  tick:  { fontSize: '0.72rem', fontWeight: 700, marginTop: 2, flexShrink: 0 },
  featText: { fontSize: '0.8rem', color: 'var(--text-secondary)' },

  cta:   { fontSize: '0.8rem', fontWeight: 600, marginTop: '0.25rem' },

  footnote: { fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.04em' },
}