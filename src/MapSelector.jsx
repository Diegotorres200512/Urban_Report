import React, { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ÍCONO PARA TU UBICACIÓN
const userIcon = new L.Icon({
  iconUrl:
    "https://cdn4.iconfinder.com/data/icons/small-n-flat/24/map-marker-512.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function MapSelector({ onSelect, onClose }) {
  const [position, setPosition] = useState(null);
  const [initialCenter, setInitialCenter] = useState([3.8939, -77.0723]); // Buenaventura
  const [mapReady, setMapReady] = useState(false);

  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setInitialCenter(coords);
          setUserLocation(coords);
          setMapReady(true);
        },
        () => {
          setMapReady(true);
        }
      );
    } else {
      setMapReady(true);
    }
  }, []);

  function LocationPicker() {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
      },
    });

    return position ? <Marker position={position} /> : null;
  }

  const confirm = async () => {
    if (!position) return;

    const lat = position.lat;
    const lon = position.lng;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await res.json();
    const address = data.display_name || `${lat}, ${lon}`;

    onSelect({ lat, lon, address });
  };

  if (!mapReady) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
        <div className="bg-white p-6 rounded-xl shadow-xl">
          <p className="text-gray-700">Obteniendo ubicación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-4 border border-gray-200">

        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Selecciona la ubicación
        </h3>

        <div className="h-[400px] rounded-lg overflow-hidden">
          <MapContainer center={initialCenter} zoom={15} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* MARCADOR DE TU UBICACIÓN */}
            {userLocation && (
              <Marker position={userLocation} icon={userIcon} />
            )}

            <LocationPicker />
          </MapContainer>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">
            Cancelar
          </button>

          <button onClick={confirm} className="px-4 py-2 bg-green-600 text-white rounded-lg">
            Confirmar ubicación
          </button>
        </div>

      </div>
    </div>
  );
}
