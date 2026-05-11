# Tech Stack: Store Vision AI

## Frontend Stack
-   **Framework**: React (Vite)
-   **Styling**: CSS Vanilla (Glassmorphism / HUD Design)
-   **Icons**: Lucide-React
-   **Charts**: Recharts (analytics dashboard)
-   **Architecture**: Hook-based Modular Architecture

## Backend / AI Stack (Phase 5)
-   **Framework**: FastAPI (Python 3.10+)
-   **Real-time Communication**: WebSockets — streams annotated frames + analytics JSON to React HUD
-   **Object Detection & Tracking**: Ultralytics YOLOv8 (`.pt` models, COCO class 0 = person)
-   **Computer Vision**: OpenCV (frame annotation, ROI polygon test, bbox drawing)
-   **Gender Classification**: DeepFace (auto-downloads VGGFace model on first run)
-   **Config Management**: python-dotenv (`.env` — model paths, thresholds, server config)
-   **Data Processing**: NumPy

## AI Pipeline Configuration (`.env`)
-   `DETECTION_MODEL_PATH` — YOLOv8 `.pt` model file
-   `CONFIDENCE_THRESHOLD` — Minimum detection confidence (default: `0.4`)
-   `IOU_THRESHOLD` — NMS overlap threshold (default: `0.5`)
-   `GENDER_MODEL_PATH` — Optional custom gender classifier (falls back to DeepFace)

## Video & Canvas Handling
-   **ROI Drawing**: Browser-native HTML5 Canvas API
-   **Video Input**: Local file path passed via WebSocket config message
-   **Frame Streaming**: OpenCV reads video, annotates frames, encodes as base64 JPEG

## Development Tools
-   **Environment**: Node.js + Python venv (`backend/venv/`)
-   **Version Control**: Git — feature branch `feature/python-ai-backend`
-   **Standardization**: Spec-Driven Development using `.constitution/` files
