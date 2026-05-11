import React, { useState } from 'react';
import { Upload, Video, X } from 'lucide-react';

const VideoUploader = ({ onVideoSelect, selectedFile }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        onVideoSelect(file);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onVideoSelect(e.target.files[0]);
    }
  };

  return (
    <div className="animate-fade-in">
      {!selectedFile ? (
        <label 
          className={`glass-card flex flex-col items-center justify-center p-12 border-2 border-dashed transition-all cursor-pointer
            ${dragActive ? 'border-primary bg-primary/10' : 'border-border'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <input 
            type="file" 
            className="hidden" 
            accept="video/*"
            onChange={handleChange}
            id="video-upload"
            style={{ display: 'none' }}
          />
          <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '20px', borderRadius: '50%' }}>
            <Upload size={40} color="var(--primary)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Cargar Video</h3>
            <p style={{ color: 'var(--text-muted)' }}>Arrastra y suelta un archivo de video aquí o haz clic para seleccionar</p>
          </div>
          <button className="btn-primary" onClick={() => document.getElementById('video-upload').click()}>
            Seleccionar Archivo
          </button>
        </label>
      ) : (
        <div className="glass-card p-6 flex items-center justify-between animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--primary)', padding: '10px', borderRadius: '8px' }}>
              <Video size={24} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: '500' }}>{selectedFile.name}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button 
            className="btn-secondary" 
            style={{ padding: '8px', borderRadius: '50%' }}
            onClick={() => onVideoSelect(null)}
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
