import React from 'react';
import { Layers } from 'lucide-react';

const LayerPanel = ({ areas, activeAreaId, onSetActiveArea }) => {
  return (
    <div className="glass-hud" style={{
      position: 'absolute', 
      top: '20px', 
      right: '20px', 
      width: '200px', 
      padding: '16px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <Layers size={14} color="var(--text-muted)" />
        <span style={{ fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px' }}>REGIONS OF INTEREST</span>
      </div>
      
      {areas.map(area => (
        <div key={area.id} 
          onClick={() => onSetActiveArea(area.id)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: 'pointer',
            opacity: activeAreaId === area.id ? 1 : 0.5, 
            transition: '0.2s'
          }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: area.color }}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>{area.name}</span>
        </div>
      ))}
    </div>
  );
};

export default LayerPanel;
