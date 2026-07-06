import { useState } from 'react'

const NET_OPTIONS = [
  { net: 100, label: '100 — Core Product Attributes (Positive)' },
  { net: 200, label: '200 — Functional Benefits' },
  { net: 300, label: '300 — Emotional & Experiential Benefits' },
  { net: 400, label: '400 — Brand & Trust' },
  { net: 500, label: '500 — Design & Aesthetics' },
  { net: 600, label: '600 — Value & Pricing' },
  { net: 700, label: '700 — Naming & Communication Issues' },
  { net: 800, label: '800 — Functional Concerns' },
  { net: 900, label: '900 — Emotional Concerns' },
  { net: 1000,label: '1000 — Brand & Trust Concerns' },
  { net: 1200,label: '1200 — General Negative Sentiment' },
  { net: 1400,label: '1400 — Target Audience Issues' },
]

const NET_NAMES = Object.fromEntries(NET_OPTIONS.map(n => [n.net, n.label.split(' — ')[1]]))

export default function CodebookBuilder({ codebook, setCodebook }) {
  const [form,    setForm]    = useState({ net: 200, theme: '', description: '' })
  const [editIdx, setEditIdx] = useState(null)
  const [error,   setError]   = useState('')

  const nextCode = (net) => {
    const existing = codebook.filter(t => t.net === net).map(t => t.code)
    let n = net + 1
    while (existing.includes(n)) n++
    return n
  }

  const handleAdd = () => {
    if (!form.theme.trim()) { setError('Theme name is required.'); return }
    setError('')
    if (editIdx !== null) {
      setCodebook(cb => cb.map((t, i) => i === editIdx ? { ...t, net: Number(form.net), net_name: NET_NAMES[form.net], theme: form.theme.trim(), description: form.description.trim() } : t))
      setEditIdx(null)
    } else {
      const code = nextCode(Number(form.net))
      setCodebook(cb => [...cb, { net: Number(form.net), net_name: NET_NAMES[form.net] || '', code, theme: form.theme.trim(), description: form.description.trim() }].sort((a,b) => a.code - b.code))
    }
    setForm({ net: 200, theme: '', description: '' })
  }

  const handleEdit = (i) => {
    const t = codebook[i]
    setForm({ net: t.net, theme: t.theme, description: t.description || '' })
    setEditIdx(i)
  }

  const handleDelete = (i) => {
    setCodebook(cb => cb.filter((_, idx) => idx !== i))
    if (editIdx === i) { setEditIdx(null); setForm({ net: 200, theme: '', description: '' }) }
  }

  const grouped = codebook.reduce((acc, t) => {
    if (!acc[t.net]) acc[t.net] = { net_name: t.net_name, themes: [] }
    acc[t.net].themes.push(t)
    return acc
  }, {})

  return (
    <div style={S.card}>
      <div style={S.title}>Codebook Builder</div>

      {/* ── Add / Edit form ── */}
      <div style={S.form}>
        <select
          style={S.select}
          value={form.net}
          onChange={e => setForm(f => ({ ...f, net: Number(e.target.value) }))}
        >
          {NET_OPTIONS.map(n => <option key={n.net} value={n.net}>{n.label}</option>)}
        </select>

        <input
          style={S.input}
          placeholder="Theme name  e.g. Zero Sugar Content"
          value={form.theme}
          onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />

        <input
          style={{ ...S.input, fontSize:'0.78rem', color:'var(--grey-2)' }}
          placeholder="Description (optional)"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />

        {error && <div style={S.err}>{error}</div>}

        <div style={S.btnRow}>
          {editIdx !== null && (
            <button style={S.cancelBtn} onClick={() => { setEditIdx(null); setForm({ net:200, theme:'', description:'' }) }}>
              Cancel
            </button>
          )}
          <button style={S.addBtn} onClick={handleAdd}>
            {editIdx !== null ? '✓ Save Edit' : '+ Add Theme'}
          </button>
        </div>
      </div>

      {/* ── Theme list ── */}
      {codebook.length === 0 ? (
        <div style={S.empty}>No themes yet — add your first theme above</div>
      ) : (
        <div style={S.list}>
          {Object.entries(grouped).sort((a,b) => Number(a[0])-Number(b[0])).map(([net, { net_name, themes }]) => (
            <div key={net} style={S.netGroup}>
              <div style={S.netLabel}>NET {net} · {net_name}</div>
              {themes.map((t, i) => {
                const realIdx = codebook.findIndex(x => x.code === t.code)
                return (
                  <div key={t.code} style={S.themeRow}>
                    <span style={S.code}>{t.code}</span>
                    <span style={S.themeName}>{t.theme}</span>
                    <div style={S.actions}>
                      <button style={S.editBtn} onClick={() => handleEdit(realIdx)}>✎</button>
                      <button style={S.delBtn}  onClick={() => handleDelete(realIdx)}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const S = {
  card:  { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' },
  title: { fontFamily:'var(--font-display)', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--grey-3)', padding:'1.1rem 1.25rem', borderBottom:'1px solid var(--border)' },
  form:  { padding:'1.1rem 1.25rem', borderBottom:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:'0.6rem' },
  select:{ background:'var(--bg-input)', border:'1px solid var(--border-md)', borderRadius:'var(--radius-sm)', color:'var(--white)', fontSize:'0.78rem', fontFamily:'var(--font-body)', padding:'0.55rem 0.75rem', outline:'none', width:'100%' },
  input: { background:'var(--bg-input)', border:'1px solid var(--border-md)', borderRadius:'var(--radius-sm)', color:'var(--white)', fontSize:'0.85rem', fontFamily:'var(--font-body)', padding:'0.55rem 0.75rem', outline:'none', width:'100%' },
  err:   { fontSize:'0.75rem', color:'#f87171' },
  btnRow:{ display:'flex', gap:'0.5rem' },
  addBtn:{ flex:1, background:'var(--lime)', color:'#080808', border:'none', borderRadius:'var(--radius-sm)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.82rem', padding:'0.6rem', cursor:'pointer' },
  cancelBtn: { background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--grey-2)', fontFamily:'var(--font-body)', fontSize:'0.8rem', padding:'0.6rem 0.9rem', cursor:'pointer' },
  empty: { padding:'1.5rem', textAlign:'center', fontSize:'0.78rem', color:'var(--grey-3)' },
  list:  { maxHeight:320, overflowY:'auto' },
  netGroup: { padding:'0.6rem 1.25rem 0.4rem' },
  netLabel: { fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--grey-3)', marginBottom:'0.4rem', paddingBottom:'0.3rem', borderBottom:'1px solid var(--border)' },
  themeRow: { display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.35rem 0', borderBottom:'1px solid rgba(255,255,255,0.03)' },
  code:  { fontFamily:'var(--font-mono)', fontSize:'0.7rem', fontWeight:700, color:'var(--lime)', background:'var(--lime-dim)', borderRadius:5, padding:'0.15rem 0.4rem', minWidth:34, textAlign:'center' },
  themeName: { flex:1, fontSize:'0.8rem', color:'var(--grey-1)' },
  actions:   { display:'flex', gap:'0.3rem' },
  editBtn:   { background:'none', border:'1px solid var(--border)', borderRadius:5, color:'var(--grey-2)', fontSize:'0.75rem', padding:'0.2rem 0.45rem', cursor:'pointer' },
  delBtn:    { background:'none', border:'1px solid rgba(255,69,69,0.2)', borderRadius:5, color:'#f87171', fontSize:'0.72rem', padding:'0.2rem 0.45rem', cursor:'pointer' },
}