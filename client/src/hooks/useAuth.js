import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getCurrentUser, clearAuth } from '../store/slices/authSlice'

export const useAuth = () => {
  const dispatch = useDispatch()
  const { user, token, isAuthenticated, isLoading, error } = useSelector((state) => state.auth)

  useEffect(() => {
    // Check if user is authenticated on app load
    if (token && !user && !isLoading) {
      dispatch(getCurrentUser())
    } else if (!token && isAuthenticated) {
      // Token expired or invalid
      dispatch(clearAuth())
    }
  }, [token, user, isAuthenticated, isLoading, dispatch])

  const isAdmin = user?.role === 'admin'
  const isLibrarian = user?.role === 'librarian'
  const isStudent = user?.role === 'student'
  const isStaff = isAdmin || isLibrarian

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isLibrarian,
    isStudent,
    isStaff,
  }
}
