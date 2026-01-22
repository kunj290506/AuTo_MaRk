# AutoMark - AI-Powered Smart Labeling Tool

## 🎯 Problem Statement

**Manual image annotation is time-consuming and expensive.**

In computer vision and machine learning, labeling images for training requires precision. Traditionally, this process involves:
- Hiring human annotators to draw bounding boxes or masks
- Spending weeks on manual labeling
- Dealing with inconsistent label quality

## 💡 Solution

**AutoMark automates the entire annotation process using SAM 2.1 Large.**

I built a smart annotation tool that leverages **SAM 2.1 (Segment Anything Model)** to automatically segment and label objects in images with pixel-perfect accuracy.

### Key Features:
- **Automatic Segmentation:** Uses SAM 2.1 Large for high-precision masks
- **Smart Labeling:** Extracts object class from filenames (e.g., `car.jpg` -> `car`)
- **YOLO Format Export:** auto-converts masks to bounding boxes for training
- **Modern Web Interface:** Clean React UI with drag-and-drop
- **GPU Accelerated:** Fast inference using CUDA

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Python, FastAPI, Ultralytics SAM |
| **AI Model** | SAM 2.1 Large (Segment Anything Model) |
| **Frontend** | React, Vite, Lucide Icons |
| **Styling** | Modern CSS, Glassmorphism |

---

## 🔧 How It Works

1. **Upload:** Drag & drop images or ZIP files
2. **Segment:** SAM 2.1 Large scans the image and creates segmentation masks
3. **Label:** The system converts masks to YOLO bounding boxes based on filenames
4. **Export:** Download the ready-to-train dataset

---

## 🚀 Project Highlights

### What I Built:
- **Full-stack AI application** with React frontend and FastAPI backend
- **Integration of SAM 2.1 Large**, the state-of-the-art segmentation model
- **Automated pipeline** from raw image to labeled dataset
- **Premium UI** with dark/light modes and smooth interactions

### Skills Demonstrated:
- **Computer Vision:** Segmentation, Mask-to-Box conversion
- **Deep Learning:** Implementing Transformer-based vision models (SAM)
- **Full-Stack:** Real-time API integration with React
- **System Design:** Efficient handling of large AI models (400MB+)

---

## 📸 Usage

### 1. Upload
Clean interface to drop your raw images.

### 2. Processing
Visual feedback while the heavy AI model processes your data.

### 3. Results
Instant view of the generated annotations.

---

## 👤 About Me
**Kunj**

I'm passionate about AI and computer vision. This project demonstrates my ability to build sophisticated AI tools using the latest foundation models like SAM.
