import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

import Topbar from './components/Topbar'
import Landing from './pages/Landing'
import ManualUpload from './pages/ManualUpload'
import AutomatedUpload from './pages/AutomatedUpload'
import CodingWorkspace from './pages/CodingWorkspace'
import ResultsPanel from './components/ResultsPanel'

const API = '/api'

export default function App() {
  const [view,      setView]      = useState('landing')
  const [mode,      setMode]      = useState(null)
  const [fileData,  setFileData]  = useState(null)
  const [codebook,  setCodebook]  = useState([])
  const [responses, setResponses] = useState([])
  const [topic,     setTopic]     = useState('')
  const [threshold, setThreshold] = useState(5)
  const [jobId,     setJobId]     = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [error,     setError]     = useState(null)
  const pollRef = useRef(null)

  const handleUpload = async (file) => {
    setError(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await axios.post(`${API}/upload`, form)
      setFileData(data)
      const rows = data.all_rows || data.preview || []
      setResponses(rows.map(r => ({
        respid: r.respid, qid: r.qid, verbatim: r.verbatim,
        sentiment: '', codes: [],
      })))
      return data
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed — is the backend running?')
      return null
    }
  }

  const handleAutoRun = async () => {
    if (!fileData || !topic.trim()) return
    setError(null)
    setView('auto_running')
    setJobStatus({ status:'queued', stage:'Queued', progress:0, log:[], stats:{}, codebook:[] })
    const form = new FormData()
    form.append('file_id', fileData.file_id)
    form.append('file_path', fileData.path)
    form.append('topic', topic.trim())
    form.append('min_threshold', threshold)
    try {
      const { data } = await axios.post(`${API}/run`, form)
      setJobId(data.job_id)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to start pipeline.')
      setView('auto_upload')
    }
  }

  useEffect(() => {
    if (!jobId) return
    const poll = async () => {
      try {
        const { data } = await axios.get(`${API}/status/${jobId}`)
        setJobStatus(data)
        if (data.status === 'done') {
          clearInterval(pollRef.current)
          if (data.all_rows?.length) {
            setResponses(data.all_rows.map(r => ({
              respid: r.respid, qid: r.qid, verbatim: r.verbatim,
              sentiment: r.sentiment || '', codes: r.codes || [],
            })))
          }
          if (data.codebook?.length) setCodebook(data.codebook)
          setView('workspace')
        } else if (['cancelled','error'].includes(data.status)) {
          setError('Pipeline failed or was cancelled.')
          setView('auto_upload')
          clearInterval(pollRef.current)
        }
      } catch { clearInterval(pollRef.current) }
    }
    pollRef.current = setInterval(poll, 1200)
    poll()
    return () => clearInterval(pollRef.current)
  }, [jobId])

  const handleHome = () => {
    clearInterval(pollRef.current)
    setView('landing'); setMode(null); setFileData(null)
    setCodebook([]); setResponses([]); setTopic('')
    setThreshold(5); setJobId(null); setJobStatus(null); setError(null)
  }

  const handleMode = (m) => {
    setMode(m)
    setView(m === 'manual' ? 'manual_upload' : 'auto_upload')
  }

  const handleExport = async () => {
    try {
      const form = new FormData()
      form.append('file_path', fileData?.path || '')
      form.append('responses', JSON.stringify(responses))
      form.append('codebook',  JSON.stringify(codebook))
      form.append('question',  fileData?.question || '')
      const { data } = await axios.post(`${API}/export`, form, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(fileData?.filename || 'output').replace('.xlsx','')}_coded.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch { setError('Export failed.') }
  }

  return (
    <div style={S.root}>
      <Topbar onHome={view !== 'landing' ? handleHome : null} mode={mode} view={view} />
      <main style={view === 'workspace' ? S.mainFull : S.main}>
        {error && (
          <div style={S.err}>
            <span>⚠ {error}</span>
            <button style={S.errX} onClick={() => setError(null)}>✕</button>
          </div>
        )}
        {view === 'landing'      && <Landing onSelect={handleMode} />}
        {view === 'manual_upload'&& <ManualUpload onUpload={handleUpload} fileData={fileData} onStart={() => setView('workspace')} onReplace={handleHome} />}
        {view === 'auto_upload'  && <AutomatedUpload onUpload={handleUpload} fileData={fileData} topic={topic} setTopic={setTopic} threshold={threshold} setThreshold={setThreshold} onRun={handleAutoRun} onReplace={handleHome} />}
        {view === 'auto_running' && jobStatus && <ResultsPanel phase="running" jobStatus={jobStatus} topic={topic} fileData={fileData} />}
        {view === 'workspace'    && <CodingWorkspace mode={mode} responses={responses} setResponses={setResponses} codebook={codebook} setCodebook={setCodebook} fileData={fileData} onExport={handleExport} onHome={handleHome} />}
      </main>
    </div>
  )
}

const S = {
  root:     { minHeight:'100vh', display:'flex', flexDirection:'column', background:'var(--bg)' },
  main:     { flex:1, padding:'2rem 2.5rem 4rem', maxWidth:1200, margin:'0 auto', width:'100%' },
  mainFull: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', height:'calc(100vh - 56px)' },
  err:      { display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,69,69,0.1)', border:'1px solid rgba(255,69,69,0.3)', borderRadius:'var(--r-md)', padding:'0.85rem 1.25rem', marginBottom:'1.5rem', fontSize:'0.875rem', color:'#ff8080' },
  errX:     { background:'none', border:'none', color:'var(--grey-2)', cursor:'pointer' },
}