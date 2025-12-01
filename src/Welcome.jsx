import React from "react";
import logo from "./assets/logo.jpg";


export default function Welcome({ onContinue }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 to-blue-300 flex flex-col items-center justify-center p-4">
      
      {/* Tarjeta central */}
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-2xl w-full text-center border border-gray-200">
        
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Logo" className="w-14 h-14" />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          ¡Bienvenido a UrbanReport! 🏙️
        </h1>

        {/* Textos */}
        <div className="space-y-3 text-gray-600 leading-relaxed">

          <p>📸 Cada foto, 💬 cada reporte, 🙋‍♂️ cada gesto…</p>

          <p>
            🌱 Transforma las calles, los barrios y la esperanza de nuestra ciudad.
          </p>

          <p>💪 No esperes el cambio…</p>

          <p>
            ❤️ Sé el cambio que Buenaventura necesita.
          </p>

          <p>
            🌍 Tu voz cuenta. Tu acción inspira. Tu ciudad te lo agradecerá.
          </p>

        </div>

        {/* Botón */}
        <button
          onClick={onContinue}
          className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition"
        >
          Continuar
        </button>
      </div>

      {/* Texto inferior */}
      <p className="text-gray-700 text-sm mt-6 flex items-center gap-2">
        💡 Conectando ciudadanos y soluciones — Urban Report
      </p>
    </div>
  );
}
