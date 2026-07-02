# Maison

**A climate-aware personal fashion curation mobile app.**
*AI Fashion Recommendation Mobile App*

---

## Project Description

Maison is a full-stack mobile application that helps a user decide what to wear by combining three things in one interface:

- **A Thermal Comfort Index** — a 0–10 wearability score computed from temperature and humidity, with fabric recommendations and a daily curated outfit.
- **An AI Stylist chat** — a conversational screen where the user asks for outfit ideas (e.g. "what should I wear to a wedding?") and receives a categorized suggestion with illustrative product images.
- **A digital wardrobe** — the user can photograph, name, categorize, and browse clothing items they already own.

The app is built with React Native (Expo) on the client and a Python Flask REST API on the server, following a three-tier architecture (presentation / application / data).

## Features

- 🔐 Registration and login flow with a JWT session token
- 🌤️ Live-fetched weather snapshot + client-side Thermal Comfort Index calculation
- 💬 Conversational styling chat with a horizontally scrollable recommendation carousel
- 👗 Camera/library capture, naming, and categorization of wardrobe items
- 🗂️ Wardrobe grid view with pull-to-refresh and long-press delete
- 🌓 Light ("Editorial") and dark ("Obsidian Rose") theming, following the device's system appearance
- ✨ Animated micro-interactions throughout (entrance animations, shimmer skeletons, press feedback)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native, Expo, React Navigation (Stack), Expo Image Picker, Expo Secure Store, Expo Google Fonts |
| Backend | Python 3, Flask, Flask-CORS, Flask-JWT-Extended, Flask-Bcrypt (installed as a dependency) |
| Data Storage | JSON flat-file (`wardrobe_data.json`) + local filesystem for images |
| External Services | [pollinations.ai](https://pollinations.ai) for on-demand outfit image generation |

## Installation & Setup

### Prerequisites
- Node.js (LTS) and npm
- Python 3.9+
- Expo Go app on your phone, or an Android/iOS simulator
- Your computer and phone on the **same Wi-Fi network**

### 1. Backend (Flask API)

```bash
cd backend
pip install flask flask-cors flask-bcrypt flask-jwt-extended
python app.py
```

The server starts on `http://0.0.0.0:5000`. Find your computer's local IP address:

```bash
# Windows
ipconfig
# macOS / Linux
ifconfig
```

### 2. Frontend (React Native / Expo)

```bash
cd src
npm install
```

Open each screen file (`HomeScreen.js`, `ChatScreen.js`, `WardrobeScreen.js`, `LoginScreen.js`) and update the hardcoded API URL constant (e.g. `API_URL`, `NGROK`) to match your computer's IP address from the step above, then:

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `w` to open the web preview.

> **Note:** the backend base URL is currently set per-screen rather than in one shared config file — see [Known Limitations](#known-limitations--future-work) below.

## Documentation

Full project documentation is in `docs/`:
- `Maison_SRS.docx` — Software Requirements Specification
- `Maison_Design_Document_UML.docx` — Use Case, Activity, Sequence, Class, ER, and Data Flow diagrams
- `Maison_Final_Report.docx` — complete project report, including test cases and bug log
- `Maison_Presentation.pptx` — project presentation slides

## Known Limitations & Future Work

In the interest of transparency for grading and viva, the current build has the following known gaps, each documented in detail in the SRS and Final Report:

| Area | Current State | Planned Improvement |
|---|---|---|
| **AI Stylist** | Deterministic keyword matching against a static outfit dictionary — **not** a generative AI model call | Integrate a real LLM (e.g. Gemini or Claude) that reasons over live weather + actual wardrobe contents |
| **Authentication** | Credentials are accepted but never hashed or verified against a stored record | Apply real password hashing (Flask-Bcrypt is already a dependency) and route-level JWT verification |
| **Data storage** | Single JSON flat-file, no database engine | Migrate to SQLite/PostgreSQL using the schema proposed in the Design Document |
| **Weather data** | `/weather` returns a fixed, hardcoded payload | Connect a live weather API (e.g. OpenWeatherMap) |
| **Multi-user support** | Wardrobe and chat data are not scoped per account | Partition data by authenticated user ID |
| **Configuration** | API base URL hardcoded per screen | Centralize into a single environment config file |

## AI Usage Policy

In line with the course's AI-assisted development guidelines, this project used **Claude AI** (Anthropic) during development for:

- Code review and debugging assistance on existing screens and API routes
- Drafting and structuring the SRS, Design Document, Final Report, and presentation slides
- Identifying gaps between the intended feature set and the as-built implementation, so they could be documented honestly rather than overstated

All application logic — the outfit recommendation database, the Thermal Comfort Index formula, and the behavior of every screen — was written and is understood by the student, who can explain the full architecture during the viva.

