export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export interface AQIData {
  aqi: number;
  pm25?: number;
  pm10?: number;
  o3?: number;
  no2?: number;
  so2?: number;
  co?: number;
  temp?: number;
  humidity?: number;
  wind?: number;
  timestamp: string;
  source: string;
}

export interface CityAQI extends City {
  data: AQIData;
}

export type AQICategory =
  | "good"
  | "moderate"
  | "sensitive"
  | "unhealthy"
  | "very-unhealthy"
  | "hazardous"
  | "unknown";
