import React, { useState, useEffect } from "react";
import { X, AlertCircle, Upload, ImageIcon } from "lucide-react";
import { supabase } from "./lib/supabase.js";
import MapSelector from "./MapSelector";

export default function NewReportModal({ user, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    category_id: "",
    urgency_level: "low",
    title: "",
    description: "",
    location_address: "",
    citizen_name: user?.full_name || "",
    citizen_email: user?.email || "",
    citizen_phone: "",
    prefer_contact: "email",
    lat: null,
    lon: null,
  });

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");

  function handleLocationSelected({ lat, lon, address }) {
    setSelectedAddress(address);

    setFormData({
      ...formData,
      lat,
      lon,
      location_address: address,
    });

    setIsMapOpen(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*");
    if (!error) setCategories(data);
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);

    if (selected.length + files.length > 3) {
      setError("Máximo 3 archivos permitidos.");
      return;
    }

    const valid = selected.filter((file) => file.size <= 10 * 1024 * 1024);

    if (valid.length !== selected.length) {
      setError("Cada archivo debe pesar menos de 10MB.");
    }

    setFiles([...files, ...valid]);
  };

  const removeFile = (i) => {
    setFiles(files.filter((_, index) => index !== i));
  };

  const uploadFiles = async (reportId) => {
    const uploadedFiles = [];

    for (const file of files) {
      const filename = `${reportId}/${Date.now()}_${file.name}`.replace(" ", "_");

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(filename, file);

      if (!uploadError) {
        uploadedFiles.push(filename);
      }
    }

    return uploadedFiles;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: repError } = await supabase
        .from("reports")
        .insert([
          {
            user_id: user.id,
            ...formData,
            status: "received",
          },
        ])
        .select()
        .single();

      if (repError) throw repError;

      let uploadedPaths = [];

      if (files.length > 0) {
        uploadedPaths = await uploadFiles(data.id);

        await supabase.from("report_files").insert(
          uploadedPaths.map((path) => ({
            report_id: data.id,
            file_path: path,
          }))
        );
      }

      await supabase.from("report_history").insert([
        {
          report_id: data.id,
          changed_by: user.id,
          changed_by_name: user.full_name,
          action: "created",
          new_value: "received",
          comment: "Reporte creado por el ciudadano",
        },
      ]);

      onSuccess();
    } catch (err) {
      console.error("Error:", err);
      setError("Error al crear el reporte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-3xl my-8">

          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-2xl">
            <h2 className="text-2xl font-bold text-gray-900">Registrar nueva queja o reporte</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Categoría + Urgencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de Urgencia *</label>
                <select
                  value={formData.urgency_level}
                  onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
                  required
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 resize-none"
                required
              />
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación *</label>

              <div className="flex gap-3">
                <input
  type="text"
  value={formData.location_address}
  onChange={(e) =>
    setFormData({
      ...formData,
      location_address: e.target.value,
    })
  }
  className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg"
  required
/>


                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Seleccionar en mapa
                </button>
              </div>

              {selectedAddress && (
                <p className="text-sm mt-2 text-gray-700">
                  📍 Dirección seleccionada: {selectedAddress}
                </p>
              )}
            </div>

            {/* Archivos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjuntar Archivos (Máx 3 / 10MB)
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                <input
                  type="file"
                  id="files"
                  multiple
                  accept="image/*,video/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="files" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Click para subir archivos</p>
                </label>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-100 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-800">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-semibold rounded-lg"
              >
                {loading ? "Enviando..." : "Enviar Reporte"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mapa */}
      {isMapOpen && (
  <MapSelector
    onClose={() => setIsMapOpen(false)}
    onSelect={handleLocationSelected}
    searchAddress={formData.location_address}
  />
)}

    </>
  );
}
