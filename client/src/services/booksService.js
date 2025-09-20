import api from './api'

export const booksService = {
    getBooks: (params) => api.get('/books', { params }),
    getBookById: (id) => api.get(`/books/${id}`),
    createBook: (bookData) => api.post('/books', bookData),
    updateBook: (id, bookData) => api.put(`/books/${id}`, bookData),
    deleteBook: (id) => api.delete(`/books/${id}`),
    getPopularBooks: (params) => api.get('/books/popular', { params }),
    getRecentlyAddedBooks: (params) => api.get('/books/recent', { params }),
    searchBooks: (params) => api.get('/books/search', { params }),
    getBookStats: () => api.get('/books/stats'),
}
