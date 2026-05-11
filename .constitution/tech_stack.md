# Tech Stack: Video ROI Selector

## Frontend Stack
-   **Framework**: React (Vite)
-   **Styling**: CSS Vanilla (Glassmorphism / HUD Design)
-   **Icons**: Lucide-React
-   **Architecture**: Hook-based Modular Architecture

## Backend / AI Stack (Phase 5)
-   **Framework**: FastAPI (Python 3.10+)
-   **Real-time Communication**: WebSockets (Streaming analytics to HUD)
-   **AI Framework**: PyTorch (Only `.pt` models)
-   **Computer Vision**: OpenCV (cv2)
-   **Object Detection/Tracking**: Ultralytics (YOLOv8)
-   **Config Management**: python-dotenv (.env)
-   **Data Processing**: Pandas / NumPy

## Video & Canvas Handling
-   **Video Processing**: Browser-native HTML5 Video API for frame seeking.
-   **Selection Logic**: HTML5 Canvas API for point drawing and rectangle rendering.
-   **State Management**: React Context API (if needed for global settings) or localized `useState`.

## Development Tools
-   **Environment**: Node.js.
-   **Standardization**: Spec-Driven Development using `constitution` files.
