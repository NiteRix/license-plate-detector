from ultralytics import YOLO
from paddleocr import PaddleOCR
import cv2
import re

def process_egypt_plate(texts):
    """
    Returns:
    - arabic_letters (always separated)
    - arabic_numbers
    """

    arabic_letters = []
    arabic_numbers = []

    arabic_letter_pattern = re.compile(r'[\u0621-\u064A]')
    arabic_number_pattern = re.compile(r'[٠-٩]')

    for t in texts:
        # Remove English words
        t = re.sub(r'[A-Za-z]+', '', t)

        # Extract characters
        letters = arabic_letter_pattern.findall(t)
        numbers = arabic_number_pattern.findall(t)

        arabic_letters.extend(letters)
        arabic_numbers.extend(numbers)

    # RTL reverse letters
    arabic_letters = arabic_letters[::1]

    # Prevent Arabic joining using Zero-Width Non-Joiner
    # Example output: ل‌د‌ص
    separated_letters = "‌".join(arabic_letters)  # ZWNJ between letters

    return separated_letters, ''.join(arabic_numbers)


# Load YOLO model
MODEL_PATH = 'runs/detect/train4/weights/best.pt'
model = YOLO(MODEL_PATH)

# Initialize PaddleOCR
ocr = PaddleOCR(lang='ar', use_angle_cls=True)

# Load an image
img_path = "test/car1.png"
img = cv2.imread(img_path)

# Run detection
results = model(img)

for result in results:
    for box in result.boxes:
        # Extract bounding box (xyxy)
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)

        # Crop the license plate
        crop = img[y1:y2, x1:x2]

        # --------------------------
        # 🔥 Convert to grayscale BEFORE OCR
        # --------------------------
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        # PaddleOCR requires 3 channels — convert back to BGR
        gray_bgr = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        # --------------------------

        # OCR on the grayscale crop
        ocr_result = ocr.predict(crop)
        text = ocr_result[0]['rec_texts']
        numbers , letters = process_egypt_plate(text)
        print(text)
        print(numbers)
        print(letters)

        # Show crop (grayscale)
        cv2.namedWindow("Plate", cv2.WINDOW_NORMAL)
        cv2.imshow("Plate", crop)
        cv2.waitKey(0)

cv2.destroyAllWindows()
