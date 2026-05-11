import React from 'react';
import { Plus, Trash2, Tag, Box } from 'lucide-react';

const FloatingToolbar = ({ 
  areas, 
  activeAreaId, 
  onAddArea, 
  onRemoveArea, 
  onSetActiveArea,
  onUpdateAreaName 
}) => {
  const activeArea = areas.find(a => a.id === activeAreaId);

  return (
    <div className="glass-hud" style={{
      position: 'absolute',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px',
      zIndex: 100,
      width: '300px'
    }}>
      {activeArea && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          paddingBottom: '8px', 
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '4px'
        }}>
          <Tag size={12} color={activeArea.color} />
          <input 
            type="text"
            value={activeArea.name}
            onChange={(e) => onUpdateAreaName(activeArea.id, e.target.value)}
            style={{
              background: 'transparent', border: 'none', color: '#fff', fontSize: '0.75rem', fontWeight: '600', outline: 'none', width: '100%', textTransform: 'uppercase', letterSpacing: '1px'
            }}
          />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {areas.map(area => (
            <button
              key={area.id}
              onClick={() => onSetActiveArea(area.id)}
              style={{
                width: '28px', height: '28px', borderRadius: '8px', backgroundColor: activeAreaId === area.id ? area.color : 'transparent', border: `1.5px solid ${area.color}`, cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: activeAreaId === area.id ? 'white' : area.color }}>{area.id}</span>
            </button>
          ))}
          <button onClick={onAddArea} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Plus size={14} />
          </button>
        </div>
        
        <button 
          onClick={() => onRemoveArea(activeAreaId)} 
          disabled={!activeAreaId}
          style={{ background: 'transparent', color: activeAreaId ? '#f87171' : '#475569', cursor: activeAreaId ? 'pointer' : 'not-allowed' }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default FloatingToolbar;
