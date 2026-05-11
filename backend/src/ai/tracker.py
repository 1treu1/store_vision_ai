from .detector import PeopleDetector


class AnalyticsTracker:
    def __init__(self):
        # track_id (native int) -> { "start_video_ts", "last_video_ts", "roi_id", "gender" }
        self.active_tracks = {}

    def update(self, tracking_results, rois, video_timestamp: float,
               frame_bgr=None, gender_classifier=None):
        """
        Update stats based on tracking results and ROI definitions.

        tracking_results: Results from YOLOv8 track
        rois: List of { id, points, name }
        video_timestamp: Current position in the video in seconds (frame_idx / fps)
        frame_bgr: Full frame for gender crop (optional)
        gender_classifier: GenderClassifier instance (optional)
        """
        if tracking_results.boxes.id is None:
            return self.get_summary(video_timestamp)

        boxes = tracking_results.boxes.xyxy.cpu().numpy()
        ids = [int(i) for i in tracking_results.boxes.id.cpu().numpy()]

        for box, track_id in zip(boxes, ids):
            # Check any of the 5 candidate points (4 corners + centroid) against each ROI
            current_roi_id = None
            for roi in rois:
                if PeopleDetector.is_box_inside_roi(box, roi['points']):
                    current_roi_id = roi['id']
                    break

            if track_id not in self.active_tracks:
                # Classify gender once when the person is first detected
                gender = 'Unknown'
                if gender_classifier is not None and frame_bgr is not None:
                    gender = gender_classifier.predict(frame_bgr, box)

                self.active_tracks[track_id] = {
                    "start_video_ts": video_timestamp,
                    "last_video_ts": video_timestamp,
                    "roi_id": current_roi_id,
                    "gender": gender
                }
            else:
                self.active_tracks[track_id]["last_video_ts"] = video_timestamp
                self.active_tracks[track_id]["roi_id"] = current_roi_id

        return self.get_summary(video_timestamp)

    def get_summary(self, video_timestamp: float):
        """Returns a JSON-safe summary of current analytics."""
        people_in_roi = [
            {
                "id": tid,
                "roi_id": data["roi_id"],
                "dwell_seconds": round(video_timestamp - data["start_video_ts"], 1),
                "gender": data["gender"]
            }
            for tid, data in self.active_tracks.items()
            if data["roi_id"] is not None
        ]

        men   = sum(1 for t in self.active_tracks.values() if t["gender"] == "Male")
        women = sum(1 for t in self.active_tracks.values() if t["gender"] == "Female")

        return {
            "active_people": len(self.active_tracks),
            "people_in_roi": len(people_in_roi),
            "total_seen": len(self.active_tracks),
            "men": men,
            "women": women,
            "tracks": people_in_roi
        }
