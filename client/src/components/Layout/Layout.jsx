import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
    BookOpen,
    Home,
    User,
    Bell,
    Settings,
    LogOut,
    Menu,
    X,
    Users,
    BarChart3,
    FileText
} from 'lucide-react'

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user, isAdmin, isLibrarian, isStudent } = useAuth()
    const location = useLocation()

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['student', 'admin', 'librarian'] },
        { name: 'Books', href: '/books', icon: BookOpen, roles: ['student', 'admin', 'librarian'] },
        { name: 'My Borrows', href: '/borrows', icon: FileText, roles: ['student'] },
        { name: 'Reservations', href: '/reservations', icon: BookOpen, roles: ['student'] },
        { name: 'Profile', href: '/profile', icon: User, roles: ['student', 'admin', 'librarian'] },
    ]

    const adminNavigation = [
        { name: 'Admin Dashboard', href: '/admin', icon: BarChart3, roles: ['admin'] },
        { name: 'Users', href: '/admin/users', icon: Users, roles: ['admin'] },
        { name: 'Books Management', href: '/admin/books', icon: BookOpen, roles: ['admin', 'librarian'] },
        { name: 'Borrows Management', href: '/admin/borrows', icon: FileText, roles: ['admin', 'librarian'] },
        { name: 'Reports', href: '/admin/reports', icon: BarChart3, roles: ['admin'] },
    ]

    const filteredNavigation = navigation.filter(item =>
        item.roles.includes(user?.role)
    )

    const filteredAdminNavigation = adminNavigation.filter(item =>
        item.roles.includes(user?.role)
    )

    const isActive = (href) => location.pathname === href

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar */}
            <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
                    <div className="flex h-16 items-center justify-between px-4 border-b">
                        <div className="flex items-center">
                            <BookOpen className="h-8 w-8 text-primary-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900">Library</span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className="flex-1 space-y-1 px-2 py-4">
                        {filteredNavigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive(item.href)
                                        ? 'bg-primary-100 text-primary-900'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.name}
                            </Link>
                        ))}
                        {(isAdmin || isLibrarian) && (
                            <>
                                <div className="border-t border-gray-200 my-4" />
                                <div className="px-2 py-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Administration
                                    </p>
                                </div>
                                {filteredAdminNavigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive(item.href)
                                                ? 'bg-primary-100 text-primary-900'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <item.icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                    </Link>
                                ))}
                            </>
                        )}
                    </nav>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
                    <div className="flex h-16 items-center px-4 border-b">
                        <BookOpen className="h-8 w-8 text-primary-600" />
                        <span className="ml-2 text-xl font-bold text-gray-900">Library</span>
                    </div>
                    <nav className="flex-1 space-y-1 px-2 py-4">
                        {filteredNavigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive(item.href)
                                        ? 'bg-primary-100 text-primary-900'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.name}
                            </Link>
                        ))}
                        {(isAdmin || isLibrarian) && (
                            <>
                                <div className="border-t border-gray-200 my-4" />
                                <div className="px-2 py-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Administration
                                    </p>
                                </div>
                                {filteredAdminNavigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive(item.href)
                                                ? 'bg-primary-100 text-primary-900'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <item.icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                    </Link>
                                ))}
                            </>
                        )}
                    </nav>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex flex-1" />
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            <button
                                type="button"
                                className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                            >
                                <Bell className="h-6 w-6" />
                            </button>

                            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

                            <div className="relative">
                                <div className="flex items-center gap-x-2">
                                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                                        <span className="text-sm font-medium text-white">
                                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                        </span>
                                    </div>
                                    <div className="hidden lg:block">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {user?.firstName} {user?.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Layout
