# Project Mission: Video ROI Selector

## Vision
To provide a seamless, high-performance web interface for data scientists and AI engineers to define Regions of Interest (ROI) in video files. This tool serves as the first step in computer vision pipelines, enabling precise spatial grounding for object detection and tracking tasks.

## Core Objectives
1.  **Efficiency**: Allow users to quickly upload and visualize video content without server-side pre-processing.
2.  **Precision**: Enable multi-point polygon selection on the exact first frame of a video using a floating toolbar.
3.  **Multi-Area Support**: Allow defining multiple distinct ROIs, each color-coded for visual clarity.
4.  **Interoperability**: Generate standardized coordinate outputs (JSON/CSV) that can be easily consumed by downstream AI models.
5.  **Premium UX**: Deliver an immersive "HUD (Heads-Up Display)" Minimalist interface where the video takes the full workspace, with glassmorphism panels and smart floating tools.
6.  **Edge Analytics**: Implement high-performance Python-based computer vision to count people, calculate dwell time, and classify gender using only `.pt` PyTorch models.

## Success Metrics
-   Time from upload to ROI definition < 30 seconds.
-   Sub-pixel precision for coordinate selection.
-   Zero dependency on external video processing servers for basic selection.
