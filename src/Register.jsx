import { useState } from "react";
import { AlertCircle, CheckCircle, User, Mail, Phone, Lock } from "lucide-react";
import { supabase, getCategories, uploadFile } from './lib/supabase.js';
import logo from "./assets/logo.jpg";

function Register({ onNavigate }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from("users")
        .insert([
          {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            phone: formData.phone,
            role: "citizen",
          },
        ]);

      if (insertError) {
        if (insertError.code === "23505") {
          setError("Este correo ya está registrado");
        } else {
          setError("Error al crear la cuenta");
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => onNavigate("login"), 2000);
    } catch (err) {
      setError("Error al registrar usuario");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-xl border border-gray-200 p-6">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
              <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-[#2F5130]">Crear cuenta</h1>
            <p className="text-slate-400">Regístrate para reportar problemas</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">
                Cuenta creada exitosamente. Redirigiendo...
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input icon={User} label="Nombre Completo"
              value={formData.full_name}
              onChange={(v) => setFormData({ ...formData, full_name: v })}
            />

            <Input icon={Mail} label="Correo Electrónico" type="email"
              value={formData.email}
              onChange={(v) => setFormData({ ...formData, email: v })}
            />

            <Input icon={Phone} label="Teléfono"
              value={formData.phone}
              onChange={(v) => setFormData({ ...formData, phone: v })}
            />

            <Input icon={Lock} label="Contraseña" type="password"
              value={formData.password}
              onChange={(v) => setFormData({ ...formData, password: v })}
            />

            <Input icon={Lock} label="Confirmar Contraseña" type="password"
              value={formData.confirmPassword}
              onChange={(v) =>
                setFormData({ ...formData, confirmPassword: v })
              }
            />

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
            >
              {loading ? "Registrando..." : "Crear Cuenta"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate("login")}
              className="text-blue-500 hover:underline font-semibold"
            >
              Iniciar sesión
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Register;

/* COMPONENTE AUXILIAR */
function Input({ icon: Icon, label, type = "text", value, onChange }) {
  return (
    <div>
      <label className="text-sm font-semibold mb-1 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
    </div>
  );
}
