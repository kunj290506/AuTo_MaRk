# AutoMark - AI-Powered Smart Image Annotation Tool

## 🎯 Problem Statement

**Manual image annotation is time-consuming and expensive.**

In computer vision and machine learning, training object detection models requires thousands of labeled images. Traditionally, this process involves:
- Hiring human annotators to draw bounding boxes
- Spending weeks or months on manual labeling
- Paying significant costs for annotation services
- Dealing with inconsistent label quality

**Example:** Labeling 10,000 images manually can take 200+ hours and cost $2,000+.

---

## 💡 Solution

**AutoMark automates the entire annotation process using AI.**

I built a smart annotation tool that leverages YOLOv8 (state-of-the-art object detection) to automatically detect and label objects in images with just one click.

### Key Features:
- **Automatic Detection:** Upload images → Get instant annotations
- **1203 Object Classes:** Trained on LVIS dataset for comprehensive coverage
- **YOLO Format Export:** Download ready-to-use datasets for training
- **Modern Web Interface:** Clean React UI with drag-and-drop upload
- **Fast Processing:** GPU-accelerated inference in seconds

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Python, FastAPI, Uvicorn |
| **AI Model** | YOLOv8 (Ultralytics) |
| **Frontend** | React, Vite, Framer Motion |
| **Styling** | CSS3, Custom Design System |
| **Dataset** | LVIS (1203 classes) |

---

## 🔧 How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │ --> │  YOLOv8     │ --> │  Download   │
│   Images    │     │  Detection  │     │  Dataset    │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. **Upload:** Drag & drop images (JPG, PNG, ZIP supported)
2. **Process:** AI model detects all objects with bounding boxes
3. **Export:** Download YOLO-format dataset with:
   - Original images
   - Label files (.txt)
   - Annotated preview images
   - Dataset configuration (YAML)

---

## 📊 Results & Output

### Sample Detection Results:

| Image Type | Objects Detected | Processing Time |
|------------|-----------------|-----------------|
| Street scene | 15-30 objects | ~0.5s |
| Kitchen | 20-50 objects | ~0.5s |
| Nature | 5-20 objects | ~0.3s |

### Output Format:
```
annotated_dataset.zip
├── dataset.yaml        # YOLO config
├── images/             # Original images
├── labels/             # YOLO annotations
│   └── image1.txt      # class_id x y w h
└── annotated/          # Preview with boxes
```

### Label Format (YOLO):
```
0 0.523 0.456 0.156 0.234   # person
24 0.789 0.345 0.098 0.187  # car
```

---

## 🚀 Project Highlights

### What I Built:
- **Full-stack web application** with React frontend and FastAPI backend
- **Custom-trained YOLOv8 model** on LVIS dataset (1203 classes)
- **Dataset preparation pipeline** for downloading and processing LVIS
- **Responsive modern UI** with animations and professional design

### Technical Achievements:
- Trained model on **100,000+ images** from LVIS dataset
- Implemented **real-time object detection** with GPU acceleration
- Built **ZIP export system** for complete dataset packages
- Created **clean REST API** for image processing

### Skills Demonstrated:
- **Deep Learning:** YOLOv8, object detection, model training
- **Python:** FastAPI, async programming, file handling
- **React:** Modern hooks, animations, component design
- **Full-Stack:** API design, frontend-backend integration

---

## 📸 Screenshots

### Main Interface
- Clean upload area with drag-and-drop
- Real-time file preview
- Model information display

### Results View
- Detection statistics
- Annotated image gallery
- One-click download

---

## 🎓 Learning Outcomes

Through this project, I gained experience in:

1. **Computer Vision:** Object detection, bounding box annotation, YOLO format
2. **Deep Learning:** Model training, transfer learning, hyperparameter tuning
3. **Web Development:** Full-stack React + FastAPI application
4. **Dataset Engineering:** Large-scale dataset preparation and management
5. **API Development:** RESTful API design with file handling

---

## 📈 Future Improvements

- [ ] Support for image segmentation (instance masks)
- [ ] Custom model training from UI
- [ ] Batch processing for large datasets
- [ ] Cloud deployment with GPU support
- [ ] Real-time camera annotation

---

## 🔗 Links

- **GitHub:** [github.com/kunj290506/AuTo_MaRk](https://github.com/kunj290506/AuTo_MaRk)
- **Demo:** Run locally with instructions in README

---

## 👤 About Me

I'm passionate about AI and computer vision. This project demonstrates my ability to:
- Build end-to-end machine learning applications
- Create user-friendly web interfaces
- Work with large datasets and deep learning models
- Write clean, maintainable code

**Connect with me on LinkedIn to discuss AI/ML opportunities!**

---

*Built with ❤️ using YOLOv8, React, and FastAPI*
