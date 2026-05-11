import uvicorn
import cv2
import os
import base64
import asyncio
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from src.ai.detector import PeopleDetector
from src.ai.tracker import AnalyticsTracker
from src.ai.gender_classifier import GenderClassifier

load_dotenv()

app = FastAPI(title="Store Vision AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = PeopleDetector(
    model_path=os.getenv("DETECTION_MODEL_PATH", "yolov8n.pt"),
    conf=float(os.getenv("CONFIDENCE_THRESHOLD", 0.4)),
    iou=float(os.getenv("IOU_THRESHOLD", 0.5)),
)
gender_clf = GenderClassifier(model_path=os.getenv("GENDER_MODEL_PATH", None))


def draw_annotations(frame, tracking_results, rois, tracker_state):
    """Draw bounding boxes, labels, and ROI polygons onto the frame."""
    annotated = frame.copy()

    # Draw ROI polygons
    for roi in rois:
        pts = [[p['x'], p['y']] for p in roi['points']] if roi['points'] and isinstance(roi['points'][0], dict) else roi['points']
        if len(pts) >= 3:
            pts_array = np.array(pts, np.int32)
            cv2.polylines(annotated, [pts_array], isClosed=True, color=(168, 85, 247), thickness=2)
            overlay = annotated.copy()
            cv2.fillPoly(overlay, [pts_array], color=(168, 85, 247))
            cv2.addWeighted(overlay, 0.15, annotated, 0.85, 0, annotated)
            # ROI label
            cv2.putText(annotated, roi['name'].upper(), tuple(pts_array[0]),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (168, 85, 247), 2)

    # Draw bounding boxes for each tracked person
    if tracking_results.boxes.id is not None:
        boxes = tracking_results.boxes.xyxy.cpu().numpy()
        ids = [int(i) for i in tracking_results.boxes.id.cpu().numpy()]

        for box, track_id in zip(boxes, ids):
            x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
            feet_x = (x1 + x2) / 2
            feet_y = y2

            # Check if any point of the bbox is inside any ROI
            in_roi = any(
                PeopleDetector.is_box_inside_roi(box, roi['points'])
                for roi in rois
            )

            # Vivid high-contrast colors: lime-green inside ROI, white outside
            color     = (0, 255, 128) if in_roi else (255, 255, 255)
            bg_color  = (0, 0, 0)   # dark outline for contrast

            # Draw dark outline (thickness + 2) first, then the vivid color on top
            cv2.rectangle(annotated, (x1, y1), (x2, y2), bg_color, 5)
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 3)

            # Gender label (M/F/?) with icon-like prefix
            gender = tracker_state.get(track_id, {}).get('gender', 'Unknown')
            gender_icon = '♂' if gender == 'Male' else ('♀' if gender == 'Female' else '?')
            dwell = tracker_state.get(track_id, {}).get('dwell_seconds', 0)
            label = f"{gender_icon} ID:{track_id}  {dwell:.1f}s" if in_roi else f"{gender_icon} ID:{track_id}"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
            cv2.rectangle(annotated, (x1, y1 - th - 12), (x1 + tw + 6, y1), bg_color, -1)
            cv2.putText(annotated, label, (x1 + 3, y1 - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)

    return annotated


@app.get("/")
async def root():
    return {"status": "online", "model": "YOLOv8n"}


@app.websocket("/ws/analytics")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    tracker = AnalyticsTracker()

    try:
        config = await websocket.receive_json()
        video_path = config.get("video_path")
        rois = config.get("rois", [])

        if not video_path or not os.path.exists(video_path):
            await websocket.send_json({"error": f"Video not found: {video_path}"})
            return

        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_idx = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Process every 3rd frame for performance
            if frame_idx % 3 == 0:
                video_timestamp = frame_idx / fps
                results = detector.detect_and_track(frame)
                summary = tracker.update(results, rois, video_timestamp,
                                         frame_bgr=frame, gender_classifier=gender_clf)

                # Draw annotations on frame
                annotated_frame = draw_annotations(frame, results, rois, {t['id']: t for t in summary['tracks']})

                # Resize for bandwidth efficiency (max width 960px)
                h, w = annotated_frame.shape[:2]
                if w > 960:
                    scale = 960 / w
                    annotated_frame = cv2.resize(annotated_frame, (960, int(h * scale)))

                # Encode as JPEG base64
                _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
                frame_b64 = base64.b64encode(buffer).decode('utf-8')

                await websocket.send_json({
                    "status": "processing",
                    "frame": frame_idx,
                    "total_frames": total_frames,
                    "frame_image": frame_b64,
                    "analytics": summary
                })

            frame_idx += 1
            await asyncio.sleep(0.001)

        cap.release()
        final_summary = tracker.get_summary(frame_idx / fps)
        await websocket.send_json({
            "status": "completed",
            "message": "Video analysis complete",
            "frame": frame_idx,
            "total_frames": total_frames,
            "analytics": final_summary
        })

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
        try:
            await websocket.send_json({"status": "error", "message": str(e)})
        except Exception:
            pass


if __name__ == "__main__":
    uvicorn.run(app, host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", 8000)))
