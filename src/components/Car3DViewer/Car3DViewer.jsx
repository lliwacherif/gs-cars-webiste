import React, { useRef, useState, useEffect } from 'react'
import '@google/model-viewer'
import { FiRefreshCw, FiRotateCw, FiMaximize, FiMinimize, FiInfo, FiMove } from 'react-icons/fi'
import './Car3DViewer.css'

export default function Car3DViewer({ src, carName }) {
  const modelRef = useRef(null)
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [autoRotate, setAutoRotate] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    const el = modelRef.current
    if (!el) return

    const handleProgress = (event) => {
      const p = Math.round(event.detail.totalProgress * 100)
      setProgress(p)
      if (p >= 100) {
        setTimeout(() => setLoading(false), 300)
      }
    }

    const handleLoad = () => {
      setLoading(false)
      setProgress(100)
    }

    el.addEventListener('progress', handleProgress)
    el.addEventListener('load', handleLoad)

    // Hide drag hint after initial user interaction
    const handleCameraChange = () => {
      setShowHint(false)
    }
    el.addEventListener('camera-change', handleCameraChange, { once: true })

    return () => {
      el.removeEventListener('progress', handleProgress)
      el.removeEventListener('load', handleLoad)
      el.removeEventListener('camera-change', handleCameraChange)
    }
  }, [src])

  const handleResetCamera = () => {
    if (modelRef.current) {
      modelRef.current.cameraOrbit = '0deg 75deg 105%'
      modelRef.current.fieldOfView = 'auto'
    }
  }

  const toggleAutoRotate = () => {
    setAutoRotate(!autoRotate)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.log(err))
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(err => console.log(err))
    }
  }

  return (
    <div className={`car-3d-wrapper ${isFullscreen ? 'car-3d-wrapper--fullscreen' : ''}`} ref={containerRef}>
      {/* Loading Overlay */}
      {loading && (
        <div className="car-3d-loading">
          <div className="car-3d-spinner" />
          <p className="car-3d-loading-text">Chargement du modèle 3D... {progress}%</p>
          <div className="car-3d-progress-bar">
            <div className="car-3d-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Interactive Helper Hint */}
      {showHint && !loading && (
        <div className="car-3d-hint">
          <FiMove className="car-3d-hint-icon" />
          <span>Cliquez & glissez pour pivoter en 360° | Molette pour zoomer</span>
        </div>
      )}

      {/* Control Buttons Bar */}
      {!loading && (
        <div className="car-3d-toolbar">
          <button
            className={`car-3d-btn ${autoRotate ? 'car-3d-btn--active' : ''}`}
            onClick={toggleAutoRotate}
            title={autoRotate ? 'Arrêter la rotation automatique' : 'Activer la rotation automatique'}
          >
            <FiRotateCw /> <span>{autoRotate ? 'Auto: ON' : 'Auto-rotation'}</span>
          </button>

          <button className="car-3d-btn" onClick={handleResetCamera} title="Réinitialiser la vue">
            <FiRefreshCw /> <span>Reset vue</span>
          </button>

          <button className="car-3d-btn" onClick={toggleFullscreen} title="Plein écran">
            {isFullscreen ? <FiMinimize /> : <FiMaximize />} <span>{isFullscreen ? 'Quitter' : 'Plein écran'}</span>
          </button>
        </div>
      )}

      {/* 3D Model Viewer Web Component */}
      <model-viewer
        ref={modelRef}
        src={src}
        alt={`Modèle 3D interactif de ${carName}`}
        camera-controls
        touch-action="pan-y"
        auto-rotate={autoRotate ? '' : undefined}
        rotation-per-second="15deg"
        shadow-intensity="1.6"
        shadow-softness="0.8"
        exposure="1.0"
        environment-image="neutral"
        camera-orbit="0deg 75deg 105%"
        min-camera-orbit="auto 0deg auto"
        max-camera-orbit="auto 90deg auto"
        interaction-prompt="none"
        className="car-3d-canvas"
      >
        {/* Custom Fallback / Loading Slot */}
        <div slot="progress-bar" style={{ display: 'none' }} />
      </model-viewer>
    </div>
  )
}
