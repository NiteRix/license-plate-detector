import cv2
from ultralytics import YOLO

MODEL_PATH = 'runs/detect/train4/weights/best.pt'  # adjust path if needed
model = YOLO(MODEL_PATH)

# Load image from path
img_path = "test/many.png"
img = cv2.imread(img_path)

# Run detection
results = model(img)[0]

# Draw detections on the image
annotated = results.plot()

# Show result
cv2.imshow("Detection", annotated)
cv2.waitKey(0)
cv2.destroyAllWindows()
