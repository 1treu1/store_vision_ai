# Project Roadmap: Video ROI Selector

## Phase 1: Foundation & Scaffolding (Current)
-   [x] Project Constitution initialization (`mission.md`, `tech_stack.md`, `roadmap.md`).
-   [x] Vite + React project initialization.
-   [x] Directory structure setup.

## Phase 2: Core Infrastructure
-   [ ] Implementation of the `VideoUploader` component.
-   [ ] Development of the `FrameExtractor` logic (extracting first frame to canvas).
-   [ ] Responsive Layout setup with a focus on "Dark Mode" premium aesthetics.

## Phase 3: Interactive Canvas & Toolbar (Completed)
-   [x] Implementation of the Floating Toolbar component.
-   [x] Multi-area selection logic (adding/removing distinct ROIs).
-   [x] Dynamic color palette assignment for each area.
-   [x] Visual feedback for point placement (coordinates, lines).
-   [x] Rectangle/Polygon validation logic.

## Phase 4: Data Export & Polish (Completed)
-   [x] ROI coordinate export (JSON format).
-   [x] Micro-animations for UI transitions (HUD).
-   [x] Architectural refactoring (Clean Architecture).

## Phase 5: Python AI Backend (In Progress)
-   [x] Architecture definition for Python codebase (FastAPI + WebSockets).
-   [x] Implementation of People Counting and Dwell Time tracking inside ROIs using YOLOv8.
-   [x] Real-time WebSocket frame streaming with annotated bounding boxes.
-   [x] Analytics Dashboard (gender pie, occupancy timeline, dwell distribution, zone activity).
-   [x] Configurable confidence/IOU thresholds via `.env`.
-   [/] Gender Classification via DeepFace (model auto-downloads on first run).
-   [ ] Export final analytics report as CSV/JSON.
