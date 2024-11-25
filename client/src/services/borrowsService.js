import api from './api'

export const borrowsService = {
  getBorrows: (params) => api.get('/borrows', { params }),
  getBorrowById: (id) => api.get(`/borrows/${id}`),
  borrowBook: (bookId) => api.post('/borrows', { bookId }),
  returnBook: (id, notes) => api.post(`/borrows/${id}/return`, { notes }),
  renewBook: (id) => api.post(`/borrows/${id}/renew`),
  getUserBorrowHistory: (userId, params) => api.get(`/borrows/user/${userId}`, { params }),
  getOverdueBorrows: (params) => api.get('/borrows/overdue', { params }),
  getBorrowStats: () => api.get('/borrows/stats'),
}
