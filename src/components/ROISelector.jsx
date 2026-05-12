import React, { useState, useCallback } from 'react';
import { Play, RefreshCcw, Cpu, BarChart2 } from 'lucide-react';

import { useVideoFrame } from '../hooks/useVideoFrame';
import { useROIAreas } from '../hooks/useROIAreas';

import ROICanvas from './Canvas/ROICanvas';
import LayerPanel from './HUD/LayerPanel';
import FloatingToolbar from './HUD/FloatingToolbar';
import AnalyticsDashboard from './Dashboard/AnalyticsDashboard';

const MAX_HISTORY = 300; // Keep last 300 data points

const ROISelector = ({ videoFile }) => {
  const { frameData, canvasSize } = useVideoFrame(videoFile);
  const { areas, activeAreaId, setActiveAreaId, addPoint, addArea, removeArea, updateAreaName } = useROIAreas();

  const [isProcessing, setIsProcessing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [liveFrame, setLiveFrame] = useState(null);
  const [history, setHistory] = useState([]);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const handleProcess = useCallback(async () => {
    if (!videoFile) return;

    setIsProcessing(true);
    setAnalytics({ status: 'uploading' });
    setLiveFrame(null);
    setHistory([]);

    try {
      // 1. Upload the file first
      const formData = new FormData();
      formData.append('file', videoFile);

      const uploadResponse = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.status === 'error') {
        throw new Error(uploadData.message || 'Upload failed');
      }

      const serverVideoPath = uploadData.path;

      // 2. Connect to WebSocket with the server-side path
      setAnalytics({ status: 'connecting' });
      const socket = new WebSocket('ws://localhost:8000/ws/analytics');

      socket.onopen = () => {
        socket.send(JSON.stringify({
          video_path: serverVideoPath,
          rois: areas.map(a => ({ id: a.id, points: a.points, name: a.name }))
        }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Merge: keep last known analytics if the new message doesn't include it
        setAnalytics(prev => ({
          ...prev,
          ...data,
          analytics: data.analytics ?? prev?.analytics,
          status: data.status ?? prev?.status,
          message: data.message ?? prev?.message
        }));

        if (data.frame_image) {
          setLiveFrame(`data:image/jpeg;base64,${data.frame_image}`);
        }

        // Accumulate history for charts (sample every ~10 frames to keep it light)
        if (data.analytics && data.frame % 10 === 0) {
          setHistory(prev => {
            const point = {
              ts: data.timestamp || (data.frame / 30),
              active_people: data.analytics.active_people,
              people_in_roi: data.analytics.people_in_roi,
              men: data.analytics.men,
              women: data.analytics.women,
              tracks: data.analytics.tracks || [],
            };
            const next = [...prev, point];
            return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
          });
        }

        if (data.status === 'completed' || data.status === 'error') {
          setIsProcessing(false);
          socket.close();
        }
      };

      socket.onerror = () => {
        setAnalytics({ status: 'error', message: 'WebSocket connection failed' });
        setIsProcessing(false);
      };

      socket.onclose = () => setIsProcessing(false);

    } catch (err) {
      console.error('Processing error:', err);
      setAnalytics({ status: 'error', message: err.message });
      setIsProcessing(false);
    }
  }, [areas, videoFile]);

  const progress = analytics?.total_frames > 0
    ? Math.round((analytics.frame / analytics.total_frames) * 100)
    : 0;

  if (!frameData) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <RefreshCcw style={{ animation: 'spin 1s linear infinite' }} size={32} color="var(--primary)" />
      <span style={{ fontSize: '0.8rem', letterSpacing: '2px', color: 'var(--text-muted)' }}>INITIALIZING BUFFER...</span>
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {isProcessing && <div className="scanner-line" />}

      {/* Main view */}
      {liveFrame ? (
        <img src={liveFrame} alt="Live AI Analysis" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      ) : (
        <ROICanvas
          frameData={frameData}
          canvasSize={canvasSize}
          areas={areas}
          activeAreaId={activeAreaId}
          onPointAdd={addPoint}
          isProcessing={isProcessing}
        />
      )}

      {/* LIVE ANALYTICS HUD */}
      {analytics && (
        <div className="glass-hud" style={{ position: 'absolute', top: '20px', left: '20px', padding: '16px', minWidth: '210px', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="var(--primary)" style={{ animation: isProcessing ? 'spin 1s linear infinite' : 'none' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px' }}>LIVE ANALYTICS</span>
            </div>
            {/* Dashboard button */}
            <button
              onClick={() => setDashboardOpen(true)}
              title="Open Dashboard"
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'rgba(168,85,247,0.15)',
                border: '1px solid rgba(168,85,247,0.4)',
                borderRadius: '6px', padding: '3px 8px', cursor: 'pointer',
                color: 'var(--primary)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.5px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(168,85,247,0.15)'}
            >
              <BarChart2 size={11} />
              BOARD
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>STATUS</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: analytics.status === 'completed' ? '#22c55e' : analytics.status === 'error' ? '#ef4444' : 'var(--primary)' }}>
                {analytics.status?.toUpperCase()}
              </span>
            </div>

            {[
              { label: 'ACTIVE PERSONS', value: analytics.analytics?.active_people, color: 'var(--primary)' },
              { label: 'INSIDE ROI',     value: analytics.analytics?.people_in_roi, color: '#10b981' },
              { label: 'TOTAL SEEN',     value: analytics.analytics?.total_seen,    color: 'var(--text-main)' },
              { label: '♂ MEN',          value: analytics.analytics?.men,           color: '#60a5fa' },
              { label: '♀ WOMEN',        value: analytics.analytics?.women,         color: '#f472b6' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color }}>{value ?? '—'}</span>
              </div>
            ))}

            {analytics.analytics?.tracks?.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>DWELL TIME</span>
                {analytics.analytics.tracks.slice(0, 4).map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.65rem', color: t.gender === 'Male' ? '#60a5fa' : '#f472b6' }}>
                      {t.gender === 'Male' ? '♂' : t.gender === 'Female' ? '♀' : '?'} ID {t.id}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>{t.dwell_seconds}s</span>
                  </div>
                ))}
              </div>
            )}

            {analytics.total_frames > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>PROGRESS</span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{progress}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progress}%`, height: '100%',
                    background: analytics.status === 'completed' ? '#22c55e' : 'linear-gradient(90deg, var(--primary), #3b82f6)',
                    transition: 'width 0.3s ease', borderRadius: '2px'
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <LayerPanel areas={areas} activeAreaId={activeAreaId} onSetActiveArea={setActiveAreaId} />

      <div style={{ position: 'absolute', bottom: '30px', right: '30px', zIndex: 110 }}>
        <button
          className="btn-process"
          onClick={handleProcess}
          disabled={isProcessing || areas.every(a => a.points.length < 3)}
        >
          {isProcessing ? <Cpu style={{ animation: 'spin 1s linear infinite' }} /> : <Play fill="white" />}
          <span>{isProcessing ? 'ANALYZING...' : 'START PROCESSING'}</span>
        </button>
      </div>

      {!isProcessing && (
        <FloatingToolbar
          areas={areas}
          activeAreaId={activeAreaId}
          onAddArea={addArea}
          onRemoveArea={removeArea}
          onSetActiveArea={setActiveAreaId}
          onUpdateAreaName={updateAreaName}
        />
      )}

      {/* Analytics Dashboard slide-over */}
      <AnalyticsDashboard
        isOpen={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
        analytics={analytics}
        history={history}
        areas={areas}
      />
    </div>
  );
};

export default ROISelector;
