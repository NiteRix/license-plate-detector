from ultralytics import YOLO

if __name__ == "__main__":
    # Load a small base model — good for starting / real-time use
    model = YOLO('yolov8n.pt')

    # Start training
    model.train(
        data='data.yaml',
        epochs=30,
        imgsz=640,
        batch=16,
        device=0, # use "cpu" for now since your GPU is not detected
        workers=0
    )