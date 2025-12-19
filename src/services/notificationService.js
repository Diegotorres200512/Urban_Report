import { supabase } from '../lib/supabase';

export const notificationService = {
  /**
   * Obtener notificaciones de un usuario
   * @param {string} userId
   */
  async getNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return data;
  },

  /**
   * Marcar notificación como leída
   * @param {string} notificationId
   */
  async markAsRead(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) console.error('Error marking notification as read:', error);
  },

  /**
   * Crear una nueva notificación
   * @param {string} userId
   * @param {string} message
   * @param {string} type - 'info', 'success', 'warning', 'error'
   */
  async createNotification(userId, message, type = 'info') {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message,
        type
      });

    if (error) console.error('Error creating notification:', error);
  },

  /**
   * Suscribirse a nuevas notificaciones en tiempo real
   * @param {string} userId 
   * @param {function} callback 
   */
  subscribeToNotifications(userId, callback) {
    return supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
  }
};
