import React from 'react';
import { Plus, Trash2, Box, Tag } from 'lucide-react';

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
    <div className="glass-card" style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px 16px',
      zIndex: 100,
      minWidth: '400px',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
    }}>
      {/* Top Row: Active Area Name Editor */}
      {activeArea && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          paddingBottom: '8px', 
          borderBottom: '1px solid var(--border)',
          marginBottom: '4px'
        }}>
          <Tag size={14} color={activeArea.color} />
          <input 
            type="text"
            value={activeArea.name}
            onChange={(e) => onUpdateAreaName(activeArea.id, e.target.value)}
            placeholder="Nombre de la categoría..."
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              fontWeight: '500',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>
      )}

      {/* Bottom Row: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', 
            padding: '4px', 
            backgroundColor: 'rgba(255,255,255,0.05)', 
            borderRadius: '8px',
            gap: '4px'
          }}>
            <button 
              className="tool-btn" 
              style={{ 
                padding: '6px', 
                borderRadius: '6px', 
                backgroundColor: 'var(--primary)',
                color: 'white'
              }}
            >
              <Box size={18} />
            </button>
          </div>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)', margin: '0 4px' }} />
          
          <div style={{ display: 'flex', gap: '6px', maxWidth: '240px', overflowX: 'auto', paddingBottom: '2px' }}>
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() => onSetActiveArea(area.id)}
                style={{
                  minWidth: '32px',
                  height: '32px',
                  borderRadius: '16px',
                  backgroundColor: activeAreaId === area.id ? area.color : 'transparent',
                  border: `2px solid ${area.color}`,
                  color: activeAreaId === area.id ? 'white' : area.color,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: activeAreaId === area.id ? '0 10px' : '0',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
                title={area.name}
              >
                {activeAreaId === area.id ? area.name : area.id}
              </button>
            ))}
            <button
              onClick={onAddArea}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px dashed var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <button 
          onClick={() => onRemoveArea(activeAreaId)}
          disabled={!activeAreaId}
          style={{ 
            padding: '6px', 
            color: activeAreaId ? '#ef4444' : 'var(--text-muted)',
            cursor: activeAreaId ? 'pointer' : 'not-allowed',
            background: 'transparent'
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default FloatingToolbar;
