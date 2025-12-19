
import React, { useState, useEffect } from 'react';
import CitizenHome from "./CitizenHome";
import Welcome from "./Welcome";
import { FileText, LogOut, Plus, Clock, CheckCircle, XCircle, AlertCircle, BarChart3, Edit2, Mail, Phone, MapPin, User, Lock, UserPlus, Search, X, Save, Upload, Image as ImageIcon, Zap, TrendingUp } from 'lucide-react';
import { supabase, getCategories, uploadFile } from './lib/supabase.js';
import logo from "./assets/logo.jpg";
import ChooseRegister from "./ChooseRegister";
import Register from "./Register";
import RegisterEntity from "./RegisterEntity";
import RateService from "./RateService";
import AdminRegister from "./AdminRegister";
import NotificationHeader from "./NotificationHeader";
import { notificationService } from "./services/notificationService";
import EntityDashboard from "./EntityDashboard";
import EditReportModal from "./EditReportModal";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function App() {
  const [currentView, setCurrentView] = useState('welcome');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("citizen");
  const [filteredReports, setFilteredReports] = useState([]);
  useEffect(() => {
    const savedUser = localStorage.getItem('user');

    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      if (userData.role === 'admin') {
        setCurrentView('admin');
      } else if (userData.role === 'entity') {
        setCurrentView('entity');
      } else {
        setCurrentView('inicio');
      }
    } else {
      setCurrentView('welcome'); // <- corregido
    }

    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    if (userData.role === 'admin') {
      setCurrentView('admin');
    } else if (userData.role === 'entity') {
      setCurrentView('entity');
    } else {
      setCurrentView('inicio');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCurrentView('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {currentView === 'welcome' && (
        <Welcome onContinue={() => setCurrentView('login')} />
      )}

      {currentView === 'login' && (
        <Login onLogin={handleLogin} onNavigate={setCurrentView} />
      )}

      {currentView === 'choose-register' && (
        <ChooseRegister onNavigate={setCurrentView} />
      )}

      {currentView === "Register" && (
        <Register onNavigate={setCurrentView} />
      )}

      {currentView === "RegisterEntity" && (
        <RegisterEntity onNavigate={setCurrentView} />
      )}

      {currentView === "RegisterAdmin" && (
        <AdminRegister onNavigate={setCurrentView} />
      )}

      {currentView === 'inicio' && (
        <CitizenHome user={user} onNavigate={setCurrentView} onLogout={handleLogout} />
      )}

      {currentView === 'citizen' && (
        <CitizenDashboard user={user} onLogout={handleLogout} onNavigate={setCurrentView} />
      )}


      {currentView === "Rate" && (
        <RateService user={user} onNavigate={setCurrentView} />
      )}






      {currentView === 'admin' && (
        <AdminDashboard user={user} onLogout={handleLogout} />
      )}

      {currentView === 'entity' && (
        <EntityDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

// ============================================
// LOGIN
// ============================================
function Login({ onLogin, onNavigate }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔍 Intentando login con:', formData.email);

      // 1. Intentar autenticación con Supabase Auth (para Entidades y usuarios migrados)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (authData?.user) {
        console.log("✅ Authenticated via Supabase Auth:", authData.user.id);

        // A. Verificar si es una ENTIDAD
        const { data: entityData } = await supabase
          .from('entities')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (entityData) {
          if (entityData.status === 'pending') {
            setError("Tu cuenta está pendiente de aprobación por un administrador.");
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
          if (entityData.status === 'rejected') {
            setError(`Tu solicitud fue rechazada: ${entityData.rejection_reason || 'Sin motivo'}`);
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }

          // Login exitoso como entidad
          const userObj = { ...entityData, role: 'entity', full_name: entityData.name };
          console.log('✅ Login exitoso (Entidad):', userObj);
          onLogin(userObj);
          return;
        }

        // B. Verificar si es un USUARIO (Ciudadano/Admin) en tabla 'users'
        // Intentar buscar por email ya que el ID de auth podría no coincidir con legacy users si no se migraron IDs
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', formData.email)
          .single();

        if (userData) {
          console.log('✅ Login exitoso (Usuario Auth):', userData);
          onLogin(userData);
          return;
        }
      }

      // 2. Fallback: Autenticación Legacy (Directo a tabla users con contraseña texto plano)
      // Solo si Auth falló o no encontró perfil
      console.log("⚠️ Fallback to Legacy Login check...");

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', formData.email)
        .eq('password', formData.password)
        .eq('is_active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const legacyUser = data[0];

        // Verificación extra por si es entidad legacy (aunque ahora usamos tabla entities)
        if (legacyUser.role === "entity" && legacyUser.status !== "approved") {
          setError("Tu cuenta está pendiente de aprobación.");
          setLoading(false);
          return;
        }

        console.log('✅ Login exitoso (Legacy):', legacyUser);
        onLogin(legacyUser);
        return;
      }

      // Si llegamos aqui, fallaron ambos métodos
      setError('Credenciales incorrectas');
      setLoading(false);

    } catch (err) {
      console.error('❌ Error inesperado:', err);
      setError(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-blue-300">

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-[#2F5130]">UrbanReport</h1>

          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}



          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-lg font-semibold mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"

                  placeholder="tu@correo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-lg font-semibold mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"

                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-lg font-semibold mb-2">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => onNavigate('choose-register')}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Regístrate
              </button>

            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
// ============================================
// REGISTER
// ============================================


// Continuará con CitizenDashboard y AdminDashboard en el siguiente mensaje...

// ============================================
// CITIZEN DASHBOARD
// ============================================
function CitizenDashboard({ user, onLogout, onNavigate }) {
  const [showNewReport, setShowNewReport] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredReports, setFilteredReports] = useState([]);
  useEffect(() => {
    loadReports();
  }, [user]);

  const loadReports = async () => {


    try {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          categories ( id, name, icon, color, responsible_entity ),
          users!reports_assigned_user_id_fkey ( full_name, entity_name )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformed = data.map(r => ({
        ...r,
        category_name: r.categories?.name,
        category_color: r.categories?.color,
        assigned_user_name: r.users?.full_name,
        assigned_entity_name: r.users?.entity_name
      }));

      setReports(transformed);
      setFilteredReports(transformed);
    } catch (err) {
      console.error("Error cargando reportes:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      received: { label: 'Recibido', color: 'bg-blue-500/20 text-blue-300 border-blue-500/50', icon: Clock },
      in_review: { label: 'En Revisión', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50', icon: AlertCircle },
      in_progress: { label: 'En Progreso', color: 'bg-purple-500/20 text-purple-300 border-purple-500/50', icon: TrendingUp },
      requires_info: { label: 'Requiere Info', color: 'bg-orange-500/20 text-orange-300 border-orange-500/50', icon: AlertCircle },
      resolved: { label: 'Resuelto', color: 'bg-green-500/20 text-green-300 border-green-500/50', icon: CheckCircle },
      rejected: { label: 'Rechazado', color: 'bg-red-500/20 text-red-300 border-red-500/50', icon: XCircle },
      closed: { label: 'Cerrado', color: 'bg-gray-500/20 text-gray-300 border-gray-500/50', icon: CheckCircle }
    };
    return configs[status] || configs.received;
  };

  const getUrgencyBadge = (urgency) => {
    const badges = {
      low: { label: 'Baja', color: 'bg-slate-500/20 text-slate-300' },
      medium: { label: 'Media', color: 'bg-yellow-500/20 text-yellow-300' },
      high: { label: 'Alta', color: 'bg-orange-500/20 text-orange-300' },
      critical: { label: 'Crítica', color: 'bg-red-500/20 text-red-300' }
    };
    return badges[urgency] || badges.low;
  };

  return (
    <>
      <nav className="bg-[#A8D5A2] border-b border-green-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">


          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
              <div>
                <h1 className="text-lg font-semibold mb-2">UrbanReport</h1>
                <p className="text-sm text-[#2F5130]/80">Portal Ciudadano</p>


              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationHeader userId={user?.id} />
              <span className="text-lg font-semibold mb-2">{user?.full_name}</span>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-300 hover:bg-red-300 text-red-800 rounded-lg transition-colors"

              >


                <LogOut className="text-lg font-semibold mb-2 w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 bg-[#F7F7F7] min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => onNavigate("inicio")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-400 hover:bg-slate-300 text-slate-700 rounded-lg transition"
          >
            ← Volver
          </button>

          <div>
            <h2 className="text-lg font-semibold mb-2">Mis Reportes</h2>
            <p className="text-xl font-bold text-[#2F5130]">Gestiona y da seguimiento a tus reportes</p>
          </div>
          <button
            onClick={() => setShowNewReport(true)}

          >
          </button>
        </div>

        {loading ? (
          <div className="text-center text-white py-12">Cargando reportes...</div>
        ) : reports.length === 0 ? (
          <div className="bg-white shadow-md rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No tienes reportes</h3>
            <p className="text-slate-300 mb-6">Crea tu primer reporte ciudadano</p>
            <button
              onClick={() => setShowNewReport(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Reporte...
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => {
              const statusConfig = getStatusConfig(report.status);
              const urgencyBadge = getUrgencyBadge(report.urgency_level);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={report.id}
                  className="bg-white shadow-md border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`px-3 py-1 rounded-lg border flex items-center gap-2 ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm font-medium text-gray-700">{statusConfig.label}</span>
                    </div>

                    <div className={`px-2 py-1 rounded text-xs font-medium ${urgencyBadge.color} text-gray-700`}>
                      {urgencyBadge.label}
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-xs text-blue-700 font-mono">{report.tracking_code}</span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>

                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{report.description}</p>

                  {report.category_name && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {report.category_name}
                      </span>
                    </div>
                  )}

                  {report.location_address && (
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {report.location_address}
                    </p>
                  )}

                  <div className="text-xs text-gray-500 mb-3">
                    {new Date(report.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>

                  {report.assigned_entity && (
                    <div className="mb-3 p-2 bg-purple-100 rounded text-xs text-purple-700 border border-purple-200">
                      <strong>Asignado a:</strong> {report.assigned_entity}
                    </div>
                  )}

                  {report.admin_notes && (
                    <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
                      <p className="text-xs font-semibold text-blue-700 mb-1">Notas del Administrador:</p>
                      <p className="text-xs text-gray-700">{report.admin_notes}</p>
                    </div>
                  )}

                  {report.resolution_notes && report.status === 'resolved' && (
                    <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
                      <p className="text-xs font-semibold text-green-700 mb-1">Solución:</p>
                      <p className="text-xs text-gray-700">{report.resolution_notes}</p>
                    </div>
                  )}

                  {report.status === 'resolved' && !report.citizen_rating && (
                    <button
                      onClick={() => onNavigate("Rate")}

                      className="mt-4 w-full py-2 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded-lg text-sm transition-colors"
                    >
                      Calificar Servicio
                    </button>
                  )}

                  {report.citizen_rating && (
                    <div className="mt-3">
                      ⭐ {report.citizen_rating}/5
                      <p className="text-sm text-gray-600">
                        {report.citizen_comment}
                      </p>
                    </div>
                  )}
                </div>

              );
            })}
          </div>
        )}
      </div>


    </>
  );
}

// ============================================
// NEW REPORT MODAL
// ============================================


// ============================================
// ADMIN DASHBOARD
// ============================================
function AdminDashboard({ user, onLogout }) {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEntities, setLoadingEntities] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");

  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [appRatings, setAppRatings] = useState([]);























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
    loadEntities();
  }, []);



  const getCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error cargando categorías:", error);
      return [];
    }

    return data;
  };












  const loadData = async () => {
    try {
      // Cargar reportes con join manual
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

      // Transformar los datos
      const transformedReports = (reportsData || []).map(report => ({
        ...report,
        category_name: report.categories?.name,
        category_icon: report.categories?.icon,
        category_color: report.categories?.color,
        responsible_entity: report.categories?.responsible_entity,
        assigned_user_name: report.users?.full_name,
        assigned_entity_name: report.users?.entity_name
      }));

      // Cargar categorías
      const categoriesData = await getCategories();

      setReports(transformedReports);
      setFilteredReports(transformedReports);
      setCategories(categoriesData);
      calculateStats(transformedReports);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };


  const updateEntityStatus = async (entity, status, reason = null) => {
    try {
      const { error } = await supabase
        .from("entities")
        .update({
          status,
          rejection_reason: reason
        })
        .eq("id", entity.id);

      if (error) throw error;

      // Registrar en historial de auditoría
      const { error: auditError } = await supabase
        .from('entity_audit_logs')
        .insert({
          entity_id: entity.id,
          admin_id: user.id,
          action: status,
          reason: reason
        });

      if (auditError) console.error('Error creating audit log:', auditError);

      // Notificar
      const msg = status === 'approved'
        ? 'Tu cuenta de entidad ha sido aprobada. Ya puedes acceder al sistema.'
        : `Tu solicitud de registro ha sido rechazada. Motivo: ${reason}`;
      const type = status === 'approved' ? 'success' : 'error';

      await notificationService.createNotification(entity.user_id, msg, type);

      loadEntities();
    } catch (error) {
      console.error("Error actualizando entidad:", error);
      alert("No se pudo actualizar la entidad");
    }
  };


  const loadEntities = async () => {
    setLoadingEntities(true);
    try {
      const { data, error } = await supabase
        .from("entities")
        .select(`
          id,
          user_id,
          name,
          email,
          phone,
          nit,
          status,
          created_at,
          rut_path,
          chamber_path,
          rejection_reason
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntities(data || []);
    } catch (err) {
      console.error("Error cargando entidades:", err);
    } finally {
      setLoadingEntities(false);
    }
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

    // Calcular promedio de calificaciones
    const ratedReports = reportsData.filter(r => r.citizen_rating);
    if (ratedReports.length > 0) {
      const sum = ratedReports.reduce((acc, r) => acc + r.citizen_rating, 0);
      newStats.avg_rating = (sum / ratedReports.length).toFixed(1);
    }

    setStats(newStats);
  };

  const applyFilters = () => {
    let filtered = [...reports];

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

    if (filterCategory !== 'all') {
      filtered = filtered.filter(r => r.category_id === filterCategory);
    }

    if (filterUrgency !== 'all') {
      filtered = filtered.filter(r => r.urgency_level === filterUrgency);
    }

    setFilteredReports(filtered);
  };
  useEffect(() => {
    applyFilters();
  }, [reports, searchTerm, filterStatus, filterCategory, filterUrgency]);



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

  return (
    <>
      <nav className="bg-[#A8D5A2] border-b border-green-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-[#2F5130]">UrbanReport</h1>
                <p className="text-xl font-bold text-[#00000]">Panel Operativo</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NotificationHeader userId={user?.id} />

              <div className="text-right">
                <p className="text-sm text-[#2F5130]">{user?.full_name}</p>
                <p className="text-xs text-[#2F5130]/70">{user?.entity_name || 'Admin'}</p>
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
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#2F5130] mb-2">Panel de Control</h2>
          <p className="text-xl font-bold text-[#00000]">Gestiona todos los reportes ciudadanos de Buenaventura</p>
        </div>

        {loading ? (
          <div className="text-center text-white py-12">Cargando datos...</div>
        ) : (
          <>
            {/* STATS CARDS */}

            {/* ENTIDADES PENDIENTES */}
            <div className="bg-white shadow-md rounded-xl border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-bold text-[#2F5130] mb-4">
                Gestión de Entidades
              </h3>

              {loadingEntities ? (
                <p className="text-gray-600">Cargando entidades...</p>
              ) : entities.length === 0 ? (
                <p className="text-gray-600">No hay entidades registradas</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2 px-3">Entidad</th>
                        <th className="text-left py-2 px-3">NIT</th>
                        <th className="text-left py-2 px-3">Email</th>
                        <th className="text-left py-2 px-3">Fecha</th>
                        <th className="text-left py-2 px-3">Estado</th>
                        <th className="text-left py-2 px-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entities.map(entity => (
                        <tr key={entity.id} className="border-b">
                          <td className="py-2 px-3 font-medium">
                            {entity.name}
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-600">
                            {entity.nit || '-'}
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-600">
                            {entity.email}
                          </td>
                          <td className="py-2 px-3 text-sm">
                            {new Date(entity.created_at).toLocaleDateString("es-ES")}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium
                  ${entity.status === "approved"
                                ? "bg-green-200 text-green-800"
                                : entity.status === "rejected"
                                  ? "bg-red-200 text-red-800"
                                  : "bg-yellow-200 text-yellow-800"}
                `}>
                              {entity.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 flex gap-2">
                            <button
                              onClick={() => setSelectedEntity(entity)}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                            >
                              Ver Detalles
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                    placeholder="Buscar por código, descripción, nombre o ubicación..."
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
                  <option value="requires_info">Requiere Info</option>
                  <option value="resolved">Resuelto</option>
                  <option value="rejected">Rechazado</option>
                  <option value="closed">Cerrado</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                <select
                  value={filterUrgency}
                  onChange={(e) => setFilterUrgency(e.target.value)}
                  className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las urgencias</option>
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
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">Ciudadano</th>
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
                          No se encontraron reportes con los filtros aplicados
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
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                {report.title}
                              </p>
                            </td>

                            <td className="py-4 px-4">
                              <div className="text-gray-800 text-sm font-medium">
                                {report.citizen_name}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{report.citizen_email}</span>
                              </div>
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
                                className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors text-sm font-medium"
                              >
                                <Edit2 className="w-4 h-4" />
                                Gestionar
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

              </div>

              {filteredReports.length > 0 && (
                <div className="mt-4 text-sm text-slate-400 text-center">
                  Mostrando {filteredReports.length} de {reports.length} reportes
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {selectedEntity && (
        <EntityDetailModal
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
          onUpdate={updateEntityStatus}
        />
      )}

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

// ============================================
// ENTITY DETAIL MODAL
// ============================================
function EntityDetailModal({ entity, onClose, onUpdate }) {
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [rutUrl, setRutUrl] = useState(null);
  const [chamberUrl, setChamberUrl] = useState(null);

  useEffect(() => {
    // Generar URLs firmadas o públicas
    if (entity.rut_path) {
      const { data } = supabase.storage.from('entity-documents').getPublicUrl(entity.rut_path);
      setRutUrl(data.publicUrl);
    }
    if (entity.chamber_path) {
      const { data } = supabase.storage.from('entity-documents').getPublicUrl(entity.chamber_path);
      setChamberUrl(data.publicUrl);
    }
  }, [entity]);

  const handleAction = async (status) => {
    if (status === 'rejected' && !rejectMode) {
      setRejectMode(true);
      return;
    }

    if (status === 'rejected' && !reason.trim()) {
      alert("Debes escribir un motivo de rechazo");
      return;
    }

    setLoading(true);
    await onUpdate(entity, status, reason);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
          <div>
            <h2 className="text-xl font-bold">Detalle de Solicitud</h2>
            <p className="text-slate-400 text-sm">{entity.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Razón Social</label>
              <p className="text-gray-800 font-medium">{entity.name}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">NIT</label>
              <p className="text-gray-800 font-medium">{entity.nit || 'No registrado'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Correo</label>
              <p className="text-gray-800 font-medium">{entity.email}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Teléfono</label>
              <p className="text-gray-800 font-medium">{entity.phone || 'No registrado'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">RUT</label>
              {rutUrl ? (
                <a href={rutUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                  <FileText className="w-4 h-4" /> Ver Documento
                </a>
              ) : <p className="text-gray-400">No adjunto</p>}
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Cámara Comercio</label>
              {chamberUrl ? (
                <a href={chamberUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                  <FileText className="w-4 h-4" /> Ver Documento
                </a>
              ) : <p className="text-gray-400">No adjunto</p>}
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="text-xs text-slate-500 uppercase font-bold">Fecha Solicitud</label>
            <p className="text-gray-800">{new Date(entity.created_at).toLocaleString()}</p>
          </div>

          {entity.status === 'rejected' && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-800 font-bold">Motivo Rechazo:</p>
              <p className="text-red-700">{entity.rejection_reason}</p>
            </div>
          )}

          {/* Action Aera */}
          {entity.status === 'pending' && (
            <div className="space-y-4 pt-4 border-t">
              {rejectMode ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Motivo de rechazo (Obligatorio)
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="Especifique por qué se rechaza la solicitud..."
                    rows={3}
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setRejectMode(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleAction('rejected')}
                      disabled={loading || !reason.trim()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading ? 'Procesando...' : 'Confirmar Rechazo'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleAction('approved')}
                    disabled={loading}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Procesando...' : 'Aprobar Solicitud'}
                  </button>
                  <button
                    onClick={() => setRejectMode(true)}
                    disabled={loading}
                    className="flex-1 py-3 bg-white border-2 border-red-500 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Rechazar Solicitud
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Continúa con EditReportModal en el siguiente mensaje...

// ============================================
// EDIT REPORT MODAL
// ============================================
