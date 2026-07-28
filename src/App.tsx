import { useEffect, useMemo, useState, useCallback } from "react";
import { majorCities } from "./cities";
import type { CityAQI } from "./types";
import { fetchAllAQI, getAQIColor, getAQICategory } from "./api";
import AQIMap from "./AQIMap";
import { formatTime } from "./utils";
import "./App.css";

const categoryOrder = [
  "good",
  "moderate",
  "sensitive",
  "unhealthy",
  "very-unhealthy",
  "hazardous",
  "unknown",
] as const;

export default function App() {
  const [cities, setCities] = useState<CityAQI[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<CityAQI | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllAQI(majorCities);
      setCities(data);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError("Failed to load air quality data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCities = useMemo(() => {
    return cities
      .filter((city) => {
        const matchesQuery =
          city.name.toLowerCase().includes(query.toLowerCase()) ||
          city.country.toLowerCase().includes(query.toLowerCase());
        const matchesCategory =
          selectedCategory === "all" ||
          getAQICategory(city.data.aqi) === selectedCategory;
        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => a.data.aqi - b.data.aqi);
  }, [cities, query, selectedCategory]);

  const stats = useMemo(() => {
    const total = cities.length;
    const average =
      total > 0
        ? Math.round(cities.reduce((sum, c) => sum + c.data.aqi, 0) / total)
        : 0;
    const worst =
      total > 0
        ? [...cities].sort((a, b) => b.data.aqi - a.data.aqi)[0]
        : null;
    const best =
      total > 0
        ? [...cities].sort((a, b) => a.data.aqi - b.data.aqi)[0]
        : null;
    return { total, average, worst, best };
  }, [cities]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const city of cities) {
      const cat = getAQICategory(city.data.aqi);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [cities]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Global Air Quality Map
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Real-time AQI for major cities around the world
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
          {lastUpdated && (
            <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:inline">
              Updated {formatTime(lastUpdated)}
            </span>
          )}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <main className="relative min-h-0 flex-1 overflow-hidden">
          {loading && cities.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-sky-600" />
              <div className="text-center">
                <h2 className="text-lg font-semibold">Global Air Quality Map</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Fetching AQI data for {majorCities.length} cities...
                </p>
              </div>
            </div>
          ) : (
            <AQIMap
              cities={filteredCities}
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
            />
          )}

          <button
            onClick={() => setListOpen((p) => !p)}
            className="absolute bottom-4 left-4 z-[1000] rounded-full bg-white p-3 shadow-lg ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700"
            aria-label="Toggle city list"
          >
            <svg
              className="h-6 w-6 text-slate-700 dark:text-slate-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </main>

        <aside
          className={`absolute right-0 top-0 bottom-0 z-[1000] w-80 transform border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 ${
            listOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Cities</h2>
              <button
                onClick={() => setListOpen(false)}
                className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden"
              >
                
              </button>
            </div>

            <input
              id="city-search"
              type="text"
              placeholder="Search city or country..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
            />

            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="all">All categories</option>
              <option value="good">Good</option>
              <option value="moderate">Moderate</option>
              <option value="sensitive">Unhealthy for Sensitive</option>
              <option value="unhealthy">Unhealthy</option>
              <option value="very-unhealthy">Very Unhealthy</option>
              <option value="hazardous">Hazardous</option>
            </select>

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-2 text-center text-xs dark:bg-slate-800">
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {stats.total}
                </div>
                <div className="text-slate-500 dark:text-slate-400">Cities</div>
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {stats.average}
                </div>
                <div className="text-slate-500 dark:text-slate-400">Avg AQI</div>
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {stats.worst?.data.aqi ?? "—"}
                </div>
                <div className="text-slate-500 dark:text-slate-400">Worst</div>
              </div>
            </div>

            <div className="mb-4 space-y-2 text-xs">
              {categoryOrder.map((cat) => (
                <div key={cat} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: getAQIColor(
                          cat === "good"
                            ? 25
                            : cat === "moderate"
                            ? 75
                            : cat === "sensitive"
                            ? 125
                            : cat === "unhealthy"
                            ? 175
                            : cat === "very-unhealthy"
                            ? 250
                            : 350
                        ),
                      }}
                    />
                    <span className="capitalize text-slate-700 dark:text-slate-300">
                      {cat.replace(/-/g, " ")}
                    </span>
                  </div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {categoryCounts[cat] || 0}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <ul className="space-y-2">
                {filteredCities.map((city) => (
                  <li key={city.name}>
                    <button
                      onClick={() => setSelectedCity(city)}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:shadow-sm dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div>
                        <div className="font-medium">{city.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {city.country}
                        </div>
                      </div>
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: getAQIColor(city.data.aqi) }}
                      >
                        {city.data.aqi}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              {filteredCities.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-500">
                  No cities match your filters.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <footer className="z-20 border-t border-slate-200 bg-white px-4 py-2 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Data from Open-Meteo Air Quality API (no API key required). Falls back
        to realistic mock data if the service is unavailable.
      </footer>
    </div>
  );
}
