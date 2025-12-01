import React, { useState } from "react";
import logo from "./assets/logo.jpg";
import { MapPin, FileText, Star } from "lucide-react";
import NewReportModal from "./NewReportModal";   // 👈 CORRECTO

export default function CitizenHome({ user, onNavigate, onLogout }) {
  const [showNewReport, setShowNewReport] = useState(false);

  return (
    <>
      {/* Modal */}
      {showNewReport && (
        <NewReportModal
          user={user}
          onClose={() => setShowNewReport(false)}
          onSuccess={() => {
            setShowNewReport(false);
          }}
        />
      )}

      <div className="min-h-screen bg-gray-100 p-6">
        {/* Barra superior */}
        <nav className="bg-green-200 p-4 rounded-xl flex items-center justify-between mb-8 shadow">
          <div className="flex items-center gap-3">
            <img src={logo} className="w-12 h-12" />
            <div>
              <h1 className="text-xl font-bold text-gray-700">
                Bienvenido a UrbanReport
              </h1>
              <p className="text-sm text-gray-600">
                Un sistema de quejas y reclamos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-[#00000]">{user?.full_name}</span>


            <button
              onClick={() => {
                onLogout();
                onNavigate("welcome");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-200 hover:bg-red-300 text-red-700 rounded-lg transition"
            >
              Cerrar sesion
            </button>
          </div>
        </nav>

        {/* Mensaje */}
        <p className="text-xl mb-8">
          👉 “Hola, {user?.full_name} 👋 Gracias por aportar y cuidar tu comunidad”
        </p>
        
        {/* Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Registrar queja */}
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <MapPin className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Registrar queja</h3>
            <p className="text-gray-600 text-sm mb-4">
              Cuéntanos qué situación quieres reportar. Ingresa la dirección o usa tu ubicación.
            </p>
            <button
              onClick={() => setShowNewReport(true)}   // 👈 CORREGIDO
              className="px-4 py-2 bg-green-500 text-white rounded-lg"
            >
              Registrar
            </button>
          </div>

          {/* Mis reportes */}
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <FileText className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Mis reportes</h3>
            <p className="text-gray-600 text-sm mb-4">
              Consulta el estado de tus reportes enviados.
            </p>
            <button
              onClick={() => onNavigate("citizen")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Ver
            </button>
          </div>

          {/* Calificar */}
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <Star className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Calificar servicio</h3>
            <p className="text-gray-600 text-sm mb-4">
              Evalúa la atención recibida por las entidades.
            </p>
            <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg">
              Calificar
            </button>
          </div>
        </div>
        {/* Textos */}
        <div className="space-y-3 text-gray-600 leading-relaxed">

          <p className="flex justify-center mb-8 text-xl font-bold text-[#00000] mt-7">  🌍 UrbanReport: La voz de tu comunidad</p>

          <p>
            🕊️ “Una plataforma donde los ciudadanos reportan, las entidades responden y juntos
mejoramos Buenaventura.”


          </p>

          <p>📱 Con UrbanReport puedes:</p>

          <p>
            🧩 Reportar problemas de tu barrio (basura, huecos, alumbrado, etc.)
          </p>

          <p>
              🏛️ Hacer seguimiento y calificar la atención recibida
          </p>

          <p>
              💚 Ser parte activa del cambio que nuestra ciudad necesitas
          </p>

        </div>
      </div>
    </>
  );
}
