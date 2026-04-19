import { useState, useRef, useEffect, useCallback } from 'react'

export default function Step1Camera({ onNext }) {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const [stream,   setStream]   = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [mode,     setMode]     = useState('idle')   // idle | camera | captured
  const [camError, setCamError] = useState(null)
  const [gpsState, setGpsState] = useState(null)     // null | 'acquiring' | {lat,lng} | 'unavailable'

  const stopStream = useCallback((s) => {
    s?.getTracks().forEach((t) => t.stop())
  }, [])

  useEffect(() => () => stopStream(stream), [stream, stopStream])

  function acquireGps() {
    if (!navigator.geolocation) {
      setGpsState('unavailable')
      return
    }
    setGpsState('acquiring')
    navigator.geolocation.getCurrentPosition(
      (pos) => setGpsState({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGpsState('unavailable'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  async function openCamera() {
    setCamError(null)
    acquireGps()
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      setStream(s)
      setMode('camera')
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = s
      })
    } catch {
      setCamError('Camera access required. CivicLens only accepts live photos for authenticity.')
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
    setGpsState(null)
  }

  function usePhoto() {
    const capturedAt = new Date().toISOString()
    const captureGps = gpsState && typeof gpsState === 'object' ? gpsState : null
    onNext({ imagePreview: preview, capturedAt, captureGps, isLiveCapture: true })
  }

  return (
    <div className="flex flex-col min-h-full p-5 gap-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Take a Live Photo</h2>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
          CivicLens only accepts live camera photos to ensure authenticity.
        </p>
      </div>

      {/* Camera live preview */}
      {mode === 'camera' && (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] w-full">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

          {/* Viewfinder corners */}
          <div className="absolute inset-4 pointer-events-none">
            {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
              <div key={i} className={`absolute w-6 h-6 ${pos} ${
                pos.includes('right') ? 'border-r-2' : 'border-l-2'
              } ${pos.includes('bottom') ? 'border-b-2' : 'border-t-2'} border-amber-400 rounded-sm`} />
            ))}
          </div>

          {/* GPS indicator */}
          <div className="absolute top-3 left-3">
            {gpsState === 'acquiring' && (
              <span className="text-[10px] bg-black/60 text-amber-300 px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 3v1m0 16v1" /></svg>
                Acquiring GPS…
              </span>
            )}
            {gpsState && typeof gpsState === 'object' && (
              <span className="text-[10px] bg-green-500/80 text-white px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                GPS ready
              </span>
            )}
          </div>

          <button
            onClick={capturePhoto}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-slate-900 dark:border-amber-500 shadow-lg touch-manipulation active:scale-95 transition-transform"
            aria-label="Capture photo"
          />
          <button
            onClick={() => { stopStream(stream); setStream(null); setMode('idle'); setGpsState(null) }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center touch-manipulation"
          >
            ✕
          </button>
        </div>
      )}

      {/* Captured preview */}
      {mode === 'captured' && preview && (
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] w-full">
          <img src={preview} alt="Captured" className="w-full h-full object-cover" />
          <div className="absolute top-3 right-3 bg-green-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            📸 Live Capture ✓
          </div>
          {gpsState && typeof gpsState === 'object' && (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
              {gpsState.lat.toFixed(4)}, {gpsState.lng.toFixed(4)}
            </div>
          )}
        </div>
      )}

      {/* Idle placeholder */}
      {mode === 'idle' && (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 bg-white dark:bg-transparent aspect-[4/3] flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-zinc-600">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          <span className="text-sm">No photo yet</span>
        </div>
      )}

      {/* Camera error */}
      {camError && (
        <div className="card p-4 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-300">{camError}</p>
        </div>
      )}

      {/* Action buttons */}
      {mode !== 'camera' && (
        <div className="flex flex-col gap-3 mt-auto">
          {mode === 'idle' && (
            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={openCamera}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              Open Camera
            </button>
          )}

          {mode === 'captured' && (
            <div className="flex gap-3">
              <button className="btn-ghost flex-1" onClick={retake}>Retake</button>
              <button className="btn-primary flex-1" onClick={usePhoto}>
                Use This Photo →
              </button>
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
