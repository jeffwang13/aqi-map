import type { City, AQIData, CityAQI } from "./types";
import { majorCities } from "./cities";

const OPEN_METEO_BASE = "https://air-quality-api.open-meteo.com/v1/air-quality";

const MOCK_AQI: Record<string, number> = {
  Delhi: 285,
  Dhaka: 240,
  Mumbai: 190,
  Karachi: 220,
  Kolkata: 180,
  Beijing: 160,
  Shanghai: 140,
  Jakarta: 170,
  Lagos: 155,
  Tehran: 175,
  "Ho Chi Minh City": 150,
  Cairo: 145,
  Bangkok: 120,
  Istanbul: 110,
  "Mexico City": 105,
  Seoul: 98,
  "Los Angeles": 95,
  Tokyo: 65,
  "New York": 72,
  London: 55,
  Paris: 60,
  Berlin: 45,
  Sydney: 30,
  Vancouver: 25,
  Singapore: 50,
  Toronto: 40,
  Dubai: 90,
  Riyadh: 130,
  Santiago: 115,
  Madrid: 58,
  Rome: 62,
  Barcelona: 48,
  Amsterdam: 38,
  Stockholm: 32,
  Oslo: 28,
  Copenhagen: 35,
  Helsinki: 25,
  Zurich: 34,
  Vienna: 42,
  Brussels: 44,
  Warsaw: 52,
  Prague: 47,
  Budapest: 56,
  Bucharest: 68,
  Lisbon: 36,
  Dublin: 30,
  Athens: 76,
  "Tel Aviv": 58,
  Casablanca: 82,
  Nairobi: 78,
  "Cape Town": 64,
  Johannesburg: 88,
  Melbourne: 29,
  "San Francisco": 42,
  Chicago: 50,
  "Hong Kong": 70,
  Bangalore: 100,
  Hyderabad: 95,
  Ahmedabad: 140,
  Chennai: 110,
  Pune: 90,
  Tianjin: 130,
  Chengdu: 125,
  Nanjing: 115,
  Wuhan: 105,
  Guangzhou: 120,
  Chongqing: 135,
  Shenzhen: 95,
  Osaka: 60,
  Manila: 85,
  Lima: 92,
  Bogotá: 75,
  "Rio de Janeiro": 65,
  "São Paulo": 80,
  "Buenos Aires": 55,
  Kinshasa: 85,
  Luanda: 95,
  Moscow: 58,
};

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + (hash << 5) - hash;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

function getMockAQI(city: City): AQIData {
  const base =
    MOCK_AQI[city.name] ??
    (() => {
      const baseValue = 30 + Math.floor(seededRandom(city.name) * 230);
      const latFactor = Math.abs(city.lat) > 35 ? 20 : 0;
      return Math.min(500, baseValue + latFactor);
    })();

  const aqi = Math.max(
    1,
    base + Math.floor((seededRandom(city.country) - 0.5) * 20)
  );

  return {
    aqi,
    pm25: Math.round(aqi * 0.6),
    pm10: Math.round(aqi * 0.9),
    o3: Math.round(aqi * 0.4),
    no2: Math.round(aqi * 0.3),
    so2: Math.round(aqi * 0.2),
    co: Math.round(aqi * 0.15),
    temp: 15 + Math.floor(seededRandom(city.name + "temp") * 20),
    humidity: 30 + Math.floor(seededRandom(city.name + "hum") * 50),
    wind: Math.floor(seededRandom(city.name + "wind") * 25),
    timestamp: new Date().toISOString(),
    source: "Mock fallback data",
  };
}

export function getAQICategory(aqi: number) {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "sensitive";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "very-unhealthy";
  return "hazardous";
}

export function getAQILabel(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return "#22c55e";
  if (aqi <= 100) return "#eab308";
  if (aqi <= 150) return "#f97316";
  if (aqi <= 200) return "#ef4444";
  if (aqi <= 300) return "#a855f7";
  return "#7f1d1d";
}

function currentHourIndex(times: string[]): number {
  const now = new Date().toISOString().slice(0, 13);
  let idx = times.findIndex((t) => t.startsWith(now));
  if (idx === -1) idx = times.length - 1;
  return idx;
}

export async function fetchCityAQI(city: City): Promise<CityAQI> {
  try {
    const params = new URLSearchParams({
      latitude: city.lat.toString(),
      longitude: city.lng.toString(),
      hourly: [
        "us_aqi",
        "pm2_5",
        "pm10",
        "nitrogen_dioxide",
        "sulphur_dioxide",
        "carbon_monoxide",
        "ozone",
      ].join(","),
    });

    const response = await fetch(`${OPEN_METEO_BASE}?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);

    const json = (await response.json()) as {
      hourly?: {
        time: string[];
        us_aqi?: number[];
        pm2_5?: number[];
        pm10?: number[];
        nitrogen_dioxide?: number[];
        sulphur_dioxide?: number[];
        carbon_monoxide?: number[];
        ozone?: number[];
      };
    };

    const hourly = json.hourly;
    if (!hourly || !hourly.time || hourly.us_aqi === undefined) {
      throw new Error("Invalid Open-Meteo response");
    }

    const idx = currentHourIndex(hourly.time);
    const aqi = hourly.us_aqi[idx];
    if (typeof aqi !== "number") {
      throw new Error("No AQI value available for current hour");
    }

    const get = (arr?: number[]) =>
      arr && typeof arr[idx] === "number" ? arr[idx] : undefined;

    return {
      ...city,
      data: {
        aqi,
        pm25: get(hourly.pm2_5),
        pm10: get(hourly.pm10),
        o3: get(hourly.ozone),
        no2: get(hourly.nitrogen_dioxide),
        so2: get(hourly.sulphur_dioxide),
        co: get(hourly.carbon_monoxide),
        timestamp: hourly.time[idx],
        source: "Open-Meteo Air Quality API",
      },
    };
  } catch (err) {
    console.warn(`Falling back to mock data for ${city.name}`, err);
    return { ...city, data: getMockAQI(city) };
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export async function fetchAllAQI(
  cities: City[] = majorCities
): Promise<CityAQI[]> {
  const results: CityAQI[] = [];
  const batches = chunk(cities, 10);

  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map((city) => fetchCityAQI(city))
    );
    results.push(...batchResults);
  }

  return results;
}
