import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Store Vision AI Backend")

# CORS setup for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Store Vision AI API is running"}

@app.websocket("/ws/analytics")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected to WebSocket")
    try:
      while True:
          # Receive ROI config or video path from client
          data = await websocket.receive_json()
          print(f"Received data: {data}")
          
          # Simulate processing frames
          for i in range(1, 101):
              import asyncio
              await asyncio.sleep(0.05) # Simulate work
              await websocket.send_json({
                  "status": "processing",
                  "progress": i,
                  "analytics": {
                      "people_count": i // 10,
                      "men": i // 20,
                      "women": (i // 10) - (i // 20),
                      "dwell_time": 15.5
                  }
              })
          
          await websocket.send_json({"status": "completed", "message": "Analysis finished"})
          
    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__main__":
    uvicorn.run(app, host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", 8000)))
