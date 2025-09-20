import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import booksSlice from './slices/booksSlice'
import borrowsSlice from './slices/borrowsSlice'
import notificationsSlice from './slices/notificationsSlice'

export const store = configureStore({
    reducer: {
        auth: authSlice,
        books: booksSlice,
        borrows: borrowsSlice,
        notifications: notificationsSlice,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST'],
            },
        }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
