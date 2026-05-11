import React, { useRef, useEffect } from 'react';
import { calculateMappedCoordinates } from '../../core/utils/geometry';

const ROICanvas = ({ frameData, canvasSize, areas, activeAreaId, onPointAdd, isProcessing }) => {
  const canvasRef = useRef(null);

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
    const coords = calculateMappedCoordinates(e.clientX, e.clientY, canvasRef, canvasSize);
    if (coords) {
      onPointAdd(coords.x, coords.y);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      onClick={handleCanvasClick}
      style={{ 
        width: '100%', 
        height: '100%', 
        objectFit: 'contain', 
        cursor: isProcessing ? 'wait' : 'crosshair',
        display: 'block'
      }}
    />
  );
};

export default ROICanvas;
