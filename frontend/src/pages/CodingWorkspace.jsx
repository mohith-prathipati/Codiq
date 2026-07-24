import { useState, useRef } from 'react'

export default function ProjectDashboard({ project, onRename, onUpload, onOpenQuestion, onDeleteQuestion, onMerge }) {
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState([])     // selected question ids for merge
  const [ctxMenu,  setCtxMenu]  = useState(null)    // { x, y, qId }
  const [editingName, setEditingName] = useState(!project.name)
  const [nameInput, setNameInput] = useState(project.name)
  const fileRef = useRef()

  const isManual = project.mode === 'manual'

  const handleFiles = (files) => {
    Array.from(files).forEach(f => {
      if (f.name.match(/\.(xlsx|xls)$/i)) onUpload(f)
    })
  }

  const toggleSelect = (qId, e) => {
    e.stopPropagation()
    setSelected(s => s.includes(qId) ? s.filter(x => x !== qId) : [...s, qId])
  }

  const saveName = () => { onRename(nameInput.trim() || 'Untitled Project'); setEditingName(false) }

  // Close ctx menu on click
  const closeCtx = () => setCtxMenu(null)

  return (
    <div style={S.root} onClick={closeCtx}>

      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <span style={{ ...S.modeBadge, ...(isManual ? S.badgeManual : S.badgeAuto) }}>
            {isManual ? '✍️ Manual' : '⚡ Automated'}
          </span>
          {editingName ? (
            <input autoFocus style={S.nameInput} value={nameInput}
              placeholder="Project name…"
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              onBlur={saveName} />
          ) : (
            <h1 style={S.projectName} onClick={() => setEditingName(true)}>
              {project.name || 'Untitled Project'} <span style={S.editHint}>✎</span>
            </h1>
          )}
        </div>
        <div style={S.headerRight}>
          {selected.length >= 2 && (
            <button style={S.mergeBtn} onClick={() => { onMerge(selected); setSelected([]) }}>
              ⧉ Merge {selected.length} into shared codebook
            </button>
          )}
          <button style={S.addBtn} onClick={() => fileRef.current?.click()}>+ Add Question</button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" multiple style={{ display:'none' }}
            onChange={e => handleFiles(e.target.files)} />
        </div>
      </div>

      <p style={S.subtitle}>
        {isManual
          ? 'Add question files, then open each one to build its codebook and code responses.'
          : 'Add question files, then open each to run AI coding. Select 2+ similar questions to share one codebook.'}
      </p>

      {/* Empty / upload zone */}
      {project.questions.length === 0 ? (
        <div style={{ ...S.dropZone, ...(dragging ? S.dropZoneOn : {}) }}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}>
          <div style={S.dropIcon}>📁</div>
          <div style={S.dropTitle}>Drop question files here</div>
          <div style={S.dropSub}>One Excel file per question · you can add several</div>
          <div style={S.dropChip}>.xlsx · .xls</div>
        </div>
      ) : (
        <>
          {/* Merge hint */}
          {selected.length > 0 && (
            <div style={S.selectBar}>
              {selected.length} selected
              {selected.length >= 2 ? ' — click Merge to share a codebook' : ' — select one more to merge'}
              <button style={S.clearSel} onClick={() => setSelected([])}>Clear</button>
            </div>
          )}

          {/* Question grid */}
          <div style={S.grid}>
            {project.questions.map(q => {
              const isSel = selected.includes(q.id)
              const inGroup = q.sharedGroup
              return (
                <div key={q.id}
                  style={{ ...S.card, ...(isSel ? S.cardSel : {}) }}
                  onClick={() => onOpenQuestion(q.id)}
                  onContextMenu={e => { e.preventDefault(); setCtxMenu({ x:e.clientX, y:e.clientY, qId:q.id }) }}>

                  {/* checkbox */}
                  <div style={S.cardTop}>
                    <button style={{ ...S.checkbox, ...(isSel ? S.checkboxOn : {}) }}
                      onClick={e => toggleSelect(q.id, e)}>
                      {isSel ? '✓' : ''}
                    </button>
                    <span style={S.fileIcon}>📄</span>
                    {inGroup && <span style={S.sharedTag}>⧉ shared</span>}
                    {q.coded && <span style={S.codedTag}>✓ coded</span>}
                  </div>

                  <div style={S.cardTitle}>{q.qid}</div>
                  <div style={S.cardQuestion}>{q.question || q.filename}</div>

                  <div style={S.cardMeta}>
                    <span style={S.metaBadge}>{q.total?.toLocaleString()} responses</span>
                    {q.codebook.length > 0 && <span style={S.metaBadge}>{q.codebook.length} themes</span>}
                  </div>

                  <div style={S.cardCta}>
                    {project.mode === 'automated' && !q.coded ? '⚡ Run AI Coding →' : 'Open Codebook →'}
                  </div>
                </div>
              )
            })}

            {/* Add more card */}
            <div style={S.addCard} onClick={() => fileRef.current?.click()}>
              <div style={S.addCardIcon}>+</div>
              <div style={S.addCardText}>Add Question</div>
            </div>
          </div>
        </>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <div style={{ ...S.ctx, top:ctxMenu.y, left:ctxMenu.x }} onClick={e => e.stopPropagation()}>
          <button style={S.ctxItem} onClick={() => { onOpenQuestion(ctxMenu.qId); setCtxMenu(null) }}>
            📖 Open Codebook
          </button>
          <button style={S.ctxItem} onClick={() => {
            setSelected(s => s.includes(ctxMenu.qId) ? s : [...s, ctxMenu.qId]); setCtxMenu(null)
          }}>
            ⧉ Select for merge
          </button>
          <div style={S.ctxDiv} />
          <button style={{ ...S.ctxItem, color:'#dc2626' }}
            onClick={() => { onDeleteQuestion(ctxMenu.qId); setCtxMenu(null) }}>
            ✕ Remove Question
          </button>
        </div>
      )}
    </div>
  )
}

