import React, { useRef, useEffect, useState } from 'react';
import { Play, RefreshCcw, Layers, Trash2, Cpu } from 'lucide-react';
import FloatingToolbar from './FloatingToolbar';

const COLORS = ['#a855f7', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ec4899'];

const ROISelector = ({ videoFile }) => {
  const canvasRef = useRef(null);
  const [areas, setAreas] = useState([
    { id: 1, points: [], color: COLORS[0], name: 'Categoría 1' }
  ]);
  const [activeAreaId, setActiveAreaId] = useState(1);
  const [frameData, setFrameData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!videoFile) return;
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoFile);
    video.src = url;
    video.onloadedmetadata = () => { video.currentTime = 0; };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setFrameData(canvas.toDataURL('image/jpeg'));
      setCanvasSize({ width: video.videoWidth, height: video.videoHeight });
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);

  useEffect(() => {
    if (!frameData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = frameData;

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      areas.forEach((area) => {
        const isActive = area.id === activeAreaId;
        if (area.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(area.points[0].x, area.points[0].y);
          area.points.forEach(p => ctx.lineTo(p.x, p.y));
          if (area.points.length >= 3) {
            ctx.fillStyle = `${area.color}33`;
            ctx.fill();
          }
          ctx.strokeStyle = area.color;
          ctx.lineWidth = isActive ? 4 : 2;
          ctx.stroke();

          // Minimalist label
          ctx.fillStyle = area.color;
          ctx.font = 'bold 12px Inter';
          ctx.fillText(area.name.toUpperCase(), area.points[0].x, area.points[0].y - 10);
        }
        area.points.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, isActive ? 5 : 3, 0, Math.PI * 2);
          ctx.fillStyle = isActive ? 'white' : area.color;
          ctx.fill();
        });
      });
    };
  }, [frameData, areas, activeAreaId]);

  const handleCanvasClick = (e) => {
    if (isProcessing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    
    const canvasRatio = canvasSize.width / canvasSize.height;
    const containerRatio = rect.width / rect.height;
    
    let renderWidth, renderHeight, offsetX, offsetY;
    if (containerRatio > canvasRatio) {
      renderHeight = rect.height;
      renderWidth = rect.height * canvasRatio;
      offsetX = (rect.width - renderWidth) / 2;
      offsetY = 0;
    } else {
      renderWidth = rect.width;
      renderHeight = rect.width / canvasRatio;
      offsetX = 0;
      offsetY = (rect.height - renderHeight) / 2;
    }

    const scaleX = canvasSize.width / renderWidth;
    const scaleY = canvasSize.height / renderHeight;
    
    const x = (e.clientX - rect.left - offsetX) * scaleX;
    const y = (e.clientY - rect.top - offsetY) * scaleY;

    if (x < 0 || x > canvasSize.width || y < 0 || y > canvasSize.height) return;

    setAreas(prev => prev.map(a => a.id === activeAreaId ? { ...a, points: [...a.points, { x, y }] } : a));
  };

  const handleProcess = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 6000);
  };

  if (!frameData) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <RefreshCcw className="animate-spin" size={32} color="var(--primary)" />
      <span style={{ fontSize: '0.8rem', letterSpacing: '2px', color: 'var(--text-muted)' }}>INITIALIZING BUFFER...</span>
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {isProcessing && <div className="scanner-line"></div>}

      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleCanvasClick}
        style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'crosshair' }}
      />

      {/* Floating Category List (Right) */}
      <div className="glass-hud" style={{
        position: 'absolute', top: '20px', right: '20px', width: '200px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Layers size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px' }}>REGIONS OF INTEREST</span>
        </div>
        {areas.map(area => (
          <div key={area.id} 
            onClick={() => setActiveAreaId(area.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              opacity: activeAreaId === area.id ? 1 : 0.5, transition: '0.2s'
            }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: area.color }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>{area.name}</span>
          </div>
        ))}
      </div>

      {/* Main Action Button (Bottom Right) */}
      <div style={{ position: 'absolute', bottom: '30px', right: '30px', zIndex: 110 }}>
        <button 
          className="btn-process" 
          onClick={handleProcess} 
          disabled={isProcessing || areas.every(a => a.points.length < 3)}
        >
          {isProcessing ? <Cpu className="animate-spin" /> : <Play fill="white" />}
          <span>{isProcessing ? 'ANALYZING FLUX...' : 'START PROCESSING'}</span>
        </button>
      </div>

      <FloatingToolbar 
        areas={areas}
        activeAreaId={activeAreaId}
        onAddArea={() => {
          const id = areas.length + 1;
          const newArea = { id, points: [], color: COLORS[id % COLORS.length], name: `Categoría ${id}` };
          setAreas([...areas, newArea]);
          setActiveAreaId(id);
        }}
        onRemoveArea={(id) => {
          const filtered = areas.filter(a => a.id !== id);
          setAreas(filtered);
          if (activeAreaId === id) setActiveAreaId(filtered[0]?.id);
        }}
        onSetActiveArea={setActiveAreaId}
        onUpdateAreaName={(id, name) => setAreas(areas.map(a => a.id === id ? { ...a, name } : a))}
      />
    </div>
  );
};

export default ROISelector;
