import { useState } from 'react';
import { COLORS } from '../core/constants/colors';

export const useROIAreas = () => {
  const [areas, setAreas] = useState([
    { id: 1, points: [], color: COLORS[0], name: 'Categoría 1' }
  ]);
  const [activeAreaId, setActiveAreaId] = useState(1);

  const addPoint = (x, y) => {
    if (!activeAreaId) return;
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

  return {
    areas,
    activeAreaId,
    setActiveAreaId,
    addPoint,
    addArea,
    removeArea,
    updateAreaName
  };
};
