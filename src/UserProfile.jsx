import React, { useState, useEffect } from 'react';
import { supabase, uploadFile } from './lib/supabase';
import { User, Phone, Mail, Camera, Save, X, ArrowLeft, Loader } from 'lucide-react';

export default function UserProfile({ user, onNavigate }) {
    const [profile, setProfile] = useState({
        full_name: '',
        phone: '',
        avatar_url: '',
        email: '' // Read-only
    });
    const [originalProfile, setOriginalProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError('');

            const table = user.role === 'entity' ? 'entities' : 'users';
            // Entities have 'name', Users have 'full_name'
            // We need to map them to a common structure

            let query = supabase.from(table).select('*').single();

            // For entities, we query by id (which matches auth id usually, but let's be safe: 
            // if table is entities, we query by user_id or id? 
            // In App.jsx login: entities query is .eq('user_id', authData.user.id).
            // Assuming 'user.id' passed here is the correct ID to query.
            // If user is from 'users' table, user.id is the PK.
            // If user is from 'entities' table (via App.jsx login flow), user.id is the PK of entities table.

            query = query.eq('id', user.id);

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            const loadedProfile = {
                full_name: data.full_name || data.name || '',
                phone: data.phone || '',
                avatar_url: data.avatar_url || '',
                email: data.email || user.email || ''
            };

            setProfile(loadedProfile);
            setOriginalProfile(loadedProfile);
        } catch (err) {
            console.error('Error loading profile:', err);
            setError('Error al cargar el perfil.');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        try {
            setUploading(true);
            setError('');
            const file = e.target.files[0];
            if (!file) return;

            // Usamos uploadFile pero necesitamos pasar un "reportId" para la subcarpeta.
            // Usaremos 'profiles' como prefijo virtual, aunque la función espera reportId.
            // La función generate nombre: `${reportId}/${timestamp}-${randomString}.${fileExt}`
            // Pasaremos `profiles/${user.id}`
            const fileUrl = await uploadFile(file, `profiles/${user.id}`);

            setProfile(prev => ({ ...prev, avatar_url: fileUrl }));
            setSuccess('Foto subida. Recuerda guardar los cambios.');
        } catch (err) {
            console.error('Error uploading avatar:', err);
            setError('Error al subir la imagen: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!profile.full_name.trim()) {
            setError('El nombre es obligatorio');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const table = user.role === 'entity' ? 'entities' : 'users';

            const updates = {
                phone: profile.phone,
                avatar_url: profile.avatar_url
            };

            if (user.role === 'entity') {
                updates.name = profile.full_name;
            } else {
                updates.full_name = profile.full_name;
            }

            const { error: updateError } = await supabase
                .from(table)
                .update(updates)
                .eq('id', user.id);

            if (updateError) throw updateError;

            // update local storage user if needed
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { ...currentUser, ...updates };
            // Map back 'name' to 'full_name' for consistency if entity
            if (user.role === 'entity') updatedUser.full_name = updates.name;

            localStorage.setItem('user', JSON.stringify(updatedUser));

            setOriginalProfile(profile);
            setIsEditing(false);
            setSuccess('Perfil actualizado correctamente');

            // Update parent state via reload or callback if we had one
            // For now, we rely on App.jsx state being refreshed on reload or we simply display local state

        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Error al guardar los cambios');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setProfile(originalProfile);
        setIsEditing(false);
        setError('');
        setSuccess('');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onNavigate(user.role === 'entity' ? 'entity' : 'inicio')}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold">Mi Perfil</h1>
                    </div>
                    {isEditing ? (
                        <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Editando</span>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-white/90 transition-colors"
                        >
                            Editar Perfil
                        </button>
                    )}
                </div>

                <div className="p-8">
                    {loading && !profile.email ? (
                        <div className="flex justify-center py-10">
                            <Loader className="w-10 h-10 text-blue-500 animate-spin" />
                        </div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-8">

                            {/* Mensajes */}
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                                    <X className="w-5 h-5" />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="p-4 bg-green-50 text-green-600 rounded-lg flex items-center gap-2">
                                    <Save className="w-5 h-5" />
                                    {success}
                                </div>
                            )}

                            {/* Avatar Section */}
                            <div className="flex flex-col items-center">
                                <div className="relative w-32 h-32 mb-4">
                                    {profile.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt="Profile"
                                            className="w-full h-full rounded-full object-cover border-4 border-gray-100 shadow-md"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-gray-200 border-4 border-gray-100 flex items-center justify-center text-gray-400 shadow-md">
                                            <User className="w-16 h-16" />
                                        </div>
                                    )}

                                    {isEditing && (
                                        <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700 transition shadow-sm">
                                            {uploading ? <Loader className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                disabled={uploading}
                                                onChange={handleAvatarUpload}
                                            />
                                        </label>
                                    )}
                                </div>
                                <p className="text-gray-500 text-sm">{user.role === 'entity' ? 'Cuenta de Entidad' : 'Cuenta Ciudadana'}</p>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Name */}
                                <div className="col-span-full">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Nombre Completo
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={profile.full_name}
                                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                            disabled={!isEditing}
                                            className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all
                                        ${isEditing ? 'border-gray-300 bg-white' : 'border-transparent bg-gray-50'}`}
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled={true}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-transparent bg-gray-100 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 pl-1">No editable por seguridad</p>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Teléfono
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={profile.phone}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            disabled={!isEditing}
                                            className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all
                                        ${isEditing ? 'border-gray-300 bg-white' : 'border-transparent bg-gray-50'}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            {isEditing && (
                                <div className="flex gap-4 pt-6 border-t border-gray-100 mt-6">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={loading}
                                        className="flex-1 py-3 px-6 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 px-6 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Guardar Cambios
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
