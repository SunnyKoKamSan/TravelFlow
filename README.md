```markdown
# TravelFlow Pro 🌍✈️

**TravelFlow Pro** is a modern, AI-powered travel planning application designed to streamline your trips. Built with React, TypeScript, and Firebase, it combines interactive 3D visualizations, real-time expense tracking, and AI-generated itineraries into a seamless PWA experience.

![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0-purple?style=flat-square&logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-10-orange?style=flat-square&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan?style=flat-square&logo=tailwindcss)

## ✨ Key Features

- **🤖 AI Trip Planner**: Generate complete, day-by-day itineraries instantly using Gemini AI.
- **🌍 Interactive 3D Globe**: Visualize your destinations on a stunning, interactive 3D globe.
- **💰 Expense Tracker**: seamless shared wallet to track expenses, split bills, and calculate balances between travelers.
- **📍 Smart Mapping**: View your daily routes and locations on interactive Leaflet maps.
- **🔄 Real-time Sync**: All data is instantly synced across devices using Firebase Cloud Firestore.
- **🗣️ Live Translator**: Built-in translation tools to help you communicate anywhere.
- **📱 PWA Support**: Installable on mobile devices with offline capabilities.

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend & Auth**: Firebase (Auth, Firestore)
- **Maps & Visuals**: Three.js (Globe), Leaflet (Maps)
- **AI Integration**: Google Gemini API
- **State Management**: React Hooks (Custom)

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
   git clone [https://github.com/yourusername/travel-flow-pro.git](https://github.com/yourusername/travel-flow-pro.git)
   cd travel-flow-pro

```

2. **Install dependencies**
```bash
npm install

```


3. **Configure Environment Variables**
Create a `.env` file in the root directory and add your keys (Get these from your Firebase Console and Google AI Studio):
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key_here

```


4. **Run the development server**
```bash
npm run dev

```


Open [http://localhost:5173](https://www.google.com/search?q=http://localhost:5173) to view it in the browser.

## 📜 Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Starts the development server with HMR. |
| `npm run build` | Builds the app for production (TypeScript compile + Vite build). |
| `npm run lint` | Runs ESLint to check for code quality issues. |
| `npm run preview` | Locally preview the production build. |

## 📂 Project Structure

```text
src/
├── components/       # Reusable UI components (Globe, Header, MapPanel, etc.)
├── hooks/            # Custom hooks (useAuth, useTrip, useDebounce)
├── lib/              # Configuration (Firebase, API utilities)
├── types/            # TypeScript type definitions
├── App.tsx           # Main application layout and logic
├── main.tsx          # Entry point
└── index.css         # Global styles (Tailwind imports)

```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

```

```