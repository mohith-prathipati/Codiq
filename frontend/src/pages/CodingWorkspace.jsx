import { useState, useRef, useEffect } from 'react'

const SENTIMENTS = ['Positive', 'Negative', 'Mixed']
const SENT_COLOR = { Positive: '#4ade80', Negative: '#f87171', Mixed: '#fbbf24' }
const MAX_CODES  = 4

const NET_OPTIONS = [
  { net: 100,  label: 'NET 100 — Core Attributes (Positive)' },
  { net: 200,  label: 'NET 200 — Functional Benefits' },
  { net: 300,  label: 'NET 300 — Emotional Benefits' },
  { net: 400,  label: 'NET 400 — Brand & Trust' },
  { net: 500,  label: 'NET 500 — Design & Aesthetics' },
  { net: 600,  label: 'NET 600 — Value & Pricing' },
  { net: 700,  label: 'NET 700 — Naming Issues' },
  { net: 800,  label: 'NET 800 — Functional Concerns' },
  { net: 900,  label: 'NET 900 — Emotional Concerns' },
  { net: 1000, label: 'NET 1000 — Brand Concerns' },
  { net: 1200, label: 'NET 1200 — General Negative' },
  { net: 1400, label: 'NET 1400 — Audience Issues' },
]
const NET_NAMES = Object.fromEntries(NET_OPTIONS.map(n => [n.net, n.label.split(' — ')[1]]))

