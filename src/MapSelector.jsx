import React, { useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

// Configuración correcta del icono por defecto
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapSelector({ onSelect, onClose }) {
  const [position, setPosition] = useState(null);

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-4 border border-gray-200">

        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Selecciona la ubicación
        </h3>

        <div className="h-[400px] rounded-lg overflow-hidden">
          <MapContainer
            center={[4.65, -74.1]}
            zoom={14}
            className="h-full w-full"
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
