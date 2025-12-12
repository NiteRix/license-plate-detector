from ultralytics import YOLO
from paddleocr import PaddleOCR
import cv2
import re
import numpy as np

def debug_crop(crop, label=""):
    print(f"--- DEBUG ({label}) ---")

    # Print shape
    print("Shape:", crop.shape)

    # Sharpness (variance of Laplacian)
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
    print("Sharpness:", sharpness)

    # Brightness & contrast
    print("Mean Brightness:", np.mean(gray))
    print("Std Contrast:", np.std(gray))

    # Histogram signature
    hist = cv2.calcHist([gray], [0], None, [8], [0,256]).flatten()
    print("Histogram (8 bins):", hist)

    print("----------------------\n")

def process_egypt_plate(texts):
    """
    Returns:
    - arabic_letters (always separated)
    - arabic_numbers
    """

    blacklist = {"مصر", "EGYPT"}  # words you want to skip

    arabic_letters = []
    arabic_numbers = []

    arabic_letter_pattern = re.compile(r'[\u0621-\u064A]')
    arabic_number_pattern = re.compile(r'[٠-٩]')

    for t in texts:

        # Skip blacklisted words
        if any(b in t for b in blacklist):
            continue

        # Extract characters
        letters = arabic_letter_pattern.findall(t)
        numbers = arabic_number_pattern.findall(t)

        arabic_letters.extend(letters)
        arabic_numbers.extend(numbers)

    # Prevent Arabic joining using Zero-Width Non-Joiner
    separated_letters = " ‌".join(arabic_letters)

    return separated_letters, ''.join(arabic_numbers)

model_name = 'Model 4' # for debug purposes

# Load YOLO model
MODEL_PATH = 'runs/detect/train4/weights/best.pt'
model = YOLO(MODEL_PATH)


# Initialize PaddleOCR
ocr = PaddleOCR(lang='ar',
                use_textline_orientation=True,
                # text_det_thresh=0.5,
                )

# Load an image
img_path = "test/car1.png"
img = cv2.imread(img_path)

# Run detection
results = model(img)

for result in results:
    for box in result.boxes:

        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int) # Extract bounding box (xyxy)

        crop = img[y1:y2, x1:x2] # Crop the license plate



        # gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        # gray_bgr = cv2.cvtColor(crop, cv2.COLOR_GRAY2BGR) # grayscale version:

        crop = cv2.resize(crop, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC) # upscale

        # debug_crop(crop,model_name) # debug crop image data

        ocr_result = ocr.predict(crop)  # replace "crop" with "gray" to detect grayscale
        text = ocr_result[0]['rec_texts']
        numbers , letters = process_egypt_plate(text)
        print(text)
        print(numbers)
        print(letters)

        cv2.namedWindow("Plate", cv2.WINDOW_NORMAL)
        cv2.imshow("Plate", crop)
        cv2.waitKey(0)

cv2.destroyAllWindows()
