from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
from ultralytics import YOLO
from paddleocr import PaddleOCR
import cv2
import numpy as np
import uuid
import os
import re

app = Flask(__name__)
# Enable CORS for all routes and origins (including network access)
CORS(app, origins="*", allow_headers=["Content-Type"], methods=["GET", "POST", "OPTIONS"])

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

@app.route('/detect', methods=['POST', 'OPTIONS'])
def detect():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        print("=== DEBUG: Detection Endpoint ===")
        print(f"Request method: {request.method}")
        print(f"Request files keys: {list(request.files.keys())}")
        print(f"Request form keys: {list(request.form.keys())}")
        
        if 'image' not in request.files:
            print("ERROR: No 'image' key found in request.files")
            return jsonify({
                "error": "No image provided", 
                "available_keys": list(request.files.keys()),
                "form_keys": list(request.form.keys())
            }), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No image selected"}), 400
            
        img_bytes = file.read()
        if len(img_bytes) == 0:
            return jsonify({"error": "Empty image file"}), 400

        # Convert to OpenCV image
        img_array = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({"error": "Invalid image format"}), 400

        # YOLO detect
        results = model(image)[0]

        detections = []

        if results.boxes is not None:
            for box in results.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)

                # crop plate
                crop = image[y1:y2, x1:x2]

                # temp save
                temp_name = f"temp_{uuid.uuid4()}.jpg"
                cv2.imwrite(temp_name, crop)

                try:
                    # OCR
                    ocr_result = ocr.predict(temp_name)

                    raw_texts = ocr_result[0]['rec_texts']
                    print(f"Raw OCR texts: {raw_texts}")
                    
                    # apply your post-processing
                    letters, numbers = process_egypt_plate(raw_texts)
                    print(f"Processed - Letters: {letters}, Numbers: {numbers}")
                    
                    detections.append({
                        "bbox": [int(x1), int(y1), int(x2), int(y2)],
                        "raw_text": raw_texts,
                        "letters": letters,
                        "numbers": numbers
                    })
                except Exception as ocr_error:
                    print(f"OCR Error: {ocr_error}")
                    detections.append({
                        "bbox": [int(x1), int(y1), int(x2), int(y2)],
                        "raw_text": [],
                        "letters": "",
                        "numbers": "",
                        "error": "OCR processing failed"
                    })
                finally:
                    # delete temp file
                    if os.path.exists(temp_name):
                        os.remove(temp_name)

        response_data = {
            "count": len(detections),
            "plates": detections
        }
        
        return Response(
            json.dumps(response_data, ensure_ascii=False),
            mimetype='application/json',
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        )
        
    except Exception as e:
        print(f"Detection Error: {e}")
        return jsonify({"error": f"Detection failed: {str(e)}"}), 500



@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Flask API is running"}), 200

@app.route('/test-upload', methods=['POST', 'OPTIONS'])
def test_upload():
    """Test endpoint to debug image upload issues"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        print("=== DEBUG: Test Upload Endpoint ===")
        print(f"Request method: {request.method}")
        print(f"Request headers: {dict(request.headers)}")
        print(f"Request files: {list(request.files.keys())}")
        print(f"Request form: {dict(request.form)}")
        
        if 'image' not in request.files:
            print("ERROR: No 'image' key in request.files")
            return jsonify({
                "error": "No image provided",
                "available_keys": list(request.files.keys()),
                "form_data": dict(request.form)
            }), 400

        file = request.files['image']
        print(f"File object: {file}")
        print(f"Filename: {file.filename}")
        print(f"Content type: {file.content_type}")
        
        if file.filename == '':
            return jsonify({"error": "No image selected"}), 400
            
        img_bytes = file.read()
        print(f"Image bytes length: {len(img_bytes)}")
        
        if len(img_bytes) == 0:
            return jsonify({"error": "Empty image file"}), 400

        return jsonify({
            "status": "success",
            "filename": file.filename,
            "content_type": file.content_type,
            "size_bytes": len(img_bytes),
            "message": "Image upload test successful"
        }), 200
        
    except Exception as e:
        print(f"ERROR in test upload: {e}")
        return jsonify({"error": f"Test upload failed: {str(e)}"}), 500

if __name__ == '__main__':
    print("Starting Flask API on http://0.0.0.0:8080")
    print("Available endpoints:")
    print("  POST /detect - License plate detection")
    print("  GET /health - Health check")
    print("Network access enabled - API accessible from:")
    print("  Local: http://127.0.0.1:8080")
    print("  Network: http://192.168.1.4:8080 (or your actual IP)")
    app.run(host='0.0.0.0', port=8080, debug=True)
