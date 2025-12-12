# Egyptian License Plate Detector and OCR

This project detects Egyptian license plates in images using YOLOv8 and recognizes Arabic letters and numbers using PaddleOCR. 
It also separates Arabic letters to prevent joining and filters out unwanted text like "مصر" and "EGYPT".

## 🗂 Folder Structure (AI)
#### 🗂 runs/detect -> YOLO Model files
#### 🗂 test -> Contains test images.
#### train.py -> Used to train YOLO model (Image dataset not provided).
#### Data.yaml -> Showing train.py where dataset files are.
#### api.py -> Python file that runs API for WEB
#### liveDetection.py -> Python file that runs YOLO model.
#### Reader.py -> Python file that runs YOLO and OCR to read plate.
#### request tester.py -> Python file that is used to test API.
#### tester.py -> No function just used to test around stuff without editing important files.

## Features:

Detects license plates using YOLOv8.

Crops the detected plates.

Upscales and sharpens plates for better OCR.

Reads Arabic letters and numbers separately.

Adds Zero-Width Non-Joiner (‌) to letters to prevent joining.

Blacklists "مصر" and "EGYPT" from OCR results.
