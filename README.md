# Global Air Quality Map

An interactive world map that visualizes real-time Air Quality Index (AQI) data for major cities. Built with React, TypeScript, Vite, Tailwind CSS, and Leaflet.

## Features

- **Interactive world map** with colored AQI markers for each city
- **Real-time data** from the Open-Meteo Air Quality API
- **Mock fallback** when live data is unavailable
- **Search & filter** cities by name, country, or AQI category
- **Responsive sidebar** with stats, legend, and city list
- **Dark mode** support via `prefers-color-scheme`

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Leaflet + React-Leaflet
- Oxlint

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or later recommended)
- A package manager such as `npm`, `yarn`, `pnpm`, or `bun`

## Getting Started

1. **Install dependencies**

   ```bash
   cd aqi-map
   npm install
   ```

2. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173` by default.

3. **Open your browser and view the map**

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint on the source code |

## Data Source

AQI data is provided by the [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api). No API key is required. If the service is unavailable, the app falls back to realistic mock data.

## Project Structure

```
aqi-map/
├── src/
│   ├── App.tsx      # Main app shell and state management
│   ├── AQIMap.tsx   # Leaflet map and markers
│   ├── api.ts       # Data fetching and AQI helpers
│   ├── cities.ts    # City list with coordinates
│   ├── types.ts     # TypeScript type definitions
│   └── main.tsx     # Application entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## License

MIT
