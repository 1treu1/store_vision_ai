import uvicorn
import cv2
import os
import base64
import asyncio
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
from pathlib import Path
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

# Ensure uploads directory exists
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def draw_annotations(frame, tracking_results, rois, tracker_state):
    """Draw elegant, HUD-style bounding boxes and ROI polygons."""
    annotated = frame.copy()
    overlay = frame.copy()
    
    # Colors (BGR)
    COLOR_PURPLE = (247, 85, 168)
    COLOR_GREEN = (94, 197, 34)
    COLOR_WHITE = (240, 240, 240)
    COLOR_DARK = (42, 23, 15)  # #0f172a
    
    # Draw ROI polygons
    for roi in rois:
        pts = [[p['x'], p['y']] for p in roi['points']] if roi['points'] and isinstance(roi['points'][0], dict) else roi['points']
        if len(pts) >= 3:
            pts_array = np.array(pts, np.int32)
            # Technical border
            cv2.polylines(annotated, [pts_array], isClosed=True, color=COLOR_PURPLE, thickness=1, lineType=cv2.LINE_AA)
            # Soft fill on overlay
            cv2.fillPoly(overlay, [pts_array], color=COLOR_PURPLE)
            
            # ROI label with small glass box
            label = roi['name'].upper()
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            tx, ty = pts_array[0][0], pts_array[0][1] - 8
            cv2.rectangle(annotated, (tx, ty - th - 6), (tx + tw + 8, ty + 4), COLOR_DARK, -1)
            cv2.putText(annotated, label, (tx + 4, ty), cv2.FONT_HERSHEY_SIMPLEX, 0.45, COLOR_PURPLE, 1, cv2.LINE_AA)

    # Apply ROI fill overlay (alpha blend)
    cv2.addWeighted(overlay, 0.08, annotated, 0.92, 0, annotated)

    # Draw bounding boxes for each tracked person
    if tracking_results.boxes.id is not None:
        boxes = tracking_results.boxes.xyxy.cpu().numpy()
        ids = [int(i) for i in tracking_results.boxes.id.cpu().numpy()]

        for box, track_id in zip(boxes, ids):
            x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
            
            in_roi = any(PeopleDetector.is_box_inside_roi(box, roi['points']) for roi in rois)
            color = COLOR_GREEN if in_roi else COLOR_WHITE
            
            # 1. Subtle full rectangle
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 1, cv2.LINE_AA)
            
            # 2. Technical HUD Corners (thicker than the main box)
            l = min(15, (x2-x1)//4, (y2-y1)//4)
            # TL
            cv2.line(annotated, (x1, y1), (x1 + l, y1), color, 2, cv2.LINE_AA)
            cv2.line(annotated, (x1, y1), (x1, y1 + l), color, 2, cv2.LINE_AA)
            # TR
            cv2.line(annotated, (x2, y1), (x2 - l, y1), color, 2, cv2.LINE_AA)
            cv2.line(annotated, (x2, y1), (x2, y1 + l), color, 2, cv2.LINE_AA)
            # BL
            cv2.line(annotated, (x1, y2), (x1 + l, y2), color, 2, cv2.LINE_AA)
            cv2.line(annotated, (x1, y2), (x1, y2 - l), color, 2, cv2.LINE_AA)
            # BR
            cv2.line(annotated, (x2, y2), (x2 - l, y2), color, 2, cv2.LINE_AA)
            cv2.line(annotated, (x2, y2), (x2, y2 - l), color, 2, cv2.LINE_AA)

            # 3. Info Label (Modern HUD style)
            gender = tracker_state.get(track_id, {}).get('gender', 'Unknown')
            g_icon = 'M' if gender == 'Male' else ('F' if gender == 'Female' else '?')
            dwell = tracker_state.get(track_id, {}).get('dwell_seconds', 0)
            
            label = f"ID:{track_id} [{g_icon}]"
            if in_roi: label += f" {dwell:.1f}S"
            
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
            # Background box
            cv2.rectangle(annotated, (x1, y1 - th - 10), (x1 + tw + 8, y1), COLOR_DARK, -1)
            # Label text
            cv2.putText(annotated, label, (x1 + 4, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1, cv2.LINE_AA)

    return annotated

    return annotated


@app.get("/")
async def root():
    return {"status": "online", "model": "YOLOv8n"}


@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file to the server."""
    try:
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "filename": file.filename,
            "path": str(file_path.absolute()),
            "status": "success"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.websocket("/ws/analytics")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    tracker = AnalyticsTracker()

    try:
        config = await websocket.receive_json()
        video_path = config.get("video_path")
        rois = config.get("rois", [])

        if not video_path or not os.path.exists(video_path):
            await websocket.send_json({
                "status": "error", 
                "message": f"Video not found on server: {video_path}"
            })
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
                    "timestamp": video_timestamp,
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