export default function CodingWorkspace({
  mode, responses, setResponses, codebook, setCodebook, fileData, onExport
}) {
  const [selIdx,      setSelIdx]      = useState(0)
  const [search,      setSearch]      = useState('')
  const [statusFilt,  setStatusFilt]  = useState('all')
  const [collapsedNets, setCollapsedNets] = useState({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [addNet,      setAddNet]      = useState(200)
  const [addTheme,    setAddTheme]    = useState('')
  const [addDesc,     setAddDesc]     = useState('')
  const [addErr,      setAddErr]      = useState('')
  const themeRef = useRef()
  const selRowRef = useRef()

  const isAuto = mode === 'automated'

  // ── Filtered responses ────────────────────────────────────
  const filtered = responses
    .map((r, i) => ({ ...r, _orig: i }))
    .filter(r => {
      const q = search.toLowerCase()
      const matchSearch = !q || r.verbatim.toLowerCase().includes(q) || String(r.respid).includes(q)
      const matchStatus =
        statusFilt === 'coded'   ? r.codes.length > 0 :
        statusFilt === 'uncoded' ? r.codes.length === 0 : true
      return matchSearch && matchStatus
    })

  const selected = filtered[selIdx] || null
  const coded    = responses.filter(r => r.codes.length > 0).length
  const total    = responses.length

  // Scroll selected row into view
  useEffect(() => {
    selRowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selIdx])

  // ── Code usage counts ────────────────────────────────────
  const codeCounts = {}
  responses.forEach(r => r.codes.forEach(c => { codeCounts[c] = (codeCounts[c] || 0) + 1 }))

  // ── Codebook grouped by NET ───────────────────────────────
  const grouped = codebook.reduce((acc, t) => {
    if (!acc[t.net]) acc[t.net] = { net_name: t.net_name || NET_NAMES[t.net] || '', themes: [] }
    acc[t.net].themes.push(t)
    return acc
  }, {})

  // ── Actions ───────────────────────────────────────────────
  const toggleCode = (code) => {
    if (!selected) return
    const idx = selected._orig
    setResponses(prev => prev.map((r, i) => {
      if (i !== idx) return r
      const has = r.codes.includes(code)
      if (has) return { ...r, codes: r.codes.filter(c => c !== code) }
      if (r.codes.length >= MAX_CODES) return r
      return { ...r, codes: [...r.codes, code] }
    }))
  }

  const setSentiment = (sent) => {
    if (!selected) return
    setResponses(prev => prev.map((r, i) =>
      i === selected._orig ? { ...r, sentiment: r.sentiment === sent ? '' : sent } : r
    ))
  }

  const nextCode = (net) => {
    const used = codebook.filter(t => Math.floor(t.code / 100) * 100 === net).map(t => t.code)
    let n = net + 1; while (used.includes(n)) n++; return n
  }

  const addThemeToCodebook = () => {
    if (!addTheme.trim()) { setAddErr('Theme name required'); return }
    setAddErr('')
    const net  = Number(addNet)
    const code = nextCode(net)
    setCodebook(cb => [...cb, {
      net, net_name: NET_NAMES[net] || '', code,
      theme: addTheme.trim(), description: addDesc.trim(),
    }].sort((a, b) => a.code - b.code))
    setAddTheme(''); setAddDesc('')
    setShowAddForm(false)
  }

  const deleteTheme = (code) => {
    setCodebook(cb => cb.filter(t => t.code !== code))
    setResponses(rs => rs.map(r => ({ ...r, codes: r.codes.filter(c => c !== code) })))
  }

  const toggleNet = (net) =>
    setCollapsedNets(prev => ({ ...prev, [net]: !prev[net] }))

  const codeName = (code) => codebook.find(t => t.code === code)?.theme || String(code)

  return (
    <div style={S.root}>

      {/* ══ TOP BAR ════════════════════════════════════════════ */}
      <div style={S.topbar}>
        <div style={S.topLeft}>
          {/* Response counter */}
          <div style={S.counter}>
            <span style={S.counterNum}>{filtered.length > 0 ? selIdx + 1 : 0}</span>
            <span style={S.counterSep}>/</span>
            <span style={S.counterNum}>{total}</span>
            <span style={S.counterLbl}>Responses</span>
          </div>
          <div style={S.topDivider} />
          <div style={S.counter}>
            <span style={{ ...S.counterNum, color: '#4ade80' }}>{coded}</span>
            <span style={S.counterSep}>/</span>
            <span style={S.counterNum}>{total}</span>
            <span style={S.counterLbl}>Coded</span>
            <span style={{ ...S.counterPct, color: coded/total > 0.8 ? '#4ade80' : coded/total > 0.4 ? '#fbbf24' : '#f87171' }}>
              ({total ? Math.round(coded/total*100) : 0}%)
            </span>
          </div>
          <div style={S.topDivider} />
          {/* Filter tabs */}
          <div style={S.filterTabs}>
            {[['all','All'],['coded','Coded'],['uncoded','Uncoded']].map(([k,l]) => (
              <button key={k}
                style={{ ...S.filterTab, ...(statusFilt === k ? S.filterTabOn : {}) }}
                onClick={() => { setStatusFilt(k); setSelIdx(0) }}>
                {l}
              </button>
            ))}
          </div>
          {/* Search */}
          <input style={S.searchInput} placeholder="Search responses…"
            value={search} onChange={e => { setSearch(e.target.value); setSelIdx(0) }} />
        </div>
        <div style={S.topRight}>
          <button style={S.exportBtn} onClick={onExport}>⬇ Export Excel</button>
        </div>
      </div>

      {/* ══ MAIN 2-COLUMN LAYOUT ══════════════════════════════ */}
      <div style={S.body}>

        {/* ── LEFT: Response list ─────────────────────────────── */}
        <div style={S.leftPanel}>
          {filtered.length === 0 && (
            <div style={S.emptyList}>No responses match</div>
          )}
          {filtered.map((r, i) => {
            const isSel = i === selIdx
            return (
              <div key={r._orig} ref={isSel ? selRowRef : null}
                style={{ ...S.responseItem, ...(isSel ? S.responseItemSel : {}) }}
                onClick={() => setSelIdx(i)}>

                {/* Row header */}
                <div style={S.respHeader}>
                  <span style={S.respMeta}>{r.qid?.slice(0,40) || 'Q'}</span>
                  <span style={S.respId}>{r.respid}</span>
                  {r.sentiment && (
                    <span style={{ ...S.respSentBadge, color: SENT_COLOR[r.sentiment], borderColor: SENT_COLOR[r.sentiment] + '44' }}>
                      {r.sentiment}
                    </span>
                  )}
                </div>

                {/* Verbatim */}
                <div style={S.respText}>{r.verbatim}</div>

                {/* Assigned codes — shown below verbatim like Ascribe */}
                {r.codes.length > 0 && (
                  <div style={S.respCodes}>
                    {r.codes.map(c => (
                      <div key={c} style={S.respCodeRow}>
                        <span style={S.respCodeIcon}>▸</span>
                        <span style={S.respCodeNum}>{c}</span>
                        <span style={S.respCodeName}>{codeName(c)}</span>
                        {isSel && (
                          <button style={S.respCodeRemove}
                            onClick={e => { e.stopPropagation(); toggleCode(c) }}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── RIGHT: Codebook panel ───────────────────────────── */}
        <div style={S.rightPanel}>

          {/* Codebook header */}
          <div style={S.cbHeader}>
            <div style={S.cbHeaderLeft}>
              <span style={S.cbTitle}>Codebook</span>
              <span style={S.cbTotal}>{coded}/{total} Responses coded ({total ? Math.round(coded/total*100) : 0}%)</span>
            </div>
            <button style={S.addThemeBtn} onClick={() => { setShowAddForm(v => !v); setTimeout(() => themeRef.current?.focus(), 50) }}>
              {showAddForm ? '✕ Cancel' : '+ Add Theme'}
            </button>
          </div>

          {/* Add theme form — inline, appears below header */}
          {showAddForm && (
            <div style={S.addForm}>
              <select style={S.addSelect} value={addNet} onChange={e => setAddNet(Number(e.target.value))}>
                {NET_OPTIONS.map(n => <option key={n.net} value={n.net}>{n.label}</option>)}
              </select>
              <input ref={themeRef} style={S.addInput}
                placeholder="Theme name  e.g. Zero Sugar Content"
                value={addTheme} onChange={e => setAddTheme(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addThemeToCodebook()} />
              <input style={{ ...S.addInput, fontSize: '0.75rem', color: '#888' }}
                placeholder="Description (optional)"
                value={addDesc} onChange={e => setAddDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addThemeToCodebook()} />
              {addErr && <div style={S.addErr}>{addErr}</div>}
              <button style={S.addSubmit} onClick={addThemeToCodebook}>Add Theme</button>
            </div>
          )}

          {/* Sentiment selector for selected response */}
          {selected && (
            <div style={S.sentSection}>
              <span style={S.sentLabel}>Sentiment:</span>
              {SENTIMENTS.map(s => (
                <button key={s} style={{
                  ...S.sentBtn,
                  ...(selected.sentiment === s ? {
                    background: SENT_COLOR[s] + '22',
                    border: `1px solid ${SENT_COLOR[s]}88`,
                    color: SENT_COLOR[s],
                    fontWeight: 600,
                  } : {})
                }} onClick={() => setSentiment(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Codebook tree */}
          <div style={S.cbTree}>
            {Object.keys(grouped).length === 0 && (
              <div style={S.cbEmpty}>
                {isAuto
                  ? 'Codebook loading…'
                  : 'No themes yet — click "+ Add Theme" to create your first theme'}
              </div>
            )}

            {Object.entries(grouped).sort((a,b) => Number(a[0])-Number(b[0])).map(([net, { net_name, themes }]) => {
              const isCollapsed = collapsedNets[net]
              // Count how many responses have any code in this NET
              const netCodes   = themes.map(t => t.code)
              const netCount   = responses.filter(r => r.codes.some(c => netCodes.includes(c))).length
              const netPct     = total ? Math.round(netCount/total*100) : 0

              return (
                <div key={net} style={S.netBlock}>
                  {/* NET header row */}
                  <div style={S.netRow} onClick={() => toggleNet(net)}>
                    <span style={S.netToggle}>{isCollapsed ? '▶' : '▼'}</span>
                    <span style={S.netPlus}>+</span>
                    <span style={S.netName}>{net_name} (Net)</span>
                    {netCount > 0 && (
                      <span style={S.netCount}>{netCount} ({netPct}%)</span>
                    )}
                  </div>

                  {/* Theme rows */}
                  {!isCollapsed && themes.map(t => {
                    const isAssigned = selected?.codes.includes(t.code)
                    const isMaxed    = selected?.codes.length >= MAX_CODES && !isAssigned
                    const count      = codeCounts[t.code] || 0
                    const pct        = total ? Math.round(count/total*100) : 0

                    return (
                      <div key={t.code}
                        style={{
                          ...S.themeRow,
                          ...(isAssigned ? S.themeRowAssigned : {}),
                          ...(isMaxed    ? S.themeRowMaxed    : {}),
                        }}
                        onClick={() => !isMaxed && toggleCode(t.code)}
                        title={t.description || t.theme}
                      >
                        <span style={S.themePlus}>+</span>
                        <span style={S.themeCode}>{t.code}</span>
                        <span style={S.themeName}>{t.theme}</span>
                        {count > 0 && (
                          <span style={S.themeCount}>{count} ({pct}%)</span>
                        )}
                        {isAssigned && <span style={S.assignedCheck}>✓</span>}
                        <button style={S.themeDelete}
                          onClick={e => { e.stopPropagation(); deleteTheme(t.code) }}
                          title="Delete theme">✕</button>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────
const S = {
  root: {
    display: 'flex', flexDirection: 'column',
    height: 'calc(100vh - 56px)', overflow: 'hidden',
    background: '#f5f5f0',   // light background like Ascribe
    color: '#1a1a1a',
    fontFamily: 'var(--font-body)',
  },

  // ── Top bar ──
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 1rem', height: 42,
    background: '#1a1a1a', borderBottom: '1px solid #333',
    flexShrink: 0,
  },
  topLeft:    { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  topRight:   { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  topDivider: { width: 1, height: 20, background: '#333' },

  counter:    { display: 'flex', alignItems: 'center', gap: '0.2rem' },
  counterNum: { fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: '#f0f0f0' },
  counterSep: { color: '#555', fontSize: '0.78rem' },
  counterLbl: { fontSize: '0.68rem', color: '#888', marginLeft: '0.25rem' },
  counterPct: { fontSize: '0.68rem', fontWeight: 600, marginLeft: '0.15rem' },

  filterTabs: { display: 'flex', gap: 2 },
  filterTab:  { background: 'none', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: '0.68rem', fontWeight: 600, padding: '0.18rem 0.55rem', cursor: 'pointer', fontFamily: 'var(--font-body)' },
  filterTabOn:{ background: '#c8ff00', border: '1px solid #c8ff00', color: '#0d0d0d' },

  searchInput:{ background: '#2a2a2a', border: '1px solid #333', borderRadius: 4, color: '#f0f0f0', fontSize: '0.75rem', fontFamily: 'var(--font-body)', padding: '0.22rem 0.6rem', outline: 'none', width: 180 },

  exportBtn:  { background: '#c8ff00', color: '#0d0d0d', border: 'none', borderRadius: 4, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', padding: '0.3rem 0.9rem', cursor: 'pointer' },

  // ── Main body ──
  body: {
    display: 'grid', gridTemplateColumns: '1fr 420px',
    flex: 1, overflow: 'hidden',
  },

  // ── Left: response list ──
  leftPanel: {
    overflowY: 'auto',
    borderRight: '1px solid #ddd',
    background: '#ffffff',
  },
  emptyList: { padding: '2rem', textAlign: 'center', fontSize: '0.82rem', color: '#999' },

  responseItem: {
    padding: '0.6rem 0.85rem',
    borderBottom: '1px solid #ebebeb',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  responseItemSel: {
    background: '#f0f7ff',
    borderLeft: '3px solid #2563eb',
    paddingLeft: 'calc(0.85rem - 3px)',
  },

  respHeader: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' },
  respMeta:   { fontSize: '0.68rem', color: '#888', fontWeight: 500 },
  respId:     { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#aaa', background: '#f5f5f5', borderRadius: 3, padding: '0.05rem 0.3rem' },
  respSentBadge: { fontSize: '0.6rem', fontWeight: 600, border: '1px solid', borderRadius: 100, padding: '0.05rem 0.4rem', marginLeft: 'auto' },

  respText:   { fontSize: '0.82rem', color: '#1a1a1a', lineHeight: 1.5 },

  respCodes:    { marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' },
  respCodeRow:  { display: 'flex', alignItems: 'center', gap: '0.35rem', paddingLeft: '0.5rem' },
  respCodeIcon: { fontSize: '0.6rem', color: '#2563eb' },
  respCodeNum:  { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, color: '#2563eb', minWidth: 28 },
  respCodeName: { fontSize: '0.72rem', color: '#444', fontStyle: 'italic' },
  respCodeRemove:{ background: 'none', border: 'none', color: '#ccc', fontSize: '0.6rem', cursor: 'pointer', padding: '0 0.1rem', marginLeft: 'auto' },

  // ── Right: codebook ──
  rightPanel: {
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', background: '#fafafa',
  },

  cbHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.55rem 0.85rem',
    background: '#efefef', borderBottom: '1px solid #ddd',
    flexShrink: 0,
  },
  cbHeaderLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  cbTitle:  { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: '#1a1a1a' },
  cbTotal:  { fontSize: '0.68rem', color: '#666', background: '#e0e0e0', borderRadius: 3, padding: '0.12rem 0.5rem' },
  addThemeBtn: { background: '#1a1a1a', color: '#c8ff00', border: 'none', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.75rem', cursor: 'pointer', fontFamily: 'var(--font-body)' },

  addForm: {
    padding: '0.75rem', borderBottom: '1px solid #ddd',
    background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0,
  },
  addSelect:  { background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 4, color: '#1a1a1a', fontSize: '0.75rem', fontFamily: 'var(--font-body)', padding: '0.4rem 0.55rem', outline: 'none' },
  addInput:   { background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 4, color: '#1a1a1a', fontSize: '0.82rem', fontFamily: 'var(--font-body)', padding: '0.4rem 0.55rem', outline: 'none' },
  addErr:     { fontSize: '0.72rem', color: '#dc2626' },
  addSubmit:  { background: '#1a1a1a', color: '#c8ff00', border: 'none', borderRadius: 4, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.78rem', padding: '0.45rem', cursor: 'pointer' },

  sentSection: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.45rem 0.85rem', borderBottom: '1px solid #ddd',
    background: '#fff', flexShrink: 0,
  },
  sentLabel: { fontSize: '0.7rem', fontWeight: 600, color: '#666' },
  sentBtn:   { background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 4, color: '#444', fontSize: '0.72rem', fontWeight: 500, padding: '0.22rem 0.65rem', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.12s' },

  cbTree:  { flex: 1, overflowY: 'auto' },
  cbEmpty: { padding: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#999', lineHeight: 1.6 },

  // NET rows — like Ascribe's collapsible sections
  netBlock: {},
  netRow:   {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.42rem 0.85rem',
    background: '#ececec', borderBottom: '1px solid #ddd',
    cursor: 'pointer', userSelect: 'none',
    position: 'sticky', top: 0, zIndex: 1,
  },
  netToggle: { fontSize: '0.55rem', color: '#666', width: 10, flexShrink: 0 },
  netPlus:   { fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, flexShrink: 0 },
  netName:   { fontSize: '0.78rem', fontWeight: 700, color: '#1a1a1a', flex: 1 },
  netCount:  { fontSize: '0.68rem', color: '#666', fontFamily: 'var(--font-mono)' },

  // Theme rows — like Ascribe's code list
  themeRow: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.35rem 0.85rem 0.35rem 1.75rem',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer', transition: 'background 0.1s',
    background: '#fff',
  },
  themeRowAssigned: {
    background: '#eff6ff',
    borderLeft: '2px solid #2563eb',
    paddingLeft: 'calc(1.75rem - 2px)',
  },
  themeRowMaxed: { opacity: 0.4, cursor: 'not-allowed' },

  themePlus: { fontSize: '0.65rem', color: '#2563eb', fontWeight: 700, flexShrink: 0 },
  themeCode: { fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: '#444', minWidth: 32, flexShrink: 0 },
  themeName: { flex: 1, fontSize: '0.78rem', color: '#1a1a1a' },
  themeCount:{ fontSize: '0.65rem', color: '#888', fontFamily: 'var(--font-mono)', marginLeft: 'auto', flexShrink: 0 },
  assignedCheck: { fontSize: '0.65rem', color: '#2563eb', fontWeight: 700, flexShrink: 0 },
  themeDelete:   { background: 'none', border: 'none', color: '#ccc', fontSize: '0.6rem', cursor: 'pointer', padding: '0 0.1rem', flexShrink: 0, opacity: 0 },
}