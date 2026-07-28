import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { CityAQI } from "./types";
import { getAQIColor, getAQILabel } from "./api";
import { formatTime } from "./utils";
import "leaflet/dist/leaflet.css";

interface AQIMapProps {
  cities: CityAQI[];
  selectedCity: CityAQI | null;
  onSelectCity: (city: CityAQI) => void;
}

function createAQIIcon(aqi: number) {
  const color = getAQIColor(aqi);
  const size = 32;
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="3" />
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="system-ui, sans-serif">${aqi}</text>
    </svg>
  `;
  return L.divIcon({
    className: "aqi-marker",
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function MapController({
  selectedCity,
  cities,
}: {
  selectedCity: CityAQI | null;
  cities: CityAQI[];
}) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (selectedCity) {
      map.flyTo([selectedCity.lat, selectedCity.lng], 10, {
        duration: 1.5,
      });
    }
  }, [selectedCity, map]);

  useEffect(() => {
    if (hasFittedRef.current || cities.length === 0) return;
    const bounds = L.latLngBounds(cities.map((c) => [c.lat, c.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      hasFittedRef.current = true;
    }
  }, [cities, map]);

  return null;
}

export default function AQIMap({
  cities,
  selectedCity,
  onSelectCity,
}: AQIMapProps) {
  const markersRef = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (selectedCity && markersRef.current[selectedCity.name]) {
      markersRef.current[selectedCity.name].openPopup();
    }
  }, [selectedCity]);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={18}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController selectedCity={selectedCity} cities={cities} />
      {cities.map((city) => (
        <Marker
          key={city.name}
          position={[city.lat, city.lng]}
          icon={createAQIIcon(city.data.aqi)}
          eventHandlers={{
            click: () => onSelectCity(city),
          }}
          ref={(ref) => {
            if (ref) markersRef.current[city.name] = ref;
          }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <h3 className="text-lg font-bold text-gray-900">
                {city.name}, {city.country}
              </h3>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: getAQIColor(city.data.aqi) }}
                >
                  {city.data.aqi}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {getAQILabel(city.data.aqi)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                {city.data.pm25 !== undefined && (
                  <div className="rounded bg-gray-100 px-2 py-1">
                    PM2.5: {city.data.pm25}
                  </div>
                )}
                {city.data.pm10 !== undefined && (
                  <div className="rounded bg-gray-100 px-2 py-1">
                    PM10: {city.data.pm10}
                  </div>
                )}
                {city.data.temp !== undefined && (
                  <div className="rounded bg-gray-100 px-2 py-1">
                    Temp: {city.data.temp}°C
                  </div>
                )}
                {city.data.humidity !== undefined && (
                  <div className="rounded bg-gray-100 px-2 py-1">
                    Hum: {city.data.humidity}%
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Source: {city.data.source}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Updated: {formatTime(city.data.timestamp)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