const S = {
  root: { paddingTop:'0.5rem' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', marginBottom:'0.5rem' },
  headerLeft: { display:'flex', alignItems:'center', gap:'0.85rem' },
  modeBadge: { fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', padding:'0.25rem 0.7rem', borderRadius:100 },
  badgeManual: { color:'var(--lime)', background:'var(--lime-dim)', border:'1px solid var(--lime-border)' },
  badgeAuto: { color:'var(--purple)', background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)' },
  projectName: { fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.02em', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem' },
  editHint: { fontSize:'0.85rem', color:'var(--text-muted)' },
  nameInput: { fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, background:'var(--bg-input)', border:'1px solid var(--lime-border)', borderRadius:'var(--r-sm)', color:'var(--text-primary)', padding:'0.2rem 0.6rem', outline:'none', letterSpacing:'-0.02em' },
  headerRight: { display:'flex', alignItems:'center', gap:'0.6rem' },
  mergeBtn: { background:'var(--purple)', color:'#fff', border:'none', borderRadius:'var(--r-md)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.78rem', padding:'0.55rem 1rem', cursor:'pointer' },
  addBtn: { background:'var(--lime)', color:'#0d0d0d', border:'none', borderRadius:'var(--r-md)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.82rem', padding:'0.55rem 1.1rem', cursor:'pointer' },
  subtitle: { fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'2rem' },

  dropZone: { border:'2px dashed var(--border-md)', borderRadius:'var(--r-xl)', padding:'4rem 2rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem', cursor:'pointer', background:'var(--bg-card)', transition:'all 0.2s' },
  dropZoneOn: { borderColor:'var(--lime)', background:'var(--bg-selected)' },
  dropIcon: { fontSize:'2.5rem', marginBottom:'0.5rem' },
  dropTitle: { fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:600, color:'var(--text-primary)' },
  dropSub: { fontSize:'0.8rem', color:'var(--text-muted)' },
  dropChip: { marginTop:'0.5rem', padding:'0.2rem 0.7rem', background:'var(--bg-input)', border:'1px solid var(--border-md)', borderRadius:100, fontSize:'0.68rem', fontFamily:'var(--font-mono)', color:'var(--text-secondary)' },

  selectBar: { display:'flex', alignItems:'center', gap:'0.75rem', background:'var(--bg-card)', border:'1px solid var(--lime-border)', borderRadius:'var(--r-md)', padding:'0.6rem 1rem', marginBottom:'1rem', fontSize:'0.8rem', color:'var(--text-primary)' },
  clearSel: { marginLeft:'auto', background:'none', border:'1px solid var(--border-md)', borderRadius:'var(--r-sm)', color:'var(--text-secondary)', fontSize:'0.72rem', padding:'0.25rem 0.6rem', cursor:'pointer' },

  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'1rem' },
  card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'1.25rem', cursor:'pointer', display:'flex', flexDirection:'column', gap:'0.5rem', transition:'border-color 0.15s' },
  cardSel: { border:'1px solid var(--lime)', background:'var(--bg-selected)' },
  cardTop: { display:'flex', alignItems:'center', gap:'0.5rem' },
  checkbox: { width:20, height:20, borderRadius:5, border:'1px solid var(--border-md)', background:'var(--bg-input)', color:'#0d0d0d', fontSize:'0.7rem', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  checkboxOn: { background:'var(--lime)', border:'1px solid var(--lime)' },
  fileIcon: { fontSize:'1.1rem' },
  sharedTag: { marginLeft:'auto', fontSize:'0.62rem', fontWeight:600, color:'var(--purple)', background:'rgba(167,139,250,0.1)', borderRadius:100, padding:'0.1rem 0.5rem' },
  codedTag: { marginLeft:'auto', fontSize:'0.62rem', fontWeight:600, color:'var(--lime)', background:'var(--lime-dim)', borderRadius:100, padding:'0.1rem 0.5rem' },
  cardTitle: { fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.95rem', color:'var(--text-primary)' },
  cardQuestion: { fontSize:'0.78rem', color:'var(--text-secondary)', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', minHeight:'2.3em' },
  cardMeta: { display:'flex', gap:'0.4rem', flexWrap:'wrap' },
  metaBadge: { fontSize:'0.65rem', color:'var(--text-secondary)', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:100, padding:'0.12rem 0.55rem' },
  cardCta: { fontSize:'0.75rem', fontWeight:600, color:'var(--lime)', marginTop:'0.35rem' },

  addCard: { border:'2px dashed var(--border-md)', borderRadius:'var(--r-lg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.4rem', cursor:'pointer', minHeight:160, color:'var(--text-muted)', transition:'border-color 0.15s' },
  addCardIcon: { fontSize:'1.8rem', fontWeight:300 },
  addCardText: { fontSize:'0.8rem', fontWeight:500 },

  ctx: { position:'fixed', background:'var(--bg-card)', border:'1px solid var(--border-md)', borderRadius:'var(--r-md)', boxShadow:'0 8px 30px rgba(0,0,0,0.4)', zIndex:500, minWidth:180, overflow:'hidden' },
  ctxItem: { display:'block', width:'100%', background:'none', border:'none', textAlign:'left', padding:'0.6rem 1rem', fontSize:'0.8rem', color:'var(--text-primary)', cursor:'pointer', fontFamily:'var(--font-body)' },
  ctxDiv: { height:1, background:'var(--border)', margin:'0.2rem 0' },
}