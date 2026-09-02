# 🌤️ Acclimate — Environmental Intelligence Platform

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**Acclimate** turns raw atmospheric data—live weather forecasts, air quality indices, solar position, and UV levels—into practical, actionable daily decisions. Instead of just showing numbers, Acclimate answers: *When should I go outside? What should I wear? Is it safe to host an outdoor event?*

---

## ✨ Key Features

- 🎯 **"What Can You Do Today?"** — Real-time activity suitabilities (running, cycling, outdoor dining, clothes drying, stargazing) calculated directly from live environmental metrics.
- 🕒 **Today's Breakdown** — Granular hourly timelines for temperature, apparent feel, precipitation probability, wind speed, UV index, and humidity.
- 📅 **Event Planner** — Risk assessment tool for planning outdoor activities, gatherings, or weddings based on forecast atmospheric thresholds.
- 👔 **Smart Outfit Planner** — Dynamic clothing recommendations tailored to temperature ranges, wind chill, rain, and solar exposure.
- 🤖 **Ask Acclimate AI** — Grounded AI assistant that interprets real-time local conditions to answer custom queries via Gemini, OpenAI, or local deterministic reasoning engines.
- 🌌 **Dynamic Environment Scenes** — Immersive, real-time background animations and visual themes that change dynamically based on weather conditions, sun position, and time of day.
- 📊 **Insights & Exploration** — Interactive charts powered by Recharts for analyzing multi-day trends, microclimates, and air quality indices.
- 🌍 **Global Location Search** — Instant search and auto-location via Open-Meteo Geocoding and OpenStreetMap Nominatim.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/) |
| **Build System** | [Vite 8.2](https://vitejs.dev/) |
| **Routing** | [TanStack Router](https://tanstack.com/router) (File-based routing) |
| **State Management** | [TanStack Query](https://tanstack.com/query) + React Context |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Radix UI primitives |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 📡 Environmental Data Sources

Acclimate aggregates data from open atmospheric APIs:

- 🌡️ **[Open-Meteo API](https://open-meteo.com/)** — Temperature, wind, cloud cover, visibility, UV index, and 7-day hourly forecasts.
- 🍃 **[OpenAQ API](https://openaq.org/)** — Real-time PM2.5, PM10, NO2, and Air Quality Index (AQI) measurements.
- ☀️ **[SunriseSunset API](https://sunrisesunset.io/api/)** — Golden hour, civil twilight, sunrise, sunset, and solar elevation data.
- 🗺️ **[OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/)** — Geocoding and location resolution.

---

## 📁 Repository Structure

```text
acclimate-your-site/
├── public/                 # Static assets and icons
├── src/
│   ├── components/         # Modular UI components
│   │   ├── ai/             # AI chat floating interface & prompt handlers
│   │   ├── features/       # DailyBrief, EventPlanner, OutfitPlanner, etc.
│   │   ├── ui/             # Reusable Radix UI & styled primitives
│   │   ├── EnvironmentScene.tsx  # Dynamic atmospheric background
│   │   ├── LocationSelector.tsx  # Search & geolocation selector
│   │   └── SiteChrome.tsx        # Navigation header & footer
│   ├── lib/
│   │   ├── ai/             # Reasoning engines, Gemini & OpenAI integration
│   │   └── env/            # API fetching, caching, formatting & state providers
│   ├── routes/             # TanStack file-based routes
│   │   ├── index.tsx       # Homepage
│   │   ├── overview.tsx    # Environmental Dashboard
│   │   ├── today.tsx       # Daily breakdown & timeline
│   │   ├── plan.tsx        # Outdoor event risk evaluation
│   │   ├── explore.tsx     # Exploration & comparison
│   │   ├── insights.tsx   # Atmospheric analytics
│   │   └── settings.tsx   # Preferences & unit toggle (°C / °F)
│   └── main.tsx            # Application entry point
├── LICENSE                 # GNU Affero General Public License v3.0
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm** or **bun**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TerrorCoder/acclimate-your-site.git
   cd acclimate-your-site
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

### Build & Production Verification

To build the production bundle and verify type-checking:
```bash
npm run build
npm run preview
```

---

## ⚙️ Environment Variables (Optional)

Acclimate runs out-of-the-box using open API endpoints and built-in deterministic AI fallback engines. If you wish to enable live LLM integration for **Ask Acclimate**, create a `.env.local` file:

```env
# Optional LLM API keys for AI recommendations
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 📜 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** — see the [LICENSE](LICENSE) file for details.

Under AGPL-3.0:
- You are free to run, study, and modify this software.
- Any modified or derivative versions hosted on a network (SaaS) must be open-sourced under the AGPL-3.0 license.

### Commercial Licensing & Negotiation
Commercial use, proprietary / closed-source integration, or deployment without AGPL-3.0 copyleft requirements can be negotiated. If your organization requires an alternative commercial license or custom terms, please contact the project authors / copyright holders.
