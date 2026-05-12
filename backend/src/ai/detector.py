import cv2
import numpy as np
import torch
from ultralytics import YOLO


class PeopleDetector:
    def __init__(self, model_path="yolov8n.pt", conf=0.4, iou=0.5):
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model = YOLO(model_path)
        self.model.to(self.device)
        self.classes = [0]  # 0 is 'person' in COCO dataset
        self.conf = conf   # Minimum confidence threshold
        self.iou = iou     # NMS IoU threshold

    def detect_and_track(self, frame):
        """
        Detect and track people in a frame.
        conf: minimum confidence to accept a detection (0.0 - 1.0)
        iou:  NMS overlap threshold (lower = fewer overlapping boxes)
        Returns the tracking results from Ultralytics.
        """
        results = self.model.track(
            source=frame,
            persist=True,
            classes=self.classes,
            conf=self.conf,
            iou=self.iou,
            verbose=False
        )
        return results[0]

    @staticmethod
    def _normalize_polygon(polygon):
        """Convert list of dicts {'x', 'y'} or list of [x, y] to numpy array."""
        if len(polygon) > 0 and isinstance(polygon[0], dict):
            return np.array([[p['x'], p['y']] for p in polygon], np.int32)
        return np.array(polygon, np.int32)

    @staticmethod
    def is_inside_roi(point, polygon):
        """Check if a single (x, y) point is inside a polygon."""
        pts = PeopleDetector._normalize_polygon(polygon)
        result = cv2.pointPolygonTest(pts, (float(point[0]), float(point[1])), False)
        return result >= 0

    @staticmethod
    def is_box_inside_roi(box, polygon):
        """
        Check if a bounding box overlaps with a polygon ROI.
        Tests 5 candidate points: 4 corners + centroid.
        Returns True as soon as any one point is inside the polygon.

        box: [x1, y1, x2, y2]
        polygon: list of dicts {'x', 'y'} or list of [x, y]
        """
        x1, y1, x2, y2 = float(box[0]), float(box[1]), float(box[2]), float(box[3])
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2

        candidate_points = [
            (x1, y1),   # top-left
            (x2, y1),   # top-right
            (x1, y2),   # bottom-left
            (x2, y2),   # bottom-right
            (cx, cy),   # centroid
        ]

        pts = PeopleDetector._normalize_polygon(polygon)
        for point in candidate_points:
            result = cv2.pointPolygonTest(pts, (float(point[0]), float(point[1])), False)
            if result >= 0:
                return True

        return False
