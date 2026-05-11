import React, { useState } from 'react';
import { Play, RefreshCcw, Cpu } from 'lucide-react';

import { useVideoFrame } from '../../hooks/useVideoFrame';
import { useROIAreas } from '../../hooks/useROIAreas';

import ROICanvas from './Canvas/ROICanvas';
import LayerPanel from './HUD/LayerPanel';
import FloatingToolbar from './HUD/FloatingToolbar';

const ROISelector = ({ videoFile }) => {
  const { frameData, canvasSize } = useVideoFrame(videoFile);
  const {
    areas,
    activeAreaId,
    setActiveAreaId,
    addPoint,
    addArea,
    removeArea,
    updateAreaName
  } = useROIAreas();
  
  const [isProcessing, setIsProcessing] = useState(false);

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

      <ROICanvas 
        frameData={frameData}
        canvasSize={canvasSize}
        areas={areas}
        activeAreaId={activeAreaId}
        onPointAdd={addPoint}
        isProcessing={isProcessing}
      />

      <LayerPanel 
        areas={areas} 
        activeAreaId={activeAreaId} 
        onSetActiveArea={setActiveAreaId} 
      />

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
        onAddArea={addArea}
        onRemoveArea={removeArea}
        onSetActiveArea={setActiveAreaId}
        onUpdateAreaName={updateAreaName}
      />
    </div>
  );
};

export default ROISelector;
