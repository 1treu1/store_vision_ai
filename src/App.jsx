import React, { useState } from 'react'
import VideoUploader from './components/Upload/VideoUploader'
import ROISelector from './components/ROISelector'
import { BrainCircuit, Activity } from 'lucide-react'

function App() {
  const [videoFile, setVideoFile] = useState(null)

  return (
    <div className="hud-container">
      {/* Immersive Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0 1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary), #7c3aed)', 
            padding: '8px', 
            borderRadius: '10px',
            boxShadow: '0 0 15px var(--primary-glow)'
          }}>
            <BrainCircuit size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.25rem', letterSpacing: '1px', fontWeight: '500', color: '#fff' }}>
            STORE VISION <span style={{ color: 'var(--text-muted)', fontWeight: '300' }}>AI</span>
          </h1>
        </div>

        <div className="glass-hud" style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: videoFile ? '#22c55e' : '#f59e0b' }}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            {videoFile ? 'READY' : 'WAITING FOR SOURCE'}
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="video-workspace">
        {!videoFile ? (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)'
          }}>
            <div style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
              <VideoUploader onVideoSelect={setVideoFile} selectedFile={videoFile} />
            </div>
          </div>
        ) : (
          <ROISelector videoFile={videoFile} />
        )}
      </main>

      {/* Footer Info */}
      <footer style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        padding: '0.5rem',
        color: 'var(--text-muted)',
        fontSize: '0.7rem',
        letterSpacing: '1px'
      }}>
        SYSTEM ENGINE V2.0 // NEURAL GROUNDING INTERFACE
      </footer>
    </div>
  )
}

export default App
