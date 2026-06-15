# 🛡️ RAKSHA NEXUS

**AI-Driven Real-Time Public Safety Intelligence Platform**

> A smart city safety ecosystem powered by edge computing, IoT sensor networks, and Gemini AI — enabling instant crisis response, women safety, and civilian emergency tools.

🔗 **Live Demo:** [https://raksha-1426f.web.app](https://raksha-1426f.web.app)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Modules](#modules)
- [Deployment](#deployment)

---

## Overview

Raksha Nexus is a comprehensive public safety platform designed for smart city infrastructure. It combines real-time IoT sensor monitoring, AI-powered emergency guidance, and civilian reporting tools into a unified command center — accessible to both administrators and the general public.

The platform enables:
- **Real-time crisis detection** via IoT sensor feeds (fire, flood, violence, medical)
- **AI-powered multilingual emergency chatbot** using Gemini
- **Women safety SOS system** with live GPS broadcasting
- **Anonymous incident reporting** with QR-coded case tracking
- **Admin command center** with live incident management

---

## Key Features

### 🚨 Crisis Response Dashboard
- Live IoT sensor feeds for fire detection (temperature, smoke PPM), flood monitoring, and violence detection via AI-powered CCTV analysis
- Automated dispatch protocols with severity classification
- Real-time incident timeline tracking and responder unit assignment
- Interactive fire spread grid and suppression zone controls

### 🤖 Gemini AI Chatbot
- Emergency guidance powered by Gemini AI
- Supports **5 regional languages**: Kannada, Telugu, Tamil, Hindi, and Malayalam
- Context-aware safety recommendations
- Real-time multilingual response generation

### 👩‍💼 Women Safety Module
- **One-tap SOS** with live GPS broadcasting to guardian contacts
- WhatsApp and SMS alert dispatch to emergency contacts
- Real-time location tracking with coordinate sharing
- Guardian contact management system
- Fake call generator for unsafe situations

### 📍 Public Tools
- **Nearby Emergency Services Finder** — Hospitals and police stations with Leaflet map visualization
- **Crisis Report System** — Multi-step incident reporting with:
  - Auto-location detection via GPS + Nominatim reverse geocoding (English)
  - Voice dictation using Web Speech API
  - Media attachment support (photos/videos)
  - QR code generation with full report details
- **Voice Assistant** — Hands-free emergency commands (nearest hospital, call police, activate SOS, safe route)

### 🔐 Admin Command Center
- Live incident management table with sorting, filtering, and search
- Real-time public report ingestion from civilian submissions
- Severity classification (Low → Critical) with visual indicators
- Responder unit assignment and status management (Pending → Active → Resolved → Dismissed)
- Admin notes and full incident timeline
- Report deletion and case management

### 📊 Additional Features
- **Google OAuth** authentication via Firebase
- **Anonymous reporting** with identity stripping
- **QR-coded case references** encoding full report details (type, severity, location, description, timestamp)
- **Auto-location detection** with browser Geolocation API + reverse geocoding
- **Speech-to-text dictation** for hands-free report filing
- **Dark mode glass-morphism UI** with micro-animations

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, Glass-morphism design system |
| **AI** | Gemini AI (via Groq LLM API) |
| **Maps** | Leaflet + React-Leaflet, OpenStreetMap tiles |
| **Geocoding** | Nominatim Reverse Geocoding API |
| **Voice** | Web Speech API (Speech Recognition + Synthesis) |
| **QR Codes** | qrcode.react |
| **Auth** | Firebase Authentication (Google OAuth) |
| **Hosting** | Firebase Hosting |
| **State** | React Context API, Local Storage |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   RAKSHA NEXUS                       │
├─────────────┬──────────────┬────────────────────────┤
│  Admin      │  Public      │  Women Safety          │
│  Dashboard  │  Tools       │  Module                │
├─────────────┼──────────────┼────────────────────────┤
│ Crisis      │ Nearby       │ SOS Alert              │
│ Response    │ Finder       │ System                 │
│ (IoT Feeds) │              │                        │
│             │ Crisis       │ Guardian               │
│ Incident    │ Report       │ Management             │
│ Management  │              │                        │
│             │ Voice        │ Live GPS               │
│ Analytics   │ Assistant    │ Tracking               │
├─────────────┴──────────────┴────────────────────────┤
│              Gemini AI Chatbot                       │
├─────────────────────────────────────────────────────┤
│  Firebase Auth  │  Leaflet Maps  │  Web Speech API  │
├─────────────────────────────────────────────────────┤
│              Firebase Hosting                        │
└─────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account (for authentication and hosting)

### Installation

```bash
# Clone the repository
git clone https://github.com/harshithyadav2006-dotcom/Raksha.git
cd Raksha

# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Google Sign-in** under Authentication → Sign-in method
3. Update `frontend/src/firebase.ts` with your Firebase config
4. Add your Groq API key in `frontend/src/services/groqChat.ts`

---

## Project Structure

```
raksha-nexus/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/              # Admin dashboard components
│   │   │   ├── women/              # Women safety components
│   │   │   ├── ReportIncidentModal.tsx
│   │   │   ├── AnimatedHeading.tsx
│   │   │   └── FadeIn.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx      # Firebase auth context
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        # Main admin dashboard
│   │   │   ├── CrisisResponse.tsx   # Crisis response tabs
│   │   │   ├── PublicTools.tsx      # Public-facing tools
│   │   │   ├── WomenSafety.tsx      # Women safety module
│   │   │   ├── Settings.tsx         # App settings
│   │   │   └── Login.tsx            # Google OAuth login
│   │   ├── services/
│   │   │   └── groqChat.ts          # Gemini AI integration
│   │   ├── store/
│   │   │   └── reportStore.ts       # Report state management
│   │   └── firebase.ts              # Firebase configuration
│   ├── package.json
│   └── vite.config.ts
├── firebase.json                     # Firebase hosting config
├── .firebaserc                       # Firebase project config
└── README.md
```

---

## Modules

### 1. Crisis Response Dashboard
Real-time monitoring across 5 crisis categories with live IoT data visualization, automated severity assessment, and dispatch coordination.

### 2. Gemini AI Chatbot
Multilingual emergency assistant supporting English, Kannada, Telugu, Tamil, Hindi, and Malayalam with context-aware safety guidance.

### 3. Women Safety
One-tap SOS system broadcasting live GPS coordinates to saved guardian contacts via SMS and WhatsApp, with fake call generation for unsafe situations.

### 4. Public Tools
Civilian-accessible emergency toolkit with nearby services finder, multi-step crisis reporting with auto-location and voice dictation, and voice-activated emergency commands.

### 5. Admin Panel
Comprehensive incident management with real-time report ingestion, responder assignment, status tracking, admin notes, and case timelines.

---

## Deployment

### Firebase Hosting

```bash
# Build production bundle
cd frontend
npm run build

# Deploy to Firebase
cd ..
firebase deploy --only hosting
```

**Live URL:** [https://raksha-1426f.web.app](https://raksha-1426f.web.app)

---

## License

This project is built for educational and hackathon purposes.

---

<p align="center">
  <strong>RAKSHA NEXUS</strong> — Protecting Communities Through Intelligent Safety Infrastructure
</p>
