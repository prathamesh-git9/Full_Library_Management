import api from './api'

export const notificationsService = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getNotificationById: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  createNotification: (notificationData) => api.post('/notifications', notificationData),
  getNotificationStats: () => api.get('/notifications/stats'),
  sendDueDateReminders: () => api.post('/notifications/send-due-reminders'),
  sendOverdueNotices: () => api.post('/notifications/send-overdue-notices'),
}
