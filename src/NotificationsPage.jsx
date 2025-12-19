import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Bell, ArrowLeft, CheckCircle, AlertTriangle, XCircle, Info, Filter, Search } from 'lucide-react';

export default function NotificationsPage({ user, onNavigate }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadNotifications();
        markAllAsVisible(); // Opcional: marcar como "vistas" al entrar a la página
    }, [user]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (err) {
            console.error("Error cargando notificaciones:", err);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsVisible = async () => {
        // Podríamos marcar como leídos todos al entrar, o dejar que el usuario lo haga uno a uno.
        // user requirement implies "history", let's keep logic simple.
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === 'all'
            ? true
            : filter === 'unread' ? !n.is_read : n.is_read;

        const term = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
            n.message.toLowerCase().includes(term) ||
            n.report_code?.toLowerCase().includes(term) ||
            n.address?.toLowerCase().includes(term) ||
            n.entity_name?.toLowerCase().includes(term);

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onNavigate(user.role === 'entity' ? 'entity' : 'inicio')}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Bell className="w-6 h-6" />
                            Mis Notificaciones
                        </h1>
                    </div>
                    <div className="text-sm bg-white/20 px-4 py-2 rounded-lg">
                        Total: {notifications.length}
                    </div>
                </div>

                {/* Filters */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                        />
                    </div>

                    <div className="flex bg-white rounded-lg border border-gray-300 p-1">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            No leídas
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">Cargando...</div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                            <Bell className="w-12 h-12 mb-3 text-gray-200" />
                            <p>No se encontraron notificaciones</p>
                        </div>
                    ) : (
                        filteredNotifications.map(notif => (
                            <div key={notif.id} className={`p-6 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-blue-50/30' : ''}`}>
                                <div className="flex gap-4 items-start">
                                    <div className="mt-1 flex-shrink-0">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-gray-800 text-lg">
                                                {notif.report_code ? `Reporte #${notif.report_code}` : 'Sistema'}
                                            </h4>
                                            <span className="text-xs text-gray-500">
                                                {new Date(notif.created_at).toLocaleString('es-ES', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-gray-600">{notif.message}</p>

                                        {(notif.address || notif.entity_name || (notif.old_status && notif.new_status)) && (
                                            <div className="mt-3 p-3 bg-gray-100 rounded-lg text-sm grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600">
                                                {notif.address && (
                                                    <div>📍 <span className="font-semibold">Ubicación:</span> {notif.address}</div>
                                                )}
                                                {notif.entity_name && (
                                                    <div>🏢 <span className="font-semibold">Entidad:</span> {notif.entity_name}</div>
                                                )}
                                                {notif.old_status && notif.new_status && (
                                                    <div className="col-span-full">
                                                        🔄 <span className="font-semibold">Estado:</span>
                                                        <span className="mx-1 px-2 py-0.5 bg-gray-200 rounded text-xs">{notif.old_status}</span>
                                                        ➝
                                                        <span className="mx-1 px-2 py-0.5 bg-green-200 text-green-800 rounded text-xs">{notif.new_status}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
