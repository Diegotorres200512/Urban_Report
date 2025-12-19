import { useState } from "react";
import { AlertCircle, CheckCircle, User, Mail, Phone, Lock, Upload, FileText } from "lucide-react";
import { supabase, getCategories, uploadFile } from './lib/supabase.js';
import logo from "./assets/logo.jpg";

export default function RegisterEntity({ onNavigate }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone: "",
    nit: "", // Nuevo campo
  });

  const [rutFile, setRutFile] = useState(null);
  const [chamberFile, setChamberFile] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /* =========================
     HANDLE SUBMIT
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      /* Validaciones */
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }
      if (formData.password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }
      if (!rutFile || !chamberFile) {
        throw new Error("Debes adjuntar el RUT y la Cámara de Comercio");
      }

      /* 1️⃣ Crear usuario en Supabase Auth */
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              role: "entity",
              full_name: formData.full_name,
            },
          },
        });

      if (signUpError) throw signUpError;

      const user = signUpData.user;
      if (!user) {
        throw new Error("No se pudo crear el usuario");
      }

      /* 2️⃣ Subir archivos */
      const timestamp = Date.now();
      const rutPath = `entities/${user.id}/rut_${timestamp}.pdf`;
      const chamberPath = `entities/${user.id}/chamber_${timestamp}.pdf`;

      // Subir RUT
      const { error: rutError } = await supabase.storage
        .from("entity-documents")
        .upload(rutPath, rutFile);
      if (rutError) throw rutError;

      // Subir Cámara de Comercio
      const { error: chamberError } = await supabase.storage
        .from("entity-documents")
        .upload(chamberPath, chamberFile);
      if (chamberError) throw chamberError;

      /* 3️⃣ Crear registro en tabla 'entities' */
      const { error: insertError } = await supabase
        .from("entities")
        .insert({
          user_id: user.id, // Enlace con auth
          name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          nit: formData.nit, // Nuevo campo
          rut_path: rutPath,
          chamber_path: chamberPath,
          status: 'pending', // Por defecto pendiente
          is_active: true
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => onNavigate("login"), 2500);

    } catch (err) {
      console.error(err);
      setError(err.message || "Error al registrar la entidad");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-xl border border-gray-200 p-6">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
              <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-[#2F5130]">Registro de Entidad</h1>
            <p className="text-slate-300">Registro para entidades oficiales</p>
          </div>

          {/* Alertas */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex gap-2 text-red-200">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex gap-2 text-green-200">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">
                Entidad registrada correctamente. Pendiente de aprobación.
              </span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre */}
            <Input icon={User} label="Nombre de la Entidad" value={formData.full_name}
              onChange={(v) => setFormData({ ...formData, full_name: v })} />

            {/* NIT - Nuevo Campo */}
            <Input icon={FileText} label="NIT" value={formData.nit}
              onChange={(v) => setFormData({ ...formData, nit: v })} />

            {/* Email */}
            <Input icon={Mail} label="Correo Electrónico" type="email"
              value={formData.email}
              onChange={(v) => setFormData({ ...formData, email: v })} />

            {/* Teléfono */}
            <Input icon={Phone} label="Teléfono"
              value={formData.phone}
              onChange={(v) => setFormData({ ...formData, phone: v })} />

            {/* Password */}
            <Input icon={Lock} label="Contraseña" type="password"
              value={formData.password}
              onChange={(v) => setFormData({ ...formData, password: v })} />

            {/* Confirm */}
            <Input icon={Lock} label="Confirmar Contraseña" type="password"
              value={formData.confirmPassword}
              onChange={(v) => setFormData({ ...formData, confirmPassword: v })} />

            {/* Archivos */}
            <FileInput label="Adjuntar RUT (PDF)"
              onChange={setRutFile} />

            <FileInput label="Adjuntar Cámara de Comercio (PDF)"
              onChange={setChamberFile} />

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg"
            >
              {loading ? "Registrando..." : "Registrar Entidad"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate("login")}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Volver al login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

/* COMPONENTES AUXILIARES */
function Input({ icon: Icon, label, type = "text", value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-gray-700">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="
            w-full
            pl-10 pr-4 py-3
            bg-white
            border border-gray-300
            rounded-lg
            text-gray-800
            placeholder-gray-400
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
          "
          required
        />
      </div>
    </div>
  );
}


function FileInput({ label, onChange }) {
  return (
    <div>
      <label className="text-lg font-semibold mb-2">{label}</label>
      <div className="border border-dashed border-blue-300 rounded-lg p-4 text-center">
        <Upload className="mx-auto mb-2 text-blue-400" />
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => onChange(e.target.files[0])}
          required
        />
      </div>
    </div>
  );
}
