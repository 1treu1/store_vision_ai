import React, { useRef, useEffect, useState } from 'react';
import { MousePointer2, RefreshCcw, Save, Trash2, Layers } from 'lucide-react';
import FloatingToolbar from './FloatingToolbar';

const COLORS = [
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];

const ROISelector = ({ videoFile }) => {
  const canvasRef = useRef(null);
  const [areas, setAreas] = useState([
    { id: 1, points: [], color: COLORS[0], name: 'Categoría 1' }
  ]);
  const [activeAreaId, setActiveAreaId] = useState(1);
  const [frameData, setFrameData] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Extract first frame
  useEffect(() => {
    if (!videoFile) return;
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoFile);
    video.src = url;
    video.preload = 'auto';
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

  // Draw logic
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
        const points = area.points;
        
        if (points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          if (points.length >= 3) {
            ctx.fillStyle = `${area.color}44`;
            ctx.fill();
          }
          ctx.strokeStyle = area.color;
          ctx.lineWidth = isActive ? 4 : 2;
          if (isActive) ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw Label for the Area
          const firstPoint = points[0];
          ctx.fillStyle = area.color;
          ctx.font = 'bold 16px Inter';
          const text = area.name;
          const textWidth = ctx.measureText(text).width;
          ctx.fillRect(firstPoint.x, firstPoint.y - 30, textWidth + 10, 25);
          ctx.fillStyle = 'white';
          ctx.fillText(text, firstPoint.x + 5, firstPoint.y - 12);
        }

        points.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, isActive ? 6 : 4, 0, Math.PI * 2);
          ctx.fillStyle = area.color;
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = isActive ? 2 : 1;
          ctx.stroke();
        });
      });
    };
  }, [frameData, areas, activeAreaId, canvasSize]);

  const handleCanvasClick = (e) => {
    if (!activeAreaId) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setAreas(prev => prev.map(area => {
      if (area.id === activeAreaId) {
        return { ...area, points: [...area.points, { x, y }] };
      }
      return area;
    }));
  };

  const addArea = () => {
    const nextId = areas.length > 0 ? Math.max(...areas.map(a => a.id)) + 1 : 1;
    const nextColor = COLORS[nextId % COLORS.length];
    const newArea = { id: nextId, points: [], color: nextColor, name: `Categoría ${nextId}` };
    setAreas([...areas, newArea]);
    setActiveAreaId(nextId);
  };

  const removeArea = (id) => {
    const newAreas = areas.filter(a => a.id !== id);
    setAreas(newAreas);
    if (activeAreaId === id) {
      setActiveAreaId(newAreas.length > 0 ? newAreas[0].id : null);
    }
  };

  const updateAreaName = (id, newName) => {
    setAreas(prev => prev.map(area => 
      area.id === id ? { ...area, name: newName } : area
    ));
  };

  const saveROI = () => {
    console.log("Exporting Areas:", areas);
    alert("Exportación enviada a consola.");
  };

  if (!frameData) return (
    <div className="glass-card p-12 flex flex-col items-center gap-4 animate-fade-in">
      <RefreshCcw className="animate-spin" color="var(--primary)" />
      <p>Procesando primer frame...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="glass-card p-4 overflow-hidden" style={{ position: 'relative', minHeight: '400px' }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onClick={handleCanvasClick}
          style={{ width: '100%', height: 'auto', borderRadius: '8px', cursor: 'crosshair', display: 'block' }}
        />
        
        <FloatingToolbar 
          areas={areas}
          activeAreaId={activeAreaId}
          onAddArea={addArea}
          onRemoveArea={removeArea}
          onSetActiveArea={setActiveAreaId}
          onUpdateAreaName={updateAreaName}
        />
      </div>

      <div className="flex justify-between items-center">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)' }}>
          <Layers size={18} />
          <span>{areas.length} Categorías</span>
        </div>
        
        <button className="btn-primary" onClick={saveROI} disabled={areas.every(a => a.points.length === 0)}>
          <Save size={18} /> Exportar Proyecto
        </button>
      </div>
    </div>
  );
};

export default ROISelector;
