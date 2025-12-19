import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function RateAppModal({ user, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Por favor selecciona una calificación de estrellas.");
      return;
    }

    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const { data: authData } = await supabase.auth.getUser();
    const authUserId =
      (sessionData && sessionData.session && sessionData.session.user && sessionData.session.user.id) ||
      (authData && authData.user && authData.user.id) ||
      (supabase.auth && typeof supabase.auth.user === "function" && supabase.auth.user()?.id) ||
      null;

    if (!authUserId) {
      setLoading(false);
      alert("No se encontró usuario autenticado. Por favor inicia sesión nuevamente.");
      return;
    }

    const { error } = await supabase
      .from('app_ratings')
      .insert([
        {
          user_id: authUserId,
          rating: rating,
          comment: comment,
          created_at: new Date().toISOString()
        }
      ]);

    setLoading(false);

    if (error) {
      console.error('Error enviando calificación de la app:', error);
      alert('Hubo un error al enviar tu calificación. Inténtalo de nuevo.');
    } else {
      alert('¡Gracias por calificar nuestra plataforma!');
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-green-600 p-4 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold">Calificar UrbanReport</h2>
          <button onClick={onClose} className="hover:bg-green-700 p-1 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            ¿Qué te parece nuestra plataforma? Tu opinión nos ayuda a mejorar.
          </p>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={32}
                onClick={() => setRating(star)}
                className={`cursor-pointer transition-colors ${
                  star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Comentario (Opcional)
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 h-24 resize-none"
                placeholder="Escribe aquí tus sugerencias..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-bold transition ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? 'Enviando...' : 'Enviar Calificación'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
