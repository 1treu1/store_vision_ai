import { useState, useEffect } from 'react';

export const useVideoFrame = (videoFile) => {
  const [frameData, setFrameData] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!videoFile) return;
    
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoFile);
    video.src = url;
    video.preload = 'auto';
    
    video.onloadedmetadata = () => { 
      video.currentTime = 0; 
    };
    
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

  return { frameData, canvasSize };
};
