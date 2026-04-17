import { useState, useRef, useEffect, useCallback } from 'react'

export default function Step1Camera({ onNext }) {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const fileRef     = useRef(null)
  const [stream,   setStream]   = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [mode,     setMode]     = useState('idle')   // idle | camera | captured
  const [camError, setCamError] = useState(null)

  // Stop camera tracks on unmount or when stream changes
  const stopStream = useCallback((s) => {
    s?.getTracks().forEach((t) => t.stop())
  }, [])

  useEffect(() => () => stopStream(stream), [stream, stopStream])

  async function openCamera() {
    setCamError(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      setStream(s)
      setMode('camera')
      // Attach after state update — use a small delay via requestAnimationFrame
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = s
      })
    } catch {
      // getUserMedia unavailable (desktop no cam, iOS restriction, etc.)
      // Gracefully fall back to <input capture>
      setCamError('Camera not accessible — please upload a photo instead.')
      fileRef.current?.click()
    }
  }

  function capturePhoto() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    setPreview(canvas.toDataURL('image/jpeg', 0.88))
    setMode('captured')
    stopStream(stream)
    setStream(null)
  }

  function retake() {
    setPreview(null)
    setMode('idle')
    setCamError(null)
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target.result)
      setMode('captured')
    }
    reader.readAsDataURL(file)
    // Reset so same file can be re-selected after retake
    e.target.value = ''
  }

  return (
    <div className="flex flex-col min-h-full p-5 gap-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Take a Photo</h2>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
          Capture or upload a clear photo of the issue. Good lighting helps AI analysis.
        </p>
      </div>

      {/* ── Camera live preview ─────────────────────────────────────────── */}
      {mode === 'camera' && (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Viewfinder corners */}
          <div className="absolute inset-4 pointer-events-none">
            {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
              <div key={i} className={`absolute w-6 h-6 ${pos} ${
                pos.includes('right') ? 'border-r-2' : 'border-l-2'
              } ${pos.includes('bottom') ? 'border-b-2' : 'border-t-2'} border-amber-400 rounded-sm`} />
            ))}
          </div>

          <button
            onClick={capturePhoto}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-slate-900 dark:border-amber-500 shadow-lg touch-manipulation active:scale-95 transition-transform"
            aria-label="Capture photo"
          />
          <button
            onClick={() => { stopStream(stream); setStream(null); setMode('idle') }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center touch-manipulation"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Captured / uploaded preview ─────────────────────────────────── */}
      {mode === 'captured' && preview && (
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] w-full">
          <img src={preview} alt="Captured" className="w-full h-full object-cover" />
          <div className="absolute top-3 right-3 bg-green-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Photo ready
          </div>
        </div>
      )}

      {/* ── Idle placeholder ────────────────────────────────────────────── */}
      {mode === 'idle' && (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 bg-white dark:bg-transparent aspect-[4/3] flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-zinc-600">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          <span className="text-sm">No photo yet</span>
        </div>
      )}

      {/* Error feedback */}
      {camError && (
        <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
          {camError}
        </p>
      )}

      {/* ── Action buttons ──────────────────────────────────────────────── */}
      {mode !== 'camera' && (
        <div className="flex flex-col gap-3 mt-auto">
          {mode === 'idle' && (
            <>
              <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={openCamera}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                Open Camera
              </button>

              {/* Hidden inputs */}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

              <button
                className="btn-ghost w-full flex items-center justify-center gap-2"
                onClick={() => {
                  // Use a plain file input (no capture attr) for gallery access
                  const inp = document.createElement('input')
                  inp.type = 'file'
                  inp.accept = 'image/*'
                  inp.onchange = handleFile
                  inp.click()
                }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Upload from Gallery
              </button>
            </>
          )}

          {mode === 'captured' && (
            <div className="flex gap-3">
              <button className="btn-ghost flex-1" onClick={retake}>Retake</button>
              <button
                className="btn-primary flex-1"
                onClick={() => onNext({ imagePreview: preview })}
              >
                Use This Photo →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for snapshot */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
