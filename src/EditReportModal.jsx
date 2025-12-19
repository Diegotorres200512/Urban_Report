import React, { useState, useEffect } from 'react';
import { supabase, uploadFile } from './lib/supabase.js';
import { notificationService } from './services/notificationService';
import { X, AlertCircle, CheckCircle, Upload, Image as ImageIcon, Save } from 'lucide-react';

export default function EditReportModal({ report, user, onClose, onSuccess }) {
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
                    user_name: user.full_name || user.name || 'Usuario',
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

                // ENVIAR NOTIFICACIÓN AL CIUDADANO
                // report.user_id es el creador del reporte
                if (report.user_id) {
                    try {
                        const statusLabel = getStatusLabel(formData.status);
                        const message = `Tu reporte #${report.tracking_code} ha cambiado a estado: ${statusLabel}`;

                        // Fallback seguro para el nombre: name, full_name, o 'Entidad'
                        const reporterName = user.name || user.full_name || 'Entidad';

                        await notificationService.createNotification(
                            report.user_id,
                            message,
                            'info',
                            {
                                report_id: report.id,
                                report_code: report.tracking_code || '---',
                                entity_name: user.role === 'entity' ? reporterName : 'Administrador',
                                old_status: oldStatus,
                                new_status: formData.status,
                                address: report.location_address || ''
                            }
                        );
                    } catch (notifErr) {
                        console.error('⚠️ Error al enviar notificación (no bloqueante):', notifErr);
                        // No lanzamos error para permitir que el reporte se guarde
                    }
                }
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
            <div className="bg-slate-600 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-5xl my-8">
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
                            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'details'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-slate-400 hover:text-slate-300'
                                }`}
                        >
                            Detalles
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'history'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-slate-400 hover:text-slate-300'
                                }`}
                        >
                            Historial ({history.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'comments'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-slate-400 hover:text-slate-300'
                                }`}
                        >
                            Comentarios ({comments.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('attachments')}
                            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'attachments'
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
