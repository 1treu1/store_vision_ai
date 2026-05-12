import time
import numpy as np
from .detector import PeopleDetector


class AnalyticsTracker:
    def __init__(self, recovery_max_time=10.0):
        # track_id -> { "last_pos", "velocity", "total_dwell", "last_roi_id", "last_video_ts", "is_active", "gender" }
        self.tracks = {}
        self.next_mid = 1
        # YOLO ID -> Persistent MID
        self.yolo_map = {}
        self.recovery_max_time = recovery_max_time

    def _get_centroid(self, box):
        x1, y1, x2, y2 = box
        return ((x1 + x2) / 2, (y1 + y2) / 2)

    def _calculate_iou(self, box1, box2):
        x1_1, y1_1, x1_2, y1_2 = box1
        x2_1, y2_1, x2_2, y2_2 = box2
        
        xi1 = max(x1_1, x2_1)
        yi1 = max(y1_1, y2_1)
        xi2 = min(x1_2, x2_2)
        yi2 = min(y1_2, y2_2)
        
        inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)
        box1_area = (x1_2 - x1_1) * (y1_2 - y1_1)
        box2_area = (x2_2 - x2_1) * (y2_2 - y2_1)
        
        return inter_area / float(box1_area + box2_area - inter_area + 1e-6)

    def update(self, tracking_results, rois, video_timestamp: float,
               frame_bgr=None, gender_classifier=None):
        
        current_detections = []
        if tracking_results.boxes.id is not None:
            boxes = tracking_results.boxes.xyxy.cpu().numpy()
            yolo_ids = [int(i) for i in tracking_results.boxes.id.cpu().numpy()]
            for box, yid in zip(boxes, yolo_ids):
                current_detections.append({
                    "box": box,
                    "yid": yid,
                    "centroid": self._get_centroid(box)
                })

        # 1. Prediction Step: Move all existing tracks based on their velocity
        # BUT only update time/dwell for GHOSTS. Active tracks update in _update_track.
        for tid, track in self.tracks.items():
            dt = video_timestamp - track["last_video_ts"]
            if dt > 0:
                vx, vy = track.get("velocity", (0, 0))
                # Predict new position
                track["last_pos"] = (
                    track["last_pos"][0] + vx * dt,
                    track["last_pos"][1] + vy * dt
                )
                
                # If they are GHOSTS, update their dwell time and timestamp here
                if not track["is_active"]:
                    if track["last_roi_id"] is not None:
                        track["total_dwell"] += dt
                    track["last_video_ts"] = video_timestamp

        # 2. Association Step: Match YOLO detections to existing tracks
        # We prioritize matching by YOLO ID first (if we have a mapping)
        unmatched_detections = []
        matched_tids = set()

        for det in current_detections:
            yid = det["yid"]
            matched = False
            
            # A. Try exact YOLO ID match
            if yid in self.yolo_map:
                tid = self.yolo_map[yid]
                if tid in self.tracks:
                    self._update_track(tid, det, rois, video_timestamp)
                    matched_tids.add(tid)
                    matched = True
            
            # B. Try Spatial Match (Proximity/IOU) if not matched by ID
            if not matched:
                best_tid = None
                best_score = 0
                
                for tid, track in self.tracks.items():
                    if tid in matched_tids: continue
                    
                    # Distance Score
                    dist = np.sqrt((det["centroid"][0] - track["last_pos"][0])**2 + 
                                   (det["centroid"][1] - track["last_pos"][1])**2)
                    
                    # IOU Score (if we had a box)
                    iou = 0
                    if "last_box" in track:
                        iou = self._calculate_iou(det["box"], track["last_box"])
                    
                    # Heuristic score
                    score = iou * 100 + (1.0 / (dist + 1.0)) * 500
                    
                    if score > best_score and (dist < 300 or iou > 0.3):
                        best_score = score
                        best_tid = tid
                
                if best_tid is not None:
                    print(f"[TRACKER] Re-associating track {best_tid} to new YOLO ID {yid}")
                    self.yolo_map[yid] = best_tid
                    self._update_track(best_tid, det, rois, video_timestamp)
                    matched_tids.add(best_tid)
                    matched = True
                else:
                    unmatched_detections.append(det)

        # 3. Create new tracks for unmatched detections
        for det in unmatched_detections:
            tid = self.next_mid
            self.next_mid += 1
            print(f"[TRACKER] New track created: {tid} (YOLO {det['yid']})")
            
            gender = 'Unknown'
            if gender_classifier and frame_bgr is not None:
                gender = gender_classifier.predict(frame_bgr, det["box"])
                
            self.tracks[tid] = {
                "gender": gender,
                "total_dwell": 0.0,
                "last_roi_id": None, # Will be set in _update_track
                "last_video_ts": video_timestamp,
                "last_pos": det["centroid"],
                "last_box": det["box"],
                "velocity": (0, 0),
                "is_active": True
            }
            self.yolo_map[det["yid"]] = tid
            self._update_track(tid, det, rois, video_timestamp)
            matched_tids.add(tid)

        # 4. Mark unmatched tracks as inactive (Ghosts)
        for tid, track in self.tracks.items():
            if tid not in matched_tids:
                if track["is_active"]:
                    print(f"[TRACKER] Track {tid} lost -> Ghost Mode")
                    track["is_active"] = False

        # 5. Cleanup expired tracks
        expired = [tid for tid, track in self.tracks.items() 
                   if video_timestamp - track["last_video_ts"] > self.recovery_max_time]
        for tid in expired:
            print(f"[TRACKER] Deleting track {tid} (timeout)")
            del self.tracks[tid]
            # Remove from yolo_map
            yids = [y for y, m in self.yolo_map.items() if m == tid]
            for y in yids: del self.yolo_map[y]

        return self.get_summary(video_timestamp)

    def _update_track(self, tid, det, rois, ts):
        track = self.tracks[tid]
        dt = ts - track["last_video_ts"]
        
        # Calculate ROI
        current_roi_id = None
        for roi in rois:
            if PeopleDetector.is_box_inside_roi(det["box"], roi['points']):
                current_roi_id = roi['id']
                break

        if dt > 0 and track["is_active"]:
            # Update velocity
            vx = (det["centroid"][0] - track["last_pos"][0]) / dt
            vy = (det["centroid"][1] - track["last_pos"][1]) / dt
            alpha = 0.7
            old_vx, old_vy = track.get("velocity", (0,0))
            track["velocity"] = (alpha * vx + (1-alpha)*old_vx, alpha * vy + (1-alpha)*old_vy)
            
            # Accumulate dwell
            if track["last_roi_id"] is not None:
                track["total_dwell"] += dt

        track["last_pos"] = det["centroid"]
        track["last_box"] = det["box"]
        track["last_roi_id"] = current_roi_id
        track["last_video_ts"] = ts
        track["is_active"] = True

    def get_summary(self, video_timestamp: float):
        # Maintain cumulative stats to offload frontend calculation
        dwell_buckets = [
            {"name": "<15s", "count": 0},
            {"name": "15s-1m", "count": 0},
            {"name": "1-5m", "count": 0},
            {"name": ">5m", "count": 0},
        ]
        
        # Zone unique visitors (Cumulative)
        if not hasattr(self, "zone_visits"): self.zone_visits = {} 
        
        for tid, data in self.tracks.items():
            # Dwell buckets
            d = data["total_dwell"]
            if d < 15: dwell_buckets[0]["count"] += 1
            elif d < 60: dwell_buckets[1]["count"] += 1
            elif d < 300: dwell_buckets[2]["count"] += 1
            else: dwell_buckets[3]["count"] += 1
            
            # Record zone visit
            if data["last_roi_id"] is not None:
                if tid not in self.zone_visits: self.zone_visits[tid] = set()
                self.zone_visits[tid].add(data["last_roi_id"])

        zone_activity = {}
        for tid, visited_rois in self.zone_visits.items():
            for rid in visited_rois:
                zone_activity[rid] = zone_activity.get(rid, 0) + 1

        people_in_roi = []
        for tid, data in self.tracks.items():
            if data["last_roi_id"] is not None:
                lx, ly = data["last_pos"]
                people_in_roi.append({
                    "id": tid,
                    "roi_id": data["last_roi_id"],
                    "dwell_seconds": round(float(data["total_dwell"]), 1),
                    "gender": data["gender"],
                    "is_ghost": not data["is_active"],
                    "last_pos": (float(lx), float(ly))
                })

        men   = sum(1 for t in self.tracks.values() if t["gender"] == "Male")
        women = sum(1 for t in self.tracks.values() if t["gender"] == "Female")
        active_now = sum(1 for t in self.tracks.values() if t["is_active"])

        if not hasattr(self, "peak_occupancy"): self.peak_occupancy = 0
        self.peak_occupancy = max(self.peak_occupancy, active_now)

        return {
            "active_people": active_now,
            "people_in_roi": len(people_in_roi),
            "total_seen": len(self.tracks),
            "men": men,
            "women": women,
            "tracks": people_in_roi,
            "id_map": self.yolo_map,
            "dwell_buckets": dwell_buckets,
            "zone_activity": zone_activity,
            "peak_occupancy": self.peak_occupancy,
            "avg_dwell": round(sum(t["total_dwell"] for t in self.tracks.values()) / max(1, len(self.tracks)), 1)
        }
