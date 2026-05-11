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

## Phase 5: Python AI Backend (New)
-   [ ] Architecture definition for Python codebase (Tracking & Demographics).
-   [ ] Implementation of People Counting and Dwell Time tracking inside ROIs using `.pt` models.
-   [ ] Integration of Gender Classification model (Men/Women).
-   [ ] Creation of processing pipeline (loading ROI JSON, parsing video, outputting stats).
