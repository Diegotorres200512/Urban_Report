import { User, Building2, ArrowLeft } from "lucide-react";

function ChooseRegister({ onNavigate }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">

        <button
          onClick={() => onNavigate("login")}
          className="flex items-center gap-2 text-gray-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <h2 className="text-2xl font-bold text-center text-[#2F5130] mb-2">
          ¿Cómo deseas registrarte?
        </h2>

        <p className="text-center text-gray-600 mb-8">
          Selecciona el tipo de cuenta que deseas crear
        </p>

        <div className="space-y-4">

          {/* USUARIO CIUDADANO */}
          <button
            onClick={() => onNavigate("Register")}
            className="w-full flex items-center gap-4 p-4 border border-gray-300 rounded-xl hover:bg-blue-50 transition"
          >
            <User className="w-8 h-8 text-blue-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">
                Usuario ciudadano
              </p>
              <p className="text-sm text-gray-600">
                Reporta problemas y realiza seguimiento
              </p>
            </div>
          </button>

          {/* ENTIDAD */}
          <button
            onClick={() => onNavigate("RegisteEntity")}
            className="w-full flex items-center gap-4 p-4 border border-gray-300 rounded-xl hover:bg-green-50 transition"
          >
            <Building2 className="w-8 h-8 text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">
                Entidad
              </p>
              <p className="text-sm text-gray-600">
                Gestiona reportes y requiere aprobación
              </p>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}

export default ChooseRegister;
