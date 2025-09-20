import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { notificationsService } from '../../services/notificationsService'

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (params, { rejectWithValue }) => {
        try {
            const response = await notificationsService.getNotifications(params)
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications')
        }
    }
)

export const markNotificationAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (notificationId, { rejectWithValue }) => {
        try {
            const response = await notificationsService.markAsRead(notificationId)
            return response.data.notification
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read')
        }
    }
)

export const markAllNotificationsAsRead = createAsyncThunk(
    'notifications/markAllAsRead',
    async (_, { rejectWithValue }) => {
        try {
            const response = await notificationsService.markAllAsRead()
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to mark all notifications as read')
        }
    }
)

const initialState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalNotifications: 0,
        hasNext: false,
        hasPrev: false,
    },
}

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null
        },
        addNotification: (state, action) => {
            state.notifications.unshift(action.payload)
            state.unreadCount += 1
        },
        removeNotification: (state, action) => {
            state.notifications = state.notifications.filter(
                notification => notification._id !== action.payload
            )
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.isLoading = false
                state.notifications = action.payload.notifications
                state.unreadCount = action.payload.pagination.unreadCount
                state.pagination = action.payload.pagination
                state.error = null
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })
            .addCase(markNotificationAsRead.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                state.isLoading = false
                const index = state.notifications.findIndex(
                    notification => notification._id === action.payload._id
                )
                if (index !== -1) {
                    state.notifications[index] = action.payload
                    if (!action.payload.isRead) {
                        state.unreadCount = Math.max(0, state.unreadCount - 1)
                    }
                }
                state.error = null
            })
            .addCase(markNotificationAsRead.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })
            .addCase(markAllNotificationsAsRead.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(markAllNotificationsAsRead.fulfilled, (state, action) => {
                state.isLoading = false
                state.notifications = state.notifications.map(notification => ({
                    ...notification,
                    isRead: true,
                    readAt: new Date().toISOString(),
                }))
                state.unreadCount = 0
                state.error = null
            })
            .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })
    },
})

export const { clearError, addNotification, removeNotification } = notificationsSlice.actions
export default notificationsSlice.reducer
