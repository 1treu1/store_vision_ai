import React, { useState } from 'react'
import VideoUploader from './components/VideoUploader'
import ROISelector from './components/ROISelector'
import { Layout, Shield, BrainCircuit } from 'lucide-react'

function App() {
  const [videoFile, setVideoFile] = useState(null)

  return (
    <div className="container">
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
          <div style={{ backgroundColor: 'var(--primary)', padding: '8px', borderRadius: '12px' }}>
            <BrainCircuit size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Store Vision AI</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Herramienta de precisión para la definición de Regiones de Interés (ROI) en flujos de video para Computer Vision.
        </p>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <Shield size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.5rem' }}>1. Carga de Assets</h2>
          </div>
          <VideoUploader 
            onVideoSelect={setVideoFile} 
            selectedFile={videoFile} 
          />
        </section>

        {videoFile && (
          <section className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
              <Layout size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.5rem' }}>2. Definición de ROI</h2>
            </div>
            <ROISelector videoFile={videoFile} />
          </section>
        )}
      </main>

      <footer style={{ marginTop: '5rem', padding: '2rem 0', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          &copy; 2026 Store Vision AI - Senior Data Scientist & AI Engineering Tool
        </p>
      </footer>
    </div>
  )
}

export default App
