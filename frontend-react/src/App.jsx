import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Eye, EyeOff, FileArchive, Image as ImageIcon, Trash2, RefreshCw, Download, CheckCircle, LogOut, Box, Info } from 'lucide-react'
import axios from 'axios'
import './App.css'

const API = 'http://localhost:8000'

// Login
function Login({ onLogin, onSwitch }) {
  const [email, setEmail] = useState('demo@automark.ai')
  const [pass, setPass] = useState('demo123')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.post(`${API}/api/auth/login`, { email, password: pass })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLogin(data.user)
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>AutoMark</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-row">
              <input className="form-input" type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} />
              <button type="button" className="toggle-pass" onClick={() => setShow(!show)}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="login-footer">
          Need an account? <a href="#" onClick={e => { e.preventDefault(); onSwitch() }}>Sign up</a>
        </div>
      </div>
    </div>
  )
}

// Signup
function Signup({ onLogin, onSwitch }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await axios.post(`${API}/api/auth/signup`, { name, email, password: pass })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLogin(data.user)
    } catch (e) {
      setError(e.response?.data?.detail || 'Signup failed')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>Create Account</h1>
          <p>Start annotating images</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={pass} onChange={e => setPass(e.target.value)} />
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div className="login-footer">
          Have an account? <a href="#" onClick={e => { e.preventDefault(); onSwitch() }}>Sign in</a>
        </div>
      </div>
    </div>
  )
}

// Main App
function Main({ user, onLogout }) {
  const [files, setFiles] = useState([])
  const [description, setDescription] = useState('')
  const [processing, setProcessing] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [results, setResults] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const timerRef = useRef(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: files => setFiles(f => [...f, ...files]),
    accept: { 'image/*': [], 'application/zip': ['.zip'] }
  })

  const process = async () => {
    if (!files.length) return
    setProcessing(true)
    setElapsed(0)

    const start = Date.now()
    timerRef.current = setInterval(() => setElapsed((Date.now() - start) / 1000), 100)

    try {
      const form = new FormData()
      files.forEach(f => form.append('files', f))
      if (description) form.append('description', description)

      const { data } = await axios.post(`${API}/api/annotate`, form)
      setResults(data)
      setSessionId(data.session_id)
      setFiles([])
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    }

    clearInterval(timerRef.current)
    setProcessing(false)
  }

  const reset = () => {
    setResults(null)
    setElapsed(0)
    setDescription('')
  }

  const formatTime = s => {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60)
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <Box size={28} />
          AutoMark
        </div>
        <div className="header-right">
          <span className="user-name">{user.name || user.email}</span>
          <button className="btn btn-secondary" onClick={onLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="main">
        {!results ? (
          <>
            <div className="page-header">
              <h1>Auto-Annotate Images</h1>
              <p>Upload images and get YOLO-ready annotations</p>
            </div>

            <div {...getRootProps()} className={`upload-box ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              <div className="upload-icon"><Upload size={28} /></div>
              <h2>Drop files here</h2>
              <p>JPG, PNG, WEBP or ZIP files</p>
              <button className="btn btn-primary">Browse Files</button>
            </div>

            {/* Optional Description */}
            <div className="desc-section">
              <h3>
                <Info size={16} />
                Object Description
                <span>Optional</span>
              </h3>
              <textarea
                className="desc-input"
                rows={2}
                placeholder="Describe the objects to help identify them (e.g., 'red car', 'wooden chair')"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {files.length > 0 && (
              <div className="file-list">
                {files.map((f, i) => (
                  <div key={i} className="file-item">
                    <div className="file-info">
                      <div className="file-icon">
                        {f.name.endsWith('.zip') ? <FileArchive size={18} /> : <ImageIcon size={18} />}
                      </div>
                      <div>
                        <div className="file-name">{f.name}</div>
                        <div className="file-size">{(f.size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                    <button className="btn-icon" onClick={() => setFiles(fs => fs.filter((_, idx) => idx !== i))}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {processing && (
              <div className="progress-box">
                <div className="progress-header">
                  <span>Processing...</span>
                  <span>{formatTime(elapsed)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '100%' }} />
                </div>
              </div>
            )}

            {files.length > 0 && !processing && (
              <div className="actions">
                <button className="btn btn-secondary" onClick={() => setFiles([])}>Clear</button>
                <button className="btn btn-primary btn-lg" onClick={process}>
                  <Upload size={18} /> Start Annotation
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="result-card">
              <div className="result-header">
                <div>
                  <h2><CheckCircle className="success-icon" size={28} /> Done!</h2>
                  <p className="result-info">
                    {results.total_images} images • {results.total_detections} detections • {formatTime(elapsed)}
                  </p>
                </div>
                <div className="result-actions">
                  <button className="btn btn-secondary" onClick={reset}>
                    <RefreshCw size={16} /> New
                  </button>
                  <button className="btn btn-primary" onClick={() => window.open(`${API}/api/download/${sessionId}`)}>
                    <Download size={16} /> Download
                  </button>
                </div>
              </div>
            </div>

            <div className="dataset-box">
              <h3>📦 Dataset Contents</h3>
              <ul className="dataset-list">
                <li>📁 images/</li>
                <li>📁 labels/</li>
                <li>📄 classes.txt</li>
                <li>📄 dataset.yaml</li>
              </ul>
            </div>

            <div className="image-grid">
              {results.processed_files?.slice(0, 12).map((f, i) => (
                <div key={i} className="image-card">
                  <img src={`${API}/output/${results.session_id}/annotated/${f.filename}`} alt={f.filename} />
                  <div className="image-card-info">
                    <div className="image-card-name">{f.filename}</div>
                    <div className="image-card-meta">{f.detections} objects</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// App
function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'))
  const [page, setPage] = useState('login')

  const login = u => setUser(u)
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (!user) {
    return page === 'login'
      ? <Login onLogin={login} onSwitch={() => setPage('signup')} />
      : <Signup onLogin={login} onSwitch={() => setPage('login')} />
  }

  return <Main user={user} onLogout={logout} />
}

export default App
