import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { booksService } from '../../services/booksService'

export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async (params, { rejectWithValue }) => {
    try {
      const response = await booksService.getBooks(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch books')
    }
  }
)

export const fetchBookById = createAsyncThunk(
  'books/fetchBookById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await booksService.getBookById(id)
      return response.data.book
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch book')
    }
  }
)

const initialState = {
  books: [],
  currentBook: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalBooks: 0,
    hasNext: false,
    hasPrev: false,
  },
}

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentBook: (state) => {
      state.currentBook = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.isLoading = false
        state.books = action.payload.books
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(fetchBookById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchBookById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentBook = action.payload
        state.error = null
      })
      .addCase(fetchBookById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const { clearError, clearCurrentBook } = booksSlice.actions
export default booksSlice.reducer
