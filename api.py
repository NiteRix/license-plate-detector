from flask import Flask, request, jsonify,Response
import json
from ultralytics import YOLO
from paddleocr import PaddleOCR
import cv2
import numpy as np
import uuid
import os
import re

app = Flask(__name__)

# Load YOLO model
model = YOLO("runs/detect/train4/weights/last.pt")

# Load OCR
ocr = PaddleOCR(lang="ar")

def process_egypt_plate(texts):
    """
    Input: list of OCR strings
    Returns:
      - separated arabic letters (RTL-safe)
      - arabic numbers only
    """

    arabic_letters = []
    arabic_numbers = []

    arabic_letter_pattern = re.compile(r'[\u0621-\u064A]')
    arabic_number_pattern = re.compile(r'[٠-٩]')

    for t in texts:
        # remove English
        t = re.sub(r'[A-Za-z]+', '', t)

        # extract characters
        letters = arabic_letter_pattern.findall(t)
        numbers = arabic_number_pattern.findall(t)

        arabic_letters.extend(letters)
        arabic_numbers.extend(numbers)

    # prevent Arabic glyph joining using ZWNJ
    separated_letters = "‌".join(arabic_letters)

    return separated_letters, ''.join(arabic_numbers)



# Main Detection Endpoint

@app.route('/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files['image']
    img_bytes = file.read()

    # Convert to OpenCV image
    img_array = np.frombuffer(img_bytes, np.uint8)
    image = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    # YOLO detect
    results = model(image)[0]

    detections = []

    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)

        # crop plate
        crop = image[y1:y2, x1:x2]

        # temp save
        temp_name = f"temp_{uuid.uuid4()}.jpg"
        cv2.imwrite(temp_name, crop)

        # OCR
        ocr_result = ocr.predict(temp_name)

        raw_texts = ocr_result[0]['rec_texts']
        print(raw_texts)
        # apply your post-processing
        letters, numbers = process_egypt_plate(raw_texts)
        print(letters)
        print(numbers)
        detections.append({
            "bbox": [int(x1), int(y1), int(x2), int(y2)],
            "raw_text": raw_texts,
            "letters": letters,
            "numbers": numbers
        })
        # delete temp file
        os.remove(temp_name)

    return Response(
        json.dumps({
            "count": len(detections),
            "plates": detections
        }, ensure_ascii=False),
        mimetype='application/json'
    )



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
