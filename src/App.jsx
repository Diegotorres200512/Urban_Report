
import React, { useState, useEffect } from 'react';
import CitizenHome from "./CitizenHome";
import { FileText, LogOut, Plus, Clock, CheckCircle, XCircle, AlertCircle, BarChart3, Edit2, Mail, Phone, MapPin, User, Lock, UserPlus, Search, X, Save, Upload, Image as ImageIcon, Zap, TrendingUp } from 'lucide-react';
import { supabase, getCategories, uploadFile } from './lib/supabase.js';
import logo from "./assets/logo.jpg";
// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión guardada
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setCurrentView('login');

    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentView(userData.role === 'admin' || userData.role === 'entity_user' ? 'admin' : 'inicio');
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

      {currentView === 'login' && <Login onLogin={handleLogin} onNavigate={setCurrentView} />}
      {currentView === 'register' && <Register onNavigate={setCurrentView} />}
      {currentView === 'inicio' && (<CitizenHome user={user}onNavigate={setCurrentView}/>)}
      {currentView === 'citizen' && <CitizenDashboard user={user} onLogout={handleLogout} />}
      {currentView === 'admin' && <AdminDashboard user={user} onLogout={handleLogout} />}
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

    const { data, error, count } = await supabase
      .from('users')
      .select('*')
      .eq('email', formData.email)
      .eq('password', formData.password)
      .eq('is_active', true);

    console.log('📊 Respuesta de Supabase:', { data, error, count });

    if (error) {
      console.error('❌ Error de Supabase:', error);
      setError(`Error de conexión: ${error.message}`);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setError('Credenciales incorrectas');
      setLoading(false);
      return;
    }

    console.log('✅ Login exitoso:', data[0]);
    onLogin(data[0]);
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
              <button onClick={() => onNavigate('register')} className="text-blue-400 hover:text-blue-300 font-semibold">
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
function Register({ onNavigate }) {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    full_name: '', 
    phone: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          role: 'citizen'
        }]);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Este correo ya está registrado');
        } else {
          setError('Error al crear la cuenta');
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => onNavigate('login'), 2000);
    } catch (err) {
      setError('Error al registrar usuario');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
              <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-[#2F5130]">Crear cuenta</h1>
            <p className="text-slate-300">Regístrate para reportar problemas</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2 text-green-200">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Cuenta creada exitosamente. Redirigiendo...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-lg font-semibold mb-2">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-200 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-lg font-semibold mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-200 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="tu@correo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-lg font-semibold mb-2">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-200 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="3001234567"
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
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-200 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-lg font-semibold mb-2">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-200 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-lg font-semibold mb-1">
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => onNavigate('login')} className="text-blue-400 hover:text-blue-300 font-semibold">
                Iniciar Sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Continuará con CitizenDashboard y AdminDashboard en el siguiente mensaje...

// ============================================
// CITIZEN DASHBOARD
// ============================================
function CitizenDashboard({ user, onLogout }) {
  const [showNewReport, setShowNewReport] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [user]);

  const loadReports = async () => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        categories (
          name,
          icon,
          color,
          responsible_entity
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transformar los datos
    const transformedData = (data || []).map(report => ({
      ...report,
      category_name: report.categories?.name,
      category_icon: report.categories?.icon,
      category_color: report.categories?.color,
      responsible_entity: report.categories?.responsible_entity
    }));
    
    setReports(transformedData);
  } catch (error) {
    console.error('Error cargando reportes:', error);
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
              <span className="text-sm text-slate-300">{user?.full_name}</span>
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
                <div key={report.id} className="bg-white shadow-md rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`px-3 py-1 rounded-lg border flex items-center gap-2 ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{statusConfig.label}</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${urgencyBadge.color}`}>
                      {urgencyBadge.label}
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-xs text-blue-300 font-mono">{report.tracking_code}</span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{report.title}</h3>
                  <p className="text-slate-300 text-sm mb-2 line-clamp-2">{report.description}</p>
                  
                  {report.category_name && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                        {report.category_name}
                      </span>
                    </div>
                  )}

                  {report.location_address && (
                    <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {report.location_address}
                    </p>
                  )}

                  <div className="text-xs text-slate-400 mb-3">
                    {new Date(report.created_at).toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </div>

                  {report.assigned_entity && (
                    <div className="mb-3 p-2 bg-purple-500/10 rounded text-xs text-purple-300">
                      <strong>Asignado a:</strong> {report.assigned_entity}
                    </div>
                  )}

                  {report.admin_notes && (
                    <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <p className="text-xs font-semibold text-blue-300 mb-1">Notas del Administrador:</p>
                      <p className="text-xs text-slate-300">{report.admin_notes}</p>
                    </div>
                  )}

                  {report.resolution_notes && report.status === 'resolved' && (
                    <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <p className="text-xs font-semibold text-green-300 mb-1">Solución:</p>
                      <p className="text-xs text-slate-300">{report.resolution_notes}</p>
                    </div>
                  )}

                  {report.status === 'resolved' && !report.citizen_rating && (
                    <button className="mt-4 w-full py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg text-sm transition-colors">
                      Calificar Servicio
                    </button>
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
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

  useEffect(() => {
    applyFilters();
  }, [reports, searchTerm, filterStatus, filterCategory, filterUrgency]);

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
    setCategories(categoriesData);
    calculateStats(transformedReports);
  } catch (error) {
    console.error('Error cargando datos:', error);
  } finally {
    setLoading(false);
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

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.citizen_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.tracking_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Filtro de categoría
    if (filterCategory !== 'all') {
      filtered = filtered.filter(r => r.category_id === filterCategory);
    }

    // Filtro de urgencia
    if (filterUrgency !== 'all') {
      filtered = filtered.filter(r => r.urgency_level === filterUrgency);
    }

    setFilteredReports(filtered);
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

  return (
    <>
      <nav className="bg-[#A8D5A2] border-b border-green-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8 bg-[#F7F7F7] min-h-screen">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold text-white">UrbanReport</h1>
                <p className="text-xs text-slate-300">Panel Administrativo</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-300">{user?.full_name}</p>
                <p className="text-xs text-slate-400">{user?.entity_name || 'Admin'}</p>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-700 rounded-lg transition-colors"

              >
                <LogOut className="text-lg font-semibold mb-2 w-4 h-4" />
                Salir
              </button>

              


              
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 bg-[#F7F7F7] min-h-screen">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Panel de Control</h2>
          <p className="text-slate-300">Gestiona todos los reportes ciudadanos de Buenaventura</p>
        </div>

        {loading ? (
          <div className="text-center text-white py-12">Cargando datos...</div>
        ) : (
          <>
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-xl border border-blue-500/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/30 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-300" />
                  </div>
                  <span className="text-3xl font-bold text-white">{stats.total}</span>
                </div>
                <h3 className="text-slate-200 font-medium">Total Reportes</h3>
              </div>

              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-lg rounded-xl border border-yellow-500/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-500/30 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-yellow-300" />
                  </div>
                  <span className="text-3xl font-bold text-white">{stats.received}</span>
                </div>
                <h3 className="text-slate-200 font-medium">Nuevos</h3>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-xl border border-purple-500/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-300" />
                  </div>
                  <span className="text-3xl font-bold text-white">{stats.in_progress}</span>
                </div>
                <h3 className="text-slate-200 font-medium">En Progreso</h3>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-xl border border-green-500/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/30 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-300" />
                  </div>
                  <span className="text-3xl font-bold text-white">{stats.resolved}</span>
                </div>
                <h3 className="text-slate-200 font-medium">Resueltos</h3>
              </div>

              <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-lg rounded-xl border border-red-500/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-500/30 rounded-lg">
                    <Zap className="w-6 h-6 text-red-300" />
                  </div>
                  <span className="text-3xl font-bold text-white">{stats.critical_count}</span>
                </div>
                <h3 className="text-slate-200 font-medium">Críticos</h3>
              </div>

              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-lg rounded-xl border border-orange-500/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-500/30 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-300" />
                  </div>
                  <span className="text-3xl font-bold text-white">{stats.in_review}</span>
                </div>
                <h3 className="text-slate-200 font-medium">En Revisión</h3>
              </div>

              <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-lg rounded-xl border border-pink-500/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-pink-500/30 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-pink-300" />
                  </div>
                  <span className="text-3xl font-bold text-white">{stats.avg_rating || 'N/A'}</span>
                </div>
                <h3 className="text-slate-200 font-medium">Calificación Promedio</h3>
              </div>

              <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 backdrop-blur-lg rounded-xl border border-gray-500/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gray-500/30 rounded-lg">
                    <XCircle className="w-6 h-6 text-gray-300" />
                  </div>
                  <span className="text-3xl font-bold text-white">{stats.rejected}</span>
                </div>
                <h3 className="text-slate-200 font-medium">Rechazados</h3>
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
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Código</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Fecha</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Categoría</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Ciudadano</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Ubicación</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Urgencia</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Estado</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-12 text-slate-300">
                          No se encontraron reportes con los filtros aplicados
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => {
                        const statusConfig = getStatusConfig(report.status);
                        const urgencyColors = {
                          low: 'bg-slate-500/20 text-slate-300',
                          medium: 'bg-yellow-500/20 text-yellow-300',
                          high: 'bg-orange-500/20 text-orange-300',
                          critical: 'bg-red-500/20 text-red-300'
                        };
                        
                        return (
                          <tr key={report.id} className="border-b border-slate-700/50 hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4">
                              <span className="text-xs font-mono text-blue-300">{report.tracking_code}</span>
                            </td>
                            <td className="py-4 px-4 text-slate-300 text-sm">
                              {new Date(report.created_at).toLocaleDateString('es-ES', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric' 
                              })}
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-white font-medium text-sm">{report.category_name}</span>
                              <p className="text-xs text-slate-400 mt-1 line-clamp-1">{report.title}</p>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-slate-300 text-sm">{report.citizen_name}</div>
                              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{report.citizen_email}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-start gap-1 text-xs text-slate-400">
                                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2 max-w-[150px]">{report.location_address}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${urgencyColors[report.urgency_level]}`}>
                                {report.urgency_level === 'low' ? 'Baja' : 
                                 report.urgency_level === 'medium' ? 'Media' :
                                 report.urgency_level === 'high' ? 'Alta' : 'Crítica'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-lg border text-xs font-medium ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <button
                                onClick={() => setSelectedReport(report)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm"
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

// Continúa con EditReportModal en el siguiente mensaje...

// ============================================
// EDIT REPORT MODAL
// ============================================
function EditReportModal({ report, user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    status: report.status,
    admin_notes: report.admin_notes || '',
    resolution_notes: report.resolution_notes || '',
    rejection_reason: report.rejection_reason || '',
    assigned_user_id: report.assigned_user_id || user.id
  });
  const [files, setFiles] = useState([]);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // details, history, comments, attachments

  useEffect(() => {
    loadReportDetails();
  }, []);

  const loadReportDetails = async () => {
    try {
      // Cargar historial
      const { data: historyData } = await supabase
        .from('report_history')
        .select('*')
        .eq('report_id', report.id)
        .order('created_at', { ascending: false });

      // Cargar comentarios
      const { data: commentsData } = await supabase
        .from('report_comments')
        .select('*')
        .eq('report_id', report.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      // Cargar archivos adjuntos
      const { data: attachmentsData } = await supabase
        .from('report_attachments')
        .select('*')
        .eq('report_id', report.id)
        .order('created_at', { ascending: false });

      setHistory(historyData || []);
      setComments(commentsData || []);
      setAttachments(attachmentsData || []);
    } catch (error) {
      console.error('Error cargando detalles:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 3) {
      setError('Máximo 3 archivos permitidos');
      return;
    }
    
    const validFiles = selectedFiles.filter(file => file.size <= 10 * 1024 * 1024);
    if (validFiles.length !== selectedFiles.length) {
      setError('Algunos archivos exceden 10MB');
    }
    
    setFiles([...files, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('report_comments')
        .insert([{
          report_id: report.id,
          user_id: user.id,
          user_name: user.full_name,
          comment: newComment,
          is_internal: false,
          is_public: true
        }]);

      if (error) throw error;

      setNewComment('');
      loadReportDetails();
    } catch (error) {
      console.error('Error añadiendo comentario:', error);
      setError('Error al añadir comentario');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const oldStatus = report.status;
      const updateData = {
        status: formData.status,
        admin_notes: formData.admin_notes,
        resolution_notes: formData.resolution_notes,
        rejection_reason: formData.rejection_reason,
        assigned_user_id: formData.assigned_user_id,
        updated_at: new Date().toISOString()
      };

      // Actualizar fechas según el estado
      if (formData.status === 'in_review' && !report.reviewed_at) {
        updateData.reviewed_at = new Date().toISOString();
      }
      if (formData.status === 'in_progress' && !report.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      if (formData.status === 'resolved' && !report.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }
      if (formData.status === 'closed' && !report.closed_at) {
        updateData.closed_at = new Date().toISOString();
      }

      // Actualizar reporte
      const { error: updateError } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', report.id);

      if (updateError) throw updateError;

      // Registrar cambio en historial si cambió el estado
      if (oldStatus !== formData.status) {
        await supabase
          .from('report_history')
          .insert([{
            report_id: report.id,
            changed_by: user.id,
            changed_by_name: user.full_name,
            action: 'status_change',
            old_value: oldStatus,
            new_value: formData.status,
            comment: formData.admin_notes
          }]);
      }

      // Subir archivos de evidencia si existen
      if (files.length > 0) {
        for (const file of files) {
          try {
            const fileUrl = await uploadFile(file, report.id);
            
            await supabase
              .from('report_attachments')
              .insert([{
                report_id: report.id,
                file_url: fileUrl,
                file_name: file.name,
                file_type: file.type.startsWith('image/') ? 'image' : 
                          file.type.startsWith('video/') ? 'video' : 'document',
                file_size: file.size,
                attachment_type: formData.status === 'resolved' ? 'resolution' : 'progress',
                uploaded_by: user.id
              }]);
          } catch (fileError) {
            console.error('Error subiendo archivo:', fileError);
          }
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al actualizar el reporte');
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      received: 'Recibido',
      in_review: 'En Revisión',
      in_progress: 'En Progreso',
      requires_info: 'Requiere Información',
      resolved: 'Resuelto',
      rejected: 'Rechazado',
      closed: 'Cerrado'
    };
    return labels[status] || status;
  };

  const getActionLabel = (action) => {
    const labels = {
      created: 'Creado',
      status_change: 'Cambio de Estado',
      assignment: 'Asignación',
      comment: 'Comentario',
      attachment: 'Archivo Adjunto'
    };
    return labels[action] || action;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-5xl my-8">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center rounded-t-2xl z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Gestionar Reporte</h2>
            <p className="text-sm text-slate-400 mt-1">Código: {report.tracking_code}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2 text-green-200">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Reporte actualizado exitosamente</span>
            </div>
          )}

          {/* TABS */}
          <div className="flex gap-2 mb-6 border-b border-slate-700">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'details' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Detalles
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'history' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Historial ({history.length})
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'comments' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Comentarios ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'attachments' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Archivos ({attachments.length})
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="max-h-[60vh] overflow-y-auto mb-6">
            {/* DETALLES DEL REPORTE */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 text-sm">Categoría:</span>
                      <p className="text-white font-semibold">{report.category_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-sm">Urgencia:</span>
                      <p className="text-white font-semibold capitalize">{report.urgency_level}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-sm">Título:</span>
                    <p className="text-white font-semibold">{report.title}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-sm">Descripción:</span>
                    <p className="text-white">{report.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 text-sm">Ciudadano:</span>
                      <p className="text-white">{report.citizen_name}</p>
                      <p className="text-slate-400 text-xs">{report.citizen_email}</p>
                      <p className="text-slate-400 text-xs">{report.citizen_phone}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-sm">Preferencia de contacto:</span>
                      <p className="text-white capitalize">{report.prefer_contact}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-sm">Ubicación:</span>
                    <p className="text-white">{report.location_address}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-sm">Entidad asignada:</span>
                    <p className="text-white font-semibold">{report.assigned_entity || 'Sin asignar'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 text-sm">Fecha de creación:</span>
                      <p className="text-white">
                        {new Date(report.created_at).toLocaleString('es-ES', {
                          day: '2-digit', month: 'long', year: 'numeric', 
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {report.resolved_at && (
                      <div>
                        <span className="text-slate-400 text-sm">Fecha de resolución:</span>
                        <p className="text-white">
                          {new Date(report.resolved_at).toLocaleString('es-ES', {
                            day: '2-digit', month: 'long', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* FORMULARIO DE ACTUALIZACIÓN */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Estado del Reporte *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="received">Recibido</option>
                      <option value="in_review">En Revisión</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="requires_info">Requiere Información</option>
                      <option value="resolved">Resuelto</option>
                      <option value="rejected">Rechazado</option>
                      <option value="closed">Cerrado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Notas del Administrador
                    </label>
                    <textarea
                      value={formData.admin_notes}
                      onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Notas internas sobre el seguimiento..."
                    />
                  </div>

                  {formData.status === 'resolved' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Notas de Resolución *
                      </label>
                      <textarea
                        value={formData.resolution_notes}
                        onChange={(e) => setFormData({ ...formData, resolution_notes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Describe cómo se resolvió el problema..."
                        required
                      />
                    </div>
                  )}

                  {formData.status === 'rejected' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Motivo del Rechazo *
                      </label>
                      <textarea
                        value={formData.rejection_reason}
                        onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Explica por qué se rechaza este reporte..."
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Adjuntar Evidencia de Progreso/Resolución
                    </label>
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-4">
                      <input
                        type="file"
                        id="evidence-files"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="evidence-files" className="cursor-pointer flex flex-col items-center">
                        <Upload className="w-10 h-10 text-slate-400 mb-2" />
                        <p className="text-slate-300 text-sm">Click para subir evidencia</p>
                        <p className="text-slate-500 text-xs mt-1">Fotos o videos del progreso/resolución</p>
                      </label>
                    </div>

                    {files.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-slate-700 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-blue-400" />
                              <span className="text-sm text-slate-300">{file.name}</span>
                              <span className="text-xs text-slate-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading || success}
                      className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-semibold rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || success}
                      className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {loading ? 'Guardando...' : success ? '¡Guardado!' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* HISTORIAL */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No hay historial disponible</p>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-blue-400 font-semibold">{getActionLabel(item.action)}</span>
                          <p className="text-slate-400 text-sm">Por: {item.changed_by_name}</p>
                        </div>
                        <span className="text-slate-500 text-xs">
                          {new Date(item.created_at).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {item.old_value && item.new_value && (
                        <div className="text-sm text-slate-300">
                          <span className="text-red-400">{getStatusLabel(item.old_value)}</span>
                          {' → '}
                          <span className="text-green-400">{getStatusLabel(item.new_value)}</span>
                        </div>
                      )}
                      {item.comment && (
                        <p className="text-slate-300 text-sm mt-2">{item.comment}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* COMENTARIOS */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Añadir Comentario
                  </label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Escribe un comentario público para el ciudadano..."
                  />
                  <button
                    onClick={handleAddComment}
                    className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    Publicar Comentario
                  </button>
                </div>

                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No hay comentarios todavía</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-blue-400 font-semibold">{comment.user_name}</span>
                          <span className="text-slate-500 text-xs">
                            {new Date(comment.created_at).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm">{comment.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ARCHIVOS ADJUNTOS */}
            {activeTab === 'attachments' && (
              <div className="space-y-3">
                {attachments.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No hay archivos adjuntos</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="w-5 h-5 text-blue-400" />
                          <span className="text-sm text-slate-300 truncate">{attachment.file_name}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{(attachment.file_size / 1024 / 1024).toFixed(2)} MB</span>
                          <span className="capitalize">{attachment.attachment_type}</span>
                        </div>
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block text-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                        >
                          Ver Archivo
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}