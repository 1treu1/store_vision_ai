/**
 * Calculates the mapped coordinates of a click event relative to the drawn image
 * inside a canvas that uses object-fit: contain.
 */
export const calculateMappedCoordinates = (clientX, clientY, canvasRef, canvasSize) => {
  if (!canvasRef.current || !canvasSize.width) return null;

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
  
  const x = (clientX - rect.left - offsetX) * scaleX;
  const y = (clientY - rect.top - offsetY) * scaleY;

  // If click is outside the actual image area (in the letterbox zone), return null
  if (x < 0 || x > canvasSize.width || y < 0 || y > canvasSize.height) {
    return null;
  }

  return { x, y };
};
