import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { BarChart3, LogOut, Search, MapPin, Save, CheckCircle } from 'lucide-react';
import NotificationHeader from "./NotificationHeader";
import EditReportModal from "./EditReportModal";

export default function EntityDashboard({ user, onLogout }) {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [categories, setCategories] = useState([]);
    const [myCategories, setMyCategories] = useState([]); // Array de IDs
    const [loading, setLoading] = useState(true);
    const [savingPrefs, setSavingPrefs] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterUrgency, setFilterUrgency] = useState("all");

    const [selectedReport, setSelectedReport] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        received: 0,
        in_review: 0,
        in_progress: 0,
        resolved: 0,
        rejected: 0,
        closed: 0,
        avg_rating: 0,
        critical_count: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    // Efecto para filtrar cuando cambian las preferencias locales o los filtros
    useEffect(() => {
        applyFilters();
    }, [reports, searchTerm, filterStatus, filterUrgency, myCategories]); // Agregado myCategories

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Cargar categorías disponibles
            const { data: catsData } = await supabase
                .from("categories")
                .select("id, name")
                .order("name");
            setCategories(catsData || []);

            // 2. Cargar mis preferencias (categorías seleccionadas)
            // Buscamos en la tabla entities usando el user.id (que es el auth user id)
            // Ojo: user.id en props viene del Auth o de la tabla entities? 
            // En App.jsx Login: userObj = { ...entityData, role: 'entity' ... }
            // Entonces user.id es el de la tabla entities? 
            // Revisando Login: `const userObj = { ...entityData, role: 'entity', full_name: entityData.name };`
            // entityData viene de `from('entities')...`. 
            // Si la tabla entities tiene su propio ID (uuid) y user_id (auth), 
            // `user.id` seria el ID DE LA ENTIDAD en la tabla entities (PK), no el auth id.
            // Confirmar: `eq('user_id', authData.user.id).single()` -> entityData
            // Si, user.id es el PK de entities. user.user_id es el auth id.

            if (user.categories && Array.isArray(user.categories)) {
                setMyCategories(user.categories);
            } else {
                // Si no viene en el objeto user (porque no recargamos sesión), lo buscamos
                const { data: entityData } = await supabase
                    .from('entities')
                    .select('categories')
                    .eq('id', user.id)
                    .single();

                if (entityData?.categories) {
                    setMyCategories(entityData.categories);
                }
            }

            // 3. Cargar reportes
            const { data: reportsData, error: reportsError } = await supabase
                .from('reports')
                .select(`
        *,
        categories (
          name,
          icon,
          color,
          responsible_entity
        ),
        users!reports_assigned_user_id_fkey (
          full_name,
          entity_name
        )
      `)
                .order('created_at', { ascending: false });

            if (reportsError) throw reportsError;

            const transformedReports = (reportsData || []).map(report => ({
                ...report,
                category_name: report.categories?.name,
                category_icon: report.categories?.icon,
                category_color: report.categories?.color,
                responsible_entity: report.categories?.responsible_entity,
                assigned_user_name: report.users?.full_name,
                assigned_entity_name: report.users?.entity_name
            }));

            setReports(transformedReports);
            // El filtrado inicial se hará en el useEffect via applyFilters

            calculateStats(transformedReports);

        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const savePreferences = async () => {
        try {
            setSavingPrefs(true);
            const { error } = await supabase
                .from('entities')
                .update({ categories: myCategories })
                .eq('id', user.id);

            if (error) throw error;

            // Actualizar localStorage para persistencia simple de sesión
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { ...currentUser, categories: myCategories };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            alert("Preferencias guardadas correctamente");
        } catch (err) {
            console.error("Error guardando preferencias:", err);
            alert("Error al guardar");
        } finally {
            setSavingPrefs(false);
        }
    };

    const toggleCategory = (catId) => {
        setMyCategories(prev => {
            if (prev.includes(catId)) {
                return prev.filter(id => id !== catId);
            } else {
                return [...prev, catId];
            }
        });
    };

    const calculateStats = (reportsData) => {
        const newStats = {
            total: reportsData.length,
            received: reportsData.filter(r => r.status === 'received').length,
            in_review: reportsData.filter(r => r.status === 'in_review').length,
            in_progress: reportsData.filter(r => r.status === 'in_progress').length,
            resolved: reportsData.filter(r => r.status === 'resolved').length,
            rejected: reportsData.filter(r => r.status === 'rejected').length,
            closed: reportsData.filter(r => r.status === 'closed').length,
            critical_count: reportsData.filter(r => r.urgency_level === 'critical').length,
            avg_rating: 0
        };
        const ratedReports = reportsData.filter(r => r.citizen_rating);
        if (ratedReports.length > 0) {
            const sum = ratedReports.reduce((acc, r) => acc + r.citizen_rating, 0);
            newStats.avg_rating = (sum / ratedReports.length).toFixed(1);
        }
        setStats(newStats);
    };

    const getStatusConfig = (status) => {
        const configs = {
            received: { label: 'Recibido', color: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
            in_review: { label: 'En Revisión', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' },
            in_progress: { label: 'En Progreso', color: 'bg-purple-500/20 text-purple-300 border-purple-500/50' },
            requires_info: { label: 'Requiere Info', color: 'bg-orange-500/20 text-orange-300 border-orange-500/50' },
            resolved: { label: 'Resuelto', color: 'bg-green-500/20 text-green-300 border-green-500/50' },
            rejected: { label: 'Rechazado', color: 'bg-red-500/20 text-red-300 border-red-500/50' },
            closed: { label: 'Cerrado', color: 'bg-gray-500/20 text-gray-300 border-gray-500/50' }
        };
        return configs[status] || configs.received;
    };

    const applyFilters = () => {
        // Filtrar primero por las categorías seleccionadas por la entidad
        // Si no tiene categorías seleccionadas, ¿mostramos todo o nada?
        // "Escoger las categorias que va a atender y que los que no pertenezcan... se oculten".
        // Si no escoge nada, no ve nada (o ve todo? Asumiré: no ve nada si el array está vacío, o todo si es nuevo. 
        // Mejor: Si array vacio -> No ve reportes específicos, incita a seleccionar.
        // PERO para usabilidad inicial, si es null/undefined podría mostrar todo? No, cumplamos el requisito estricto.

        let filtered = reports.filter(r => myCategories.includes(r.category_id));

        if (searchTerm) {
            filtered = filtered.filter(r =>
                r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.citizen_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.location_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.tracking_code?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(r => r.status === filterStatus);
        }

        if (filterUrgency !== 'all') {
            filtered = filtered.filter(r => r.urgency_level === filterUrgency);
        }

        setFilteredReports(filtered);
    };

    return (
        <>
            <nav className="bg-[#A8D5A2] border-b border-green-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-blue-600" />
                            <div>
                                <h1 className="text-xl font-bold text-[#2F5130]">UrbanReport</h1>
                                <p className="text-xl font-bold text-[#00000]">Panel Entidad</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <NotificationHeader userId={user?.user_id} /> {/* user.user_id es el id para notificaciones (auth id) */}

                            <div className="text-right">
                                <p className="text-sm text-[#2F5130]">{user?.name}</p>
                                <p className="text-xs text-[#2F5130]/70">Entidad Verificada</p>
                            </div>

                            <button
                                onClick={onLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-200 hover:bg-red-300 text-red-800 rounded-lg transition"
                            >
                                <LogOut className="w-4 h-4" />
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8 bg-[#F7F7F7] min-h-screen">

                {/* SECCION PREFERENCIAS CATEGORIAS */}
                <div className="bg-white shadow-md rounded-xl border border-gray-200 p-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-[#2F5130]">Categorías de Atención</h3>
                            <p className="text-sm text-gray-500">Selecciona las categorías de reportes que deseas gestionar.</p>
                        </div>
                        <button
                            onClick={savePreferences}
                            disabled={savingPrefs}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {savingPrefs ? "Guardando..." : "Guardar Preferencias"}
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => {
                            const isSelected = myCategories.includes(cat.id);
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => toggleCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-2
                                ${isSelected
                                            ? 'bg-green-100 border-green-300 text-green-800 shadow-sm'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {isSelected ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 h-3 block border rounded-full border-gray-400"></span>}
                                    {cat.name}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-gray py-12">Cargando datos...</div>
                ) : (
                    <>
                        {/* STATS CARDS - Mostrar stats basados en lo filtrado o totales? Normalmente totales filtrados */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Podemos reutilizar las cards de AdminDashboard, por brevedad pondré un resumen simple */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-gray-500 text-sm">Reportes Visibles</p>
                                <p className="text-2xl font-bold text-gray-800">{filteredReports.length}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-gray-500 text-sm">Pendientes</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {filteredReports.filter(r => ['received', 'in_review', 'in_progress'].includes(r.status)).length}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-gray-500 text-sm">Resueltos</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {filteredReports.filter(r => r.status === 'resolved').length}
                                </p>
                            </div>
                        </div>

                        {/* FILTROS Y TABLA */}
                        <div className="bg-white shadow-md rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
                            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar reporte..."
                                        className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Todos los estados</option>
                                    <option value="received">Recibido</option>
                                    <option value="in_review">En Revisión</option>
                                    <option value="in_progress">En Progreso</option>
                                    <option value="resolved">Resuelto</option>
                                    <option value="closed">Cerrado</option>
                                </select>

                                <select
                                    value={filterUrgency}
                                    onChange={(e) => setFilterUrgency(e.target.value)}
                                    className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Urgencia</option>
                                    <option value="low">Baja</option>
                                    <option value="medium">Media</option>
                                    <option value="high">Alta</option>
                                    <option value="critical">Crítica</option>
                                </select>
                            </div>

                            {/* TABLA DE REPORTES */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-300">
                                            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Código</th>
                                            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Fecha</th>
                                            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Categoría</th>
                                            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Ubicación</th>
                                            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Urgencia</th>
                                            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Estado</th>
                                            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Acciones</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredReports.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-12 text-gray-600">
                                                    {myCategories.length === 0
                                                        ? "Selecciona categorías arriba para ver reportes."
                                                        : "No hay reportes en las categorías seleccionadas."}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredReports.map((report) => {
                                                const statusConfig = getStatusConfig(report.status);
                                                const urgencyColors = {
                                                    low: 'bg-slate-200 text-slate-700',
                                                    medium: 'bg-yellow-200 text-yellow-800',
                                                    high: 'bg-orange-200 text-orange-800',
                                                    critical: 'bg-red-200 text-red-800',
                                                };

                                                return (
                                                    <tr
                                                        key={report.id}
                                                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <td className="py-4 px-4">
                                                            <span className="text-xs font-mono text-blue-700 font-semibold">
                                                                {report.tracking_code}
                                                            </span>
                                                        </td>

                                                        <td className="py-4 px-4 text-gray-700 text-sm">
                                                            {new Date(report.created_at).toLocaleDateString("es-ES")}
                                                        </td>

                                                        <td className="py-4 px-4">
                                                            <span className="text-gray-800 font-medium text-sm">
                                                                {report.category_name}
                                                            </span>
                                                        </td>

                                                        <td className="py-4 px-4">
                                                            <div className="flex items-start gap-1 text-xs text-gray-500">
                                                                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                                <span className="line-clamp-2 max-w-[150px]">
                                                                    {report.location_address}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="py-4 px-4">
                                                            <span
                                                                className={`px-2 py-1 rounded text-xs font-medium capitalize ${urgencyColors[report.urgency_level]}`}
                                                            >
                                                                {report.urgency_level === "low"
                                                                    ? "Baja"
                                                                    : report.urgency_level === "medium"
                                                                        ? "Media"
                                                                        : report.urgency_level === "high"
                                                                            ? "Alta"
                                                                            : "Crítica"}
                                                            </span>
                                                        </td>

                                                        <td className="py-4 px-4">
                                                            <span
                                                                className={`px-3 py-1 rounded-lg border text-xs font-medium ${statusConfig.color}`}
                                                            >
                                                                {statusConfig.label}
                                                            </span>
                                                        </td>

                                                        <td className="py-4 px-4">
                                                            <button
                                                                onClick={() => setSelectedReport(report)}
                                                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-blue-600"
                                                                title="Gestionar reporte"
                                                            >
                                                                <Search className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modal */}
            {selectedReport && (
                <EditReportModal
                    report={selectedReport}
                    user={user}
                    onClose={() => setSelectedReport(null)}
                    onSuccess={() => {
                        setSelectedReport(null);
                        loadData();
                    }}
                />
            )}
        </>
    );
}
