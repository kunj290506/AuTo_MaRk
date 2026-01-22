# AutoMark - High Accuracy Image Annotation Tool

**AutoMark Pro** is a premium, AI-powered automatic image annotation tool designed to generate high-quality datasets instantly. It uses the state-of-the-art **SAM 2.1 Large (Segment Anything Model)** to provide industrial-grade detection accuracy.

## Key Features

- **State-of-the-Art Accuracy**: Uses the massive **SAM 2.1 Large** model for precise segmentation and detection.
- **Smart Filename Labeling**: Automatically extracts class names from filenames (e.g., "car_1.jpg" -> "car").
- **Instant YOLO Datasets**: Generates ready-to-train datasets with images, labels, classes.txt, and dataset.yaml.
- **Premium Web UI**: Modern React interface with glassmorphism, dark mode, and smooth animations.
- **GPU Accelerated**: Fully optimized for CUDA-enabled GPUs.

## Tech Stack

- **Frontend**: React, Vite, Modern CSS
- **Backend**: FastAPI, Python, Ultralytics SAM
- **AI Model**: SAM 2.1 Large

## Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/kunj290506/AuTo_MaRk.git
   cd AuTo_MaRk
   ```

2. **Backend Setup**
   ```bash
   pip install -r requirements.txt
   python backend.py
   ```

3. **Frontend Setup**
   ```bash
   cd frontend-react
   npm install
   npm run dev
   ```

4. **Access**
   - Open http://localhost:5173
   - Login: demo@automark.ai / demo123

## Usage

1. **Upload**: Drag and drop images or ZIP files.
2. **Process**: The system detects objects using high-accuracy AI.
3. **Verify**: View bounding boxes and labels instantly.
4. **Download**: Get a ZIP file with standard YOLO format labels.

## License

MIT License


