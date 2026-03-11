import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { API_URL } from './config'
import './App.css'

const TOOLS = {
  SELECT: 'select',
  POINT: 'point',
  BOX: 'box',
  PAN: 'pan'
}

const PALETTE = ['#ff6b6b', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899']

const deepCopy = (value) => JSON.parse(JSON.stringify(value))

function App() {
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const dragVertexRef = useRef(null)
  const panStartRef = useRef(null)
  const boxStartRef = useRef(null)

  const [projects, setProjects] = useState([])
  const [projectName, setProjectName] = useState('AutoMark Dataset')
  const [projectId, setProjectId] = useState(null)
  const [projectMeta, setProjectMeta] = useState(null)
  const [images, setImages] = useState([])
  const [classes, setClasses] = useState([])
  const [stats, setStats] = useState(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [annotation, setAnnotation] = useState(null)
  const [selectedMaskId, setSelectedMaskId] = useState(null)

  const [tool, setTool] = useState(TOOLS.SELECT)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [confidenceFilter, setConfidenceFilter] = useState(0.5)
  const [autoClass, setAutoClass] = useState(true)

  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState('Ready')
  const [batchJob, setBatchJob] = useState(null)

  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])

  const [newClassName, setNewClassName] = useState('')
  const [mergeSource, setMergeSource] = useState('')
  const [mergeTarget, setMergeTarget] = useState('')
  const [exportTask, setExportTask] = useState('segment')
  const [augment, setAugment] = useState({
    horizontal_flip: false,
    vertical_flip: false,
    rotations: [90],
    random_rotate_small: false,
    brightness_contrast: false,
    mosaic: false,
    resize_width: 640,
    resize_height: 640
  })
  const [augPreviewUrl, setAugPreviewUrl] = useState(null)

  const currentImage = images[currentIndex] || null

  const filteredMasks = useMemo(() => {
    const masks = annotation?.masks || []
    return masks.filter((m) => Number(m.score || 0) >= confidenceFilter)
  }, [annotation, confidenceFilter])

  const classCountsCurrent = useMemo(() => {
    const counts = {}
    for (const mask of annotation?.masks || []) {
      if (!mask.class_name || mask.class_name === 'unlabeled') continue
      counts[mask.class_name] = (counts[mask.class_name] || 0) + 1
    }
    return counts
  }, [annotation])

  const progress = useMemo(() => {
    if (!images.length) return 0
    const done = images.filter((x) => x.status === 'done').length
    return Math.round((done / images.length) * 100)
  }, [images])

  const refreshProjects = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/projects`)
    const data = await res.json()
    setProjects(data.projects || [])
    if (!projectId && data.projects?.length) {
      setProjectId(data.projects[0].id)
    }
  }, [projectId])

  const refreshStats = useCallback(async (pid) => {
    if (!pid) return
    const res = await fetch(`${API_URL}/api/projects/${pid}/stats`)
    if (!res.ok) return
    const data = await res.json()
    setStats(data)
  }, [])

  const refreshProject = useCallback(async (pid) => {
    if (!pid) return
    const res = await fetch(`${API_URL}/api/projects/${pid}`)
    if (!res.ok) return
    const data = await res.json()
    setProjectMeta(data.project)
    setImages(data.images || [])
    setClasses(data.classes || [])
    if (currentIndex >= (data.images || []).length) {
      setCurrentIndex(0)
    }
    await refreshStats(pid)
  }, [currentIndex, refreshStats])

  const loadAnnotation = useCallback(async (pid, imageId) => {
    if (!pid || !imageId) return
    const res = await fetch(`${API_URL}/api/projects/${pid}/annotations/${imageId}`)
    if (!res.ok) return
    const data = await res.json()
    setAnnotation(data)
    setSelectedMaskId(null)
    setUndoStack([])
    setRedoStack([])
  }, [])

  useEffect(() => {
    refreshProjects()
  }, [refreshProjects])

  useEffect(() => {
    refreshProject(projectId)
  }, [projectId, refreshProject])

  useEffect(() => {
    if (!projectId || !currentImage) return
    loadAnnotation(projectId, currentImage.id)
  }, [projectId, currentImage, loadAnnotation])

  useEffect(() => {
    if (!batchJob?.id) return
    const timer = setInterval(async () => {
      const res = await fetch(`${API_URL}/api/jobs/${batchJob.id}`)
      if (!res.ok) return
      const data = await res.json()
      setBatchJob(data)
      setMessage(`Batch: ${data.progress}% (${data.processed}/${data.total}) ETA ${data.eta_seconds ?? '--'}s`)
      if (data.status === 'completed') {
        clearInterval(timer)
        setMessage(`Batch completed. Skipped: ${data.skipped}`)
        refreshProject(projectId)
      }
    }, 1300)
    return () => clearInterval(timer)
  }, [batchJob, projectId, refreshProject])

  const imageUrl = currentImage ? `${API_URL}/api/projects/${projectId}/images/${currentImage.id}` : null

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageRef.current || !annotation) return

    const ctx = canvas.getContext('2d')
    const img = imageRef.current
    canvas.width = img.width
    canvas.height = img.height

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    const masks = filteredMasks
    for (let i = 0; i < masks.length; i += 1) {
      const mask = masks[i]
      const poly = mask.polygon || []
      if (poly.length < 3) continue

      const classIdx = classes.findIndex((c) => c.name === mask.class_name)
      const baseColor = (classIdx >= 0 ? classes[classIdx]?.color : null) || PALETTE[i % PALETTE.length]

      ctx.beginPath()
      ctx.moveTo(poly[0][0], poly[0][1])
      for (let p = 1; p < poly.length; p += 1) {
        ctx.lineTo(poly[p][0], poly[p][1])
      }
      ctx.closePath()

      ctx.fillStyle = `${baseColor}55`
      ctx.fill()
      ctx.strokeStyle = mask.id === selectedMaskId ? '#ffffff' : baseColor
      ctx.lineWidth = mask.id === selectedMaskId ? 2.6 : 1.6
      ctx.stroke()

      if (mask.id === selectedMaskId) {
        for (let p = 0; p < poly.length; p += 1) {
          const [x, y] = poly[p]
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, Math.PI * 2)
          ctx.fillStyle = '#0f172a'
          ctx.fill()
          ctx.strokeStyle = '#facc15'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      }
    }

    if (tool === TOOLS.BOX && boxStartRef.current?.active && boxStartRef.current?.current) {
      const box = boxStartRef.current.current
      ctx.strokeStyle = '#f59e0b'
      ctx.setLineDash([6, 4])
      ctx.lineWidth = 2
      ctx.strokeRect(box.x, box.y, box.w, box.h)
      ctx.setLineDash([])
    }
  }, [annotation, classes, filteredMasks, selectedMaskId, tool])

  useEffect(() => {
    if (!imageUrl) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      drawCanvas()
    }
    img.src = imageUrl
  }, [imageUrl, drawCanvas])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const saveAnnotation = useCallback(async (next) => {
    if (!projectId || !currentImage) return
    await fetch(`${API_URL}/api/projects/${projectId}/annotations/${currentImage.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ masks: next.masks || [], history: next.history || [] })
    })
    setAnnotation(next)
    refreshProject(projectId)
  }, [projectId, currentImage, refreshProject])

  const pushUndo = useCallback((snapshot) => {
    setUndoStack((prev) => [...prev, deepCopy(snapshot)])
    setRedoStack([])
  }, [])

  const mutateMasks = useCallback(async (updater) => {
    if (!annotation) return
    pushUndo(annotation)
    const next = deepCopy(annotation)
    updater(next)
    await saveAnnotation(next)
  }, [annotation, pushUndo, saveAnnotation])

  const createProject = async () => {
    setIsBusy(true)
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName })
      })
      const data = await res.json()
      setProjectId(data.id)
      setMessage(`Project created: ${data.name}`)
      refreshProjects()
    } finally {
      setIsBusy(false)
    }
  }

  const onUploadImages = async (event) => {
    if (!projectId) return
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const form = new FormData()
    for (const file of files) form.append('files', file)

    setIsBusy(true)
    setMessage('Uploading images...')
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/upload/images`, {
        method: 'POST',
        body: form
      })
      const data = await res.json()
      setMessage(`Uploaded ${data.count} images`)
      await refreshProject(projectId)
    } finally {
      setIsBusy(false)
      event.target.value = ''
    }
  }

  const onUploadZip = async (event) => {
    if (!projectId) return
    const file = event.target.files?.[0]
    if (!file) return

    const form = new FormData()
    form.append('file', file)

    setIsBusy(true)
    setMessage('Uploading ZIP...')
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/upload/zip`, {
        method: 'POST',
        body: form
      })
      const data = await res.json()
      setMessage(`ZIP extracted: ${data.count} images`)
      await refreshProject(projectId)
    } finally {
      setIsBusy(false)
      event.target.value = ''
    }
  }

  const autoAnnotateCurrent = async () => {
    if (!projectId || !currentImage) return
    setIsBusy(true)
    setMessage('Running SAM2 auto-annotation...')
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/annotate/auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_id: currentImage.id,
          confidence_threshold: confidenceFilter,
          min_mask_area_ratio: 0.001,
          max_mask_area_ratio: 0.95,
          auto_class: autoClass
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to auto-annotate image')
      }
      const data = await res.json()
      setAnnotation(data)
      setMessage(`Auto-annotation done: ${data.masks?.length || 0} masks`)
      await refreshProject(projectId)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setIsBusy(false)
    }
  }

  const autoAnnotateBatch = async () => {
    if (!projectId) return
    setIsBusy(true)
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/annotate/auto/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confidence_threshold: confidenceFilter,
          min_mask_area_ratio: 0.001,
          max_mask_area_ratio: 0.95,
          auto_class: autoClass
        })
      })
      const data = await res.json()
      setBatchJob(data)
      setMessage('Batch auto-annotation started')
    } finally {
      setIsBusy(false)
    }
  }

  const exportDataset = async (task, downloadCoco = false) => {
    if (!projectId) return
    setIsBusy(true)
    setMessage('Building export...')
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, val_ratio: 0.2, augmentations: augment })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Export failed')
      }

      const zip = await fetch(`${API_URL}/api/projects/${projectId}/export/download`)
      const zipBlob = await zip.blob()
      const zipUrl = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = zipUrl
      a.download = `${projectId}_dataset_export.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(zipUrl)

      if (downloadCoco) {
        const cj = await fetch(`${API_URL}/api/projects/${projectId}/export/coco`)
        const cBlob = await cj.blob()
        const cUrl = URL.createObjectURL(cBlob)
        const c = document.createElement('a')
        c.href = cUrl
        c.download = `${projectId}_coco_annotations.json`
        document.body.appendChild(c)
        c.click()
        c.remove()
        URL.revokeObjectURL(cUrl)
      }

      setMessage('Export completed')
      await refreshStats(projectId)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setIsBusy(false)
    }
  }

  const loadAugPreview = async () => {
    if (!projectId || !currentImage) return
    const res = await fetch(`${API_URL}/api/projects/${projectId}/augment/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_id: currentImage.id, augmentations: augment })
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    setAugPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
  }

  const canvasPoint = (event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / zoom - pan.x
    const y = (event.clientY - rect.top) / zoom - pan.y
    return { x, y }
  }

  const pointInPolygon = (polygon, x, y) => {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1]
      const xj = polygon[j][0], yj = polygon[j][1]
      const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }

  const findMaskAndVertex = (x, y) => {
    if (!annotation?.masks) return { maskId: null, vertexIndex: null }

    for (const mask of annotation.masks) {
      if (mask.id === selectedMaskId) {
        for (let i = 0; i < mask.polygon.length; i += 1) {
          const [vx, vy] = mask.polygon[i]
          if (Math.hypot(vx - x, vy - y) < 7) {
            return { maskId: mask.id, vertexIndex: i }
          }
        }
      }
    }

    for (let i = annotation.masks.length - 1; i >= 0; i -= 1) {
      const mask = annotation.masks[i]
      if ((mask.score || 0) < confidenceFilter) continue
      if (pointInPolygon(mask.polygon || [], x, y)) {
        return { maskId: mask.id, vertexIndex: null }
      }
    }
    return { maskId: null, vertexIndex: null }
  }

  const onCanvasDown = async (event) => {
    if (!annotation || !currentImage || !projectId) return
    const { x, y } = canvasPoint(event)

    if (tool === TOOLS.PAN) {
      panStartRef.current = { x: event.clientX, y: event.clientY, startPan: { ...pan } }
      return
    }

    if (tool === TOOLS.BOX) {
      boxStartRef.current = { active: true, start: { x, y }, current: { x, y, w: 0, h: 0 } }
      drawCanvas()
      return
    }

    if (tool === TOOLS.POINT) {
      setIsBusy(true)
      try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}/annotate/point`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_id: currentImage.id, x, y })
        })
        if (res.ok) {
          const data = await res.json()
          setAnnotation(data)
          setMessage('Point prompt mask added')
          await refreshProject(projectId)
        }
      } finally {
        setIsBusy(false)
      }
      return
    }

    const hit = findMaskAndVertex(x, y)
    setSelectedMaskId(hit.maskId)
    if (hit.maskId && hit.vertexIndex !== null) {
      dragVertexRef.current = { maskId: hit.maskId, vertexIndex: hit.vertexIndex }
    }
  }

  const onCanvasMove = (event) => {
    if (!annotation) return
    const { x, y } = canvasPoint(event)

    if (panStartRef.current) {
      const dx = (event.clientX - panStartRef.current.x) / zoom
      const dy = (event.clientY - panStartRef.current.y) / zoom
      setPan({ x: panStartRef.current.startPan.x + dx, y: panStartRef.current.startPan.y + dy })
      return
    }

    if (boxStartRef.current?.active) {
      const start = boxStartRef.current.start
      boxStartRef.current.current = {
        x: Math.min(start.x, x),
        y: Math.min(start.y, y),
        w: Math.abs(x - start.x),
        h: Math.abs(y - start.y)
      }
      drawCanvas()
      return
    }

    if (dragVertexRef.current) {
      const { maskId, vertexIndex } = dragVertexRef.current
      setAnnotation((prev) => {
        if (!prev) return prev
        const next = deepCopy(prev)
        const target = next.masks.find((m) => m.id === maskId)
        if (!target) return prev
        target.polygon[vertexIndex] = [x, y]
        return next
      })
    }
  }

  const onCanvasUp = async () => {
    if (panStartRef.current) {
      panStartRef.current = null
    }

    if (dragVertexRef.current) {
      dragVertexRef.current = null
      if (annotation) {
        await saveAnnotation(annotation)
      }
    }

    if (boxStartRef.current?.active && currentImage && projectId) {
      const box = boxStartRef.current.current
      boxStartRef.current = null
      if (box.w > 3 && box.h > 3) {
        setIsBusy(true)
        try {
          const res = await fetch(`${API_URL}/api/projects/${projectId}/annotate/box`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_id: currentImage.id, x1: box.x, y1: box.y, x2: box.x + box.w, y2: box.y + box.h })
          })
          if (res.ok) {
            const data = await res.json()
            setAnnotation(data)
            setMessage('Box prompt mask added')
            await refreshProject(projectId)
          }
        } finally {
          setIsBusy(false)
        }
      }
    }
  }

  const deleteSelectedMask = async () => {
    if (!projectId || !currentImage || !selectedMaskId) return
    pushUndo(annotation)
    await fetch(`${API_URL}/api/projects/${projectId}/annotations/${currentImage.id}/masks/${selectedMaskId}`, { method: 'DELETE' })
    await loadAnnotation(projectId, currentImage.id)
    await refreshProject(projectId)
    setSelectedMaskId(null)
  }

  const assignClassToMask = async (maskId, className) => {
    if (!annotation) return
    await mutateMasks((next) => {
      const mask = next.masks.find((m) => m.id === maskId)
      if (mask) mask.class_name = className
    })
  }

  const addClass = async () => {
    if (!newClassName.trim() || !projectId) return
    await fetch(`${API_URL}/api/projects/${projectId}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newClassName.trim() })
    })
    setNewClassName('')
    refreshProject(projectId)
  }

  const assignShortcuts = async () => {
    if (!projectId) return
    const subset = classes.slice(0, 9)
    for (let i = 0; i < subset.length; i += 1) {
      await fetch(`${API_URL}/api/projects/${projectId}/classes/shortcut`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: subset[i].id, shortcut: i + 1 })
      })
    }
    refreshProject(projectId)
  }

  const mergeClassesAction = async () => {
    if (!projectId || !mergeSource || !mergeTarget || mergeSource === mergeTarget) return
    await fetch(`${API_URL}/api/projects/${projectId}/classes/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_class_id: mergeSource, target_class_id: mergeTarget })
    })
    setMergeSource('')
    setMergeTarget('')
    refreshProject(projectId)
    if (currentImage) loadAnnotation(projectId, currentImage.id)
  }

  const renameClass = async (cls) => {
    const nextName = window.prompt('Rename class:', cls.name)
    if (!nextName || !projectId) return
    await fetch(`${API_URL}/api/projects/${projectId}/classes/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: cls.id, new_name: nextName })
    })
    refreshProject(projectId)
    if (currentImage) loadAnnotation(projectId, currentImage.id)
  }

  const deleteClass = async (cls) => {
    if (!projectId) return
    await fetch(`${API_URL}/api/projects/${projectId}/classes/${cls.id}`, { method: 'DELETE' })
    refreshProject(projectId)
    if (currentImage) loadAnnotation(projectId, currentImage.id)
  }

  const copyFromPrevious = async () => {
    if (!projectId || !currentImage || currentIndex <= 0) return
    const previous = images[currentIndex - 1]
    if (!previous) return
    const res = await fetch(`${API_URL}/api/projects/${projectId}/annotations/${previous.id}`)
    if (!res.ok) return
    const prevAnnotation = await res.json()
    const copiedMasks = deepCopy(prevAnnotation.masks || []).map((mask) => ({ ...mask, id: crypto.randomUUID?.() || `${Date.now()}_${Math.random()}` }))
    const next = {
      image_id: currentImage.id,
      filename: currentImage.filename,
      width: currentImage.width,
      height: currentImage.height,
      masks: copiedMasks,
      history: []
    }
    await saveAnnotation(next)
    setAnnotation(next)
  }

  useEffect(() => {
    const handler = async (e) => {
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
      if (isTyping) return

      if (e.key === 'a' || e.key === 'A') autoAnnotateCurrent()
      if (e.key === 'd' || e.key === 'D') deleteSelectedMask()
      if (e.key === 'n' || e.key === 'N') setCurrentIndex((idx) => Math.min(images.length - 1, idx + 1))
      if (e.key === 'p' || e.key === 'P') setCurrentIndex((idx) => Math.max(0, idx - 1))
      if (e.key === 'e' || e.key === 'E') exportDataset('segment', false)

      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (!undoStack.length) return
        const prev = undoStack[undoStack.length - 1]
        setUndoStack((s) => s.slice(0, -1))
        setRedoStack((s) => [...s, deepCopy(annotation)])
        setAnnotation(prev)
        await saveAnnotation(prev)
      }

      if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'Z' && e.shiftKey && (e.ctrlKey || e.metaKey))) {
        e.preventDefault()
        if (!redoStack.length) return
        const next = redoStack[redoStack.length - 1]
        setRedoStack((s) => s.slice(0, -1))
        setUndoStack((s) => [...s, deepCopy(annotation)])
        setAnnotation(next)
        await saveAnnotation(next)
      }

      const number = Number(e.key)
      if (number >= 1 && number <= 9 && selectedMaskId) {
        const direct = classes.find((c) => c.shortcut === number) || classes[number - 1]
        if (direct) {
          assignClassToMask(selectedMaskId, direct.name)
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [annotation, classes, currentImage, deleteSelectedMask, images.length, redoStack, selectedMaskId, undoStack])

  return (
    <div className="studio-root">
      <header className="topbar">
        <div className="topbar-left">
          <h1>{projectMeta?.name || 'AutoMark SAM2'}</h1>
          <p>{message}</p>
        </div>
        <div className="topbar-center">
          <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          <span>{images.filter((x) => x.status === 'done').length}/{images.length} annotated</span>
        </div>
        <div className="topbar-actions">
          <select value={exportTask} onChange={(e) => setExportTask(e.target.value)}>
            <option value="segment">YOLO Segment</option>
            <option value="detect">YOLO Detect</option>
          </select>
          <button onClick={() => exportDataset(exportTask, false)} disabled={isBusy}>Export YOLO</button>
          <button onClick={() => exportDataset(exportTask, true)} disabled={isBusy}>Export COCO</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="left-sidebar">
          <section className="card">
            <h3>Project</h3>
            <div className="row">
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Dataset name" />
              <button onClick={createProject} disabled={isBusy}>Create</button>
            </div>
            <select value={projectId || ''} onChange={(e) => setProjectId(e.target.value || null)}>
              <option value="">Select project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="small-line">Images: {images.length}</div>
          </section>

          <section className="card">
            <h3>Upload</h3>
            <label className="upload-button">Upload Images<input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.bmp" onChange={onUploadImages} /></label>
            <label className="upload-button">Upload ZIP<input type="file" accept=".zip" onChange={onUploadZip} /></label>
            <button onClick={autoAnnotateBatch} disabled={!images.length || isBusy}>Batch Auto-Annotate</button>
            {batchJob && (
              <div className="job-box">
                <div>{batchJob.status}</div>
                <div>{batchJob.processed}/{batchJob.total}</div>
                <div>ETA: {batchJob.eta_seconds ?? '--'}s</div>
              </div>
            )}
          </section>

          <section className="card">
            <h3>Classes</h3>
            <div className="row">
              <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="new class" />
              <button onClick={addClass}>Add</button>
            </div>
            <div className="class-list">
              {classes.map((cls, idx) => (
                <div key={cls.id} className="class-item">
                  <span className="swatch" style={{ backgroundColor: cls.color || PALETTE[idx % PALETTE.length] }} />
                  <span title={`Shortcut ${idx + 1}`}>{cls.name}</span>
                  <span className="count-badge">{stats?.per_class?.[cls.name] || 0}</span>
                  <button className="mini" onClick={() => renameClass(cls)}>R</button>
                  <button className="mini" onClick={() => deleteClass(cls)}>X</button>
                </div>
              ))}
            </div>
            <button onClick={assignShortcuts} disabled={!classes.length}>Assign 1-9 Shortcuts</button>
            <div className="row">
              <select value={mergeSource} onChange={(e) => setMergeSource(e.target.value)}>
                <option value="">Merge source</option>
                {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
              </select>
              <select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)}>
                <option value="">Merge target</option>
                {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
              </select>
            </div>
            <button onClick={mergeClassesAction}>Merge Classes</button>
          </section>

          <section className="card">
            <h3>Dataset Stats</h3>
            <div>Total: {stats?.total_images || 0}</div>
            <div>Annotated: {stats?.annotated_images || 0}</div>
            <div>Remaining: {stats?.remaining_images || 0}</div>
            <div>Avg objects/image: {stats?.average_objects_per_image || 0}</div>
            <div className="class-bars">
              {Object.entries(stats?.per_class || {}).map(([name, count]) => {
                const max = Math.max(1, ...Object.values(stats?.per_class || { __: 1 }))
                return (
                  <div key={name} className="class-bar-row">
                    <span>{name}</span>
                    <div className="class-bar"><div style={{ width: `${(count / max) * 100}%` }} /></div>
                    <span>{count}</span>
                  </div>
                )
              })}
            </div>
            <ul>
              {(stats?.warnings || []).slice(0, 3).map((w) => <li key={w}>{w}</li>)}
            </ul>
          </section>
        </aside>

        <main className="center-canvas">
          <div className="toolbar card">
            <button className={tool === TOOLS.SELECT ? 'active' : ''} onClick={() => setTool(TOOLS.SELECT)}>Select</button>
            <button className={tool === TOOLS.POINT ? 'active' : ''} onClick={() => setTool(TOOLS.POINT)}>Point Prompt</button>
            <button className={tool === TOOLS.BOX ? 'active' : ''} onClick={() => setTool(TOOLS.BOX)}>Box Prompt</button>
            <button onClick={deleteSelectedMask}>Delete</button>
            <button onClick={() => setTool(TOOLS.PAN)} className={tool === TOOLS.PAN ? 'active' : ''}>Pan</button>
            <button onClick={() => setZoom((z) => Math.min(3, z + 0.1))}>Zoom +</button>
            <button onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}>Zoom -</button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}>Reset View</button>
          </div>

          <div className="canvas-shell card">
            {currentImage ? (
              <div className="canvas-viewport">
                <canvas
                  ref={canvasRef}
                  onMouseDown={onCanvasDown}
                  onMouseMove={onCanvasMove}
                  onMouseUp={onCanvasUp}
                  onMouseLeave={onCanvasUp}
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'top left' }}
                />
              </div>
            ) : (
              <div className="empty">Create/select a project and upload images.</div>
            )}
          </div>

          <div className="mask-list card">
            <h3>Masks ({filteredMasks.length})</h3>
            <div className="mask-grid">
              {filteredMasks.map((mask, idx) => (
                <div
                  key={mask.id}
                  className={`mask-chip ${mask.id === selectedMaskId ? 'selected' : ''}`}
                  onClick={() => setSelectedMaskId(mask.id)}
                >
                  <span className="chip-color" style={{ backgroundColor: classes.find((c) => c.name === mask.class_name)?.color || PALETTE[idx % PALETTE.length] }} />
                  <select value={mask.class_name || 'unlabeled'} onChange={(e) => assignClassToMask(mask.id, e.target.value)}>
                    <option value="unlabeled">unlabeled</option>
                    {classes.map((cls) => <option key={cls.id} value={cls.name}>{cls.name}</option>)}
                  </select>
                  <span>{Math.round((mask.score || 0) * 100)}%</span>
                  <span>{Math.round((mask.area_ratio || 0) * 1000) / 10}% area</span>
                  <span>{mask.polygon?.length || 0} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="thumb-strip card">
            {images.map((img, idx) => (
              <button key={img.id} className={idx === currentIndex ? 'thumb active' : 'thumb'} onClick={() => setCurrentIndex(idx)}>
                <img src={`${API_URL}/api/projects/${projectId}/images/${img.id}`} alt={img.filename} />
                <span>{img.filename}</span>
                <small>{img.status}</small>
              </button>
            ))}
          </div>
        </main>

        <aside className="right-panel">
          <section className="card">
            <h3>Image Metadata</h3>
            <div>Name: {currentImage?.filename || '--'}</div>
            <div>Resolution: {currentImage ? `${currentImage.width}x${currentImage.height}` : '--'}</div>
            <div>Status: {currentImage?.status || '--'}</div>
            <div>Current class count: {Object.keys(classCountsCurrent).length}</div>
          </section>

          <section className="card">
            <h3>Quick Actions</h3>
            <button onClick={autoAnnotateCurrent} disabled={!currentImage || isBusy}>Auto-Annotate (A)</button>
            <button onClick={() => mutateMasks((next) => { next.masks = [] })} disabled={!annotation}>Clear All</button>
            <button onClick={copyFromPrevious}>Copy From Previous</button>
            <label>
              Confidence filter: {confidenceFilter.toFixed(2)}
              <input type="range" min="0.5" max="1" step="0.01" value={confidenceFilter} onChange={(e) => setConfidenceFilter(Number(e.target.value))} />
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={autoClass} onChange={(e) => setAutoClass(e.target.checked)} />
              Auto-class suggestion
            </label>
          </section>

          <section className="card">
            <h3>Augmentation</h3>
            <label className="checkbox"><input type="checkbox" checked={augment.horizontal_flip} onChange={(e) => setAugment((a) => ({ ...a, horizontal_flip: e.target.checked }))} />Horizontal Flip</label>
            <label className="checkbox"><input type="checkbox" checked={augment.vertical_flip} onChange={(e) => setAugment((a) => ({ ...a, vertical_flip: e.target.checked }))} />Vertical Flip</label>
            <label className="checkbox"><input type="checkbox" checked={augment.random_rotate_small} onChange={(e) => setAugment((a) => ({ ...a, random_rotate_small: e.target.checked }))} />Random +/-15</label>
            <label className="checkbox"><input type="checkbox" checked={augment.brightness_contrast} onChange={(e) => setAugment((a) => ({ ...a, brightness_contrast: e.target.checked }))} />Brightness/Contrast</label>
            <label className="checkbox"><input type="checkbox" checked={augment.mosaic} onChange={(e) => setAugment((a) => ({ ...a, mosaic: e.target.checked }))} />Mosaic</label>
            <div className="row">
              <input type="number" value={augment.resize_width} onChange={(e) => setAugment((a) => ({ ...a, resize_width: Number(e.target.value) }))} />
              <input type="number" value={augment.resize_height} onChange={(e) => setAugment((a) => ({ ...a, resize_height: Number(e.target.value) }))} />
            </div>
            <button onClick={loadAugPreview} disabled={!currentImage}>Preview Augmentation</button>
            {augPreviewUrl && <img src={augPreviewUrl} className="aug-preview" alt="augmentation preview" />}
          </section>

          <section className="card">
            <h3>Keyboard Shortcuts</h3>
            <p>A: Auto-annotate</p>
            <p>D: Delete selected mask</p>
            <p>N/P: Next/Previous image</p>
            <p>E: Export dataset</p>
            <p>Ctrl+Z / Ctrl+Y: Undo/Redo</p>
            <p>1-9: Class assignment</p>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default App
