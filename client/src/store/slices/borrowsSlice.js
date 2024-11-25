import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { borrowsService } from '../../services/borrowsService'

export const fetchBorrows = createAsyncThunk(
  'borrows/fetchBorrows',
  async (params, { rejectWithValue }) => {
    try {
      const response = await borrowsService.getBorrows(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch borrows')
    }
  }
)

export const borrowBook = createAsyncThunk(
  'borrows/borrowBook',
  async (bookId, { rejectWithValue }) => {
    try {
      const response = await borrowsService.borrowBook(bookId)
      return response.data.borrow
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to borrow book')
    }
  }
)

export const returnBook = createAsyncThunk(
  'borrows/returnBook',
  async (borrowId, { rejectWithValue }) => {
    try {
      const response = await borrowsService.returnBook(borrowId)
      return response.data.borrow
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to return book')
    }
  }
)

export const renewBook = createAsyncThunk(
  'borrows/renewBook',
  async (borrowId, { rejectWithValue }) => {
    try {
      const response = await borrowsService.renewBook(borrowId)
      return response.data.borrow
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to renew book')
    }
  }
)

const initialState = {
  borrows: [],
  currentBorrows: [],
  overdueBorrows: [],
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalBorrows: 0,
    hasNext: false,
    hasPrev: false,
  },
}

const borrowsSlice = createSlice({
  name: 'borrows',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBorrows.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchBorrows.fulfilled, (state, action) => {
        state.isLoading = false
        state.borrows = action.payload.borrows
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchBorrows.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(borrowBook.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(borrowBook.fulfilled, (state, action) => {
        state.isLoading = false
        state.borrows.unshift(action.payload)
        state.error = null
      })
      .addCase(borrowBook.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(returnBook.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(returnBook.fulfilled, (state, action) => {
        state.isLoading = false
        const index = state.borrows.findIndex(borrow => borrow._id === action.payload._id)
        if (index !== -1) {
          state.borrows[index] = action.payload
        }
        state.error = null
      })
      .addCase(returnBook.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(renewBook.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(renewBook.fulfilled, (state, action) => {
        state.isLoading = false
        const index = state.borrows.findIndex(borrow => borrow._id === action.payload._id)
        if (index !== -1) {
          state.borrows[index] = action.payload
        }
        state.error = null
      })
      .addCase(renewBook.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = borrowsSlice.actions
export default borrowsSlice.reducer
