"""
Gender Classifier using DeepFace.

DeepFace auto-downloads its models on first run. Supports VGGFace, OpenFace,
DeepID, ArcFace backends — all with PyTorch/ONNX-compatible weights under the hood.

Usage: no manual model download required, just pip install deepface.
"""

import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)


class GenderClassifier:
    def __init__(self, model_path=None):
        """
        model_path is kept for API compatibility but not needed here.
        DeepFace downloads its models automatically on first analyze() call.
        """
        self._ready = False
        self._init()

    def _init(self):
        try:
            from deepface import DeepFace  # noqa — validate import only
            self._ready = True
            logger.info("DeepFace gender classifier ready.")
        except ImportError as e:
            logger.warning(f"DeepFace not available: {e}. Gender will show as 'Unknown'.")

    def predict(self, frame_bgr: np.ndarray, box) -> str:
        """
        Predict gender from a bounding box crop.
        Returns 'Male', 'Female', or 'Unknown'.
        """
        if not self._ready:
            return 'Unknown'

        x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
        h, w = frame_bgr.shape[:2]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)

        crop = frame_bgr[y1:y2, x1:x2]
        if crop.size == 0 or crop.shape[0] < 20 or crop.shape[1] < 20:
            return 'Unknown'

        # Upscale small crops to give the face detector a chance
        min_side = min(crop.shape[:2])
        if min_side < 112:
            scale = 112 / min_side
            crop = cv2.resize(crop, None, fx=scale, fy=scale)

        try:
            from deepface import DeepFace
            result = DeepFace.analyze(
                img_path=crop,
                actions=['gender'],
                enforce_detection=False,  # don't fail if no face found
                silent=True
            )
            dominant = result[0].get('dominant_gender', 'Unknown')
            # DeepFace returns 'Man' / 'Woman' — normalize to 'Male' / 'Female'
            if dominant == 'Man':
                return 'Male'
            elif dominant == 'Woman':
                return 'Female'
            return 'Unknown'
        except Exception as e:
            logger.debug(f"Gender inference error: {e}")
            return 'Unknown'
