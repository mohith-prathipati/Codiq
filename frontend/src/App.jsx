import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

import Topbar from './components/Topbar'
import Landing from './pages/Landing'
import ProjectDashboard from './pages/ProjectDashboard'
import AutomatedUpload from './pages/AutomatedUpload'
import CodingWorkspace from './pages/CodingWorkspace'
import ResultsPanel from './components/ResultsPanel'

const API = '/api'
const uid = () => Math.random().toString(36).slice(2, 10)

/*
  Views:
  'landing'      → mode selection
  'project'      → project dashboard (multi-question)
  'auto_config'  → automated: topic + threshold for a question
  'auto_running' → pipeline running
  'workspace'    → coding workspace (manual empty | automated coded)

  Data model:
  project = {
    name,
    mode: 'manual' | 'automated',
    questions: [
      { id, filename, qid, question, rows:[{respid,qid,verbatim,sentiment,codes}],
        codebook:[], coded:false, path, file_id, sharedGroup: null|groupId }
    ],
    sharedCodebooks: { [groupId]: { codebook:[], questionIds:[] } }
  }
*/

export default function App() {
  const [view,     setView]     = useState('landing')
  const [project,  setProject]  = useState(null)
  const [error,    setError]    = useState(null)

  // active coding target
  const [activeQ,  setActiveQ]  = useState(null)     // question id(s) being coded
  const [activeGroup, setActiveGroup] = useState(null) // shared group id if merged

  // automated running
  const [topic,     setTopic]     = useState('')
  const [threshold, setThreshold] = useState(5)
  const [autoQid,   setAutoQid]   = useState(null)
  const [jobId,     setJobId]     = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const pollRef = useRef(null)

  // ── Mode select ───────────────────────────────────────────
  const handleMode = (mode) => {
    setProject({ name: '', mode, questions: [], sharedCodebooks: {} })
    setView('project')
  }

  // ── Upload a question file ────────────────────────────────
  const handleUploadQuestion = async (file) => {
    setError(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await axios.post(`${API}/upload`, form)
      const q = {
        id: uid(),
        filename: data.filename,
        file_id:  data.file_id,
        path:     data.path,
        qid:      data.all_rows[0]?.qid || data.filename,
        question: data.question,
        total:    data.total,
        rows: data.all_rows.map(r => ({ ...r, sentiment: '', codes: [] })),
        codebook: [],
        coded: false,
        sharedGroup: null,
      }
      setProject(p => ({ ...p, questions: [...p.questions, q] }))
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed — is the backend running?')
    }
  }

  const renameProject = (name) => setProject(p => ({ ...p, name }))
  const deleteQuestion = (qid) =>
    setProject(p => ({ ...p, questions: p.questions.filter(q => q.id !== qid) }))

  // ── Open a single question in workspace ───────────────────
  const openQuestion = (qId) => {
    const q = project.questions.find(x => x.id === qId)
    if (!q) return
    if (project.mode === 'automated' && !q.coded) {
      // Need to run pipeline first
      setAutoQid(qId); setTopic(''); setView('auto_config')
    } else {
      setActiveQ([qId]); setActiveGroup(q.sharedGroup); setView('workspace')
    }
  }

  // ── Merge multiple questions into shared codebook ─────────
  const mergeQuestions = (qIds) => {
    if (qIds.length < 2) return
    const groupId = uid()
    // Combine existing codebooks (dedupe by code)
    const merged = []
    const seen = new Set()
    qIds.forEach(id => {
      const q = project.questions.find(x => x.id === id)
      q?.codebook.forEach(t => { if (!seen.has(t.code)) { seen.add(t.code); merged.push(t) } })
    })
    setProject(p => ({
      ...p,
      questions: p.questions.map(q => qIds.includes(q.id) ? { ...q, sharedGroup: groupId } : q),
      sharedCodebooks: { ...p.sharedCodebooks, [groupId]: { codebook: merged, questionIds: qIds } },
    }))
    setActiveQ(qIds); setActiveGroup(groupId); setView('workspace')
  }

  // ── Automated: run pipeline for autoQid ───────────────────
  const handleAutoRun = async () => {
    const q = project.questions.find(x => x.id === autoQid)
    if (!q || !topic.trim()) return
    setError(null); setView('auto_running')
    setJobStatus({ status:'queued', stage:'Queued', progress:0, log:[], stats:{}, codebook:[], all_rows:[] })
    const form = new FormData()
    form.append('file_path', q.path)
    form.append('topic', topic.trim())
    form.append('min_threshold', threshold)
    form.append('rows_json', JSON.stringify(q.rows.map(r => ({ respid:r.respid, qid:r.qid, verbatim:r.verbatim }))))
    try {
      const { data } = await axios.post(`${API}/run`, form)
      setJobId(data.job_id)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to start pipeline.')
      setView('project')
    }
  }

  // ── Poll ──────────────────────────────────────────────────
  useEffect(() => {
    if (!jobId) return
    const poll = async () => {
      try {
        const { data } = await axios.get(`${API}/status/${jobId}`)
        setJobStatus(data)
        if (data.status === 'done') {
          clearInterval(pollRef.current)
          // Write coded rows + codebook back into the question
          setProject(p => ({
            ...p,
            questions: p.questions.map(q => q.id === autoQid ? {
              ...q,
              rows: (data.all_rows || []).map(r => ({
                respid:r.respid, qid:r.qid, verbatim:r.verbatim,
                sentiment:r.sentiment || '', codes:r.codes || [],
              })),
              codebook: data.codebook || [],
              coded: true,
            } : q),
          }))
          setActiveQ([autoQid]); setActiveGroup(null); setView('workspace')
        } else if (['cancelled','error'].includes(data.status)) {
          setError('Pipeline failed or cancelled.')
          setView('project'); clearInterval(pollRef.current)
        }
      } catch { clearInterval(pollRef.current) }
    }
    pollRef.current = setInterval(poll, 1200); poll()
    return () => clearInterval(pollRef.current)
  }, [jobId])

  // ── Workspace read/write helpers ──────────────────────────
  // Returns the responses + codebook for the active target (single or merged)
  const getActiveData = () => {
    if (!project || !activeQ) return { responses: [], codebook: [], setResponses: () => {}, setCodebook: () => {}, question: '' }

    if (activeGroup) {
      // Merged: combine rows from all questions in group, shared codebook
      const qs = project.questions.filter(q => activeQ.includes(q.id))
      const responses = qs.flatMap(q => q.rows)
      const codebook  = project.sharedCodebooks[activeGroup]?.codebook || []
      const question  = qs.map(q => q.question).join('  |  ')

      const setResponses = (updater) => {
        setProject(p => {
          const newRows = typeof updater === 'function'
            ? updater(qs.flatMap(q => q.rows))
            : updater
          // Split back to questions by respid+qid match
          return {
            ...p,
            questions: p.questions.map(q => {
              if (!activeQ.includes(q.id)) return q
              const mine = newRows.filter(r => q.rows.some(x => x.respid === r.respid && x.qid === r.qid))
              return { ...q, rows: mine }
            }),
          }
        })
      }
      const setCodebook = (updater) => {
        setProject(p => {
          const cb = typeof updater === 'function' ? updater(p.sharedCodebooks[activeGroup].codebook) : updater
          return { ...p, sharedCodebooks: { ...p.sharedCodebooks, [activeGroup]: { ...p.sharedCodebooks[activeGroup], codebook: cb } } }
        })
      }
      return { responses, codebook, setResponses, setCodebook, question }
    }

    // Single question
    const q = project.questions.find(x => x.id === activeQ[0])
    const setResponses = (updater) => setProject(p => ({
      ...p, questions: p.questions.map(x => x.id === q.id
        ? { ...x, rows: typeof updater === 'function' ? updater(x.rows) : updater } : x)
    }))
    const setCodebook = (updater) => setProject(p => ({
      ...p, questions: p.questions.map(x => x.id === q.id
        ? { ...x, codebook: typeof updater === 'function' ? updater(x.codebook) : updater } : x)
    }))
    return { responses: q.rows, codebook: q.codebook, setResponses, setCodebook, question: q.question }
  }

  // ── Export ────────────────────────────────────────────────
  const handleExport = async (responses, codebook, question) => {
    try {
      const form = new FormData()
      form.append('responses', JSON.stringify(responses))
      form.append('codebook',  JSON.stringify(codebook))
      form.append('question',  question || '')
      const { data } = await axios.post(`${API}/export`, form, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url; a.download = `${project.name || 'codiq'}_coded.xlsx`; a.click()
      URL.revokeObjectURL(url)
    } catch { setError('Export failed.') }
  }

  const goProject = () => { clearInterval(pollRef.current); setView('project'); setActiveQ(null); setActiveGroup(null); setJobId(null) }
  const goHome    = () => { clearInterval(pollRef.current); setView('landing'); setProject(null); setActiveQ(null); setActiveGroup(null); setJobId(null); setJobStatus(null); setError(null) }

  const active = getActiveData()

  return (
    <div style={S.root}>
      <Topbar
        onHome={view !== 'landing' ? goHome : null}
        onProject={view === 'workspace' || view === 'auto_config' || view === 'auto_running' ? goProject : null}
        mode={project?.mode}
        projectName={project?.name}
      />
      <main style={view === 'workspace' ? S.full : S.main}>
        {error && (
          <div style={S.err}><span>⚠ {error}</span><button style={S.errX} onClick={() => setError(null)}>✕</button></div>
        )}

        {view === 'landing' && <Landing onSelect={handleMode} />}

        {view === 'project' && project && (
          <ProjectDashboard
            project={project}
            onRename={renameProject}
            onUpload={handleUploadQuestion}
            onOpenQuestion={openQuestion}
            onDeleteQuestion={deleteQuestion}
            onMerge={mergeQuestions}
          />
        )}

        {view === 'auto_config' && (
          <AutomatedUpload
            question={project.questions.find(q => q.id === autoQid)}
            topic={topic} setTopic={setTopic}
            threshold={threshold} setThreshold={setThreshold}
            onRun={handleAutoRun}
            onBack={goProject}
          />
        )}

        {view === 'auto_running' && jobStatus && (
          <ResultsPanel phase="running" jobStatus={jobStatus} topic={topic}
            fileData={{ total: project.questions.find(q => q.id === autoQid)?.total }} />
        )}

        {view === 'workspace' && (
          <CodingWorkspace
            mode={project.mode}
            responses={active.responses}
            setResponses={active.setResponses}
            codebook={active.codebook}
            setCodebook={active.setCodebook}
            question={active.question}
            isMerged={!!activeGroup}
            onExport={() => handleExport(active.responses, active.codebook, active.question)}
          />
        )}
      </main>
    </div>
  )
}

const S = {
  root: { minHeight:'100vh', display:'flex', flexDirection:'column', background:'var(--bg)' },
  main: { flex:1, padding:'2rem 2.5rem 4rem', maxWidth:1200, margin:'0 auto', width:'100%' },
  full: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', height:'calc(100vh - 56px)' },
  err:  { display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,69,69,0.1)', border:'1px solid rgba(255,69,69,0.3)', borderRadius:'var(--r-md)', padding:'0.85rem 1.25rem', marginBottom:'1.5rem', fontSize:'0.875rem', color:'#ff8080' },
  errX: { background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer' },
}