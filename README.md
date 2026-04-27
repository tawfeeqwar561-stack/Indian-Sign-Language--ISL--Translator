# Emotion-Aware Indian Sign Language (ISL) Translation System

Real-time, AI-powered ISL gesture recognition and translation with emotion-aware multilingual output and 3D avatar animation.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Python](https://img.shields.io/badge/python-3.9+-blue)
![React](https://img.shields.io/badge/react-18-61dafb)

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤟 **Real-time ISL Recognition** | Camera-based hand gesture detection and classification |
| 😊 **Emotion Detection** | 7-class facial emotion recognition (happiness, sadness, anger, etc.) |
| 🌐 **Multilingual Translation** | English, Tamil (தமிழ்), Hindi (हिन्दी) output |
| 🧑‍🦱 **3D Sign Avatar** | Animated humanoid that performs recognized signs |
| 🔊 **Text-to-Speech** | Emotion-modulated speech synthesis |
| 🚨 **Emergency Detection** | Highlighted alerts for urgent/distress signs |
| 💬 **Bidirectional Chat** | ISL→Text and Text→ISL communication |
| 🌙 **Dark/Light Theme** | Premium glassmorphic UI with theme toggle |
| 📱 **Responsive Design** | Works on desktop, tablet, and mobile |

## 🚀 Quick Start

### One-Command Start (Windows)

```bash
start.bat
```

This will:
1. Create a Python virtual environment
2. Install backend dependencies
3. Start Flask backend on port 5000
4. Install frontend dependencies  
5. Start React frontend on port 3000
6. Open your browser automatically

### Manual Start

#### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python app.py
```

The API will be available at `http://localhost:5000/api/health`

#### Frontend

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Port 3000)                │
│  ┌──────────┐  ┌────────────────┐  ┌──────────────────┐    │
│  │  Camera   │  │  Translation   │  │   3D Avatar      │    │
│  │  View     │  │  Panel         │  │   Panel          │    │
│  └──────────┘  └────────────────┘  └──────────────────┘    │
│        │              ▲                     ▲               │
│        │ WebSocket    │ Redux State         │ Sign Data     │
│        ▼              │                     │               │
│  ┌──────────────────────────────────────────┐               │
│  │         Socket.IO Client                  │               │
│  └──────────────────────────────────────────┘               │
└─────────────────────┬───────────────────────────────────────┘
                      │ WebSocket (frames ↕ results)
┌─────────────────────▼───────────────────────────────────────┐
│                Flask Backend (Port 5000)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Hand     │  │ Gesture  │  │ Emotion  │  │ Fusion   │   │
│  │ Tracker  │→ │ Model    │→ │ Model    │→ │ Model    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│        │                                         │          │
│        ▼                                         ▼          │
│  ┌──────────────┐                    ┌──────────────┐      │
│  │ Translation  │                    │    TTS       │      │
│  │ Engine       │                    │    Engine    │      │
│  └──────────────┘                    └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
isl-translation-system/
├── backend/
│   ├── api/              # REST routes + WebSocket handlers
│   ├── models/           # ML models (gesture, emotion, fusion, TTS)
│   ├── preprocessing/    # Frame processing, hand tracking
│   ├── database/         # SQLAlchemy models
│   ├── utils/            # Logging, metrics, helpers
│   ├── app.py            # Flask application factory
│   └── config.py         # Configuration management
├── frontend/
│   ├── src/
│   │   ├── components/   # React components (Camera, Translation, Avatar, etc.)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # WebSocket, API, TTS services
│   │   ├── store/        # Redux Toolkit store
│   │   └── utils/        # Helpers, constants, sign animations
│   └── public/
├── ml_pipeline/          # Training data and notebooks
├── start.bat             # One-click Windows startup
└── docker-compose.yml    # Docker deployment
```

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | System health + model status |
| `POST` | `/api/translate/frame` | Translate a single camera frame |
| `POST` | `/api/translate/text-to-isl` | Text → ISL gloss sequence |
| `POST` | `/api/tts` | Text-to-speech synthesis |
| `GET` | `/api/vocabulary` | List supported ISL signs |
| `GET` | `/api/languages` | Supported languages |
| `WS` | `frame` | Real-time frame streaming |
| `WS` | `result` | Recognition results |

## 🎨 Demo Mode

When ML dependencies (TensorFlow, MediaPipe) are not installed, the system runs in **demo mode** — it cycles through realistic gesture results so you can experience the full UI pipeline without GPU/ML setup.

## 📄 License

MIT