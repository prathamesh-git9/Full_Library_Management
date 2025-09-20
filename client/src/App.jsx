import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout/Layout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Dashboard from './pages/Dashboard/Dashboard'
import Books from './pages/Books/Books'
import BookDetail from './pages/Books/BookDetail'
import Borrows from './pages/Borrows/Borrows'
import Reservations from './pages/Reservations/Reservations'
import Profile from './pages/Profile/Profile'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminUsers from './pages/Admin/AdminUsers'
import AdminBooks from './pages/Admin/AdminBooks'
import AdminBorrows from './pages/Admin/AdminBorrows'
import AdminReports from './pages/Admin/AdminReports'
import NotFound from './pages/NotFound/NotFound'

function App() {
    const { user, isLoading } = useAuth()
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

    useEffect(() => {
        // Initialize auth state
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner h-8 w-8"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        )
    }

    return (
        <Layout>
            <Routes>
                {/* Student Routes */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/books" element={<Books />} />
                <Route path="/books/:id" element={<BookDetail />} />
                <Route path="/borrows" element={<Borrows />} />
                <Route path="/reservations" element={<Reservations />} />
                <Route path="/profile" element={<Profile />} />

                {/* Admin Routes */}
                {user?.role === 'admin' && (
                    <>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/users" element={<AdminUsers />} />
                        <Route path="/admin/books" element={<AdminBooks />} />
                        <Route path="/admin/borrows" element={<AdminBorrows />} />
                        <Route path="/admin/reports" element={<AdminReports />} />
                    </>
                )}

                {/* Librarian Routes */}
                {user?.role === 'librarian' && (
                    <>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/books" element={<AdminBooks />} />
                        <Route path="/admin/borrows" element={<AdminBorrows />} />
                    </>
                )}

                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
        </Layout>
    )
}

export default App
