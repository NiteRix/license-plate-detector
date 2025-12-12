from ultralytics import YOLO
import cv2

# Load YOLO detection model (plates)
detect_model = YOLO('runs/detect/train4/weights/best.pt')

# Load YOLO classification model (letters/numbers)
cls_model = YOLO('runs/classify/train2/weights/best.pt')

# Load image
img = cv2.imread("test/car1.png")

# Detect plates
results = detect_model(img)

for result in results:
    for box in result.boxes:
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
        plate_crop = img[y1:y2, x1:x2]

        # Optional: upscale
        plate_crop = cv2.resize(plate_crop, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)

        # Classify the plate
        cls_results = cls_model(plate_crop)

        for cls_res in cls_results:
            cls_id = cls_res.probs.top1
            cls_name = cls_model.names[cls_id]
            conf = cls_res.probs.top1conf
            print(f"Predicted class: {cls_name} (confidence: {conf:.2f})")

        cv2.imshow("Plate", plate_crop)
        cv2.waitKey(0)

cv2.destroyAllWindows()
